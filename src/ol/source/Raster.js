/**
 * @module ol/source/Raster
 */
import {getUid, inherits} from '../util.js';
import ImageCanvas from '../ImageCanvas.js';
import TileQueue from '../TileQueue.js';
import {createCanvasContext2D} from '../dom.js';
import {listen} from '../events.js';
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import {Processor} from 'pixelworks/lib/index';
import {equals, getCenter, getHeight, getWidth} from '../extent.js';
import LayerType from '../LayerType.js';
import Layer from '../layer/Layer.js';
import ImageLayer from '../layer/Image.js';
import TileLayer from '../layer/Tile.js';
import {assign} from '../obj.js';
import CanvasImageLayerRenderer from '../renderer/canvas/ImageLayer.js';
import CanvasTileLayerRenderer from '../renderer/canvas/TileLayer.js';
import ImageSource from '../source/Image.js';
import SourceState from '../source/State.js';
import TileSource from '../source/Tile.js';
import {create as createTransform} from '../transform.js';


/**
 * A function that takes an array of input data, performs some operation, and
 * returns an array of output data.
 * For `pixel` type operations, the function will be called with an array of
 * pixels, where each pixel is an array of four numbers (`[r, g, b, a]`) in the
 * range of 0 - 255. It should return a single pixel array.
 * For `'image'` type operations, functions will be called with an array of
 * {@link ImageData https://developer.mozilla.org/en-US/docs/Web/API/ImageData}
 * and should return a single {@link ImageData
 * https://developer.mozilla.org/en-US/docs/Web/API/ImageData}.  The operations
 * are called with a second "data" argument, which can be used for storage.  The
 * data object is accessible from raster events, where it can be initialized in
 * "beforeoperations" and accessed again in "afteroperations".
 *
 * @typedef {function((Array.<Array.<number>>|Array.<ImageData>), Object):
 *     (Array.<number>|ImageData)} Operation
 */


/**
 * @enum {string}
 */
const RasterEventType = {
  /**
   * Triggered before operations are run.
   * @event ol/source/Raster~RasterSourceEvent#beforeoperations
   * @api
   */
  BEFOREOPERATIONS: 'beforeoperations',

  /**
   * Triggered after operations are run.
   * @event ol/source/Raster~RasterSourceEvent#afteroperations
   * @api
   */
  AFTEROPERATIONS: 'afteroperations'
};


/**
 * Raster operation type. Supported values are `'pixel'` and `'image'`.
 * @enum {string}
 */
const RasterOperationType = {
  PIXEL: 'pixel',
  IMAGE: 'image'
};


/**
 * @classdesc
 * Events emitted by {@link module:ol/source/Raster} instances are instances of this
 * type.
 *
 * @constructor
 * @extends {module:ol/events/Event}
 * @param {string} type Type.
 * @param {module:ol/PluggableMap~FrameState} frameState The frame state.
 * @param {Object} data An object made available to operations.
 */
const RasterSourceEvent = function(type, frameState, data) {
  Event.call(this, type);

  /**
   * The raster extent.
   * @type {module:ol/extent~Extent}
   * @api
   */
  this.extent = frameState.extent;

  /**
   * The pixel resolution (map units per pixel).
   * @type {number}
   * @api
   */
  this.resolution = frameState.viewState.resolution / frameState.pixelRatio;

  /**
   * An object made available to all operations.  This can be used by operations
   * as a storage object (e.g. for calculating statistics).
   * @type {Object}
   * @api
   */
  this.data = data;

};
inherits(RasterSourceEvent, Event);

