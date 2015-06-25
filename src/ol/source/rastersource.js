goog.provide('ol.source.Raster');
goog.provide('ol.source.RasterEvent');
goog.provide('ol.source.RasterEventType');

goog.require('goog.asserts');
goog.require('goog.events.Event');
goog.require('goog.functions');
goog.require('goog.vec.Mat4');
goog.require('ol.ImageCanvas');
goog.require('ol.TileQueue');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.raster.IdentityOp');
goog.require('ol.raster.OperationType');
goog.require('ol.renderer.canvas.ImageLayer');
goog.require('ol.renderer.canvas.TileLayer');
goog.require('ol.source.Image');
goog.require('ol.source.State');
goog.require('ol.source.Tile');



/**
 * @classdesc
 * An source that transforms data from any number of input sources source using
 * an array of {@link ol.raster.Operation} functions to transform input pixel
 * values into output pixel values.
 *
 * @constructor
 * @extends {ol.source.Image}
 * @param {olx.source.RasterOptions} options Options.
 * @api
 */
ol.source.Raster = function(options) {

  /**
   * @private
   * @type {Array.<ol.raster.Operation>}
   */
  this.operations_ = goog.isDef(options.operations) ?
      options.operations : [ol.raster.IdentityOp];

  /**
   * @private
   * @type {ol.raster.OperationType}
   */
  this.operationType_ = goog.isDef(options.operationType) ?
      options.operationType : ol.raster.OperationType.PIXEL;

  /**
   * @private
   * @type {Array.<ol.renderer.canvas.Layer>}
   */
  this.renderers_ = ol.source.Raster.createRenderers_(options.sources);

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.canvasContext_ = ol.dom.createCanvasContext2D();

  /**
   * @private
   * @type {ol.TileQueue}
   */
  this.tileQueue_ = new ol.TileQueue(
      goog.functions.constant(1),
      goog.bind(this.changed, this));

  var layerStatesArray = ol.source.Raster.getLayerStatesArray_(this.renderers_);
  var layerStates = {};
  for (var i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    layerStates[goog.getUid(layerStatesArray[i].layer)] = layerStatesArray[i];
  }

  /**
   * @private
   * @type {olx.FrameState}
   */
  this.frameState_ = {
    animate: false,
    attributions: {},
    coordinateToPixelMatrix: goog.vec.Mat4.createNumber(),
    extent: null,
    focus: null,
    index: 0,
    layerStates: layerStates,
    layerStatesArray: layerStatesArray,
    logos: {},
    pixelRatio: 1,
    pixelToCoordinateMatrix: goog.vec.Mat4.createNumber(),
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

  goog.base(this, {
    // TODO: pass along any relevant options
  });


};
goog.inherits(ol.source.Raster, ol.source.Image);


/**
 * Reset the operations.
 * @param {Array.<ol.raster.Operation>} operations New operations.
 * @api
 */
ol.source.Raster.prototype.setOperations = function(operations) {
  this.operations_ = operations;
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
ol.source.Raster.prototype.updateFrameState_ =
    function(extent, resolution, projection) {
  var frameState = this.frameState_;

  var center = ol.extent.getCenter(extent);
  var width = Math.round(ol.extent.getWidth(extent) / resolution);
  var height = Math.round(ol.extent.getHeight(extent) / resolution);

  frameState.extent = extent;
  frameState.focus = ol.extent.getCenter(extent);
  frameState.size[0] = width;
  frameState.size[1] = height;

  var viewState = frameState.viewState;
  viewState.center = center;
  viewState.projection = projection;
  viewState.resolution = resolution;
  return frameState;
};


/**
 * @inheritDoc
 */
ol.source.Raster.prototype.getImage =
    function(extent, resolution, pixelRatio, projection) {

  var context = this.canvasContext_;
  var canvas = context.canvas;

  var width = Math.round(ol.extent.getWidth(extent) / resolution);
  var height = Math.round(ol.extent.getHeight(extent) / resolution);

  if (width !== canvas.width ||
      height !== canvas.height) {
    canvas.width = width;
    canvas.height = height;
  }

  var frameState = this.updateFrameState_(extent, resolution, projection);
  this.composeFrame_(frameState);

  var imageCanvas = new ol.ImageCanvas(extent, resolution, 1,
      this.getAttributions(), canvas);

  return imageCanvas;
};


/**
 * Determine if all sources are ready.
 * @return {boolean} All sources are ready.
 * @private
 */
ol.source.Raster.prototype.allSourcesReady_ = function() {
  var ready = true;
  var source;
  for (var i = 0, ii = this.renderers_.length; i < ii; ++i) {
    source = this.renderers_[i].getLayer().getSource();
    if (source.getState() !== ol.source.State.READY) {
      ready = false;
      break;
    }
  }
  return ready;
};


/**
 * Compose the frame.  This renders data from all sources, runs pixel-wise
 * operations, and renders the result to the stored canvas context.
 * @param {olx.FrameState} frameState The frame state.
 * @private
 */
ol.source.Raster.prototype.composeFrame_ = function(frameState) {
  if (!this.allSourcesReady_()) {
    return;
  }
  var len = this.renderers_.length;
  var imageDatas = new Array(len);
  var pixels = new Array(len);

  var context = this.canvasContext_;
  var canvas = context.canvas;

  for (var i = 0; i < len; ++i) {
    pixels[i] = [0, 0, 0, 0];
    imageDatas[i] = ol.source.Raster.getImageData_(
        this.renderers_[i], frameState, frameState.layerStatesArray[i]);
  }

  var data = {};
  this.dispatchEvent(new ol.source.RasterEvent(
      ol.source.RasterEventType.BEFOREOPERATIONS, frameState, data));

  var targetImageData = null;
  if (this.operationType_ === ol.raster.OperationType.PIXEL) {
    targetImageData = context.getImageData(0, 0, canvas.width,
        canvas.height);
    var target = targetImageData.data;

    var source, pixel;
    for (var j = 0, jj = target.length; j < jj; j += 4) {
      for (var k = 0; k < len; ++k) {
        source = imageDatas[k].data;
        pixel = pixels[k];
        pixel[0] = source[j];
        pixel[1] = source[j + 1];
        pixel[2] = source[j + 2];
        pixel[3] = source[j + 3];
      }
      pixel = this.runPixelOperations_(pixels, data)[0];
      target[j] = pixel[0];
      target[j + 1] = pixel[1];
      target[j + 2] = pixel[2];
      target[j + 3] = pixel[3];
    }
  } else if (this.operationType_ === ol.raster.OperationType.IMAGE) {
    targetImageData = this.runImageOperations_(imageDatas, data)[0];
  } else {
    goog.asserts.fail('unsupported operation type: ' + this.operationType_);
  }

  this.dispatchEvent(new ol.source.RasterEvent(
      ol.source.RasterEventType.AFTEROPERATIONS, frameState, data));

  context.putImageData(targetImageData, 0, 0);

  frameState.tileQueue.loadMoreTiles(16, 16);
};


/**
 * Run pixel-wise operations to transform pixels.
 * @param {Array.<ol.raster.Pixel>} pixels The input pixels.
 * @param {Object} data User storage.
 * @return {Array.<ol.raster.Pixel>} The modified pixels.
 * @private
 */
ol.source.Raster.prototype.runPixelOperations_ = function(pixels, data) {
  for (var i = 0, ii = this.operations_.length; i < ii; ++i) {
    pixels = this.operations_[i](pixels, data);
  }
  return pixels;
};


/**
 * Run image operations.
 * @param {Array.<ImageData>} imageDatas The input image data.
 * @param {Object} data User storage.
 * @return {Array.<ImageData>} The output image data.
 * @private
 */
ol.source.Raster.prototype.runImageOperations_ = function(imageDatas, data) {
  for (var i = 0, ii = this.operations_.length; i < ii; ++i) {
    imageDatas = this.operations_[i](imageDatas, data);
  }
  return imageDatas;
};


/**
 * Get image data from a renderer.
 * @param {ol.renderer.canvas.Layer} renderer Layer renderer.
 * @param {olx.FrameState} frameState The frame state.
 * @param {ol.layer.LayerState} layerState The layer state.
 * @return {ImageData} The image data.
 * @private
 */
ol.source.Raster.getImageData_ = function(renderer, frameState, layerState) {
  renderer.prepareFrame(frameState, layerState);
  var canvas = renderer.getImage();
  var imageTransform = renderer.getImageTransform();
  var dx = goog.vec.Mat4.getElement(imageTransform, 0, 3);
  var dy = goog.vec.Mat4.getElement(imageTransform, 1, 3);
  return canvas.getContext('2d').getImageData(
      Math.round(-dx), Math.round(-dy),
      frameState.size[0], frameState.size[1]);
};


/**
 * Get a list of layer states from a list of renderers.
 * @param {Array.<ol.renderer.canvas.Layer>} renderers Layer renderers.
 * @return {Array.<ol.layer.LayerState>} The layer states.
 * @private
 */
ol.source.Raster.getLayerStatesArray_ = function(renderers) {
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
ol.source.Raster.createRenderers_ = function(sources) {
  var len = sources.length;
  var renderers = new Array(len);
  for (var i = 0; i < len; ++i) {
    renderers[i] = ol.source.Raster.createRenderer_(sources[i]);
  }
  return renderers;
};


/**
 * Create a renderer for the provided source.
 * @param {ol.source.Source} source The source.
 * @return {ol.renderer.canvas.Layer} The renderer.
 * @private
 */
ol.source.Raster.createRenderer_ = function(source) {
  var renderer = null;
  if (source instanceof ol.source.Tile) {
    renderer = ol.source.Raster.createTileRenderer_(
        /** @type {ol.source.Tile} */ (source));
  } else if (source instanceof ol.source.Image) {
    renderer = ol.source.Raster.createImageRenderer_(
        /** @type {ol.source.Image} */ (source));
  } else {
    goog.asserts.fail('Unsupported source type: ' + source);
  }
  return renderer;
};


/**
 * Create an image renderer for the provided source.
 * @param {ol.source.Image} source The source.
 * @return {ol.renderer.canvas.Layer} The renderer.
 * @private
 */
ol.source.Raster.createImageRenderer_ = function(source) {
  var layer = new ol.layer.Image({source: source});
  return new ol.renderer.canvas.ImageLayer(layer);
};


/**
 * Create a tile renderer for the provided source.
 * @param {ol.source.Tile} source The source.
 * @return {ol.renderer.canvas.Layer} The renderer.
 * @private
 */
ol.source.Raster.createTileRenderer_ = function(source) {
  var layer = new ol.layer.Tile({source: source});
  return new ol.renderer.canvas.TileLayer(layer);
};



/**
 * @classdesc
 * Events emitted by {@link ol.source.Raster} instances are instances of this
 * type.
 *
 * @constructor
 * @extends {goog.events.Event}
 * @implements {oli.source.RasterEvent}
 * @param {string} type Type.
 * @param {olx.FrameState} frameState The frame state.
 * @param {Object} data An object made available to operations.
 */
ol.source.RasterEvent = function(type, frameState, data) {
  goog.base(this, type);

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
goog.inherits(ol.source.RasterEvent, goog.events.Event);


/**
 * @enum {string}
 */
ol.source.RasterEventType = {
  /**
   * Triggered before operations are run.
   * @event ol.source.RasterEvent#beforeoperations
   * @api
   */
  BEFOREOPERATIONS: 'beforeoperations',

  /**
   * Triggered after operations are run.
   * @event ol.source.RasterEvent#afteroperations
   * @api
   */
  AFTEROPERATIONS: 'afteroperations'
};
