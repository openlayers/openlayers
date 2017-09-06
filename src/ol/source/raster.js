import _ol_ from '../index';
import _ol_ImageCanvas_ from '../imagecanvas';
import _ol_TileQueue_ from '../tilequeue';
import _ol_dom_ from '../dom';
import _ol_events_ from '../events';
import _ol_events_Event_ from '../events/event';
import _ol_events_EventType_ from '../events/eventtype';
import {Processor as _ol_ext_pixelworks_Processor_} from 'pixelworks';
import _ol_extent_ from '../extent';
import _ol_layer_Image_ from '../layer/image';
import _ol_layer_Tile_ from '../layer/tile';
import _ol_obj_ from '../obj';
import _ol_renderer_canvas_ImageLayer_ from '../renderer/canvas/imagelayer';
import _ol_renderer_canvas_TileLayer_ from '../renderer/canvas/tilelayer';
import _ol_source_Image_ from '../source/image';
import _ol_source_RasterOperationType_ from '../source/rasteroperationtype';
import _ol_source_State_ from '../source/state';
import _ol_source_Tile_ from '../source/tile';
import _ol_transform_ from '../transform';

/**
 * @classdesc
 * A source that transforms data from any number of input sources using an array
 * of {@link ol.RasterOperation} functions to transform input pixel values into
 * output pixel values.
 *
 * @constructor
 * @extends {ol.source.Image}
 * @fires ol.source.Raster.Event
 * @param {olx.source.RasterOptions} options Options.
 * @api
 */