/**
 * @typedef {Object} Options
 * @property {Array.<module:ol/source/Source|module:ol/layer/Layer>} sources Input
 * sources or layers. Vector layers must be configured with `renderMode: 'image'`.
 * @property {module:ol/source/Raster~Operation} [operation] Raster operation.
 * The operation will be called with data from input sources
 * and the output will be assigned to the raster source.
 * @property {Object} [lib] Functions that will be made available to operations run in a worker.
 * @property {number} [threads] By default, operations will be run in a single worker thread.
 * To avoid using workers altogether, set `threads: 0`.  For pixel operations, operations can
 * be run in multiple worker threads.  Note that there is additional overhead in
 * transferring data to multiple workers, and that depending on the user's
 * system, it may not be possible to parallelize the work.
 * @property {module:ol/source/Raster~RasterOperationType} [operationType='pixel'] Operation type.
 * Supported values are `'pixel'` and `'image'`.  By default,
 * `'pixel'` operations are assumed, and operations will be called with an
 * array of pixels from input sources.  If set to `'image'`, operations will
 * be called with an array of ImageData objects from input sources.
 */


/**
 * @classdesc
 * A source that transforms data from any number of input sources using an
 * {@link module:ol/source/Raster~Operation} function to transform input pixel values into
 * output pixel values.
 *
 * @constructor
 * @extends {module:ol/source/Image}
 * @fires ol/source/Raster~RasterSourceEvent
 * @param {module:ol/source/Raster~Options=} options Options.
 * @api
 */
const RasterSource = function(options) {

  /**
   * @private
   * @type {*}
   */
  this.worker_ = null;

  /**
   * @private
   * @type {module:ol/source/Raster~RasterOperationType}
   */
  this.operationType_ = options.operationType !== undefined ?
    options.operationType : RasterOperationType.PIXEL;

  /**
   * @private
   * @type {number}
   */
  this.threads_ = options.threads !== undefined ? options.threads : 1;

  /**
   * @private
   * @type {Array.<module:ol/renderer/canvas/Layer>}
   */
  this.renderers_ = createRenderers(options.sources);

  for (let r = 0, rr = this.renderers_.length; r < rr; ++r) {
    listen(this.renderers_[r], EventType.CHANGE,
      this.changed, this);
  }

  /**
   * @private
   * @type {module:ol/TileQueue}
   */
  this.tileQueue_ = new TileQueue(
    function() {
      return 1;
    },
    this.changed.bind(this));

  const layerStatesArray = getLayerStatesArray(this.renderers_);
  const layerStates = {};
  for (let i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    layerStates[getUid(layerStatesArray[i].layer)] = layerStatesArray[i];
  }

  /**
   * The most recently requested frame state.
   * @type {module:ol/PluggableMap~FrameState}
   * @private
   */
  this.requestedFrameState_;

  /**
   * The most recently rendered image canvas.
   * @type {module:ol/ImageCanvas}
   * @private
   */
  this.renderedImageCanvas_ = null;

  /**
   * The most recently rendered revision.
   * @type {number}
   */
  this.renderedRevision_;

  /**
   * @private
   * @type {module:ol/PluggableMap~FrameState}
   */
  this.frameState_ = {
    animate: false,
    coordinateToPixelTransform: createTransform(),
    extent: null,
    focus: null,
    index: 0,
    layerStates: layerStates,
    layerStatesArray: layerStatesArray,
    pixelRatio: 1,
    pixelToCoordinateTransform: createTransform(),
    postRenderFunctions: [],
    size: [0, 0],
    skippedFeatureUids: {},
    tileQueue: this.tileQueue_,
    time: Date.now(),
    usedTiles: {},
    viewState: /** @type {module:ol/View~State} */ ({
      rotation: 0
    }),
    viewHints: [],
    wantedTiles: {}
  };

  ImageSource.call(this, {});

  if (options.operation !== undefined) {
    this.setOperation(options.operation, options.lib);
  }

};

inherits(RasterSource, ImageSource);


/**
 * Set the operation.
 * @param {module:ol/source/Raster~Operation} operation New operation.
 * @param {Object=} opt_lib Functions that will be available to operations run
 *     in a worker.
 * @api
 */
RasterSource.prototype.setOperation = function(operation, opt_lib) {
  this.worker_ = new Processor({
    operation: operation,
    imageOps: this.operationType_ === RasterOperationType.IMAGE,
    queue: 1,
    lib: opt_lib,
    threads: this.threads_
  });
  this.changed();
};


