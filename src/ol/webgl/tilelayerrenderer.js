goog.provide('ol.webgl.TileLayerRenderer');
goog.provide('ol.webgl.tilelayerrenderer.shader');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.vec.Mat4');
goog.require('goog.webgl');
goog.require('ol.TileLayer');
goog.require('ol.webgl.LayerRenderer');
goog.require('ol.webgl.shader.Fragment');
goog.require('ol.webgl.shader.Vertex');



/**
 * @constructor
 * @extends {ol.webgl.shader.Fragment}
 */
ol.webgl.tilelayerrenderer.shader.Fragment = function() {
  goog.base(this, [
    'precision mediump float;',
    '',
    'uniform sampler2D uTexture;',
    '',
    'varying vec2 vTexCoord;',
    '',
    'void main(void) {',
    ' gl_FragColor = vec4(texture2D(uTexture, vTexCoord).rgb, 1.);',
    '}'
  ].join('\n'));
};
goog.inherits(
    ol.webgl.tilelayerrenderer.shader.Fragment, ol.webgl.shader.Fragment);
goog.addSingletonGetter(ol.webgl.tilelayerrenderer.shader.Fragment);



/**
 * @constructor
 * @extends {ol.webgl.shader.Vertex}
 */
ol.webgl.tilelayerrenderer.shader.Vertex = function() {
  goog.base(this, [
    'attribute vec2 aPosition;',
    'attribute vec2 aTexCoord;',
    '',
    'varying vec2 vTexCoord;',
    '',
    'uniform mat4 uMatrix;',
    '',
    'void main(void) {',
    '  gl_Position = uMatrix * vec4(aPosition, 0., 1.);',
    '  vTexCoord = aTexCoord;',
    '}'
  ].join('\n'));
};
goog.inherits(
    ol.webgl.tilelayerrenderer.shader.Vertex, ol.webgl.shader.Vertex);
goog.addSingletonGetter(ol.webgl.tilelayerrenderer.shader.Vertex);



/**
 * @constructor
 * @extends {ol.webgl.LayerRenderer}
 * @param {ol.webgl.Map} map Map.
 * @param {ol.TileLayer} tileLayer Tile layer.
 */
ol.webgl.TileLayerRenderer = function(map, tileLayer) {

  goog.base(this, map, tileLayer);

  /**
   * @private
   * @type {ol.webgl.shader.Fragment}
   */
  this.fragmentShader_ =
      ol.webgl.tilelayerrenderer.shader.Fragment.getInstance();

  /**
   * @private
   * @type {ol.webgl.shader.Vertex}
   */
  this.vertexShader_ = ol.webgl.tilelayerrenderer.shader.Vertex.getInstance();

  /**
   * @private
   * @type {{aPosition: number,
   *         aTexCoord: number,
   *         uMatrix: WebGLUniformLocation,
   *         uTexture: WebGLUniformLocation}|null}
   */
  this.locations_ = null;

  /**
   * @private
   * @type {WebGLBuffer}
   */
  this.arrayBuffer_ = null;

  /**
   * @private
   * @type {WebGLTexture}
   */
  this.texture_ = null;

  /**
   * @private
   * @type {WebGLRenderbuffer}
   */
  this.renderbuffer_ = null;

  /**
   * @private
   * @type {WebGLFramebuffer}
   */
  this.framebuffer_ = null;

  /**
   * @private
   * @type {goog.math.Size}
   */
  this.framebufferSize_ = null;

  /**
   * @private
   * @type {Object.<number, number>}
   */
  this.tileChangeListenerKeys_ = {};

  /**
   * @private
   * @type {goog.vec.Mat4.AnyType}
   */
  this.matrix_ = goog.vec.Mat4.createFloat32();

};
goog.inherits(ol.webgl.TileLayerRenderer, ol.webgl.LayerRenderer);


/**
 * @return {ol.TileLayer} Layer.
 * @override
 */
ol.webgl.TileLayerRenderer.prototype.getLayer = function() {
  return /** @type {ol.TileLayer} */ goog.base(this, 'getLayer');
};


/**
 * @inheritDoc
 */
ol.webgl.TileLayerRenderer.prototype.getTexture = function() {
  return this.texture_;
};


/**
 * @protected
 */
ol.webgl.TileLayerRenderer.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @protected
 */
