/**
 * @module ol/source/Raster
 */
import ImageCanvas from '../ImageCanvas.js';
import TileQueue from '../TileQueue.js';
import {createCanvasContext2D} from '../dom.js';
import {listen} from '../events.js';
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import {Processor} from 'pixelworks/lib/index';
import {equals, getCenter, getHeight, getWidth} from '../extent.js';
import ImageLayer from '../layer/Image.js';
import TileLayer from '../layer/Tile.js';
import {assign} from '../obj.js';
import {create as createTransform} from '../transform.js';
import ImageSource from './Image.js';
import TileSource from './Tile.js';
import SourceState from './State.js';
import Source from './Source.js';


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
 * @typedef {function((Array<Array<number>>|Array<ImageData>), Object):
 *     (Array<number>|ImageData)} Operation
 */


/**
 * @enum {string}
 */
const RasterEventType = {
  /**
   * Triggered before operations are run.
   * @event module:ol/source/Raster.RasterSourceEvent#beforeoperations
   * @api
   */
  BEFOREOPERATIONS: 'beforeoperations',

  /**
   * Triggered after operations are run.
   * @event module:ol/source/Raster.RasterSourceEvent#afteroperations
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
 */
export class RasterSourceEvent extends Event {
  /**
   * @param {string} type Type.
   * @param {import("../PluggableMap.js").FrameState} frameState The frame state.
   * @param {Object} data An object made available to operations.
   */
  constructor(type, frameState, data) {
    super(type);

    /**
     * The raster extent.
     * @type {import("../extent.js").Extent}
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

  }

}

/**
 * @typedef {Object} Options
 * @property {Array<import("./Source.js").default|import("../layer/Layer.js").default>} sources Input
 * sources or layers.  For vector data, use an VectorImage layer.
 * @property {Operation} [operation] Raster operation.
 * The operation will be called with data from input sources
 * and the output will be assigned to the raster source.
 * @property {Object} [lib] Functions that will be made available to operations run in a worker.
 * @property {number} [threads] By default, operations will be run in a single worker thread.
 * To avoid using workers altogether, set `threads: 0`.  For pixel operations, operations can
 * be run in multiple worker threads.  Note that there is additional overhead in
 * transferring data to multiple workers, and that depending on the user's
 * system, it may not be possible to parallelize the work.
 * @property {RasterOperationType} [operationType='pixel'] Operation type.
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
 * @fires module:ol/source/Raster.RasterSourceEvent
 * @api
 */
class RasterSource extends ImageSource {
  /**
   * @param {Options} options Options.
   */
  constructor(options) {
    super({
      projection: null
    });

    /**
     * @private
     * @type {*}
     */
    this.worker_ = null;

    /**
     * @private
     * @type {RasterOperationType}
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
     * @type {Array<import("../layer/Layer.js").default>}
     */
    this.layers_ = createLayers(options.sources);

    for (let i = 0, ii = this.layers_.length; i < ii; ++i) {
      listen(this.layers_[i], EventType.CHANGE, this.changed, this);
    }

    /**
     * @private
     * @type {import("../TileQueue.js").default}
     */
    this.tileQueue_ = new TileQueue(function() {
      return 1;
    }, this.changed.bind(this));

    /**
     * The most recently requested frame state.
     * @type {import("../PluggableMap.js").FrameState}
     * @private
     */
    this.requestedFrameState_;

    /**
     * The most recently rendered image canvas.
     * @type {import("../ImageCanvas.js").default}
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
     * @type {import("../PluggableMap.js").FrameState}
     */
    this.frameState_ = {
      animate: false,
      coordinateToPixelTransform: createTransform(),
      extent: null,
      focus: null,
      index: 0,
      layerStatesArray: getLayerStatesArray(this.layers_),
      pixelRatio: 1,
      pixelToCoordinateTransform: createTransform(),
      postRenderFunctions: [],
      size: [0, 0],
      skippedFeatureUids: {},
      tileQueue: this.tileQueue_,
      time: Date.now(),
      usedTiles: {},
      viewState: /** @type {import("../View.js").State} */ ({
        rotation: 0
      }),
      viewHints: [],
      wantedTiles: {}
    };

    this.setAttributions(function(frameState) {
      const attributions = [];
      for (let index = 0, iMax = options.sources.length; index < iMax; ++index) {
        const sourceOrLayer = options.sources[index];
        const source = sourceOrLayer instanceof Source ? sourceOrLayer : sourceOrLayer.getSource();
        const attributionGetter = source.getAttributions();
        if (typeof attributionGetter === 'function') {
          const sourceAttribution = attributionGetter(frameState);
          attributions.push.apply(attributions, sourceAttribution);
        }
      }
      return attributions.length !== 0 ? attributions : null;
    });

    if (options.operation !== undefined) {
      this.setOperation(options.operation, options.lib);
    }

  }

  /**
   * Set the operation.
   * @param {Operation} operation New operation.
   * @param {Object=} opt_lib Functions that will be available to operations run
   *     in a worker.
   * @api
   */
  setOperation(operation, opt_lib) {
    this.worker_ = new Processor({
      operation: operation,
      imageOps: this.operationType_ === RasterOperationType.IMAGE,
      queue: 1,
      lib: opt_lib,
      threads: this.threads_
    });
    this.changed();
  }

  /**
   * Update the stored frame state.
   * @param {import("../extent.js").Extent} extent The view extent (in map units).
   * @param {number} resolution The view resolution.
   * @param {import("../proj/Projection.js").default} projection The view projection.
   * @return {import("../PluggableMap.js").FrameState} The updated frame state.
   * @private
   */
  updateFrameState_(extent, resolution, projection) {

    const frameState = /** @type {import("../PluggableMap.js").FrameState} */ (assign({}, this.frameState_));

    frameState.viewState = /** @type {import("../View.js").State} */ (assign({}, frameState.viewState));

    const center = getCenter(extent);

    frameState.extent = extent.slice();
    frameState.focus = center;
    frameState.size[0] = Math.round(getWidth(extent) / resolution);
    frameState.size[1] = Math.round(getHeight(extent) / resolution);
    frameState.time = Infinity;

    const viewState = frameState.viewState;
    viewState.center = center;
    viewState.projection = projection;
    viewState.resolution = resolution;
    return frameState;
  }

  /**
   * Determine if all sources are ready.
   * @return {boolean} All sources are ready.
   * @private
   */
  allSourcesReady_() {
    let ready = true;
    let source;
    for (let i = 0, ii = this.layers_.length; i < ii; ++i) {
      source = this.layers_[i].getSource();
      if (source.getState() !== SourceState.READY) {
        ready = false;
        break;
      }
    }
    return ready;
  }

  /**
   * @inheritDoc
   */
  getImage(extent, resolution, pixelRatio, projection) {
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
  }

  /**
   * Start processing source data.
   * @private
   */
  processSources_() {
    const frameState = this.requestedFrameState_;
    const len = this.layers_.length;
    const imageDatas = new Array(len);
    for (let i = 0; i < len; ++i) {
      const imageData = getImageData(this.layers_[i], frameState, frameState.layerStatesArray[i]);
      if (imageData) {
        imageDatas[i] = imageData;
      } else {
        return;
      }
    }

    const data = {};
    this.dispatchEvent(new RasterSourceEvent(RasterEventType.BEFOREOPERATIONS, frameState, data));
    this.worker_.process(imageDatas, data, this.onWorkerComplete_.bind(this, frameState));
  }

  /**
   * Called when pixel processing is complete.
   * @param {import("../PluggableMap.js").FrameState} frameState The frame state.
   * @param {Error} err Any error during processing.
   * @param {ImageData} output The output image data.
   * @param {Object} data The user data.
   * @private
   */
  onWorkerComplete_(frameState, err, output, data) {
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
  }

  /**
   * @override
   */
  getImageInternal() {
    return null; // not implemented
  }
}


/**
 * A reusable canvas context.
 * @type {CanvasRenderingContext2D}
 * @private
 */
let sharedContext = null;


/**
 * Get image data from a layer.
 * @param {import("../layer/Layer.js").default} layer Layer to render.
 * @param {import("../PluggableMap.js").FrameState} frameState The frame state.
 * @param {import("../layer/Layer.js").State} layerState The layer state.
 * @return {ImageData} The image data.
 */
function getImageData(layer, frameState, layerState) {
  const renderer = layer.getRenderer();
  if (!renderer) {
    throw new Error('Unsupported layer type: ' + layer);
  }

  if (!renderer.prepareFrame(frameState, layerState)) {
    return null;
  }
  const width = frameState.size[0];
  const height = frameState.size[1];
  const element = renderer.renderFrame(frameState, layerState);
  if (!(element instanceof HTMLCanvasElement)) {
    throw new Error('Unsupported rendered element: ' + element);
  }
  if (element.width === width && element.height === height) {
    const context = element.getContext('2d');
    return context.getImageData(0, 0, width, height);
  }

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
  sharedContext.drawImage(element, 0, 0, width, height);
  return sharedContext.getImageData(0, 0, width, height);
}


/**
 * Get a list of layer states from a list of layers.
 * @param {Array<import("../layer/Layer.js").default>} layers Layers.
 * @return {Array<import("../layer/Layer.js").State>} The layer states.
 */
function getLayerStatesArray(layers) {
  return layers.map(function(layer) {
    return layer.getLayerState();
  });
}


/**
 * Create layers for all sources.
 * @param {Array<import("./Source.js").default|import("../layer/Layer.js").default>} sources The sources.
 * @return {Array<import("../layer/Layer.js").default>} Array of layers.
 */
function createLayers(sources) {
  const len = sources.length;
  const layers = new Array(len);
  for (let i = 0; i < len; ++i) {
    layers[i] = createLayer(sources[i]);
  }
  return layers;
}


/**
 * Create a layer for the provided source.
 * @param {import("./Source.js").default|import("../layer/Layer.js").default} layerOrSource The layer or source.
 * @return {import("../layer/Layer.js").default} The layer.
 */
function createLayer(layerOrSource) {
  // @type {import("../layer/Layer.js").default}
  let layer;
  if (layerOrSource instanceof Source) {
    if (layerOrSource instanceof TileSource) {
      layer = new TileLayer({source: layerOrSource});
    } else if (layerOrSource instanceof ImageSource) {
      layer = new ImageLayer({source: layerOrSource});
    }
  } else {
    layer = layerOrSource;
  }
  return layer;
}


export default RasterSource;
