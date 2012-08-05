// FIXME large resolutions lead to too large framebuffers :-(
// FIXME animated shaders! check in redraw
// FIXME out-by-one error in texture alignment?

goog.provide('ol.webgl.TileLayerRenderer');
goog.provide('ol.webgl.tilelayerrenderer.shader.Fragment');
goog.provide('ol.webgl.tilelayerrenderer.shader.Vertex');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('goog.vec.Mat4');
goog.require('goog.webgl');
goog.require('ol.Coordinate');
goog.require('ol.Size');
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
    ' gl_FragColor = texture2D(uTexture, vTexCoord);',
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
    'uniform vec4 uTileOffset;',
    '',
    'void main(void) {',
    '  gl_Position.xy = aPosition * uTileOffset.xy + uTileOffset.zw;',
    '  gl_Position.z = 0.;',
    '  gl_Position.w = 1.;',
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
   *         uTileOffset: WebGLUniformLocation,
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
   * @type {WebGLFramebuffer}
   */
  this.framebuffer_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.framebufferDimension_ = undefined;

  /**
   * @private
   * @type {Object.<number, number>}
   */
  this.tileChangeListenerKeys_ = {};

  /**
   * @private
   * @type {goog.vec.Mat4.AnyType}
   */
  this.matrix_ = goog.vec.Mat4.createNumber();

};
goog.inherits(ol.webgl.TileLayerRenderer, ol.webgl.LayerRenderer);


/**
 * @protected
 */
