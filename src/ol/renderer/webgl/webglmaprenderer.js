// FIXME check against gl.getParameter(webgl.MAX_TEXTURE_SIZE)

goog.provide('ol.renderer.webgl.Map');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.object');
goog.require('goog.style');
goog.require('goog.webgl');
goog.require('ol');
goog.require('ol.RendererType');
goog.require('ol.css');
goog.require('ol.dom');
goog.require('ol.layer.Image');
goog.require('ol.layer.Layer');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.render.Event');
goog.require('ol.render.EventType');
goog.require('ol.render.webgl.Immediate');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.webgl.ImageLayer');
goog.require('ol.renderer.webgl.Layer');
goog.require('ol.renderer.webgl.TileLayer');
goog.require('ol.renderer.webgl.VectorLayer');
goog.require('ol.source.State');
goog.require('ol.structs.LRUCache');
goog.require('ol.structs.PriorityQueue');
goog.require('ol.webgl');
goog.require('ol.webgl.Context');
goog.require('ol.webgl.WebGLContextEventType');


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
      (goog.dom.createElement('CANVAS'));
  this.canvas_.style.width = '100%';
  this.canvas_.style.height = '100%';
  this.canvas_.className = ol.css.CLASS_UNSELECTABLE;
  goog.dom.insertChildAt(container, this.canvas_, 0);

  /**
   * @private
   * @type {number}
   */
  this.clipTileCanvasWidth_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.clipTileCanvasHeight_ = 0;

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.clipTileContext_ = ol.dom.createCanvasContext2D();

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
    failIfMajorPerformanceCaveat: true,
    preserveDrawingBuffer: false,
    stencil: true
  });
  goog.asserts.assert(this.gl_, 'got a WebGLRenderingContext');

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
   * @type {ol.structs.LRUCache.<ol.renderer.webgl.TextureCacheEntry|null>}
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
      goog.bind(
          /**
           * @param {Array.<*>} element Element.
           * @return {number} Priority.
           * @this {ol.renderer.webgl.Map}
           */
          function(element) {
            var tileCenter = /** @type {ol.Coordinate} */ (element[1]);
            var tileResolution = /** @type {number} */ (element[2]);
            var deltaX = tileCenter[0] - this.focus_[0];
            var deltaY = tileCenter[1] - this.focus_[1];
            return 65536 * Math.log(tileResolution) +
                Math.sqrt(deltaX * deltaX + deltaY * deltaY) / tileResolution;
          }, this),
      /**
       * @param {Array.<*>} element Element.
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
          var element = this.tileTextureQueue_.dequeue();
          var tile = /** @type {ol.Tile} */ (element[0]);
          var tileSize = /** @type {ol.Size} */ (element[3]);
          var tileGutter = /** @type {number} */ (element[4]);
          this.bindTileTexture(
              tile, tileSize, tileGutter, goog.webgl.LINEAR, goog.webgl.LINEAR);
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
 * @param {ol.Size} tileSize Tile size.
 * @param {number} tileGutter Tile gutter.
 * @param {number} magFilter Mag filter.
 * @param {number} minFilter Min filter.
 */
