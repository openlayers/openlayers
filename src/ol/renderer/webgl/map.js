// FIXME check against gl.getParameter(webgl.MAX_TEXTURE_SIZE)

import _ol_ from '../../index';
import _ol_array_ from '../../array';
import _ol_css_ from '../../css';
import _ol_dom_ from '../../dom';
import _ol_events_ from '../../events';
import _ol_has_ from '../../has';
import _ol_layer_Layer_ from '../../layer/layer';
import _ol_render_Event_ from '../../render/event';
import _ol_render_EventType_ from '../../render/eventtype';
import _ol_render_webgl_Immediate_ from '../../render/webgl/immediate';
import _ol_renderer_Map_ from '../map';
import _ol_renderer_Type_ from '../type';
import _ol_source_State_ from '../../source/state';
import _ol_structs_LRUCache_ from '../../structs/lrucache';
import _ol_structs_PriorityQueue_ from '../../structs/priorityqueue';
import _ol_webgl_ from '../../webgl';
import _ol_webgl_Context_ from '../../webgl/context';
import _ol_webgl_ContextEventType_ from '../../webgl/contexteventtype';

/**
 * @constructor
 * @extends {ol.renderer.Map}
 * @param {Element} container Container.
 * @param {ol.PluggableMap} map Map.
 * @api
 */
var _ol_renderer_webgl_Map_ = function(container, map) {
  _ol_renderer_Map_.call(this, container, map);

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = /** @type {HTMLCanvasElement} */
    (document.createElement('CANVAS'));
  this.canvas_.style.width = '100%';
  this.canvas_.style.height = '100%';
  this.canvas_.style.display = 'block';
  this.canvas_.className = _ol_css_.CLASS_UNSELECTABLE;
  container.insertBefore(this.canvas_, container.childNodes[0] || null);

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
  this.clipTileContext_ = _ol_dom_.createCanvasContext2D();

  /**
   * @private
   * @type {boolean}
   */
  this.renderedVisible_ = true;

  /**
   * @private
   * @type {WebGLRenderingContext}
   */
  this.gl_ = _ol_webgl_.getContext(this.canvas_, {
    antialias: true,
    depth: true,
    failIfMajorPerformanceCaveat: true,
    preserveDrawingBuffer: false,
    stencil: true
  });

  /**
   * @private
   * @type {ol.webgl.Context}
   */
  this.context_ = new _ol_webgl_Context_(this.canvas_, this.gl_);

  _ol_events_.listen(this.canvas_, _ol_webgl_ContextEventType_.LOST,
      this.handleWebGLContextLost, this);
  _ol_events_.listen(this.canvas_, _ol_webgl_ContextEventType_.RESTORED,
      this.handleWebGLContextRestored, this);

  /**
   * @private
   * @type {ol.structs.LRUCache.<ol.WebglTextureCacheEntry|null>}
   */
  this.textureCache_ = new _ol_structs_LRUCache_();

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.focus_ = null;

  /**
   * @private
   * @type {ol.structs.PriorityQueue.<Array>}
   */
  this.tileTextureQueue_ = new _ol_structs_PriorityQueue_(
      /**
       * @param {Array.<*>} element Element.
       * @return {number} Priority.
       * @this {ol.renderer.webgl.Map}
       */
      (function(element) {
        var tileCenter = /** @type {ol.Coordinate} */ (element[1]);
        var tileResolution = /** @type {number} */ (element[2]);
        var deltaX = tileCenter[0] - this.focus_[0];
        var deltaY = tileCenter[1] - this.focus_[1];
        return 65536 * Math.log(tileResolution) +
            Math.sqrt(deltaX * deltaX + deltaY * deltaY) / tileResolution;
      }).bind(this),
      /**
       * @param {Array.<*>} element Element.
       * @return {string} Key.
       */
      function(element) {
        return /** @type {ol.Tile} */ (element[0]).getKey();
      });


  /**
   * @param {ol.PluggableMap} map Map.
   * @param {?olx.FrameState} frameState Frame state.
   * @return {boolean} false.
   * @this {ol.renderer.webgl.Map}
   */
  this.loadNextTileTexture_ =
      function(map, frameState) {
        if (!this.tileTextureQueue_.isEmpty()) {
          this.tileTextureQueue_.reprioritize();
          var element = this.tileTextureQueue_.dequeue();
          var tile = /** @type {ol.Tile} */ (element[0]);
          var tileSize = /** @type {ol.Size} */ (element[3]);
          var tileGutter = /** @type {number} */ (element[4]);
          this.bindTileTexture(
              tile, tileSize, tileGutter, _ol_webgl_.LINEAR, _ol_webgl_.LINEAR);
        }
        return false;
      }.bind(this);


  /**
   * @private
   * @type {number}
   */
  this.textureCacheFrameMarkerCount_ = 0;

  this.initializeGL_();
};

