/**
 * @module ol/source/Raster
 */
import Disposable from '../Disposable.js';
import ImageCanvas from '../ImageCanvas.js';
import TileQueue from '../TileQueue.js';
import {createCanvasContext2D} from '../dom.js';
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import {equals, getCenter, getHeight, getWidth} from '../extent.js';
import ImageLayer from '../layer/Image.js';
import TileLayer from '../layer/Tile.js';
import LRUCache from '../structs/LRUCache.js';
import {
  apply as applyTransform,
  create as createTransform,
} from '../transform.js';
import {getUid} from '../util.js';
import DataTileSource from './DataTile.js';
import ImageSource from './Image.js';
import ImageTileSource from './ImageTile.js';
import Source from './Source.js';
import TileSource from './Tile.js';

/**
 * @typedef {Object} MinionData
 * @property {Array<ArrayBuffer>} buffers Array of buffers.
 * @property {Object} meta Operation metadata.
 * @property {boolean} imageOps The operation is an image operation.
 * @property {number} width The width of the image.
 * @property {number} height The height of the image.
 * @property {Array<number>} bandCounts The number of bands in each input.
 * @property {Array<string>} dtypes The typed array constructor name of each input.
 */

/**
 * A single input to an operation.  All inputs for a job share the same width
 * and height (the output pixel dimensions); they may differ in band count and
 * array type.  For image inputs, the data is `Uint8ClampedArray` RGBA (four
 * bands); for data tile inputs, the data is the native interleaved array.
 * @typedef {Uint8Array|Uint8ClampedArray|Int8Array|Uint16Array|Int16Array|Uint32Array|Int32Array|Float32Array|Float64Array} TypedArray
 */

/**
 * @typedef {Object} Input
 * @property {TypedArray} data Interleaved band data.
 * @property {number} width Width in pixels.
 * @property {number} height Height in pixels.
 * @property {number} bandCount Number of bands per pixel.
 */

/**
 * Create a function for running operations.  This function is serialized for
 * use in a worker.
 * @param {function(Array<*>, Object):*} operation The operation.
 * @return {function(MinionData):ArrayBuffer} A function that takes a
 * {@link MinionData} object and returns an array buffer of RGBA output.
 */
function createMinion(operation) {
  /**
   * Create a typed array view of the given kind over a buffer.  The set of
   * kinds mirrors the array types a data tile can carry.
   * @param {string} dtype The typed array constructor name.
   * @param {ArrayBuffer} buffer The buffer.
   * @return {*} A typed array view.
   */
  function arrayForType(dtype, buffer) {
    switch (dtype) {
      case 'Float32Array':
        return new Float32Array(buffer);
      case 'Float64Array':
        return new Float64Array(buffer);
      case 'Int8Array':
        return new Int8Array(buffer);
      case 'Int16Array':
        return new Int16Array(buffer);
      case 'Int32Array':
        return new Int32Array(buffer);
      case 'Uint16Array':
        return new Uint16Array(buffer);
      case 'Uint32Array':
        return new Uint32Array(buffer);
      case 'Uint8Array':
        return new Uint8Array(buffer);
      default:
        return new Uint8ClampedArray(buffer);
    }
  }

  return function (data) {
    // bracket notation for minification support
    const buffers = data['buffers'];
    const meta = data['meta'];
    const imageOps = data['imageOps'];
    const width = data['width'];
    const height = data['height'];
    const bandCounts = data['bandCounts'];
    const dtypes = data['dtypes'];

    const numBuffers = buffers.length;

    if (imageOps) {
      const images = new Array(numBuffers);
      for (let b = 0; b < numBuffers; ++b) {
        images[b] = new ImageData(
          new Uint8ClampedArray(buffers[b]),
          width,
          height,
        );
      }
      const output = operation(images, meta).data;
      return output.buffer;
    }

    const arrays = new Array(numBuffers);
    const pixels = new Array(numBuffers);
    for (let b = 0; b < numBuffers; ++b) {
      arrays[b] = arrayForType(dtypes[b], buffers[b]);
      pixels[b] = new Array(bandCounts[b]);
    }

    const pixelCount = arrays[0].length / bandCounts[0];
    const output = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixelCount; ++i) {
      for (let j = 0; j < numBuffers; ++j) {
        const array = arrays[j];
        const bandCount = bandCounts[j];
        const pixel = pixels[j];
        const offset = i * bandCount;
        for (let b = 0; b < bandCount; ++b) {
          pixel[b] = array[offset + b];
        }
      }
      const result = operation(pixels, meta);
      const offset = i * 4;
      output[offset] = result[0];
      output[offset + 1] = result[1];
      output[offset + 2] = result[2];
      output[offset + 3] = result[3];
    }
    return output.buffer;
  };
}