ol.renderer.webgl.Map.prototype.bindTileTexture =
    function(tile, tileSize, tileGutter, magFilter, minFilter) {
  var gl = this.getGL();
  var tileKey = tile.getKey();
  if (this.textureCache_.containsKey(tileKey)) {
    var textureCacheEntry = this.textureCache_.get(tileKey);
    goog.asserts.assert(textureCacheEntry,
        'a texture cache entry exists for key %s', tileKey);
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
    if (tileGutter > 0) {
      var clipTileCanvas = this.clipTileContext_.canvas;
      var clipTileContext = this.clipTileContext_;
      if (this.clipTileCanvasWidth_ !== tileSize[0] ||
          this.clipTileCanvasHeight_ !== tileSize[1]) {
        clipTileCanvas.width = tileSize[0];
        clipTileCanvas.height = tileSize[1];
        this.clipTileCanvasWidth_ = tileSize[0];
        this.clipTileCanvasHeight_ = tileSize[1];
      } else {
        clipTileContext.clearRect(0, 0, tileSize[0], tileSize[1]);
      }
      clipTileContext.drawImage(tile.getImage(), tileGutter, tileGutter,
          tileSize[0], tileSize[1], 0, 0, tileSize[0], tileSize[1]);
      gl.texImage2D(goog.webgl.TEXTURE_2D, 0,
          goog.webgl.RGBA, goog.webgl.RGBA,
          goog.webgl.UNSIGNED_BYTE, clipTileCanvas);
    } else {
      gl.texImage2D(goog.webgl.TEXTURE_2D, 0,
          goog.webgl.RGBA, goog.webgl.RGBA,
          goog.webgl.UNSIGNED_BYTE, tile.getImage());
    }
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
  if (ol.ENABLE_IMAGE && layer instanceof ol.layer.Image) {
    return new ol.renderer.webgl.ImageLayer(this, layer);
  } else if (ol.ENABLE_TILE && layer instanceof ol.layer.Tile) {
    return new ol.renderer.webgl.TileLayer(this, layer);
  } else if (ol.ENABLE_VECTOR && layer instanceof ol.layer.Vector) {
    return new ol.renderer.webgl.VectorLayer(this, layer);
  } else {
    goog.asserts.fail('unexpected layer configuration');
    return null;
  }
};


/**
 * @param {ol.render.EventType} type Event type.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.webgl.Map.prototype.dispatchComposeEvent_ =
    function(type, frameState) {
  var map = this.getMap();
  if (map.hasListener(type)) {
    var context = this.context_;

    var extent = frameState.extent;
    var size = frameState.size;
    var viewState = frameState.viewState;
    var pixelRatio = frameState.pixelRatio;

    var resolution = viewState.resolution;
    var center = viewState.center;
    var rotation = viewState.rotation;

    var vectorContext = new ol.render.webgl.Immediate(context,
        center, resolution, rotation, size, extent, pixelRatio);
    var composeEvent = new ol.render.Event(type, map, vectorContext,
        frameState, null, context);
    map.dispatchEvent(composeEvent);

    vectorContext.flush();
  }
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.disposeInternal = function() {
  var gl = this.getGL();
  if (!gl.isContextLost()) {
    this.textureCache_.forEach(
        /**
         * @param {?ol.renderer.webgl.TextureCacheEntry} textureCacheEntry
         *     Texture cache entry.
         */
        function(textureCacheEntry) {
          if (textureCacheEntry) {
            gl.deleteTexture(textureCacheEntry.texture);
          }
        });
  }
  goog.dispose(this.context_);
  goog.base(this, 'disposeInternal');
};