var _ol_source_Raster_ = function(options) {

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
    options.operationType : _ol_source_RasterOperationType_.PIXEL;

  /**
   * @private
   * @type {number}
   */
  this.threads_ = options.threads !== undefined ? options.threads : 1;

  /**
   * @private
   * @type {Array.<ol.renderer.canvas.Layer>}
   */
  this.renderers_ = _ol_source_Raster_.createRenderers_(options.sources);

  for (var r = 0, rr = this.renderers_.length; r < rr; ++r) {
    _ol_events_.listen(this.renderers_[r], _ol_events_EventType_.CHANGE,
        this.changed, this);
  }

  /**
   * @private
   * @type {ol.TileQueue}
   */
  this.tileQueue_ = new _ol_TileQueue_(
      function() {
        return 1;
      },
      this.changed.bind(this));

  var layerStatesArray = _ol_source_Raster_.getLayerStatesArray_(this.renderers_);
  var layerStates = {};
  for (var i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    layerStates[_ol_.getUid(layerStatesArray[i].layer)] = layerStatesArray[i];
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
    attributions: {},
    coordinateToPixelTransform: _ol_transform_.create(),
    extent: null,
    focus: null,
    index: 0,
    layerStates: layerStates,
    layerStatesArray: layerStatesArray,
    logos: {},
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

  _ol_source_Image_.call(this, {});

  if (options.operation !== undefined) {
    this.setOperation(options.operation, options.lib);
  }

};

_ol_.inherits(_ol_source_Raster_, _ol_source_Image_);


/**
 * Set the operation.
 * @param {ol.RasterOperation} operation New operation.
 * @param {Object=} opt_lib Functions that will be available to operations run
 *     in a worker.
 * @api
 */
_ol_source_Raster_.prototype.setOperation = function(operation, opt_lib) {
  this.worker_ = new _ol_ext_pixelworks_Processor_({
    operation: operation,
    imageOps: this.operationType_ === _ol_source_RasterOperationType_.IMAGE,
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
_ol_source_Raster_.prototype.updateFrameState_ = function(extent, resolution, projection) {

  var frameState = /** @type {olx.FrameState} */ (
    _ol_obj_.assign({}, this.frameState_));

  frameState.viewState = /** @type {olx.ViewState} */ (
    _ol_obj_.assign({}, frameState.viewState));

  var center = _ol_extent_.getCenter(extent);

  frameState.extent = extent.slice();
  frameState.focus = center;
  frameState.size[0] = Math.round(_ol_extent_.getWidth(extent) / resolution);
  frameState.size[1] = Math.round(_ol_extent_.getHeight(extent) / resolution);

  var viewState = frameState.viewState;
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
_ol_source_Raster_.prototype.allSourcesReady_ = function() {
  var ready = true;
  var source;
  for (var i = 0, ii = this.renderers_.length; i < ii; ++i) {
    source = this.renderers_[i].getLayer().getSource();
    if (source.getState() !== _ol_source_State_.READY) {
      ready = false;
      break;
    }
  }
  return ready;
};


/**
 * @inheritDoc
 */
_ol_source_Raster_.prototype.getImage = function(extent, resolution, pixelRatio, projection) {
  if (!this.allSourcesReady_()) {
    return null;
  }

  var frameState = this.updateFrameState_(extent, resolution, projection);
  this.requestedFrameState_ = frameState;

  // check if we can't reuse the existing ol.ImageCanvas
  if (this.renderedImageCanvas_) {
    var renderedResolution = this.renderedImageCanvas_.getResolution();
    var renderedExtent = this.renderedImageCanvas_.getExtent();
    if (resolution !== renderedResolution || !_ol_extent_.equals(extent, renderedExtent)) {
      this.renderedImageCanvas_ = null;
    }
  }

  if (!this.renderedImageCanvas_ || this.getRevision() !== this.renderedRevision_) {
    this.processSources_();
  }

  frameState.tileQueue.loadMoreTiles(16, 16);
  return this.renderedImageCanvas_;
};


/**
 * Start processing source data.
 * @private
 */
_ol_source_Raster_.prototype.processSources_ = function() {
  var frameState = this.requestedFrameState_;
  var len = this.renderers_.length;
  var imageDatas = new Array(len);
  for (var i = 0; i < len; ++i) {
    var imageData = _ol_source_Raster_.getImageData_(
        this.renderers_[i], frameState, frameState.layerStatesArray[i]);
    if (imageData) {
      imageDatas[i] = imageData;
    } else {
      return;
    }
  }

  var data = {};
  this.dispatchEvent(new _ol_source_Raster_.Event(
      _ol_source_Raster_.EventType_.BEFOREOPERATIONS, frameState, data));
  this.worker_.process(imageDatas, data,
      this.onWorkerComplete_.bind(this, frameState));
};


/**
 * Called when pixel processing is complete.
 * @param {olx.FrameState} frameState The frame state.
 * @param {Error} err Any error during processing.
 * @param {ImageData} output The output image data.
 * @param {Object} data The user data.
 * @private
 */
_ol_source_Raster_.prototype.onWorkerComplete_ = function(frameState, err, output, data) {
  if (err || !output) {
    return;
  }

  // do nothing if extent or resolution changed
  var extent = frameState.extent;
  var resolution = frameState.viewState.resolution;
  if (resolution !== this.requestedFrameState_.viewState.resolution ||
      !_ol_extent_.equals(extent, this.requestedFrameState_.extent)) {
    return;
  }

  var context;
  if (this.renderedImageCanvas_) {
    context = this.renderedImageCanvas_.getImage().getContext('2d');
  } else {
    var width = Math.round(_ol_extent_.getWidth(extent) / resolution);
    var height = Math.round(_ol_extent_.getHeight(extent) / resolution);
    context = _ol_dom_.createCanvasContext2D(width, height);
    this.renderedImageCanvas_ = new _ol_ImageCanvas_(
        extent, resolution, 1, this.getAttributions(), context.canvas);
  }
  context.putImageData(output, 0, 0);

  this.changed();
  this.renderedRevision_ = this.getRevision();

  this.dispatchEvent(new _ol_source_Raster_.Event(
      _ol_source_Raster_.EventType_.AFTEROPERATIONS, frameState, data));
};


/**
 * Get image data from a renderer.
 * @param {ol.renderer.canvas.Layer} renderer Layer renderer.
 * @param {olx.FrameState} frameState The frame state.
 * @param {ol.LayerState} layerState The layer state.
 * @return {ImageData} The image data.
 * @private
 */
_ol_source_Raster_.getImageData_ = function(renderer, frameState, layerState) {
  if (!renderer.prepareFrame(frameState, layerState)) {
    return null;
  }
  var width = frameState.size[0];
  var height = frameState.size[1];
  if (!_ol_source_Raster_.context_) {
    _ol_source_Raster_.context_ = _ol_dom_.createCanvasContext2D(width, height);
  } else {
    var canvas = _ol_source_Raster_.context_.canvas;
    if (canvas.width !== width || canvas.height !== height) {
      _ol_source_Raster_.context_ = _ol_dom_.createCanvasContext2D(width, height);
    } else {
      _ol_source_Raster_.context_.clearRect(0, 0, width, height);
    }
  }
  renderer.composeFrame(frameState, layerState, _ol_source_Raster_.context_);
  return _ol_source_Raster_.context_.getImageData(0, 0, width, height);
};


/**
 * A reusable canvas context.
 * @type {CanvasRenderingContext2D}
 * @private
 */
_ol_source_Raster_.context_ = null;


/**
 * Get a list of layer states from a list of renderers.
 * @param {Array.<ol.renderer.canvas.Layer>} renderers Layer renderers.
 * @return {Array.<ol.LayerState>} The layer states.
 * @private
 */
_ol_source_Raster_.getLayerStatesArray_ = function(renderers) {
  return renderers.map(function(renderer) {
    return renderer.getLayer().getLayerState();
  });
};


/**
 * Create renderers for all sources.
 * @param {Array.<ol.source.Source>} sources The sources.
 * @return {Array.<ol.renderer.canvas.Layer>} Array of layer renderers.
 * @private
 */
_ol_source_Raster_.createRenderers_ = function(sources) {
  var len = sources.length;
  var renderers = new Array(len);
  for (var i = 0; i < len; ++i) {
    renderers[i] = _ol_source_Raster_.createRenderer_(sources[i]);
  }
  return renderers;
};


/**
 * Create a renderer for the provided source.
 * @param {ol.source.Source} source The source.
 * @return {ol.renderer.canvas.Layer} The renderer.
 * @private
 */
_ol_source_Raster_.createRenderer_ = function(source) {
  var renderer = null;
  if (source instanceof _ol_source_Tile_) {
    renderer = _ol_source_Raster_.createTileRenderer_(source);
  } else if (source instanceof _ol_source_Image_) {
    renderer = _ol_source_Raster_.createImageRenderer_(source);
  }
  return renderer;
};


/**
 * Create an image renderer for the provided source.
 * @param {ol.source.Image} source The source.
 * @return {ol.renderer.canvas.Layer} The renderer.
 * @private
 */
_ol_source_Raster_.createImageRenderer_ = function(source) {
  var layer = new _ol_layer_Image_({source: source});
  return new _ol_renderer_canvas_ImageLayer_(layer);
};


/**
 * Create a tile renderer for the provided source.
 * @param {ol.source.Tile} source The source.
 * @return {ol.renderer.canvas.Layer} The renderer.
 * @private
 */
_ol_source_Raster_.createTileRenderer_ = function(source) {
  var layer = new _ol_layer_Tile_({source: source});
  return new _ol_renderer_canvas_TileLayer_(layer);
};


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
_ol_source_Raster_.Event = function(type, frameState, data) {
  _ol_events_Event_.call(this, type);

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
_ol_.inherits(_ol_source_Raster_.Event, _ol_events_Event_);


/**
 * @override
 */
_ol_source_Raster_.prototype.getImageInternal = function() {
  return null; // not implemented
};


/**
 * @enum {string}
 * @private
 */
_ol_source_Raster_.EventType_ = {
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
export default _ol_source_Raster_;
