// FIXME check against gl.getParameter(webgl.MAX_TEXTURE_SIZE)

goog.provide('ol.renderer.webgl.Map');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.object');
goog.require('goog.style');
goog.require('goog.webgl');
goog.require('ol.FrameState');
goog.require('ol.Tile');
goog.require('ol.css');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.render.Event');
goog.require('ol.render.EventType');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.webgl.ImageLayer');
goog.require('ol.renderer.webgl.TileLayer');
goog.require('ol.source.State');
goog.require('ol.structs.LRUCache');
goog.require('ol.structs.PriorityQueue');
goog.require('ol.webgl');
goog.require('ol.webgl.Context');
goog.require('ol.webgl.WebGLContextEventType');


/**
 * @define {number} Texture cache high water mark.
 */
ol.WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK = 1024;


/**
 * @typedef {{magFilter: number, minFilter: number, texture: WebGLTexture}}
 */
ol.renderer.webgl.TextureCacheEntry;



/**
 * @constructor
 * @extends {ol.renderer.Map}
 * @param {Element} container Container.
 * @param {ol.Map} map Map.
 */
ol.renderer.webgl.Map = function(container, map) {

  goog.base(this, container, map);

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));
  this.canvas_.className = ol.css.CLASS_UNSELECTABLE;
  goog.dom.insertChildAt(container, this.canvas_, 0);

  /**
   * @private
   * @type {boolean}
   */
  this.renderedVisible_ = true;

  /**
   * @private
   * @type {WebGLRenderingContext}
   */
  this.gl_ = ol.webgl.getContext(this.canvas_, {
    antialias: true,
    depth: false,
    preserveDrawingBuffer: false,
    stencil: true
  });
  goog.asserts.assert(!goog.isNull(this.gl_));

  /**
   * @private
   * @type {ol.webgl.Context}
   */
  this.context_ = new ol.webgl.Context(this.canvas_, this.gl_);

  goog.events.listen(this.canvas_, ol.webgl.WebGLContextEventType.LOST,
      this.handleWebGLContextLost, false, this);
  goog.events.listen(this.canvas_, ol.webgl.WebGLContextEventType.RESTORED,
      this.handleWebGLContextRestored, false, this);

  /**
   * @private
   * @type {ol.structs.LRUCache}
   */
  this.textureCache_ = new ol.structs.LRUCache();

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.focus_ = null;

  /**
   * @private
   * @type {ol.structs.PriorityQueue.<Array>}
   */
  this.tileTextureQueue_ = new ol.structs.PriorityQueue(
      /**
       * @param {Array} element Element.
       * @return {number} Priority.
       */
      goog.bind(function(element) {
        var tileCenter = /** @type {ol.Coordinate} */ (element[1]);
        var tileResolution = /** @type {number} */ (element[2]);
        var deltaX = tileCenter[0] - this.focus_[0];
        var deltaY = tileCenter[1] - this.focus_[1];
        return 65536 * Math.log(tileResolution) +
            Math.sqrt(deltaX * deltaX + deltaY * deltaY) / tileResolution;
      }, this),
      /**
       * @param {Array} element Element.
       * @return {string} Key.
       */
      function(element) {
        return /** @type {ol.Tile} */ (element[0]).getKey();
      });

  /**
   * @private
   * @type {ol.PostRenderFunction}
   */
  this.loadNextTileTexture_ = goog.bind(
      function(map, frameState) {
        if (!this.tileTextureQueue_.isEmpty()) {
          this.tileTextureQueue_.reprioritize();
          var tile =
              /** @type {ol.Tile} */ (this.tileTextureQueue_.dequeue()[0]);
          this.bindTileTexture(tile, goog.webgl.LINEAR, goog.webgl.LINEAR);
        }
      }, this);

  /**
   * @private
   * @type {number}
   */
  this.textureCacheFrameMarkerCount_ = 0;

  this.initializeGL_();

};
goog.inherits(ol.renderer.webgl.Map, ol.renderer.Map);


/**
 * @param {ol.Tile} tile Tile.
 * @param {number} magFilter Mag filter.
 * @param {number} minFilter Min filter.
 */