ol.webgl.TileLayerRenderer.prototype.disposeInternal = function() {
  var gl = this.getGL();
  if (!gl.isContextLost()) {
    gl.deleteBuffer(this.arrayBuffer_);
    gl.deleteFramebuffer(this.framebuffer_);
    gl.deleteTexture(this.texture_);
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @param {number} framebufferDimension Framebuffer dimension.
 * @private
 */
ol.webgl.TileLayerRenderer.prototype.bindFramebuffer_ =
    function(framebufferDimension) {

  var gl = this.getGL();

  if (!goog.isDef(this.framebufferDimension_) ||
      this.framebufferDimension_ != framebufferDimension) {

    gl.deleteFramebuffer(this.framebuffer_);
    gl.deleteTexture(this.texture_);

    var texture = gl.createTexture();
    gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
    gl.texImage2D(goog.webgl.TEXTURE_2D, 0, gl.RGBA, framebufferDimension,
        framebufferDimension, 0, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE,
        null);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER,
        goog.webgl.LINEAR);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER,
        goog.webgl.LINEAR);

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(goog.webgl.FRAMEBUFFER,
        goog.webgl.COLOR_ATTACHMENT0, goog.webgl.TEXTURE_2D, texture, 0);

    this.texture_ = texture;
    this.framebuffer_ = framebuffer;
    this.framebufferDimension_ = framebufferDimension;

  } else {
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, this.framebuffer_);
  }

};


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
ol.webgl.TileLayerRenderer.prototype.getMatrix = function() {
  return this.matrix_;
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
ol.webgl.TileLayerRenderer.prototype.handleTileChange = function() {
  this.dispatchChangeEvent();
};


/**
 */
ol.webgl.TileLayerRenderer.prototype.handleWebGLContextLost = function() {
  this.locations_ = null;
  this.arrayBuffer_ = null;
  this.texture_ = null;
  this.framebuffer_ = null;
  this.framebufferDimension_ = undefined;
};


/**
 * @inheritDoc
 */
ol.webgl.TileLayerRenderer.prototype.render = function() {

  var gl = this.getGL();

  var map = this.getMap();
  goog.asserts.assert(map.isDef());
  var mapCenter = map.getCenter();
  var mapExtent = map.getExtent();
  var mapResolution = /** @type {number} */ map.getResolution();
  var mapRotatedExtent = map.getRotatedExtent();
  var mapRotation = map.getRotation();

  var tileLayer = this.getLayer();
  var tileStore = tileLayer.getStore();
  var tileGrid = tileStore.getTileGrid();
  var z = tileGrid.getZForResolution(mapResolution);
  var tileBounds = tileGrid.getTileBoundsForExtentAndResolution(
      mapRotatedExtent, mapResolution);
  var tileBoundsSize = tileBounds.getSize();
  var tileSize = tileGrid.getTileSize();

  var maxDimension = Math.max(
      tileBoundsSize.width * tileSize.width,
      tileBoundsSize.height * tileSize.height);
  // FIXME find a better algorithms for rounding up to the next power of two
  var framebufferDimension = Math.max(tileSize.width, tileSize.height);
  while (framebufferDimension < maxDimension) {
    framebufferDimension *= 2;
  }
  var nTilesX = framebufferDimension / tileSize.width;
  var nTilesY = framebufferDimension / tileSize.height;
  var framebufferTileBounds = new ol.TileBounds(
      tileBounds.minX,
      tileBounds.minY,
      tileBounds.minX + nTilesX - 1,
      tileBounds.minY + nTilesY - 1);
  goog.asserts.assert(framebufferTileBounds.containsTileBounds(tileBounds));
  var framebufferExtent =
      tileGrid.getTileBoundsExtent(z, framebufferTileBounds);
  var framebufferExtentSize = framebufferExtent.getSize();

  this.bindFramebuffer_(framebufferDimension);
  gl.viewport(0, 0, framebufferDimension, framebufferDimension);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(goog.webgl.COLOR_BUFFER_BIT);
  gl.disable(goog.webgl.BLEND);

  var program = map.getProgram(this.fragmentShader_, this.vertexShader_);
  gl.useProgram(program);
  if (goog.isNull(this.locations_)) {
    this.locations_ = {
      aPosition: gl.getAttribLocation(program, 'aPosition'),
      aTexCoord: gl.getAttribLocation(program, 'aTexCoord'),
      uTileOffset: gl.getUniformLocation(program, 'uTileOffset'),
      uTexture: gl.getUniformLocation(program, 'uTexture')
    };
  }

  if (goog.isNull(this.arrayBuffer_)) {
    var arrayBuffer = gl.createBuffer();
    gl.bindBuffer(goog.webgl.ARRAY_BUFFER, arrayBuffer);
    gl.bufferData(goog.webgl.ARRAY_BUFFER, new Float32Array([
      0, 0, 0, 1,
      1, 0, 1, 1,
      0, 1, 0, 0,
      1, 1, 1, 0
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

  /**
   * @type {Object.<number, Object.<string, ol.TileCoord>>}
   */
  var tilesToDrawByZ = {};

  tilesToDrawByZ[z] = {};
  tileBounds.forEachTileCoord(z, function(tileCoord) {
    var tile = tileStore.getTile(tileCoord);
    if (goog.isNull(tile)) {
    } else if (tile.isLoaded()) {
      tilesToDrawByZ[z][tileCoord.toString()] = tile;
    } else {
      var tileKey = goog.getUid(tile);
      if (!(tileKey in this.tileChangeListenerKeys_)) {
        tile.load();
        // FIXME will need to handle aborts as well
        this.tileChangeListenerKeys_[tileKey] = goog.events.listen(tile,
            goog.events.EventType.CHANGE, this.handleTileChange, false, this);
      }
      // FIXME this could be more efficient about filling partial holes
      tileGrid.forEachTileCoordParentTileBounds(
          tileCoord,
          function(z, tileBounds) {
            var fullyCovered = true;
            tileBounds.forEachTileCoord(z, function(tileCoord) {
              var tileCoordKey = tileCoord.toString();
              if (tilesToDrawByZ[z] && tilesToDrawByZ[z][tileCoordKey]) {
                return;
              }
              var tile = tileStore.getTile(tileCoord);
              if (!goog.isNull(tile) && tile.isLoaded()) {
                if (!tilesToDrawByZ[z]) {
                  tilesToDrawByZ[z] = {};
                }
                tilesToDrawByZ[z][tileCoordKey] = tile;
              } else {
                fullyCovered = false;
              }
            });
            return fullyCovered;
          });
    }
  }, this);

  var zs = goog.object.getKeys(tilesToDrawByZ);
  goog.array.sort(zs);
  var uTileOffset = goog.vec.Vec4.createFloat32();
  goog.array.forEach(zs, function(z) {
    goog.object.forEach(tilesToDrawByZ[z], function(tile) {
      var tileExtent = tileGrid.getTileCoordExtent(tile.tileCoord);
      var sx = 2 * tileExtent.getWidth() / framebufferExtentSize.width;
      var sy = 2 * tileExtent.getHeight() / framebufferExtentSize.height;
      var tx = 2 * (tileExtent.minX - framebufferExtent.minX) /
          framebufferExtentSize.width - 1;
      var ty = 2 * (tileExtent.minY - framebufferExtent.minY) /
          framebufferExtentSize.height - 1;
      goog.vec.Vec4.setFromValues(uTileOffset, sx, sy, tx, ty);
      gl.uniform4fv(this.locations_.uTileOffset, uTileOffset);
      map.bindImageTexture(
          tile.getImage(), goog.webgl.LINEAR, goog.webgl.LINEAR);
      gl.drawArrays(goog.webgl.TRIANGLE_STRIP, 0, 4);
    }, this);
  }, this);

  goog.vec.Mat4.makeIdentity(this.matrix_);
  goog.vec.Mat4.translate(this.matrix_,
      (mapCenter.x - framebufferExtent.minX) /
          (framebufferExtent.maxX - framebufferExtent.minX),
      (mapCenter.y - framebufferExtent.minY) /
          (framebufferExtent.maxY - framebufferExtent.minY),
      0);
  goog.vec.Mat4.scale(this.matrix_,
      (mapExtent.maxX - mapExtent.minX) /
          (framebufferExtent.maxX - framebufferExtent.minX),
      (mapExtent.maxY - mapExtent.minY) /
          (framebufferExtent.maxY - framebufferExtent.minY),
      1);
  if (goog.isDef(mapRotation)) {
    goog.vec.Mat4.rotate(this.matrix_,
        mapRotation,
        0,
        0,
        1);
  }
  goog.vec.Mat4.translate(this.matrix_,
      -0.5,
      -0.5,
      0);

};
