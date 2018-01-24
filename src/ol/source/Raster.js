/**
 * @module ol/source/Raster
 */
import {getUid, inherits} from '../index.js';
import ImageCanvas from '../ImageCanvas.js';
import TileQueue from '../TileQueue.js';
import {createCanvasContext2D} from '../dom.js';
import {listen} from '../events.js';
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import {Processor} from 'pixelworks';
import {equals, getCenter, getHeight, getWidth} from '../extent.js';
import ImageLayer from '../layer/Image.js';
import TileLayer from '../layer/Tile.js';
import {assign} from '../obj.js';
import CanvasImageLayerRenderer from '../renderer/canvas/ImageLayer.js';
import CanvasTileLayerRenderer from '../renderer/canvas/TileLayer.js';
import ImageSource from '../source/Image.js';
import RasterOperationType from '../source/RasterOperationType.js';
import SourceState from '../source/State.js';
import TileSource from '../source/Tile.js';
import _ol_transform_ from '../transform.js';


/**
 * @enum {string}
 */
const RasterEventType = {
  /**
   * Triggered before operations are run.
   * @event ol.source.Raster.Event#beforeoperations
   * @api
   */
  BEFOREOPERATIONS: 'beforeoperations',

  /**
   * Triggered after operations are run.
   * @event ol.source.Raster.Event#afteroperations
   * @api
   */
  AFTEROPERATIONS: 'afteroperations'
};


/**
 * @classdesc
 * A source that transforms data from any number of input sources using an
 * {@link ol.RasterOperation} function to transform input pixel values into
 * output pixel values.
 *
 * @constructor
 * @extends {ol.source.Image}
 * @fires ol.source.Raster.Event
 * @param {olx.source.RasterOptions} options Options.
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
   * @type {ol.source.RasterOperationType}
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
   * @type {Array.<ol.renderer.canvas.Layer>}
   */
  this.renderers_ = createRenderers(options.sources);

  for (let r = 0, rr = this.renderers_.length; r < rr; ++r) {
    listen(this.renderers_[r], EventType.CHANGE,
      this.changed, this);
  }

  /**
   * @private
   * @type {ol.TileQueue}
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
   * @type {olx.FrameState}
   * @private
   */
  this.requestedFrameState_;

  /**
   * The most recently rendered image canvas.
   * @type {ol.ImageCanvas}
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
   * @type {olx.FrameState}
   */
  this.frameState_ = {
    animate: false,
    coordinateToPixelTransform: _ol_transform_.create(),
    extent: null,
    focus: null,
    index: 0,
    layerStates: layerStates,
    layerStatesArray: layerStatesArray,
    pixelRatio: 1,
    pixelToCoordinateTransform: _ol_transform_.create(),
    postRenderFunctions: [],
    size: [0, 0],
    skippedFeatureUids: {},
    tileQueue: this.tileQueue_,
    time: Date.now(),
    usedTiles: {},
    viewState: /** @type {olx.ViewState} */ ({
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
 * @param {ol.RasterOperation} operation New operation.
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
 * @param {ol.Extent} extent The view extent (in map units).
 * @param {number} resolution The view resolution.
 * @param {ol.proj.Projection} projection The view projection.
 * @return {olx.FrameState} The updated frame state.
 * @private
 */
RasterSource.prototype.updateFrameState_ = function(extent, resolution, projection) {

  const frameState = /** @type {olx.FrameState} */ (assign({}, this.frameState_));

  frameState.viewState = /** @type {olx.ViewState} */ (assign({}, frameState.viewState));

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

  // check if we can't reuse the existing ol.ImageCanvas
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
  this.dispatchEvent(new RasterSource.Event(RasterEventType.BEFOREOPERATIONS, frameState, data));
  this.worker_.process(imageDatas, data, this.onWorkerComplete_.bind(this, frameState));
};


/**
 * Called when pixel processing is complete.
 * @param {olx.FrameState} frameState The frame state.
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

  this.dispatchEvent(new RasterSource.Event(RasterEventType.AFTEROPERATIONS, frameState, data));
};


/**
 * Get image data from a renderer.
 * @param {ol.renderer.canvas.Layer} renderer Layer renderer.
 * @param {olx.FrameState} frameState The frame state.
 * @param {ol.LayerState} layerState The layer state.
 * @return {ImageData} The image data.
 */
function getImageData(renderer, frameState, layerState) {
  if (!renderer.prepareFrame(frameState, layerState)) {
    return null;
  }
  const width = frameState.size[0];
  const height = frameState.size[1];
  if (!RasterSource.context_) {
    RasterSource.context_ = createCanvasContext2D(width, height);
  } else {
    const canvas = RasterSource.context_.canvas;
    if (canvas.width !== width || canvas.height !== height) {
      RasterSource.context_ = createCanvasContext2D(width, height);
    } else {
      RasterSource.context_.clearRect(0, 0, width, height);
    }
  }
  renderer.composeFrame(frameState, layerState, RasterSource.context_);
  return RasterSource.context_.getImageData(0, 0, width, height);
}


/**
 * A reusable canvas context.
 * @type {CanvasRenderingContext2D}
 * @private
 */
RasterSource.context_ = null;


/**
 * Get a list of layer states from a list of renderers.
 * @param {Array.<ol.renderer.canvas.Layer>} renderers Layer renderers.
 * @return {Array.<ol.LayerState>} The layer states.
 */
function getLayerStatesArray(renderers) {
  return renderers.map(function(renderer) {
    return renderer.getLayer().getLayerState();
  });
}


/**
 * Create renderers for all sources.
 * @param {Array.<ol.source.Source>} sources The sources.
 * @return {Array.<ol.renderer.canvas.Layer>} Array of layer renderers.
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
 * @param {ol.source.Source} source The source.
 * @return {ol.renderer.canvas.Layer} The renderer.
 */
function createRenderer(source) {
  let renderer = null;
  if (source instanceof TileSource) {
    renderer = createTileRenderer(source);
  } else if (source instanceof ImageSource) {
    renderer = createImageRenderer(source);
  }
  return renderer;
}


/**
 * Create an image renderer for the provided source.
 * @param {ol.source.Image} source The source.
 * @return {ol.renderer.canvas.Layer} The renderer.
 */
function createImageRenderer(source) {
  const layer = new ImageLayer({source: source});
  return new CanvasImageLayerRenderer(layer);
}


/**
 * Create a tile renderer for the provided source.
 * @param {ol.source.Tile} source The source.
 * @return {ol.renderer.canvas.Layer} The renderer.
 */
function createTileRenderer(source) {
  const layer = new TileLayer({source: source});
  return new CanvasTileLayerRenderer(layer);
}


/**
 * @classdesc
 * Events emitted by {@link ol.source.Raster} instances are instances of this
 * type.
 *
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.source.RasterEvent}
 * @param {string} type Type.
 * @param {olx.FrameState} frameState The frame state.
 * @param {Object} data An object made available to operations.
 */
RasterSource.Event = function(type, frameState, data) {
  Event.call(this, type);

  /**
   * The raster extent.
   * @type {ol.Extent}
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
inherits(RasterSource.Event, Event);


/**
 * @override
 */
RasterSource.prototype.getImageInternal = function() {
  return null; // not implemented
};


export default RasterSource;