ol.renderer.webgl.Map.prototype.bindTileTexture =
    function(tile, magFilter, minFilter) {
  var gl = this.getGL();
  var tileKey = tile.getKey();
  if (this.textureCache_.containsKey(tileKey)) {
    var textureCacheEntry = this.textureCache_.get(tileKey);
    gl.bindTexture(goog.webgl.TEXTURE_2D, textureCacheEntry.texture);
    if (textureCacheEntry.magFilter != magFilter) {
      gl.texParameteri(
          goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER, magFilter);
      textureCacheEntry.magFilter = magFilter;
    }
    if (textureCacheEntry.minFilter != minFilter) {
      gl.texParameteri(
          goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER, minFilter);
      textureCacheEntry.minFilter = minFilter;
    }
  } else {
    var texture = gl.createTexture();
    gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
    gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, goog.webgl.RGBA,
        goog.webgl.UNSIGNED_BYTE, tile.getImage());
    gl.texParameteri(
        goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(
        goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_S,
        goog.webgl.CLAMP_TO_EDGE);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_T,
        goog.webgl.CLAMP_TO_EDGE);
    this.textureCache_.set(tileKey, {
      texture: texture,
      magFilter: magFilter,
      minFilter: minFilter
    });
  }
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.createLayerRenderer = function(layer) {
  if (layer instanceof ol.layer.Tile) {
    return new ol.renderer.webgl.TileLayer(this, layer);
  } else if (layer instanceof ol.layer.Image) {
    return new ol.renderer.webgl.ImageLayer(this, layer);
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @param {ol.render.EventType} type Event type.
 * @param {ol.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.webgl.Map.prototype.dispatchComposeEvent_ =
    function(type, frameState) {
  var map = this.getMap();
  var context = this.getContext();
  if (map.hasListener(type)) {
    var composeEvent = new ol.render.Event(
        type, map, null, frameState, null, context);
    map.dispatchEvent(composeEvent);
  }
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.disposeInternal = function() {
  var gl = this.getGL();
  if (!gl.isContextLost()) {
    this.textureCache_.forEach(function(textureCacheEntry) {
      if (!goog.isNull(textureCacheEntry)) {
        gl.deleteTexture(textureCacheEntry.texture);
      }
    });
  }
  goog.dispose(this.context_);
  goog.base(this, 'disposeInternal');
};


/**
 * @param {ol.Map} map Map.
 * @param {ol.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.webgl.Map.prototype.expireCache_ = function(map, frameState) {
  var gl = this.getGL();
  var textureCacheEntry;
  while (this.textureCache_.getCount() - this.textureCacheFrameMarkerCount_ >
      ol.WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK) {
    textureCacheEntry = /** @type {?ol.renderer.webgl.TextureCacheEntry} */
        (this.textureCache_.peekLast());
    if (goog.isNull(textureCacheEntry)) {
      if (+this.textureCache_.peekLastKey() == frameState.index) {
        break;
      } else {
        --this.textureCacheFrameMarkerCount_;
      }
    } else {
      gl.deleteTexture(textureCacheEntry.texture);
    }
    this.textureCache_.pop();
  }
};


/**
 * @return {ol.webgl.Context}
 */
ol.renderer.webgl.Map.prototype.getContext = function() {
  return this.context_;
};


/**
 * @return {WebGLRenderingContext} GL.
 */
ol.renderer.webgl.Map.prototype.getGL = function() {
  return this.gl_;
};


/**
 * @return {ol.structs.PriorityQueue.<Array>} Tile texture queue.
 */
ol.renderer.webgl.Map.prototype.getTileTextureQueue = function() {
  return this.tileTextureQueue_;
};


/**
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol.renderer.webgl.Map.prototype.handleWebGLContextLost = function(event) {
  event.preventDefault();
  this.textureCache_.clear();
  this.textureCacheFrameMarkerCount_ = 0;
  goog.object.forEach(this.getLayerRenderers(), function(layerRenderer) {
    layerRenderer.handleWebGLContextLost();
  });
};


/**
 * @protected
 */
ol.renderer.webgl.Map.prototype.handleWebGLContextRestored = function() {
  this.initializeGL_();
  this.getMap().render();
};


/**
 * @private
 */
ol.renderer.webgl.Map.prototype.initializeGL_ = function() {
  var gl = this.gl_;
  gl.activeTexture(goog.webgl.TEXTURE0);
  gl.blendFuncSeparate(
      goog.webgl.SRC_ALPHA, goog.webgl.ONE_MINUS_SRC_ALPHA,
      goog.webgl.ONE, goog.webgl.ONE_MINUS_SRC_ALPHA);
  gl.disable(goog.webgl.CULL_FACE);
  gl.disable(goog.webgl.DEPTH_TEST);
  gl.disable(goog.webgl.SCISSOR_TEST);
  gl.disable(goog.webgl.STENCIL_TEST);
};


/**
 * @param {ol.Tile} tile Tile.
 * @return {boolean} Is tile texture loaded.
 */
ol.renderer.webgl.Map.prototype.isTileTextureLoaded = function(tile) {
  return this.textureCache_.containsKey(tile.getKey());
};


/**
 * @private
 * @type {goog.log.Logger}
 */
ol.renderer.webgl.Map.prototype.logger_ =
    goog.log.getLogger('ol.renderer.webgl.Map');


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.renderFrame = function(frameState) {

  var context = this.getContext();
  var gl = this.getGL();

  if (gl.isContextLost()) {
    return false;
  }

  if (goog.isNull(frameState)) {
    if (this.renderedVisible_) {
      goog.style.setElementShown(this.canvas_, false);
      this.renderedVisible_ = false;
    }
    return false;
  }

  this.focus_ = frameState.focus;

  this.textureCache_.set((-frameState.index).toString(), null);
  ++this.textureCacheFrameMarkerCount_;

  var layersToDraw = [];
  var layersArray = frameState.layersArray;
  var viewResolution = frameState.view2DState.resolution;
  var i, ii, layer, layerRenderer, layerState;
  for (i = 0, ii = layersArray.length; i < ii; ++i) {
    layer = layersArray[i];
    layerState = frameState.layerStates[goog.getUid(layer)];
    if (layerState.visible &&
        layerState.sourceState == ol.source.State.READY &&
        viewResolution < layerState.maxResolution &&
        viewResolution >= layerState.minResolution) {
      layersToDraw.push(layer);
    }
  }

  for (i = 0, ii = layersToDraw.length; i < ii; ++i) {
    layer = layersToDraw[i];
    layerRenderer = this.getLayerRenderer(layer);
    layerState = frameState.layerStates[goog.getUid(layer)];
    layerRenderer.prepareFrame(frameState, layerState);
  }

  var size = frameState.size;
  if (this.canvas_.width != size[0] || this.canvas_.height != size[1]) {
    this.canvas_.width = size[0];
    this.canvas_.height = size[1];
  }

  gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, null);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(goog.webgl.COLOR_BUFFER_BIT);
  gl.enable(goog.webgl.BLEND);
  gl.viewport(0, 0, size[0], size[1]);

  this.dispatchComposeEvent_(ol.render.EventType.PRECOMPOSE, frameState);

  for (i = 0, ii = layersToDraw.length; i < ii; ++i) {
    layer = layersToDraw[i];
    layerState = frameState.layerStates[goog.getUid(layer)];
    layerRenderer = this.getLayerRenderer(layer);
    layerRenderer.composeFrame(frameState, layerState, context);
  }

  if (!this.renderedVisible_) {
    goog.style.setElementShown(this.canvas_, true);
    this.renderedVisible_ = true;
  }

  this.calculateMatrices2D(frameState);

  if (this.textureCache_.getCount() - this.textureCacheFrameMarkerCount_ >
      ol.WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK) {
    frameState.postRenderFunctions.push(goog.bind(this.expireCache_, this));
  }

  if (!this.tileTextureQueue_.isEmpty()) {
    frameState.postRenderFunctions.push(this.loadNextTileTexture_);
    frameState.animate = true;
  }

  this.dispatchComposeEvent_(ol.render.EventType.POSTCOMPOSE, frameState);

  this.scheduleRemoveUnusedLayerRenderers(frameState);

};