/**
 * @param {ol.Map} map Map.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.webgl.Map.prototype.expireCache_ = function(map, frameState) {
  var gl = this.getGL();
  var textureCacheEntry;
  while (this.textureCache_.getCount() - this.textureCacheFrameMarkerCount_ >
      ol.WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK) {
    textureCacheEntry = this.textureCache_.peekLast();
    if (!textureCacheEntry) {
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
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.getType = function() {
  return ol.RendererType.WEBGL;
};


/**
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol.renderer.webgl.Map.prototype.handleWebGLContextLost = function(event) {
  event.preventDefault();
  this.textureCache_.clear();
  this.textureCacheFrameMarkerCount_ = 0;
  goog.object.forEach(this.getLayerRenderers(),
      /**
       * @param {ol.renderer.Layer} layerRenderer Layer renderer.
       * @param {string} key Key.
       * @param {Object.<string, ol.renderer.Layer>} object Object.
       */
      function(layerRenderer, key, object) {
        goog.asserts.assertInstanceof(layerRenderer, ol.renderer.webgl.Layer,
            'renderer is an instance of ol.renderer.webgl.Layer');
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

  if (!frameState) {
    if (this.renderedVisible_) {
      goog.style.setElementShown(this.canvas_, false);
      this.renderedVisible_ = false;
    }
    return false;
  }

  this.focus_ = frameState.focus;

  this.textureCache_.set((-frameState.index).toString(), null);
  ++this.textureCacheFrameMarkerCount_;

  this.dispatchComposeEvent_(ol.render.EventType.PRECOMPOSE, frameState);

  /** @type {Array.<ol.layer.LayerState>} */
  var layerStatesToDraw = [];
  var layerStatesArray = frameState.layerStatesArray;
  goog.array.stableSort(layerStatesArray, ol.renderer.Map.sortByZIndex);

  var viewResolution = frameState.viewState.resolution;
  var i, ii, layerRenderer, layerState;
  for (i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    layerState = layerStatesArray[i];
    if (ol.layer.Layer.visibleAtResolution(layerState, viewResolution) &&
        layerState.sourceState == ol.source.State.READY) {
      layerRenderer = this.getLayerRenderer(layerState.layer);
      goog.asserts.assertInstanceof(layerRenderer, ol.renderer.webgl.Layer,
          'renderer is an instance of ol.renderer.webgl.Layer');
      if (layerRenderer.prepareFrame(frameState, layerState, context)) {
        layerStatesToDraw.push(layerState);
      }
    }
  }

  var width = frameState.size[0] * frameState.pixelRatio;
  var height = frameState.size[1] * frameState.pixelRatio;
  if (this.canvas_.width != width || this.canvas_.height != height) {
    this.canvas_.width = width;
    this.canvas_.height = height;
  }

  gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, null);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(goog.webgl.COLOR_BUFFER_BIT);
  gl.enable(goog.webgl.BLEND);
  gl.viewport(0, 0, this.canvas_.width, this.canvas_.height);

  for (i = 0, ii = layerStatesToDraw.length; i < ii; ++i) {
    layerState = layerStatesToDraw[i];
    layerRenderer = this.getLayerRenderer(layerState.layer);
    goog.asserts.assertInstanceof(layerRenderer, ol.renderer.webgl.Layer,
        'renderer is an instance of ol.renderer.webgl.Layer');
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
  this.scheduleExpireIconCache(frameState);

};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.forEachFeatureAtCoordinate =
    function(coordinate, frameState, callback, thisArg,
        layerFilter, thisArg2) {
  var result;

  if (this.getGL().isContextLost()) {
    return false;
  }

  var viewState = frameState.viewState;

  var layerStates = frameState.layerStatesArray;
  var numLayers = layerStates.length;
  var i;
  for (i = numLayers - 1; i >= 0; --i) {
    var layerState = layerStates[i];
    var layer = layerState.layer;
    if (ol.layer.Layer.visibleAtResolution(layerState, viewState.resolution) &&
        layerFilter.call(thisArg2, layer)) {
      var layerRenderer = this.getLayerRenderer(layer);
      result = layerRenderer.forEachFeatureAtCoordinate(
          coordinate, frameState, callback, thisArg);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.hasFeatureAtCoordinate =
    function(coordinate, frameState, layerFilter, thisArg) {
  var hasFeature = false;

  if (this.getGL().isContextLost()) {
    return false;
  }

  var viewState = frameState.viewState;

  var layerStates = frameState.layerStatesArray;
  var numLayers = layerStates.length;
  var i;
  for (i = numLayers - 1; i >= 0; --i) {
    var layerState = layerStates[i];
    var layer = layerState.layer;
    if (ol.layer.Layer.visibleAtResolution(layerState, viewState.resolution) &&
        layerFilter.call(thisArg, layer)) {
      var layerRenderer = this.getLayerRenderer(layer);
      hasFeature =
          layerRenderer.hasFeatureAtCoordinate(coordinate, frameState);
      if (hasFeature) {
        return true;
      }
    }
  }
  return hasFeature;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.forEachLayerAtPixel =
    function(pixel, frameState, callback, thisArg,
        layerFilter, thisArg2) {
  if (this.getGL().isContextLost()) {
    return false;
  }

  var viewState = frameState.viewState;
  var result;

  var layerStates = frameState.layerStatesArray;
  var numLayers = layerStates.length;
  var i;
  for (i = numLayers - 1; i >= 0; --i) {
    var layerState = layerStates[i];
    var layer = layerState.layer;
    if (ol.layer.Layer.visibleAtResolution(layerState, viewState.resolution) &&
        layerFilter.call(thisArg, layer)) {
      var layerRenderer = this.getLayerRenderer(layer);
      result = layerRenderer.forEachLayerAtPixel(
          pixel, frameState, callback, thisArg);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};