/**
 * Create a worker for running operations.
 * @param {ProcessorOptions} config Processor options.
 * @param {function(MessageEvent): void} onMessage Called with a message event.
 * @return {Worker} The worker.
 */
function createWorker(config, onMessage) {
  const lib = Object.keys(config.lib || {}).map(function (name) {
    return 'const ' + name + ' = ' + config.lib?.[name].toString() + ';';
  });

  const lines = lib.concat([
    'const __minion__ = (' + createMinion.toString() + ')(',
    config.operation.toString(),
    ');',
    'self.addEventListener("message", function(event) {',
    '  const buffer = __minion__(event.data);',
    '  self.postMessage({buffer: buffer, meta: event.data.meta}, [buffer]);',
    '});',
  ]);

  const worker = new Worker(
    typeof Blob === 'undefined'
      ? 'data:text/javascript;base64,' +
          //@ts-expect-error
          Buffer.from(lines.join('\n'), 'binary').toString('base64')
      : URL.createObjectURL(new Blob(lines, {type: 'text/javascript'})),
  );
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
    postMessage: function (/** @type {MinionData & {meta: Object}} */ data) {
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
 * @typedef {function(Error|null, ImageData|null, (Object|Array<Object>)): void} JobCallback
 */

/**
 * @typedef {Object} Job
 * @property {Object} meta Job metadata.
 * @property {Array<Input>} inputs Array of input data, normalized by
 *     {@link toInput} so every input carries a band count.
 * @property {JobCallback} callback Called when the job is complete.
 */

/**
 * @typedef {Object} ProcessorOptions
 * @property {number} threads Number of workers to spawn.
 * @property {Operation} operation The operation.
 * @property {Object<string, Function>} [lib] Functions that will be made available to operations run in a worker.
 * @property {number} queue The number of queued jobs to allow.
 * @property {boolean} [imageOps=false] Pass all the image data to the operation instead of a single pixel.
 */

/**
 * Normalize an operation input to a canonical {@link Input}.  `ImageData` is
 * treated as four RGBA bands; anything already shaped like an `Input` is passed
 * through.  This keeps the band count / array type knowledge in one place so the
 * rest of the processor never special-cases `ImageData`.
 * @param {Input|ImageData} input The input.
 * @return {Input} The canonical input.
 */
function toInput(input) {
  if ('bandCount' in input) {
    return input;
  }
  return {
    data: input.data,
    width: input.width,
    height: input.height,
    bandCount: 4,
  };
}

/**
 * Get the buffer to hand a worker for one input and one thread.  With a single
 * thread the whole buffer is transferred; with several, each thread gets the
 * slice covering its pixel range, respecting the input's band count and element
 * size.
 * @param {Input} input The input.
 * @param {number} startPixel The first pixel handled by the thread.
 * @param {number} segmentPixels The number of pixels per thread.
 * @param {number} threads The number of threads.
 * @return {ArrayBuffer} The buffer to transfer.
 */
function sliceInput(input, startPixel, segmentPixels, threads) {
  const buffer = /** @type {ArrayBuffer} */ (input.data.buffer);
  if (threads === 1) {
    return buffer;
  }
  const stride = input.bandCount * input.data.BYTES_PER_ELEMENT;
  const start = Math.min(startPixel * stride, buffer.byteLength);
  const end = Math.min(
    (startPixel + segmentPixels) * stride,
    buffer.byteLength,
  );
  return buffer.slice(start, end);
}

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

    /**
     * @type {boolean}
     * @private
     */
    this.imageOps_ = !!config.imageOps;
    let threads;
    if (config.threads === 0) {
      threads = 0;
    } else if (this.imageOps_) {
      threads = 1;
    } else {
      threads = config.threads || 1;
    }

    /**
     * @type {Array<(Worker|{postMessage: function(*, Array<ArrayBuffer>?=): void, terminate: function(): void})>}
     */
    const workers = new Array(threads);
    if (threads) {
      for (let i = 0; i < threads; ++i) {
        workers[i] = createWorker(config, this.onWorkerMessage_.bind(this, i));
      }
    } else {
      workers[0] = /** @type {Worker} */ (
        /** @type {unknown} */ (
          createFauxWorker(
            config,
            /** @type {function(FauxMessageEvent): void} */ (
              this.onWorkerMessage_.bind(this, 0)
            ),
          )
        )
      );
    }
    /**
     * @type {Array<(Worker|{postMessage: function(*, Array<ArrayBuffer>?=): void, terminate: function(): void})>}
     * @private
     */
    this.workers_ = workers;

    /**
     * @type {Array<Job>}
     * @private
     */
    this.queue_ = [];

    /**
     * @type {number}
     * @private
     */
    this.maxQueueLength_ = config.queue || Infinity;
    /**
     * @type {number}
     * @private
     */
    this.running_ = 0;

    /**
     * @type {Object<number, any>}
     * @private
     */
    this.dataLookup_ = {};

    /**
     * @type {Job|null}
     * @private
     */
    this.job_ = null;
  }

  /**
   * Run operation on input data.
   * @param {Array<Input|ImageData>} inputs Array of inputs.  All inputs share the
   *     output pixel dimensions but may differ in band count and array type.
   *     `ImageData` inputs are treated as four RGBA bands.
   * @param {Object} meta A user data object.  This is passed to all operations
   *     and must be serializable.
   * @param {function(Error|null, ImageData|null, Object): void} callback Called when work
   *     completes.  The first argument is any error.  The second is the ImageData
   *     generated by operations.  The third is the user data object.
   */
  process(inputs, meta, callback) {
    this.enqueue_({
      inputs: inputs.map(toInput),
      meta: meta,
      callback: callback,
    });
    this.dispatch_();
  }

  /**
   * Add a job to the queue.
   * @param {Job} job The job.
   */
  enqueue_(job) {
    this.queue_.push(job);
    while (this.queue_.length > this.maxQueueLength_) {
      const dropped = this.queue_.shift();
      dropped?.callback(null, null, {});
    }
  }

  /**
   * Dispatch a job.
   */
  dispatch_() {
    if (this.running_ || this.queue_.length === 0) {
      return;
    }

    const job = this.queue_.shift();
    if (!job) {
      return;
    }
    this.job_ = job;
    const inputs = job.inputs;
    const width = inputs[0].width;
    const height = inputs[0].height;
    const threads = this.workers_.length;
    this.running_ = threads;

    // fields shared by every worker; only `buffers` differs per thread
    const message = {
      meta: job.meta,
      imageOps: this.imageOps_,
      width: width,
      height: height,
      bandCounts: inputs.map((input) => input.bandCount),
      dtypes: inputs.map((input) => input.data.constructor.name),
    };

    const segmentPixels = Math.ceil((width * height) / threads);
    for (let i = 0; i < threads; ++i) {
      const buffers = inputs.map((input) =>
        sliceInput(input, i * segmentPixels, segmentPixels, threads),
      );
      this.workers_[i].postMessage(Object.assign({buffers}, message), buffers);
    }
  }

  /**
   * Handle messages from the worker.
   * @param {number} index The worker index.
   * @param {MessageEvent} event The message event.
   */
  onWorkerMessage_(index, event) {
    if (this.disposed) {
      return;
    }
    this.dataLookup_[index] = event.data;
    --this.running_;
    if (this.running_ === 0) {
      this.resolveJob_();
    }
  }

  /**
   * Resolve a job.  If there are no more worker threads, the processor callback
   * will be called.
   */
  resolveJob_() {
    const job = this.job_;
    if (!job) {
      return;
    }
    const width = job.inputs[0].width;
    const height = job.inputs[0].height;
    const threads = this.workers_.length;
    let data, meta;
    if (threads === 1) {
      data = new Uint8ClampedArray(this.dataLookup_[0]['buffer']);
      meta = this.dataLookup_[0]['meta'];
    } else {
      // output is RGBA (four bytes per pixel), aligned to the dispatch split
      const pixelCount = width * height;
      data = new Uint8ClampedArray(pixelCount * 4);
      meta = new Array(threads);
      const segmentLength = 4 * Math.ceil(pixelCount / threads);
      for (let i = 0; i < threads; ++i) {
        const buffer = this.dataLookup_[i]['buffer'];
        const offset = i * segmentLength;
        data.set(new Uint8ClampedArray(buffer), offset);
        meta[i] = this.dataLookup_[i]['meta'];
      }
    }
    this.job_ = null;
    this.dataLookup_ = {};
    job.callback(null, new ImageData(data, width, height), meta);
    this.dispatch_();
  }

  /**
   * Terminate all workers associated with the processor.
   * @override
   */
  disposeInternal() {
    for (let i = 0; i < this.workers_.length; ++i) {
      this.workers_[i].terminate();
    }
    this.workers_.length = 0;
  }
}

