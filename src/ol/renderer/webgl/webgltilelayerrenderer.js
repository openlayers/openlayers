// FIXME large resolutions lead to too large framebuffers :-(
// FIXME animated shaders! check in redraw

goog.provide('ol.renderer.webgl.TileLayer');
goog.provide('ol.renderer.webgl.tilelayer.shader');

goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.structs.PriorityQueue');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Vec4');
goog.require('goog.webgl');
goog.require('ol.Extent');
goog.require('ol.Size');
goog.require('ol.Tile');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.layer.TileLayer');
goog.require('ol.math');
goog.require('ol.renderer.webgl.FragmentShader');
goog.require('ol.renderer.webgl.Layer');
goog.require('ol.renderer.webgl.VertexShader');
goog.require('ol.structs.Buffer');



/**
 * @constructor
 * @extends {ol.renderer.webgl.FragmentShader}
 */
ol.renderer.webgl.tilelayer.shader.Fragment = function() {
  goog.base(this, [
    'precision mediump float;',
    '',
    'uniform sampler2D u_texture;',
    '',
    'varying vec2 v_texCoord;',
    '',
    'void main(void) {',
    ' gl_FragColor = texture2D(u_texture, v_texCoord);',
    '}'
  ].join('\n'));
};
goog.inherits(
    ol.renderer.webgl.tilelayer.shader.Fragment,
    ol.renderer.webgl.FragmentShader);
goog.addSingletonGetter(ol.renderer.webgl.tilelayer.shader.Fragment);



/**
 * @constructor
 * @extends {ol.renderer.webgl.VertexShader}
 */
ol.renderer.webgl.tilelayer.shader.Vertex = function() {
  goog.base(this, [
    'attribute vec2 a_position;',
    'attribute vec2 a_texCoord;',
    '',
    'varying vec2 v_texCoord;',
    '',
    'uniform vec4 u_tileOffset;',
    '',
    'void main(void) {',
    '  gl_Position.xy = a_position * u_tileOffset.xy + u_tileOffset.zw;',
    '  gl_Position.z = 0.;',
    '  gl_Position.w = 1.;',
    '  v_texCoord = a_texCoord;',
    '}'
  ].join('\n'));
};
goog.inherits(
    ol.renderer.webgl.tilelayer.shader.Vertex,
    ol.renderer.webgl.VertexShader);
goog.addSingletonGetter(ol.renderer.webgl.tilelayer.shader.Vertex);



/**
 * @constructor
 * @extends {ol.renderer.webgl.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.TileLayer} tileLayer Tile layer.
 */
ol.renderer.webgl.TileLayer = function(mapRenderer, tileLayer) {

  goog.base(this, mapRenderer, tileLayer);

  /**
   * @private
   * @type {ol.renderer.webgl.FragmentShader}
   */
  this.fragmentShader_ =
      ol.renderer.webgl.tilelayer.shader.Fragment.getInstance();

  /**
   * @private
   * @type {ol.renderer.webgl.VertexShader}
   */
  this.vertexShader_ = ol.renderer.webgl.tilelayer.shader.Vertex.getInstance();

  /**
   * @private
   * @type {{a_position: number,
   *         a_texCoord: number,
   *         u_tileOffset: WebGLUniformLocation,
   *         u_texture: WebGLUniformLocation}|null}
   */
  this.locations_ = null;

  /**
   * @private
   * @type {ol.structs.Buffer}
   */
  this.arrayBuffer_ = new ol.structs.Buffer([
    0, 0, 0, 1,
    1, 0, 1, 1,
    0, 1, 0, 0,
    1, 1, 1, 0
  ]);

  /**
   * @private
   * @type {ol.TileRange}
   */
  this.renderedTileRange_ = null;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.renderedFramebufferExtent_ = null;

};
goog.inherits(ol.renderer.webgl.TileLayer, ol.renderer.webgl.Layer);


/**
 * @inheritDoc
 */
ol.renderer.webgl.TileLayer.prototype.disposeInternal = function() {
  var mapRenderer = this.getWebGLMapRenderer();
  mapRenderer.deleteBuffer(this.arrayBuffer_);
  goog.base(this, 'disposeInternal');
};


/**
 * @return {ol.layer.TileLayer} Tile layer.
 */
