/**
 * @module ol/source/Raster
 */
import Disposable from '../Disposable.js';
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import ImageCanvas from '../ImageCanvas.js';
import ImageLayer from '../layer/Image.js';
import ImageSource from './Image.js';
import Source from './Source.js';
import SourceState from './State.js';
import TileLayer from '../layer/Tile.js';
import TileQueue from '../TileQueue.js';
import TileSource from './Tile.js';
import {assign} from '../obj.js';
import {createCanvasContext2D} from '../dom.js';
import {create as createTransform} from '../transform.js';
import {equals, getCenter, getHeight, getWidth} from '../extent.js';

let hasImageData = true;
try {
  new ImageData(10, 10);
} catch (_) {
  hasImageData = false;
}

const context = document.createElement('canvas').getContext('2d');

/**
 * @param {Uint8ClampedArray} data Image data.
 * @param {number} width Number of columns.
 * @param {number} height Number of rows.
 * @return {ImageData} Image data.
 */
export function newImageData(data, width, height) {
  if (hasImageData) {
    return new ImageData(data, width, height);
  } else {
    const imageData = context.createImageData(width, height);
    imageData.data.set(data);
    return imageData;
  }
}

/* istanbul ignore next */
/**
 * Create a function for running operations.  This function is serialized for
 * use in a worker.
 * @param {function(Array, Object):*} operation The operation.
 * @return {function(Object):ArrayBuffer} A function that takes an object with
 * buffers, meta, imageOps, width, and height properties and returns an array
 * buffer.
 */
function createMinion(operation) {
  let workerHasImageData = true;
  try {
    new ImageData(10, 10);
  } catch (_) {
    workerHasImageData = false;
  }

  function newWorkerImageData(data, width, height) {
    if (workerHasImageData) {
      return new ImageData(data, width, height);
    } else {
      return {data: data, width: width, height: height};
    }
  }

  return function (data) {
    // bracket notation for minification support
    const buffers = data['buffers'];
    const meta = data['meta'];
    const imageOps = data['imageOps'];
    const width = data['width'];
    const height = data['height'];

    const numBuffers = buffers.length;
    const numBytes = buffers[0].byteLength;
    let output, b;

    if (imageOps) {
      const images = new Array(numBuffers);
      for (b = 0; b < numBuffers; ++b) {
        images[b] = newWorkerImageData(
          new Uint8ClampedArray(buffers[b]),
          width,
          height
        );
      }
      output = operation(images, meta).data;
    } else {
      output = new Uint8ClampedArray(numBytes);
      const arrays = new Array(numBuffers);
      const pixels = new Array(numBuffers);
      for (b = 0; b < numBuffers; ++b) {
        arrays[b] = new Uint8ClampedArray(buffers[b]);
        pixels[b] = [0, 0, 0, 0];
      }
      for (let i = 0; i < numBytes; i += 4) {
        for (let j = 0; j < numBuffers; ++j) {
          const array = arrays[j];
          pixels[j][0] = array[i];
          pixels[j][1] = array[i + 1];
          pixels[j][2] = array[i + 2];
          pixels[j][3] = array[i + 3];
        }
        const pixel = operation(pixels, meta);
        output[i] = pixel[0];
        output[i + 1] = pixel[1];
        output[i + 2] = pixel[2];
        output[i + 3] = pixel[3];
      }
    }
    return output.buffer;
  };
}

/**
 * Create a worker for running operations.
 * @param {Object} config Configuration.
 * @param {function(MessageEvent): void} onMessage Called with a message event.
 * @return {Worker} The worker.
 */
function createWorker(config, onMessage) {
  const lib = Object.keys(config.lib || {}).map(function (name) {
    return 'var ' + name + ' = ' + config.lib[name].toString() + ';';
  });

  const lines = lib.concat([
    'var __minion__ = (' + createMinion.toString() + ')(',
    config.operation.toString(),
    ');',
    'self.addEventListener("message", function(event) {',
    '  var buffer = __minion__(event.data);',
    '  self.postMessage({buffer: buffer, meta: event.data.meta}, [buffer]);',
    '});',
  ]);

  const blob = new Blob(lines, {type: 'text/javascript'});
  const source = URL.createObjectURL(blob);
  const worker = new Worker(source);
  worker.addEventListener('message', onMessage);
  return worker;
}

/**
 * @typedef {Object} FauxMessageEvent
 * @property {Object} data Message data.
 */

/**
 * Create a faux worker for running operations.
 * @param {ProcessorOptions} config Configuration.
 * @param {function(FauxMessageEvent): void} onMessage Called with a message event.
 * @return {Object} The faux worker.
 */
function createFauxWorker(config, onMessage) {
  const minion = createMinion(config.operation);
  let terminated = false;
  return {
    postMessage: function (data) {
      setTimeout(function () {
        if (terminated) {
          return;
        }
        onMessage({data: {buffer: minion(data), meta: data['meta']}});
      }, 0);
    },
    terminate: function () {
      terminated = true;
    },
  };
}