/**
 * A function that takes an array of input data, performs some operation, and
 * returns an array of output data.
 * For `pixel` type operations, the function will be called with an array of
 * pixels, one per input source, and should return a single pixel as an array of
 * four numbers (`[r, g, b, a]`) in the range of 0 - 255.  For sources rendered
 * as images, each input pixel is an `[r, g, b, a]` array; for data tile sources
 * (see `sources`), each input pixel is an array of that source's band values in
 * their native type (e.g. floating point).
 * For `'image'` type operations, functions will be called with an array of
 * [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData)
 * and should return a single
 * [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData).
 * The operations
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
   * Triggered before operations are run.  Listeners will receive an event object with
   * a `data` property that can be used to make data available to operations.
   * @event module:ol/source/Raster.RasterSourceEvent#beforeoperations
   * @api
   */
  BEFOREOPERATIONS: 'beforeoperations',

  /**
   * Triggered after operations are run.  Listeners will receive an event object with
   * a `data` property.  If more than one thread is used, `data` will be an array of
   * objects.  If a single thread is used, `data` will be a single object.
   * @event module:ol/source/Raster.RasterSourceEvent#afteroperations
   * @api
   */
  AFTEROPERATIONS: 'afteroperations',
};

/**
 * @typedef {'pixel' | 'image'} RasterOperationType
 * Raster operation type. Supported values are `'pixel'` and `'image'`.
 */

