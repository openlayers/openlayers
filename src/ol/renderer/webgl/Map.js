/**
 * @module ol/renderer/webgl/Map
 */

import {inherits} from '../../index.js';
import {stableSort} from '../../array.js';
import {CLASS_UNSELECTABLE} from '../../css.js';
import {createCanvasContext2D} from '../../dom.js';
import {listen} from '../../events.js';
import {WEBGL} from '../../has.js';
import Layer from '../../layer/Layer.js';
import RenderEvent from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import _ol_render_webgl_Immediate_ from '../../render/webgl/Immediate.js';
import MapRenderer from '../Map.js';
import RendererType from '../Type.js';
import SourceState from '../../source/State.js';
import LRUCache from '../../structs/LRUCache.js';
import PriorityQueue from '../../structs/PriorityQueue.js';
import _ol_webgl_ from '../../webgl.js';
import _ol_webgl_Context_ from '../../webgl/Context.js';
import ContextEventType from '../../webgl/ContextEventType.js';


/**
 * @type {number} Texture cache high water mark.
 */
const WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK = 1024;


/**
 * @constructor
 * @extends {ol.renderer.Map}
 * @param {Element} container Container.
 * @param {ol.PluggableMap} map Map.
 * @api
 */
const WebGLMapRenderer = function(container, map) {
  MapRenderer.call(this, container, map);

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = /** @type {HTMLCanvasElement} */
    (document.createElement('CANVAS'));
  this.canvas_.style.width = '100%';
  this.canvas_.style.height = '100%';
  this.canvas_.style.display = 'block';
  this.canvas_.className = CLASS_UNSELECTABLE;
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
  this.clipTileContext_ = createCanvasContext2D();

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

  listen(this.canvas_, ContextEventType.LOST,
    this.handleWebGLContextLost, this);
  listen(this.canvas_, ContextEventType.RESTORED,
    this.handleWebGLContextRestored, this);

  /**
   * @private
   * @type {ol.structs.LRUCache.<ol.WebglTextureCacheEntry|null>}
   */
  this.textureCache_ = new LRUCache();

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.focus_ = null;

  /**
   * @private
   * @type {ol.structs.PriorityQueue.<Array>}
   */
  this.tileTextureQueue_ = new PriorityQueue(
    /**
       * @param {Array.<*>} element Element.
       * @return {number} Priority.
       * @this {ol.renderer.webgl.Map}
       */
    (function(element) {
      const tileCenter = /** @type {ol.Coordinate} */ (element[1]);
      const tileResolution = /** @type {number} */ (element[2]);
      const deltaX = tileCenter[0] - this.focus_[0];
      const deltaY = tileCenter[1] - this.focus_[1];
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
          const element = this.tileTextureQueue_.dequeue();
          const tile = /** @type {ol.Tile} */ (element[0]);
          const tileSize = /** @type {ol.Size} */ (element[3]);
          const tileGutter = /** @type {number} */ (element[4]);
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

inherits(WebGLMapRenderer, MapRenderer);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @return {boolean} The renderer can render the layer.
 */
WebGLMapRenderer['handles'] = function(type) {
  return WEBGL && type === RendererType.WEBGL;
};


/**
 * Create the map renderer.
 * @param {Element} container Container.
 * @param {ol.PluggableMap} map Map.
 * @return {ol.renderer.webgl.Map} The map renderer.
 */
WebGLMapRenderer['create'] = function(container, map) {
  return new WebGLMapRenderer(container, map);
};


/**
 * @param {ol.Tile} tile Tile.
 * @param {ol.Size} tileSize Tile size.
 * @param {number} tileGutter Tile gutter.
 * @param {number} magFilter Mag filter.
 * @param {number} minFilter Min filter.
 */
WebGLMapRenderer.prototype.bindTileTexture = function(tile, tileSize, tileGutter, magFilter, minFilter) {
  const gl = this.getGL();
  const tileKey = tile.getKey();
  if (this.textureCache_.containsKey(tileKey)) {
    const textureCacheEntry = this.textureCache_.get(tileKey);
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
    const texture = gl.createTexture();
    gl.bindTexture(_ol_webgl_.TEXTURE_2D, texture);
    if (tileGutter > 0) {
      const clipTileCanvas = this.clipTileContext_.canvas;
      const clipTileContext = this.clipTileContext_;
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
WebGLMapRenderer.prototype.dispatchComposeEvent_ = function(type, frameState) {
  const map = this.getMap();
  if (map.hasListener(type)) {
    const context = this.context_;

    const extent = frameState.extent;
    const size = frameState.size;
    const viewState = frameState.viewState;
    const pixelRatio = frameState.pixelRatio;

    const resolution = viewState.resolution;
    const center = viewState.center;
    const rotation = viewState.rotation;

    const vectorContext = new _ol_render_webgl_Immediate_(context,
      center, resolution, rotation, size, extent, pixelRatio);
    const composeEvent = new RenderEvent(type, vectorContext,
      frameState, null, context);
    map.dispatchEvent(composeEvent);
  }
};


/**
 * @inheritDoc
 */
WebGLMapRenderer.prototype.disposeInternal = function() {
  const gl = this.getGL();
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
  MapRenderer.prototype.disposeInternal.call(this);
};


/**
 * @param {ol.PluggableMap} map Map.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
WebGLMapRenderer.prototype.expireCache_ = function(map, frameState) {
  const gl = this.getGL();
  let textureCacheEntry;
  while (this.textureCache_.getCount() - this.textureCacheFrameMarkerCount_ >
      WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK) {
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
WebGLMapRenderer.prototype.getContext = function() {
  return this.context_;
};


/**
 * @return {WebGLRenderingContext} GL.
 */
WebGLMapRenderer.prototype.getGL = function() {
  return this.gl_;
};


/**
 * @return {ol.structs.PriorityQueue.<Array>} Tile texture queue.
 */
WebGLMapRenderer.prototype.getTileTextureQueue = function() {
  return this.tileTextureQueue_;
};


/**
 * @inheritDoc
 */
WebGLMapRenderer.prototype.getType = function() {
  return RendererType.WEBGL;
};


/**
 * @param {ol.events.Event} event Event.
 * @protected
 */
WebGLMapRenderer.prototype.handleWebGLContextLost = function(event) {
  event.preventDefault();
  this.textureCache_.clear();
  this.textureCacheFrameMarkerCount_ = 0;

  const renderers = this.getLayerRenderers();
  for (const id in renderers) {
    const renderer = /** @type {ol.renderer.webgl.Layer} */ (renderers[id]);
    renderer.handleWebGLContextLost();
  }
};


/**
 * @protected
 */
WebGLMapRenderer.prototype.handleWebGLContextRestored = function() {
  this.initializeGL_();
  this.getMap().render();
};


/**
 * @private
 */
WebGLMapRenderer.prototype.initializeGL_ = function() {
  const gl = this.gl_;
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
WebGLMapRenderer.prototype.isTileTextureLoaded = function(tile) {
  return this.textureCache_.containsKey(tile.getKey());
};


/**
 * @inheritDoc
 */
WebGLMapRenderer.prototype.renderFrame = function(frameState) {

  const context = this.getContext();
  const gl = this.getGL();

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

  this.dispatchComposeEvent_(RenderEventType.PRECOMPOSE, frameState);

  /** @type {Array.<ol.LayerState>} */
  const layerStatesToDraw = [];
  const layerStatesArray = frameState.layerStatesArray;
  stableSort(layerStatesArray, MapRenderer.sortByZIndex);

  const viewResolution = frameState.viewState.resolution;
  let i, ii, layerRenderer, layerState;
  for (i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    layerState = layerStatesArray[i];
    if (Layer.visibleAtResolution(layerState, viewResolution) &&
        layerState.sourceState == SourceState.READY) {
      layerRenderer = /** @type {ol.renderer.webgl.Layer} */ (this.getLayerRenderer(layerState.layer));
      if (layerRenderer.prepareFrame(frameState, layerState, context)) {
        layerStatesToDraw.push(layerState);
      }
    }
  }

  const width = frameState.size[0] * frameState.pixelRatio;
  const height = frameState.size[1] * frameState.pixelRatio;
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
      WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK) {
    frameState.postRenderFunctions.push(
      /** @type {ol.PostRenderFunction} */ (this.expireCache_.bind(this))
    );
  }

  if (!this.tileTextureQueue_.isEmpty()) {
    frameState.postRenderFunctions.push(this.loadNextTileTexture_);
    frameState.animate = true;
  }

  this.dispatchComposeEvent_(RenderEventType.POSTCOMPOSE, frameState);

  this.scheduleRemoveUnusedLayerRenderers(frameState);
  this.scheduleExpireIconCache(frameState);

};


/**
 * @inheritDoc
 */
WebGLMapRenderer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg,
  layerFilter, thisArg2) {
  let result;

  if (this.getGL().isContextLost()) {
    return false;
  }

  const viewState = frameState.viewState;

  const layerStates = frameState.layerStatesArray;
  const numLayers = layerStates.length;
  let i;
  for (i = numLayers - 1; i >= 0; --i) {
    const layerState = layerStates[i];
    const layer = layerState.layer;
    if (Layer.visibleAtResolution(layerState, viewState.resolution) &&
        layerFilter.call(thisArg2, layer)) {
      const layerRenderer = this.getLayerRenderer(layer);
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
WebGLMapRenderer.prototype.hasFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, layerFilter, thisArg) {
  let hasFeature = false;

  if (this.getGL().isContextLost()) {
    return false;
  }

  const viewState = frameState.viewState;

  const layerStates = frameState.layerStatesArray;
  const numLayers = layerStates.length;
  let i;
  for (i = numLayers - 1; i >= 0; --i) {
    const layerState = layerStates[i];
    const layer = layerState.layer;
    if (Layer.visibleAtResolution(layerState, viewState.resolution) &&
        layerFilter.call(thisArg, layer)) {
      const layerRenderer = this.getLayerRenderer(layer);
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
WebGLMapRenderer.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg,
  layerFilter, thisArg2) {
  if (this.getGL().isContextLost()) {
    return false;
  }

  const viewState = frameState.viewState;
  let result;

  const layerStates = frameState.layerStatesArray;
  const numLayers = layerStates.length;
  let i;
  for (i = numLayers - 1; i >= 0; --i) {
    const layerState = layerStates[i];
    const layer = layerState.layer;
    if (Layer.visibleAtResolution(layerState, viewState.resolution) &&
        layerFilter.call(thisArg, layer)) {
      const layerRenderer = /** @type {ol.renderer.webgl.Layer} */ (this.getLayerRenderer(layer));
      result = layerRenderer.forEachLayerAtPixel(
        pixel, frameState, callback, thisArg);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};
export default WebGLMapRenderer;