/**
 * Update the stored frame state.
 * @param {module:ol/extent~Extent} extent The view extent (in map units).
 * @param {number} resolution The view resolution.
 * @param {module:ol/proj/Projection} projection The view projection.
 * @return {module:ol/PluggableMap~FrameState} The updated frame state.
 * @private
 */
RasterSource.prototype.updateFrameState_ = function(extent, resolution, projection) {

  const frameState = /** @type {module:ol/PluggableMap~FrameState} */ (assign({}, this.frameState_));

  frameState.viewState = /** @type {module:ol/View~State} */ (assign({}, frameState.viewState));

  const center = getCenter(extent);

  frameState.extent = extent.slice();
  frameState.focus = center;
  frameState.size[0] = Math.round(getWidth(extent) / resolution);
  frameState.size[1] = Math.round(getHeight(extent) / resolution);
  frameState.time = Date.now();
  frameState.animate = false;

  const viewState = frameState.viewState;
  viewState.center = center;
  viewState.projection = projection;
  viewState.resolution = resolution;
  return frameState;
};


/**
 * Determine if all sources are ready.
 * @return {boolean} All sources are ready.
 * @private
 */
RasterSource.prototype.allSourcesReady_ = function() {
  let ready = true;
  let source;
  for (let i = 0, ii = this.renderers_.length; i < ii; ++i) {
    source = this.renderers_[i].getLayer().getSource();
    if (source.getState() !== SourceState.READY) {
      ready = false;
      break;
    }
  }
  return ready;
};


/**
 * @inheritDoc
 */
RasterSource.prototype.getImage = function(extent, resolution, pixelRatio, projection) {
  if (!this.allSourcesReady_()) {
    return null;
  }

  const frameState = this.updateFrameState_(extent, resolution, projection);
  this.requestedFrameState_ = frameState;

  // check if we can't reuse the existing ol/ImageCanvas
  if (this.renderedImageCanvas_) {
    const renderedResolution = this.renderedImageCanvas_.getResolution();
    const renderedExtent = this.renderedImageCanvas_.getExtent();
    if (resolution !== renderedResolution || !equals(extent, renderedExtent)) {
      this.renderedImageCanvas_ = null;
    }
  }

  if (!this.renderedImageCanvas_ || this.getRevision() !== this.renderedRevision_) {
    this.processSources_();
  }

  frameState.tileQueue.loadMoreTiles(16, 16);

  if (frameState.animate) {
    requestAnimationFrame(this.changed.bind(this));
  }

  return this.renderedImageCanvas_;
};


/**
 * Start processing source data.
 * @private
 */
RasterSource.prototype.processSources_ = function() {
  const frameState = this.requestedFrameState_;
  const len = this.renderers_.length;
  const imageDatas = new Array(len);
  for (let i = 0; i < len; ++i) {
    const imageData = getImageData(
      this.renderers_[i], frameState, frameState.layerStatesArray[i]);
    if (imageData) {
      imageDatas[i] = imageData;
    } else {
      return;
    }
  }

  const data = {};
  this.dispatchEvent(new RasterSourceEvent(RasterEventType.BEFOREOPERATIONS, frameState, data));
  this.worker_.process(imageDatas, data, this.onWorkerComplete_.bind(this, frameState));
};


/**
 * Called when pixel processing is complete.
 * @param {module:ol/PluggableMap~FrameState} frameState The frame state.
 * @param {Error} err Any error during processing.
 * @param {ImageData} output The output image data.
 * @param {Object} data The user data.
 * @private
 */