/**
 * @typedef {import("./Image.js").ImageSourceEventTypes|'beforeoperations'|'afteroperations'} RasterSourceEventTypes
 */

/**
 * @classdesc
 * Events emitted by {@link module:ol/source/Raster~RasterSource} instances are instances of this
 * type.
 */
export class RasterSourceEvent extends Event {
  /**
   * @param {string} type Type.
   * @param {import("../Map.js").FrameState} frameState The frame state.
   * @param {Object|Array<Object>} data An object made available to operations.  For "afteroperations" evenets
   * this will be an array of objects if more than one thread is used.
   */
  constructor(type, frameState, data) {
    super(type);

    /**
     * The raster extent.
     * @type {import("../extent.js").Extent}
     * @api
     */
    this.extent = /** @type {import("../extent.js").Extent} */ (
      frameState.extent
    );

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
 * sources or layers.  Most sources and layers are rendered to an image and read back as RGBA
 * pixels.  {@link module:ol/source/DataTile~DataTileSource} inputs (such as
 * {@link module:ol/source/GeoTIFF~GeoTIFFSource}) are instead sampled at their native tile
 * resolution, which preserves the data type and precision of the tiles (e.g. `Float32Array`
 * values are passed to the operation unchanged rather than clamped to bytes), and the operation
 * receives all of the source's bands per pixel.  These data tile inputs have some limitations:
 * only `'pixel'` operations are supported (an `'image'` operation still requires image inputs);
 * resampling to the view resolution uses nearest neighbor regardless of the `interpolate` option;
 * and the tile data must match the tile grid pixel for pixel, so sources with a gutter are not
 * supported.
 * @property {Operation} [operation] Raster operation.
 * The operation will be called with data from input sources
 * and the output will be assigned to the raster source.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling. By default,
 * linear interpolation is used when resampling. Set to `false` to use the nearest neighbor instead.
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
 * @property {Array<number>|null} [resolutions] Resolutions. If specified, raster operations will only
 * be run at the given resolutions.  By default, the resolutions of the first source with resolutions
 * specified will be used, if any. Set to `null` to use any view resolution instead.
 */

/***
 * @template Return
 * @typedef {import("../Observable.js").OnSignature<import("../Observable.js").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable.js").OnSignature<import("../ObjectEventType.js").Types, import("../Object.js").ObjectEvent, Return> &
 *   import("../Observable.js").OnSignature<import("./Image.js").ImageSourceEventTypes, import("./Image.js").ImageSourceEvent, Return> &
 *   import("../Observable.js").OnSignature<RasterSourceEventTypes, RasterSourceEvent, Return> &
 *   import("../Observable.js").CombinedOnSignature<import("../Observable.js").EventTypes|import("../ObjectEventType.js").Types
 *     |RasterSourceEventTypes, Return>} RasterSourceOnSignature
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
      interpolate: options.interpolate,
      projection: undefined,
    });

    /***
     * @type {RasterSourceOnSignature<import("../events.js").EventsKey>}
     */
    this.on;

    /***
     * @type {RasterSourceOnSignature<import("../events.js").EventsKey>}
     */
    this.once;

    /***
     * @type {RasterSourceOnSignature<void>}
     */
    this.un;

    /**
     * @private
     * @type {Processor|undefined}
     */
    this.processor_ = undefined;

    /**
     * @private
     * @type {RasterOperationType}
     */
    this.operationType_ =
      options.operationType !== undefined ? options.operationType : 'pixel';

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
     * @type {boolean}
     */
    this.useResolutions_ = options.resolutions !== null;

    /**
     * @private
     * @type {import("../TileQueue.js").default}
     */
    this.tileQueue_ = new TileQueue(function () {
      return 1;
    }, this.processSources_.bind(this));

    /**
     * Caches of input tiles for data tile sources, keyed by the source uid.
     * @private
     * @type {Object<string, import("../structs/LRUCache.js").default<import("../Tile.js").default>>}
     */
    this.inputTileCaches_ = {};

    /**
     * The most recently requested frame state.
     * @type {import("../Map.js").FrameState}
     * @private
     */
    this.requestedFrameState_;

    /**
     * The most recently rendered image canvas.
     * @type {import("../ImageCanvas.js").default|undefined}
     * @private
     */
    this.renderedImageCanvas_ = undefined;

    /**
     * The most recently rendered revision.
     * @type {number}
     * @private
     */
    this.renderedRevision_;

    /**
     * @private
     * @type {import("../Map.js").FrameState}
     */
    this.frameState_ = {
      animate: false,
      coordinateToPixelTransform: createTransform(),
      declutter: null,
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
      mapId: getUid(this),
      renderTargets: {},
    };

    this.setAttributions(function (frameState) {
      /** @type {Array<string>} */
      const attributions = [];
      for (let i = 0, iMax = options.sources.length; i < iMax; ++i) {
        const sourceOrLayer = options.sources[i];
        const source =
          sourceOrLayer instanceof Source
            ? sourceOrLayer
            : sourceOrLayer.getSource();
        if (!source) {
          continue;
        }
        const sourceAttributions = source.getAttributions()?.(frameState);
        if (typeof sourceAttributions === 'string') {
          attributions.push(sourceAttributions);
        } else if (sourceAttributions !== undefined) {
          attributions.push(...sourceAttributions);
        }
      }
      return attributions;
    });

    if (options.operation !== undefined) {
      this.setOperation(
        options.operation,
        /** @type {Object<string, Function>|undefined} */ (options.lib),
      );
    }
  }