/**
 * @typedef {Object} ProcessorOptions
 * @property {number} threads Number of workers to spawn.
 * @property {function(Array, Object):*} operation The operation.
 * @property {Object} [lib] Functions that will be made available to operations run in a worker.
 * @property {number} queue The number of queued jobs to allow.
 * @property {boolean} [imageOps=false] Pass all the image data to the operation instead of a single pixel.
 */

/**
 * @classdesc
 * A processor runs pixel or image operations in workers.
 */
export class Processor extends Disposable {
  /**
   * @param {ProcessorOptions} config Configuration.
   */
  constructor(config) {
    super();

    this._imageOps = !!config.imageOps;
    let threads;
    if (config.threads === 0) {
      threads = 0;
    } else if (this._imageOps) {
      threads = 1;
    } else {
      threads = config.threads || 1;
    }
    const workers = [];
    if (threads) {
      for (let i = 0; i < threads; ++i) {
        workers[i] = createWorker(config, this._onWorkerMessage.bind(this, i));
      }
    } else {
      workers[0] = createFauxWorker(
        config,
        this._onWorkerMessage.bind(this, 0)
      );
    }
    this._workers = workers;
    this._queue = [];
    this._maxQueueLength = config.queue || Infinity;
    this._running = 0;
    this._dataLookup = {};
    this._job = null;
  }

  /**
   * Run operation on input data.
   * @param {Array.<Array|ImageData>} inputs Array of pixels or image data
   *     (depending on the operation type).
   * @param {Object} meta A user data object.  This is passed to all operations
   *     and must be serializable.
   * @param {function(Error, ImageData, Object): void} callback Called when work
   *     completes.  The first argument is any error.  The second is the ImageData
   *     generated by operations.  The third is the user data object.
   */
  process(inputs, meta, callback) {
    this._enqueue({
      inputs: inputs,
      meta: meta,
      callback: callback,
    });
    this._dispatch();
  }

  /**
   * Add a job to the queue.
   * @param {Object} job The job.
   */
  _enqueue(job) {
    this._queue.push(job);
    while (this._queue.length > this._maxQueueLength) {
      this._queue.shift().callback(null, null);
    }
  }

  /**
   * Dispatch a job.
   */
  _dispatch() {
    if (this._running === 0 && this._queue.length > 0) {
      const job = this._queue.shift();
      this._job = job;
      const width = job.inputs[0].width;
      const height = job.inputs[0].height;
      const buffers = job.inputs.map(function (input) {
        return input.data.buffer;
      });
      const threads = this._workers.length;
      this._running = threads;
      if (threads === 1) {
        this._workers[0].postMessage(
          {
            buffers: buffers,
            meta: job.meta,
            imageOps: this._imageOps,
            width: width,
            height: height,
          },
          buffers
        );
      } else {
        const length = job.inputs[0].data.length;
        const segmentLength = 4 * Math.ceil(length / 4 / threads);
        for (let i = 0; i < threads; ++i) {
          const offset = i * segmentLength;
          const slices = [];
          for (let j = 0, jj = buffers.length; j < jj; ++j) {
            slices.push(buffers[i].slice(offset, offset + segmentLength));
          }
          this._workers[i].postMessage(
            {
              buffers: slices,
              meta: job.meta,
              imageOps: this._imageOps,
              width: width,
              height: height,
            },
            slices
          );
        }
      }
    }
  }

  /**
   * Handle messages from the worker.
   * @param {number} index The worker index.
   * @param {MessageEvent} event The message event.
   */
  _onWorkerMessage(index, event) {
    if (this.disposed) {
      return;
    }
    this._dataLookup[index] = event.data;
    --this._running;
    if (this._running === 0) {
      this._resolveJob();
    }
  }

  /**
   * Resolve a job.  If there are no more worker threads, the processor callback
   * will be called.
   */
  _resolveJob() {
    const job = this._job;
    const threads = this._workers.length;
    let data, meta;
    if (threads === 1) {
      data = new Uint8ClampedArray(this._dataLookup[0]['buffer']);
      meta = this._dataLookup[0]['meta'];
    } else {
      const length = job.inputs[0].data.length;
      data = new Uint8ClampedArray(length);
      meta = new Array(length);
      const segmentLength = 4 * Math.ceil(length / 4 / threads);
      for (let i = 0; i < threads; ++i) {
        const buffer = this._dataLookup[i]['buffer'];
        const offset = i * segmentLength;
        data.set(new Uint8ClampedArray(buffer), offset);
        meta[i] = this._dataLookup[i]['meta'];
      }
    }
    this._job = null;
    this._dataLookup = {};
    job.callback(
      null,
      newImageData(data, job.inputs[0].width, job.inputs[0].height),
      meta
    );
    this._dispatch();
  }

  /**
   * Terminate all workers associated with the processor.
   */
  disposeInternal() {
    for (let i = 0; i < this._workers.length; ++i) {
      this._workers[i].terminate();
    }
    this._workers.length = 0;
  }
}

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
  AFTEROPERATIONS: 'afteroperations',
};

