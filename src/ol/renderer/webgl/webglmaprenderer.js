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
goog.require('ol.renderer.Map');
goog.require('ol.renderer.webgl.ImageLayer');
goog.require('ol.renderer.webgl.TileLayer');
goog.require('ol.renderer.webgl.map.shader.Color');
goog.require('ol.renderer.webgl.map.shader.Default');
goog.require('ol.source.State');
goog.require('ol.structs.Buffer');
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
    stencil: false
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
   * @type {ol.renderer.webgl.map.shader.Color.Locations}
   */
  this.colorLocations_ = null;

  /**
   * @private
   * @type {ol.renderer.webgl.map.shader.Default.Locations}
   */
  this.defaultLocations_ = null;

  /**
   * @private
   * @type {ol.structs.Buffer}
   */
  this.arrayBuffer_ = new ol.structs.Buffer([
    -1, -1, 0, 0,
    1, -1, 1, 0,
    -1, 1, 0, 1,
    1, 1, 1, 1
  ]);

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
   * @type {ol.structs.PriorityQueue}
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
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.getCanvas = function() {
  return this.canvas_;
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
 * @return {ol.structs.PriorityQueue} Tile texture queue.
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
  this.colorLocations_ = null;
  this.defaultLocations_ = null;
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

  var layersArray = frameState.layersArray;
  var viewResolution = frameState.view2DState.resolution;
  var i, ii, layer, layerRenderer, layerState;
  for (i = 0, ii = layersArray.length; i < ii; ++i) {
    layer = layersArray[i];
    layerRenderer = this.getLayerRenderer(layer);
    layerState = frameState.layerStates[goog.getUid(layer)];
    if (layerState.visible &&
        layerState.sourceState == ol.source.State.READY &&
        viewResolution < layerState.maxResolution &&
        viewResolution >= layerState.minResolution) {
      layerRenderer.renderFrame(frameState, layerState);
    }
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

  context.bindBuffer(goog.webgl.ARRAY_BUFFER, this.arrayBuffer_);

  var currentProgram = null;
  var locations;
  for (i = 0, ii = layersArray.length; i < ii; ++i) {
    layer = layersArray[i];
    layerState = frameState.layerStates[goog.getUid(layer)];
    if (!layerState.visible ||
        layerState.sourceState != ol.source.State.READY ||
        viewResolution >= layerState.maxResolution ||
        viewResolution < layerState.minResolution) {
      continue;
    }
    var useColor =
        layerState.brightness ||
        layerState.contrast != 1 ||
        layerState.hue ||
        layerState.saturation != 1;

    var fragmentShader, vertexShader;
    if (useColor) {
      fragmentShader = ol.renderer.webgl.map.shader.ColorFragment.getInstance();
      vertexShader = ol.renderer.webgl.map.shader.ColorVertex.getInstance();
    } else {
      fragmentShader =
          ol.renderer.webgl.map.shader.DefaultFragment.getInstance();
      vertexShader = ol.renderer.webgl.map.shader.DefaultVertex.getInstance();
    }

    var program = context.getProgram(fragmentShader, vertexShader);
    if (program != currentProgram) {

      gl.useProgram(program);
      currentProgram = program;

      if (useColor) {
        if (goog.isNull(this.colorLocations_)) {
          locations =
              new ol.renderer.webgl.map.shader.Color.Locations(gl, program);
          this.colorLocations_ = locations;
        } else {
          locations = this.colorLocations_;
        }
      } else {
        if (goog.isNull(this.defaultLocations_)) {
          locations =
              new ol.renderer.webgl.map.shader.Default.Locations(gl, program);
          this.defaultLocations_ = locations;
        } else {
          locations = this.defaultLocations_;
        }
      }

      gl.enableVertexAttribArray(locations.a_position);
      gl.vertexAttribPointer(
          locations.a_position, 2, goog.webgl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(locations.a_texCoord);
      gl.vertexAttribPointer(
          locations.a_texCoord, 2, goog.webgl.FLOAT, false, 16, 8);
      gl.uniform1i(locations.u_texture, 0);

    }

    layerRenderer = this.getLayerRenderer(layer);
    gl.uniformMatrix4fv(
        locations.u_texCoordMatrix, false, layerRenderer.getTexCoordMatrix());
    gl.uniformMatrix4fv(locations.u_projectionMatrix, false,
        layerRenderer.getProjectionMatrix());
    if (useColor) {
      gl.uniformMatrix4fv(locations.u_colorMatrix, false,
          layerRenderer.getColorMatrix(
              layerState.brightness,
              layerState.contrast,
              layerState.hue,
              layerState.saturation
          ));
    }
    gl.uniform1f(locations.u_opacity, layerState.opacity);
    gl.bindTexture(goog.webgl.TEXTURE_2D, layerRenderer.getTexture());
    gl.drawArrays(goog.webgl.TRIANGLE_STRIP, 0, 4);

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

  this.scheduleRemoveUnusedLayerRenderers(frameState);

};