  /**
   * Set the operation.
   * @param {Operation} operation New operation.
   * @param {Object<string, Function>} [lib] Functions that will be available to operations run
   *     in a worker.
   * @api
   */
  setOperation(operation, lib) {
    if (this.processor_) {
      this.processor_.dispose();
    }

    this.processor_ = new Processor({
      operation: operation,
      imageOps: this.operationType_ === 'image',
      queue: 1,
      lib: /** @type {Object<string, Function>|undefined} */ (lib),
      threads: this.threads_,
    });
    this.changed();
  }

  /**
   * Update the stored frame state.
   * @param {import("../extent.js").Extent} extent The view extent (in map units).
   * @param {number} resolution The view resolution.
   * @param {import("../proj/Projection.js").default} projection The view projection.
   * @return {import("../Map.js").FrameState} The updated frame state.
   * @private
   */
  updateFrameState_(extent, resolution, projection) {
    const frameState = /** @type {import("../Map.js").FrameState} */ (
      Object.assign({}, this.frameState_)
    );

    frameState.viewState = /** @type {import("../View.js").State} */ (
      Object.assign({}, frameState.viewState)
    );

    const center = getCenter(extent);

    frameState.size[0] = Math.ceil(getWidth(extent) / resolution);
    frameState.size[1] = Math.ceil(getHeight(extent) / resolution);
    frameState.extent = [
      center[0] - (frameState.size[0] * resolution) / 2,
      center[1] - (frameState.size[1] * resolution) / 2,
      center[0] + (frameState.size[0] * resolution) / 2,
      center[1] + (frameState.size[1] * resolution) / 2,
    ];
    frameState.time = Date.now();

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
      if (!source || source.getState() !== 'ready') {
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
   * @return {import("../ImageCanvas.js").default|null} Single image.
   * @override
   */
  getImage(extent, resolution, pixelRatio, projection) {
    if (!this.allSourcesReady_()) {
      return null;
    }

    this.tileQueue_.loadMoreTiles(16, 16);

    resolution = this.findNearestResolution(resolution);
    const frameState = this.updateFrameState_(extent, resolution, projection);
    this.requestedFrameState_ = frameState;

    // check if we can't reuse the existing ol/ImageCanvas
    if (this.renderedImageCanvas_) {
      const renderedResolution = this.renderedImageCanvas_.getResolution();
      const renderedExtent = this.renderedImageCanvas_.getExtent();
      if (
        resolution !== renderedResolution ||
        !equals(
          /** @type {import("../extent.js").Extent} */ (frameState.extent),
          /** @type {import("../extent.js").Extent} */ (renderedExtent),
        )
      ) {
        this.renderedImageCanvas_ = undefined;
      }
    }

    if (
      !this.renderedImageCanvas_ ||
      this.getRevision() !== this.renderedRevision_
    ) {
      this.processSources_();
    }

    if (frameState.animate) {
      requestAnimationFrame(this.changed.bind(this));
    }

    return this.renderedImageCanvas_ ?? null;
  }

  /**
   * Get the operation input for one layer.  Data tile sources are sampled at
   * their native tile resolution to preserve precision; other layers are
   * rendered and read back as RGBA image data.
   * @param {number} layerIndex The layer index.
   * @param {import("./Source.js").default} source The layer's source.
   * @param {import("../Map.js").FrameState} frameState The frame state.
   * @return {Input|ImageData|null} The input, or `null` if it is not ready.
   * @private
   */
  getInput_(layerIndex, source, frameState) {
    if (readsArrayData(source)) {
      return /** @type {DataTileSource} */ (source).readData(
        /** @type {import("../extent.js").Extent} */ (frameState.extent),
        frameState.viewState.resolution,
        frameState.viewState.projection,
        frameState.size,
        frameState.tileQueue,
        this.getInputTileCache_(source),
      );
    }
    frameState.layerIndex = layerIndex;
    frameState.renderTargets = {};
    return getImageData(this.layers_[layerIndex], frameState);
  }

  /**
   * Get (creating if needed) the input tile cache for a data tile source.
   * @param {import("./Source.js").default} source The data tile source.
   * @return {import("../structs/LRUCache.js").default<import("../Tile.js").default>} The cache.
   * @private
   */
  getInputTileCache_(source) {
    const sourceUid = getUid(source);
    let tileCache = this.inputTileCaches_[sourceUid];
    if (!tileCache) {
      tileCache = new LRUCache();
      this.inputTileCaches_[sourceUid] = tileCache;
    }
    return tileCache;
  }

  /**
   * Get the input source values at a coordinate, as the operation receives them:
   * one array of values per input source, in source order.  This is the lookup
   * counterpart of the raster operation, returning the input data rather than
   * the rendered output (which {@link module:ol/layer/Image~ImageLayer#getData}
   * returns).  Data tile inputs yield their native band values (in the tiles'
   * array type); other inputs yield the `[r, g, b, a]` values read back from
   * their layer renderer.  Only meaningful after the source has rendered at
   * least once; returns `null` otherwise, or if an input is not yet available.
   * @param {import("../coordinate.js").Coordinate} coordinate The coordinate, in
   *     the view projection.
   * @return {Array<Array<number>|Uint8ClampedArray|Uint8Array|Float32Array>|null}
   *     The values per input source.
   * @api
   */
  getData(coordinate) {
    const frameState = this.requestedFrameState_;
    if (!frameState) {
      return null;
    }
    const pixels = new Array(this.layers_.length);
    for (let i = 0, ii = this.layers_.length; i < ii; ++i) {
      const layer = this.layers_[i];
      const source = layer.getSource();
      if (source && readsArrayData(source)) {
        // array data tile inputs are not rendered through a layer renderer, so
        // sample them directly to preserve the native band values
        const resolution = frameState.viewState.resolution;
        const extent = /** @type {import("../extent.js").Extent} */ ([
          coordinate[0] - resolution / 2,
          coordinate[1] - resolution / 2,
          coordinate[0] + resolution / 2,
          coordinate[1] + resolution / 2,
        ]);
        const input = /** @type {DataTileSource} */ (source).readData(
          extent,
          resolution,
          frameState.viewState.projection,
          /** @type {import("../size.js").Size} */ ([1, 1]),
          frameState.tileQueue,
          this.getInputTileCache_(source),
        );
        if (!input) {
          return null;
        }
        const pixel = new Array(input.bandCount);
        for (let b = 0; b < input.bandCount; ++b) {
          pixel[b] = input.data[b];
        }
        pixels[i] = pixel;
        continue;
      }

      // other inputs are read back from the layer renderer the raster source has
      // already rendered.  The frame state uses identity pixel/coordinate
      // transforms, so passing the coordinate through gives the right pixel.
      const renderer = layer.getRenderer();
      const data = renderer?.getData(
        applyTransform(
          frameState.coordinateToPixelTransform,
          /** @type {import("../pixel.js").Pixel} */ (coordinate.slice()),
        ),
      );
      if (!data) {
        return null;
      }
      pixels[i] = /** @type {Uint8ClampedArray|Uint8Array|Float32Array} */ (
        data
      );
    }
    return pixels;
  }

  /**
   * Start processing source data.
   * @private
   */
  processSources_() {
    const frameState = this.requestedFrameState_;
    const len = this.layers_.length;
    const sourceRevisions = new Array(len);
    const inputs = new Array(len);
    for (let i = 0; i < len; ++i) {
      const source = this.layers_[i].getSource();
      if (!source) {
        return;
      }
      sourceRevisions[i] = source.getRevision();
      const input = this.getInput_(i, source, frameState);
      if (!input) {
        return;
      }
      inputs[i] = input;
    }

    const data = {};
    this.dispatchEvent(
      new RasterSourceEvent(RasterEventType.BEFOREOPERATIONS, frameState, data),
    );
    this.processor_?.process(
      inputs,
      data,
      this.onWorkerComplete_.bind(this, frameState, sourceRevisions),
    );
  }

  /**
   * Called when pixel processing is complete.
   * @param {import("../Map.js").FrameState} frameState The frame state.
   * @param {Array<number>} sourceRevisions Source revisions when processing started.
   * @param {Error|null} err Any error during processing.
   * @param {ImageData|null} output The output image data.
   * @param {Object|Array<Object>} data The user data (or an array if more than one thread).
   * @private
   */
  onWorkerComplete_(frameState, sourceRevisions, err, output, data) {
    if (err || !output) {
      return;
    }

    // do nothing if extent or resolution changed
    const extent = frameState.extent;
    const resolution = frameState.viewState.resolution;
    if (
      resolution !== this.requestedFrameState_.viewState.resolution ||
      !equals(
        /** @type {import("../extent.js").Extent} */ (extent),
        /** @type {import("../extent.js").Extent} */ (
          this.requestedFrameState_.extent
        ),
      )
    ) {
      return;
    }
    // do nothing if any input source's revision changed
    for (let i = 0; i < this.layers_.length; ++i) {
      const source = this.layers_[i].getSource();
      if (!source) {
        return;
      }
      if (sourceRevisions[i] !== source.getRevision()) {
        return;
      }
    }

    let context;
    if (this.renderedImageCanvas_) {
      context =
        /** @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} */ (
          this.renderedImageCanvas_.getImage().getContext('2d')
        );
    } else {
      const width = frameState.size[0];
      const height = frameState.size[1];
      context = createCanvasContext2D(width, height);
      this.renderedImageCanvas_ = new ImageCanvas(
        /** @type {import("../extent.js").Extent} */ (extent),
        resolution,
        1,
        context.canvas,
      );
    }
    context.putImageData(output, 0, 0);

    if (frameState.animate) {
      requestAnimationFrame(this.changed.bind(this));
    } else {
      this.changed();
    }
    this.renderedRevision_ = this.getRevision();

    this.dispatchEvent(
      new RasterSourceEvent(RasterEventType.AFTEROPERATIONS, frameState, data),
    );
  }

  /**
   * @param {import("../proj/Projection.js").default} [projection] Projection.
   * @return {Array<number>|null} Resolutions.
   * @override
   */
  getResolutions(projection) {
    if (!this.useResolutions_) {
      return null;
    }
    let resolutions = super.getResolutions();
    if (!resolutions) {
      for (let i = 0, ii = this.layers_.length; i < ii; ++i) {
        const source = this.layers_[i].getSource();
        if (!source) {
          continue;
        }
        resolutions = source.getResolutions(projection);
        if (resolutions) {
          break;
        }
      }
    }
    return resolutions;
  }

  /**
   * @override
   */
  disposeInternal() {
    if (this.processor_) {
      this.processor_.dispose();
    }
    for (const uid in this.inputTileCaches_) {
      const tileCache = this.inputTileCaches_[uid];
      tileCache.forEach((tile) => tile.dispose());
      tileCache.clear();
      delete this.inputTileCaches_[uid];
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
 * @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D|undefined}
 * @private
 */
let sharedContext = undefined;

/**
 * Determine whether a source's data should be sampled directly as typed arrays
 * rather than rendered to an image and read back.  This is true for data tile
 * sources that carry array data (e.g. GeoTIFF, GeoZarr), but not for image tile
 * sources, whose tiles are images and are handled through the layer renderer.
 * @param {import("./Source.js").default|null} source The source.
 * @return {boolean} The source provides typed array data.
 */
function readsArrayData(source) {
  return (
    source instanceof DataTileSource && !(source instanceof ImageTileSource)
  );
}

/**
 * Get image data from a layer.
 * @param {import("../layer/Layer.js").default} layer Layer to render.
 * @param {import("../Map.js").FrameState} frameState The frame state.
 * @return {ImageData|null} The image data.
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
  if (width === 0 || height === 0) {
    return null;
  }
  const container = renderer.renderFrame(frameState, null);
  let element;
  if (container instanceof HTMLCanvasElement) {
    element = container;
  } else {
    if (container) {
      element = container.firstElementChild;
    }
    if (!(element instanceof HTMLCanvasElement)) {
      throw new Error('Unsupported rendered element: ' + element);
    }
    if (element.width === width && element.height === height) {
      const context = element.getContext('2d');
      if (context) {
        return context.getImageData(0, 0, width, height);
      }
    }
  }

  if (!sharedContext) {
    sharedContext = createCanvasContext2D(width, height, undefined, {
      willReadFrequently: true,
    });
  } else {
    const canvas = sharedContext.canvas;
    if (canvas.width !== width || canvas.height !== height) {
      sharedContext = createCanvasContext2D(width, height, undefined, {
        willReadFrequently: true,
      });
    } else {
      sharedContext.clearRect(0, 0, width, height);
    }
  }
  sharedContext.drawImage(element, 0, 0, width, height);
  return /** @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} */ (
    sharedContext
  ).getImageData(0, 0, width, height);
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
    } else {
      throw new Error('Unsupported source type: ' + layerOrSource);
    }
  } else {
    layer = layerOrSource;
  }
  return layer;
}

export default RasterSource;