_ol_.inherits(_ol_renderer_webgl_Map_, _ol_renderer_Map_);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @return {boolean} The renderer can render the layer.
 */
_ol_renderer_webgl_Map_['handles'] = function(type) {
  return _ol_has_.WEBGL && type === _ol_renderer_Type_.WEBGL;
};


/**
 * Create the map renderer.
 * @param {Element} container Container.
 * @param {ol.PluggableMap} map Map.
 * @return {ol.renderer.webgl.Map} The map renderer.
 */
_ol_renderer_webgl_Map_['create'] = function(container, map) {
  return new _ol_renderer_webgl_Map_(container, map);
};


/**
 * @param {ol.Tile} tile Tile.
 * @param {ol.Size} tileSize Tile size.
 * @param {number} tileGutter Tile gutter.
 * @param {number} magFilter Mag filter.
 * @param {number} minFilter Min filter.
 */
_ol_renderer_webgl_Map_.prototype.bindTileTexture = function(tile, tileSize, tileGutter, magFilter, minFilter) {
  var gl = this.getGL();
  var tileKey = tile.getKey();
  if (this.textureCache_.containsKey(tileKey)) {
    var textureCacheEntry = this.textureCache_.get(tileKey);
    gl.bindTexture(_ol_webgl_.TEXTURE_2D, textureCacheEntry.texture);
    if (textureCacheEntry.magFilter != magFilter) {
      gl.texParameteri(
          _ol_webgl_.TEXTURE_2D, _ol_webgl_.TEXTURE_MAG_FILTER, magFilter);
      textureCacheEntry.magFilter = magFilter;
    }
    if (textureCacheEntry.minFilter != minFilter) {
      gl.texParameteri(
          _ol_webgl_.TEXTURE_2D, _ol_webgl_.TEXTURE_MIN_FILTER, minFilter);
      textureCacheEntry.minFilter = minFilter;
    }
  } else {
    var texture = gl.createTexture();
    gl.bindTexture(_ol_webgl_.TEXTURE_2D, texture);
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
      gl.texImage2D(_ol_webgl_.TEXTURE_2D, 0,
          _ol_webgl_.RGBA, _ol_webgl_.RGBA,
          _ol_webgl_.UNSIGNED_BYTE, clipTileCanvas);
    } else {
      gl.texImage2D(_ol_webgl_.TEXTURE_2D, 0,
          _ol_webgl_.RGBA, _ol_webgl_.RGBA,
          _ol_webgl_.UNSIGNED_BYTE, tile.getImage());
    }
    gl.texParameteri(
        _ol_webgl_.TEXTURE_2D, _ol_webgl_.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(
        _ol_webgl_.TEXTURE_2D, _ol_webgl_.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(_ol_webgl_.TEXTURE_2D, _ol_webgl_.TEXTURE_WRAP_S,
        _ol_webgl_.CLAMP_TO_EDGE);
    gl.texParameteri(_ol_webgl_.TEXTURE_2D, _ol_webgl_.TEXTURE_WRAP_T,
        _ol_webgl_.CLAMP_TO_EDGE);
    this.textureCache_.set(tileKey, {
      texture: texture,
      magFilter: magFilter,
      minFilter: minFilter
    });
  }
};


/**
 * @param {ol.render.EventType} type Event type.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
_ol_renderer_webgl_Map_.prototype.dispatchComposeEvent_ = function(type, frameState) {
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

    var vectorContext = new _ol_render_webgl_Immediate_(context,
        center, resolution, rotation, size, extent, pixelRatio);
    var composeEvent = new _ol_render_Event_(type, vectorContext,
        frameState, null, context);
    map.dispatchEvent(composeEvent);
  }
};


/**
 * @inheritDoc
 */
_ol_renderer_webgl_Map_.prototype.disposeInternal = function() {
  var gl = this.getGL();
  if (!gl.isContextLost()) {
    this.textureCache_.forEach(
        /**
         * @param {?ol.WebglTextureCacheEntry} textureCacheEntry
         *     Texture cache entry.
         */
        function(textureCacheEntry) {
          if (textureCacheEntry) {
            gl.deleteTexture(textureCacheEntry.texture);
          }
        });
  }
  this.context_.dispose();
  _ol_renderer_Map_.prototype.disposeInternal.call(this);
};


/**
 * @param {ol.PluggableMap} map Map.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
_ol_renderer_webgl_Map_.prototype.expireCache_ = function(map, frameState) {
  var gl = this.getGL();
  var textureCacheEntry;
  while (this.textureCache_.getCount() - this.textureCacheFrameMarkerCount_ >
      _ol_.WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK) {
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
 * @return {ol.webgl.Context} The context.
 */
_ol_renderer_webgl_Map_.prototype.getContext = function() {
  return this.context_;
};


/**
 * @return {WebGLRenderingContext} GL.
 */
_ol_renderer_webgl_Map_.prototype.getGL = function() {
  return this.gl_;
};


/**
 * @return {ol.structs.PriorityQueue.<Array>} Tile texture queue.
 */
_ol_renderer_webgl_Map_.prototype.getTileTextureQueue = function() {
  return this.tileTextureQueue_;
};


/**
 * @inheritDoc
 */
_ol_renderer_webgl_Map_.prototype.getType = function() {
  return _ol_renderer_Type_.WEBGL;
};


/**
 * @param {ol.events.Event} event Event.
 * @protected
 */
_ol_renderer_webgl_Map_.prototype.handleWebGLContextLost = function(event) {
  event.preventDefault();
  this.textureCache_.clear();
  this.textureCacheFrameMarkerCount_ = 0;

  var renderers = this.getLayerRenderers();
  for (var id in renderers) {
    var renderer = /** @type {ol.renderer.webgl.Layer} */ (renderers[id]);
    renderer.handleWebGLContextLost();
  }
};


/**
 * @protected
 */
_ol_renderer_webgl_Map_.prototype.handleWebGLContextRestored = function() {
  this.initializeGL_();
  this.getMap().render();
};


/**
 * @private
 */
_ol_renderer_webgl_Map_.prototype.initializeGL_ = function() {
  var gl = this.gl_;
  gl.activeTexture(_ol_webgl_.TEXTURE0);
  gl.blendFuncSeparate(
      _ol_webgl_.SRC_ALPHA, _ol_webgl_.ONE_MINUS_SRC_ALPHA,
      _ol_webgl_.ONE, _ol_webgl_.ONE_MINUS_SRC_ALPHA);
  gl.disable(_ol_webgl_.CULL_FACE);
  gl.disable(_ol_webgl_.DEPTH_TEST);
  gl.disable(_ol_webgl_.SCISSOR_TEST);
  gl.disable(_ol_webgl_.STENCIL_TEST);
};


/**
 * @param {ol.Tile} tile Tile.
 * @return {boolean} Is tile texture loaded.
 */
_ol_renderer_webgl_Map_.prototype.isTileTextureLoaded = function(tile) {
  return this.textureCache_.containsKey(tile.getKey());
};


/**
 * @inheritDoc
 */
_ol_renderer_webgl_Map_.prototype.renderFrame = function(frameState) {

  var context = this.getContext();
  var gl = this.getGL();

  if (gl.isContextLost()) {
    return false;
  }

  if (!frameState) {
    if (this.renderedVisible_) {
      this.canvas_.style.display = 'none';
      this.renderedVisible_ = false;
    }
    return false;
  }

  this.focus_ = frameState.focus;

  this.textureCache_.set((-frameState.index).toString(), null);
  ++this.textureCacheFrameMarkerCount_;

  this.dispatchComposeEvent_(_ol_render_EventType_.PRECOMPOSE, frameState);

  /** @type {Array.<ol.LayerState>} */
  var layerStatesToDraw = [];
  var layerStatesArray = frameState.layerStatesArray;
  _ol_array_.stableSort(layerStatesArray, _ol_renderer_Map_.sortByZIndex);

  var viewResolution = frameState.viewState.resolution;
  var i, ii, layerRenderer, layerState;
  for (i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    layerState = layerStatesArray[i];
    if (_ol_layer_Layer_.visibleAtResolution(layerState, viewResolution) &&
        layerState.sourceState == _ol_source_State_.READY) {
      layerRenderer = /** @type {ol.renderer.webgl.Layer} */ (this.getLayerRenderer(layerState.layer));
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

  gl.bindFramebuffer(_ol_webgl_.FRAMEBUFFER, null);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(_ol_webgl_.COLOR_BUFFER_BIT);
  gl.enable(_ol_webgl_.BLEND);
  gl.viewport(0, 0, this.canvas_.width, this.canvas_.height);

  for (i = 0, ii = layerStatesToDraw.length; i < ii; ++i) {
    layerState = layerStatesToDraw[i];
    layerRenderer = /** @type {ol.renderer.webgl.Layer} */ (this.getLayerRenderer(layerState.layer));
    layerRenderer.composeFrame(frameState, layerState, context);
  }

  if (!this.renderedVisible_) {
    this.canvas_.style.display = '';
    this.renderedVisible_ = true;
  }

  this.calculateMatrices2D(frameState);

  if (this.textureCache_.getCount() - this.textureCacheFrameMarkerCount_ >
      _ol_.WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK) {
    frameState.postRenderFunctions.push(
        /** @type {ol.PostRenderFunction} */ (this.expireCache_.bind(this))
    );
  }

  if (!this.tileTextureQueue_.isEmpty()) {
    frameState.postRenderFunctions.push(this.loadNextTileTexture_);
    frameState.animate = true;
  }

  this.dispatchComposeEvent_(_ol_render_EventType_.POSTCOMPOSE, frameState);

  this.scheduleRemoveUnusedLayerRenderers(frameState);
  this.scheduleExpireIconCache(frameState);

};


/**
 * @inheritDoc
 */
_ol_renderer_webgl_Map_.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg,
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
    if (_ol_layer_Layer_.visibleAtResolution(layerState, viewState.resolution) &&
        layerFilter.call(thisArg2, layer)) {
      var layerRenderer = this.getLayerRenderer(layer);
      result = layerRenderer.forEachFeatureAtCoordinate(
          coordinate, frameState, hitTolerance, callback, thisArg);
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
_ol_renderer_webgl_Map_.prototype.hasFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, layerFilter, thisArg) {
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
    if (_ol_layer_Layer_.visibleAtResolution(layerState, viewState.resolution) &&
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
_ol_renderer_webgl_Map_.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg,
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
    if (_ol_layer_Layer_.visibleAtResolution(layerState, viewState.resolution) &&
        layerFilter.call(thisArg, layer)) {
      var layerRenderer = /** @type {ol.renderer.webgl.Layer} */ (this.getLayerRenderer(layer));
      result = layerRenderer.forEachLayerAtPixel(
          pixel, frameState, callback, thisArg);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};
export default _ol_renderer_webgl_Map_;