RasterSource.prototype.onWorkerComplete_ = function(frameState, err, output, data) {
  if (err || !output) {
    return;
  }

  // do nothing if extent or resolution changed
  const extent = frameState.extent;
  const resolution = frameState.viewState.resolution;
  if (resolution !== this.requestedFrameState_.viewState.resolution ||
      !equals(extent, this.requestedFrameState_.extent)) {
    return;
  }

  let context;
  if (this.renderedImageCanvas_) {
    context = this.renderedImageCanvas_.getImage().getContext('2d');
  } else {
    const width = Math.round(getWidth(extent) / resolution);
    const height = Math.round(getHeight(extent) / resolution);
    context = createCanvasContext2D(width, height);
    this.renderedImageCanvas_ = new ImageCanvas(extent, resolution, 1, context.canvas);
  }
  context.putImageData(output, 0, 0);

  this.changed();
  this.renderedRevision_ = this.getRevision();

  this.dispatchEvent(new RasterSourceEvent(RasterEventType.AFTEROPERATIONS, frameState, data));
};


/**
 * A reusable canvas context.
 * @type {CanvasRenderingContext2D}
 * @private
 */
let sharedContext = null;


/**
 * Get image data from a renderer.
 * @param {module:ol/renderer/canvas/Layer} renderer Layer renderer.
 * @param {module:ol/PluggableMap~FrameState} frameState The frame state.
 * @param {module:ol/layer/Layer~State} layerState The layer state.
 * @return {ImageData} The image data.
 */
function getImageData(renderer, frameState, layerState) {
  if (!renderer.prepareFrame(frameState, layerState)) {
    return null;
  }
  const width = frameState.size[0];
  const height = frameState.size[1];
  if (!sharedContext) {
    sharedContext = createCanvasContext2D(width, height);
  } else {
    const canvas = sharedContext.canvas;
    if (canvas.width !== width || canvas.height !== height) {
      sharedContext = createCanvasContext2D(width, height);
    } else {
      sharedContext.clearRect(0, 0, width, height);
    }
  }
  renderer.composeFrame(frameState, layerState, sharedContext);
  return sharedContext.getImageData(0, 0, width, height);
}


/**
 * Get a list of layer states from a list of renderers.
 * @param {Array.<module:ol/renderer/canvas/Layer>} renderers Layer renderers.
 * @return {Array.<module:ol/layer/Layer~State>} The layer states.
 */
function getLayerStatesArray(renderers) {
  return renderers.map(function(renderer) {
    return renderer.getLayer().getLayerState();
  });
}


/**
 * Create renderers for all sources.
 * @param {Array.<module:ol/source/Source>} sources The sources.
 * @return {Array.<module:ol/renderer/canvas/Layer>} Array of layer renderers.
 */
function createRenderers(sources) {
  const len = sources.length;
  const renderers = new Array(len);
  for (let i = 0; i < len; ++i) {
    renderers[i] = createRenderer(sources[i]);
  }
  return renderers;
}


/**
 * Create a renderer for the provided source.
 * @param {module:ol/source/Source} source The source.
 * @return {module:ol/renderer/canvas/Layer} The renderer.
 */
function createRenderer(source) {
  let renderer = null;
  if (source instanceof TileSource) {
    renderer = createTileRenderer(source);
  } else if (source instanceof ImageSource) {
    renderer = createImageRenderer(source);
  } else if (source instanceof TileLayer) {
    renderer = new CanvasTileLayerRenderer(source);
  } else if (source instanceof Layer &&
      (source.getType() == LayerType.IMAGE || source.getType() == LayerType.VECTOR)) {
    renderer = new CanvasImageLayerRenderer(source);
  }
  return renderer;
}


/**
 * Create an image renderer for the provided source.
 * @param {module:ol/source/Image} source The source.
 * @return {module:ol/renderer/canvas/Layer} The renderer.
 */
function createImageRenderer(source) {
  const layer = new ImageLayer({source: source});
  return new CanvasImageLayerRenderer(layer);
}


/**
 * Create a tile renderer for the provided source.
 * @param {module:ol/source/Tile} source The source.
 * @return {module:ol/renderer/canvas/Layer} The renderer.
 */
function createTileRenderer(source) {
  const layer = new TileLayer({source: source});
  return new CanvasTileLayerRenderer(layer);
}


/**
 * @override
 */
RasterSource.prototype.getImageInternal = function() {
  return null; // not implemented
};


export default RasterSource;