ol.renderer.webgl.TileLayer.prototype.getTileLayer = function() {
  return /** @type {ol.layer.TileLayer} */ (this.getLayer());
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.TileLayer.prototype.handleWebGLContextLost = function() {
  goog.base(this, 'handleWebGLContextLost');
  this.locations_ = null;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.TileLayer.prototype.renderFrame =
    function(frameState, layerState) {

  var mapRenderer = this.getWebGLMapRenderer();
  var gl = mapRenderer.getGL();

  var view2DState = frameState.view2DState;
  var projection = view2DState.projection;

  var tileLayer = this.getTileLayer();
  var tileSource = tileLayer.getTileSource();
  var tileGrid = tileSource.getTileGrid();
  if (goog.isNull(tileGrid)) {
    tileGrid = ol.tilegrid.getForProjection(projection);
  }
  var z = tileGrid.getZForResolution(view2DState.resolution);
  var tileResolution = tileGrid.getResolution(z);
  var center = view2DState.center;
  var extent;
  if (tileResolution == view2DState.resolution) {
    center = this.snapCenterToPixel(center, tileResolution, frameState.size);
    extent = ol.Extent.getForView2DAndSize(
        center, tileResolution, view2DState.rotation, frameState.size);
  } else {
    extent = frameState.extent;
  }
  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      extent, tileResolution);

  var framebufferExtent;
  if (!goog.isNull(this.renderedTileRange_) &&
      this.renderedTileRange_.equals(tileRange)) {
    framebufferExtent = this.renderedFramebufferExtent_;
  } else {

    var tileRangeSize = tileRange.getSize();
    var tileSize = tileGrid.getTileSize(z);

    var maxDimension = Math.max(
        tileRangeSize.width * tileSize.width,
        tileRangeSize.height * tileSize.height);
    var framebufferDimension = ol.math.roundUpToPowerOfTwo(maxDimension);
    var framebufferExtentSize = new ol.Size(
        tileResolution * framebufferDimension,
        tileResolution * framebufferDimension);
    var origin = tileGrid.getOrigin(z);
    var minX = origin.x + tileRange.minX * tileSize.width * tileResolution;
    var minY = origin.y + tileRange.minY * tileSize.height * tileResolution;
    framebufferExtent = new ol.Extent(
        minX,
        minY,
        minX + framebufferExtentSize.width,
        minY + framebufferExtentSize.height);

    this.bindFramebuffer(frameState, framebufferDimension);
    gl.viewport(0, 0, framebufferDimension, framebufferDimension);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(goog.webgl.COLOR_BUFFER_BIT);
    gl.disable(goog.webgl.BLEND);

    var program = mapRenderer.getProgram(
        this.fragmentShader_, this.vertexShader_);
    gl.useProgram(program);
    if (goog.isNull(this.locations_)) {
      this.locations_ = {
        a_position: gl.getAttribLocation(program, 'a_position'),
        a_texCoord: gl.getAttribLocation(program, 'a_texCoord'),
        u_tileOffset: gl.getUniformLocation(program, 'u_tileOffset'),
        u_texture: gl.getUniformLocation(program, 'u_texture')
      };
    }

    mapRenderer.bindBuffer(goog.webgl.ARRAY_BUFFER, this.arrayBuffer_);
    gl.enableVertexAttribArray(this.locations_.a_position);
    gl.vertexAttribPointer(
        this.locations_.a_position, 2, goog.webgl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(this.locations_.a_texCoord);
    gl.vertexAttribPointer(
        this.locations_.a_texCoord, 2, goog.webgl.FLOAT, false, 16, 8);
    gl.uniform1i(this.locations_.u_texture, 0);

    /**
     * @type {Object.<number, Object.<string, ol.Tile>>}
     */
    var tilesToDrawByZ = {};
    tilesToDrawByZ[z] = {};

    var getTileIfLoaded = this.createGetTileIfLoadedFunction(function(tile) {
      return !goog.isNull(tile) && tile.getState() == ol.TileState.LOADED &&
          mapRenderer.isTileTextureLoaded(tile);
    }, tileSource, tileGrid, projection);
    var findLoadedTiles = goog.bind(tileSource.findLoadedTiles, tileSource,
        tilesToDrawByZ, getTileIfLoaded);

    var tilesToLoad = new goog.structs.PriorityQueue();

    var allTilesLoaded = true;
    var deltaX, deltaY, priority, tile, tileCenter, tileState, x, y;
    for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

        tile = tileSource.getTileZXY(z, x, y, tileGrid, projection);
        tileState = tile.getState();
        if (tileState == ol.TileState.LOADED) {
          if (mapRenderer.isTileTextureLoaded(tile)) {
            tilesToDrawByZ[z][tile.tileCoord.toString()] = tile;
            continue;
          } else {
            tileCenter = tileGrid.getTileCoordCenter(tile.tileCoord);
            deltaX = tileCenter.x - center.x;
            deltaY = tileCenter.y - center.y;
            priority = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            tilesToLoad.enqueue(priority, tile);
          }
        } else if (tileState == ol.TileState.ERROR ||
                   tileState == ol.TileState.EMPTY) {
          continue;
        }

        allTilesLoaded = false;
        tileGrid.forEachTileCoordParentTileRange(
            tile.tileCoord, findLoadedTiles);

      }

    }

    /** @type {Array.<number>} */
    var zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
    goog.array.sort(zs);
    var u_tileOffset = goog.vec.Vec4.createFloat32();
    goog.array.forEach(zs, function(z) {
      goog.object.forEach(tilesToDrawByZ[z], function(tile) {
        var tileExtent = tileGrid.getTileCoordExtent(tile.tileCoord);
        var sx = 2 * tileExtent.getWidth() / framebufferExtentSize.width;
        var sy = 2 * tileExtent.getHeight() / framebufferExtentSize.height;
        var tx = 2 * (tileExtent.minX - framebufferExtent.minX) /
            framebufferExtentSize.width - 1;
        var ty = 2 * (tileExtent.minY - framebufferExtent.minY) /
            framebufferExtentSize.height - 1;
        goog.vec.Vec4.setFromValues(u_tileOffset, sx, sy, tx, ty);
        gl.uniform4fv(this.locations_.u_tileOffset, u_tileOffset);
        mapRenderer.bindTileTexture(tile, goog.webgl.LINEAR, goog.webgl.LINEAR);
        gl.drawArrays(goog.webgl.TRIANGLE_STRIP, 0, 4);
      }, this);
    }, this);

    if (!tilesToLoad.isEmpty()) {
      frameState.postRenderFunctions.push(
          goog.partial(function(mapRenderer, tilesToLoad) {
            var i, tile;
            // FIXME determine a suitable number of textures to upload per frame
            for (i = 0; !tilesToLoad.isEmpty() && i < 4; ++i) {
              tile = /** @type {ol.Tile} */ (tilesToLoad.remove());
              mapRenderer.bindTileTexture(
                  tile, goog.webgl.LINEAR, goog.webgl.LINEAR);
            }
          }, mapRenderer, tilesToLoad));
    }

    if (allTilesLoaded) {
      this.renderedTileRange_ = tileRange;
      this.renderedFramebufferExtent_ = framebufferExtent;
    } else {
      this.renderedTileRange_ = null;
      this.renderedFramebufferExtent_ = null;
      frameState.animate = true;
    }

  }

  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
  this.manageTilePyramid(
      frameState, tileSource, tileGrid, projection, extent, z);
  this.scheduleExpireCache(frameState, tileSource);

  var texCoordMatrix = this.texCoordMatrix;
  goog.vec.Mat4.makeIdentity(texCoordMatrix);
  goog.vec.Mat4.translate(texCoordMatrix,
      (center.x - framebufferExtent.minX) /
          (framebufferExtent.maxX - framebufferExtent.minX),
      (center.y - framebufferExtent.minY) /
          (framebufferExtent.maxY - framebufferExtent.minY),
      0);
  goog.vec.Mat4.rotateZ(texCoordMatrix, view2DState.rotation);
  goog.vec.Mat4.scale(texCoordMatrix,
      frameState.size.width * view2DState.resolution /
          (framebufferExtent.maxX - framebufferExtent.minX),
      frameState.size.height * view2DState.resolution /
          (framebufferExtent.maxY - framebufferExtent.minY),
      1);
  goog.vec.Mat4.translate(texCoordMatrix,
      -0.5,
      -0.5,
      0);

};