/**
 * Raster operation type. Supported values are `'pixel'` and `'image'`.
 * @enum {string}
 */
const RasterOperationType = {
  PIXEL: 'pixel',
  IMAGE: 'image',
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
      projection: null,
    });

    /**
     * @private
     * @type {Processor}
     */
    this.processor_ = null;

    /**
     * @private
     * @type {RasterOperationType}
     */
    this.operationType_ =
      options.operationType !== undefined
        ? options.operationType
        : RasterOperationType.PIXEL;

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

    const changed = this.changed.bind(this);
    for (let i = 0, ii = this.layers_.length; i < ii; ++i) {
      this.layers_[i].addEventListener(EventType.CHANGE, changed);
    }

    /**
     * @private
     * @type {import("../TileQueue.js").default}
     */
    this.tileQueue_ = new TileQueue(function () {
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
      index: 0,
      layerIndex: 0,
      layerStatesArray: getLayerStatesArray(this.layers_),
      pixelRatio: 1,
      pixelToCoordinateTransform: createTransform(),
      postRenderFunctions: [],
      size: [0, 0],
      tileQueue: this.tileQueue_,
      time: Date.now(),
      usedTiles: {},
      viewState: /** @type {import("../View.js").State} */ ({
        rotation: 0,
      }),
      viewHints: [],
      wantedTiles: {},
      declutterItems: [],
    };

    this.setAttributions(function (frameState) {
      const attributions = [];
      for (
        let index = 0, iMax = options.sources.length;
        index < iMax;
        ++index
      ) {
        const sourceOrLayer = options.sources[index];
        const source =
          sourceOrLayer instanceof Source
            ? sourceOrLayer
            : sourceOrLayer.getSource();
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
    if (this.processor_) {
      this.processor_.dispose();
    }

    this.processor_ = new Processor({
      operation: operation,
      imageOps: this.operationType_ === RasterOperationType.IMAGE,
      queue: 1,
      lib: opt_lib,
      threads: this.threads_,
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
    const frameState = /** @type {import("../PluggableMap.js").FrameState} */ (assign(
      {},
      this.frameState_
    ));

    frameState.viewState = /** @type {import("../View.js").State} */ (assign(
      {},
      frameState.viewState
    ));

    const center = getCenter(extent);

    frameState.extent = extent.slice();
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
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {import("../ImageCanvas.js").default} Single image.
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
      if (
        resolution !== renderedResolution ||
        !equals(extent, renderedExtent)
      ) {
        this.renderedImageCanvas_ = null;
      }
    }

    if (
      !this.renderedImageCanvas_ ||
      this.getRevision() !== this.renderedRevision_
    ) {
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
      frameState.layerIndex = i;
      const imageData = getImageData(this.layers_[i], frameState);
      if (imageData) {
        imageDatas[i] = imageData;
      } else {
        return;
      }
    }

    const data = {};
    this.dispatchEvent(
      new RasterSourceEvent(RasterEventType.BEFOREOPERATIONS, frameState, data)
    );
    this.processor_.process(
      imageDatas,
      data,
      this.onWorkerComplete_.bind(this, frameState)
    );
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
    if (
      resolution !== this.requestedFrameState_.viewState.resolution ||
      !equals(extent, this.requestedFrameState_.extent)
    ) {
      return;
    }

    let context;
    if (this.renderedImageCanvas_) {
      context = this.renderedImageCanvas_.getImage().getContext('2d');
    } else {
      const width = Math.round(getWidth(extent) / resolution);
      const height = Math.round(getHeight(extent) / resolution);
      context = createCanvasContext2D(width, height);
      this.renderedImageCanvas_ = new ImageCanvas(
        extent,
        resolution,
        1,
        context.canvas
      );
    }
    context.putImageData(output, 0, 0);

    this.changed();
    this.renderedRevision_ = this.getRevision();

    this.dispatchEvent(
      new RasterSourceEvent(RasterEventType.AFTEROPERATIONS, frameState, data)
    );
  }

  /**
   * @return {null} not implemented
   */
  getImageInternal() {
    return null; // not implemented
  }

  disposeInternal() {
    if (this.processor_) {
      this.processor_.dispose();
    }
    super.disposeInternal();
  }
}

/**
 * Clean up and unregister the worker.
 * @function
 * @api
 */
RasterSource.prototype.dispose;

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
 * @return {ImageData} The image data.
 */
function getImageData(layer, frameState) {
  const renderer = layer.getRenderer();
  if (!renderer) {
    throw new Error('Unsupported layer type: ' + layer);
  }

  if (!renderer.prepareFrame(frameState)) {
    return null;
  }
  const width = frameState.size[0];
  const height = frameState.size[1];
  const container = renderer.renderFrame(frameState, null);
  let element;
  if (container) {
    element = container.firstElementChild;
  }
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
  return layers.map(function (layer) {
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