ol.webgl.TileLayerRenderer.prototype.disposeInternal = function() {
  var gl = this.getGL();
  if (!gl.isContextLost()) {
    gl.deleteBuffer(this.arrayBuffer_);
    gl.deleteFramebuffer(this.framebuffer_);
    gl.deleteRenderbuffer(this.renderbuffer_);
    gl.deleteTexture(this.texture_);
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
ol.webgl.TileLayerRenderer.prototype.getMatrix = function() {
  return this.matrix_;
};


/**
 */
ol.webgl.TileLayerRenderer.prototype.handleWebGLContextLost = function() {
  this.locations_ = null;
  this.arrayBuffer_ = null;
  this.texture_ = null;
  this.renderbuffer_ = null;
  this.framebuffer_ = null;
  this.framebufferSize_ = null;
};


/**
 * @protected
 */
ol.webgl.TileLayerRenderer.prototype.handleTileChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.webgl.TileLayerRenderer.prototype.redraw = function() {

  var gl = this.getGL();

  var map = this.getMap();
  var center = /** @type {!goog.math.Coordinate} */ map.getCenter();
  var extent = /** @type {!ol.Extent} */ map.getExtent();
  var resolution = /** @type {number} */ map.getResolution();

  var tileLayer = this.getLayer();
  var tileStore = tileLayer.getStore();
  var tileGrid = tileStore.getTileGrid();
  var z = tileGrid.getZForResolution(resolution);
  var tileBounds = tileGrid.getExtentTileBounds(z, extent);
  var tileBoundsSize = tileBounds.getSize();
  var tileSize = tileGrid.getTileSize();

  var framebufferSize = new goog.math.Size(
      tileSize.width * tileBoundsSize.width,
      tileSize.height * tileBoundsSize.height);

  if (goog.isNull(this.framebufferSize_) ||
      !goog.math.Size.equals(this.framebufferSize_, framebufferSize)) {

    gl.deleteFramebuffer(this.framebuffer_);
    gl.deleteRenderbuffer(this.renderbuffer_);
    gl.deleteTexture(this.texture_);

    var texture = gl.createTexture();
    gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
    gl.texImage2D(goog.webgl.TEXTURE_2D, 0, gl.RGBA, framebufferSize.width,
        framebufferSize.height, 0, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE,
        null);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER,
        goog.webgl.LINEAR);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER,
        goog.webgl.LINEAR);

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(goog.webgl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(goog.webgl.RENDERBUFFER,
        goog.webgl.DEPTH_COMPONENT16, framebufferSize.width,
        framebufferSize.height);

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(goog.webgl.FRAMEBUFFER,
        goog.webgl.COLOR_ATTACHMENT0, goog.webgl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(goog.webgl.FRAMEBUFFER,
        goog.webgl.DEPTH_ATTACHMENT, goog.webgl.RENDERBUFFER, renderbuffer);

    this.texture_ = texture;
    this.renderbuffer_ = renderbuffer;
    this.framebuffer_ = framebuffer;
    this.framebufferSize_ = framebufferSize;

  } else {
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, this.framebuffer_);
  }

  gl.disable(goog.webgl.BLEND);

  var program = map.getProgram(this.fragmentShader_, this.vertexShader_);
  gl.useProgram(program);
  if (goog.isNull(this.locations_)) {
    this.locations_ = {
      aPosition: gl.getAttribLocation(program, 'aPosition'),
      aTexCoord: gl.getAttribLocation(program, 'aTexCoord'),
      uMatrix: gl.getUniformLocation(program, 'uMatrix'),
      uTexture: gl.getUniformLocation(program, 'uTexture')
    };
  }

  if (goog.isNull(this.arrayBuffer_)) {
    var arrayBuffer = gl.createBuffer();
    gl.bindBuffer(goog.webgl.ARRAY_BUFFER, arrayBuffer);
    var textureOffsetX = 0.5 / tileSize.width;
    var textureOffsetY = 0.5 / tileSize.height;
    gl.bufferData(goog.webgl.ARRAY_BUFFER, new Float32Array([
      0, 0, 0 + textureOffsetX, 1 + textureOffsetY,
      1, 0, 1 + textureOffsetX, 1 + textureOffsetY,
      0, 1, 0 + textureOffsetX, 0 + textureOffsetY,
      1, 1, 1 + textureOffsetX, 0 + textureOffsetY
    ]), goog.webgl.STATIC_DRAW);
    this.arrayBuffer_ = arrayBuffer;
  } else {
    gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.arrayBuffer_);
  }

  gl.enableVertexAttribArray(this.locations_.aPosition);
  gl.vertexAttribPointer(
      this.locations_.aPosition, 2, goog.webgl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(this.locations_.aTexCoord);
  gl.vertexAttribPointer(
      this.locations_.aTexCoord, 2, goog.webgl.FLOAT, false, 16, 8);
  gl.uniform1i(this.locations_.uTexture, 0);

  tileBounds.forEachTileCoord(z, function(tileCoord) {
    var tile = tileStore.getTile(tileCoord);
    if (goog.isNull(tile)) {
    } else if (tile.isLoaded()) {
      var uMatrix = goog.vec.Mat4.createFloat32Identity();
      goog.vec.Mat4.translate(uMatrix,
          2 * (tileCoord.x - tileBounds.minX) / tileBoundsSize.width - 1,
          2 * (tileCoord.y - tileBounds.minY) / tileBoundsSize.height - 1,
          0);
      goog.vec.Mat4.scale(uMatrix,
          2 / tileBoundsSize.width,
          2 / tileBoundsSize.height,
          1);
      gl.uniformMatrix4fv(this.locations_.uMatrix, false, uMatrix);
      gl.bindTexture(goog.webgl.TEXTURE_2D, map.getTileTexture(tile));
      gl.activeTexture(goog.webgl.TEXTURE0);
      gl.drawArrays(goog.webgl.TRIANGLE_STRIP, 0, 4);
    } else {
      var key = goog.getUid(tile);
      if (!(key in this.tileChangeListenerKeys_)) {
        tile.load();
        // FIXME will need to handle aborts as well
        this.tileChangeListenerKeys_[key] = goog.events.listen(tile,
            goog.events.EventType.CHANGE, this.handleTileChange, false, this);
      }
    }
    return false;
  }, this);

};


/**
 * @inheritDoc
 */
ol.webgl.TileLayerRenderer.prototype.handleLayerOpacityChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.webgl.TileLayerRenderer.prototype.handleLayerVisibleChange = function() {
  this.dispatchChangeEvent();
};
