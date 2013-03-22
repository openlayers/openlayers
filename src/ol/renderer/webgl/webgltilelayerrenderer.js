// FIXME large resolutions lead to too large framebuffers :-(
// FIXME animated shaders! check in redraw

goog.provide('ol.renderer.webgl.TileLayer');
goog.provide('ol.renderer.webgl.tilelayerrenderer');
goog.provide('ol.renderer.webgl.tilelayerrenderer.shader.Fragment');
goog.provide('ol.renderer.webgl.tilelayerrenderer.shader.Vertex');

goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.structs.PriorityQueue');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Vec4');
goog.require('goog.webgl');
goog.require('ol.Extent');
goog.require('ol.FrameState');
goog.require('ol.Size');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.layer.TileLayer');
goog.require('ol.renderer.webgl.FragmentShader');
goog.require('ol.renderer.webgl.Layer');
goog.require('ol.renderer.webgl.VertexShader');



/**
 * @constructor
 * @extends {ol.renderer.webgl.FragmentShader}
 */
ol.renderer.webgl.tilelayerrenderer.shader.Fragment = function() {
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
    ol.renderer.webgl.tilelayerrenderer.shader.Fragment,
    ol.renderer.webgl.FragmentShader);
goog.addSingletonGetter(ol.renderer.webgl.tilelayerrenderer.shader.Fragment);



/**
 * @constructor
 * @extends {ol.renderer.webgl.VertexShader}
 */
ol.renderer.webgl.tilelayerrenderer.shader.Vertex = function() {
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
    ol.renderer.webgl.tilelayerrenderer.shader.Vertex,
    ol.renderer.webgl.VertexShader);
goog.addSingletonGetter(ol.renderer.webgl.tilelayerrenderer.shader.Vertex);



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
      ol.renderer.webgl.tilelayerrenderer.shader.Fragment.getInstance();

  /**
   * @private
   * @type {ol.renderer.webgl.VertexShader}
   */
  this.vertexShader_ =
      ol.renderer.webgl.tilelayerrenderer.shader.Vertex.getInstance();

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
   * @type {!goog.vec.Mat4.Number}
   */
  this.texCoordMatrix_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.projectionMatrix_ = goog.vec.Mat4.createNumberIdentity();

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
 * @param {ol.FrameState} frameState Frame state.
 * @param {number} framebufferDimension Framebuffer dimension.
 * @private
 */
ol.renderer.webgl.TileLayer.prototype.bindFramebuffer_ =
    function(frameState, framebufferDimension) {

  var mapRenderer = this.getMapRenderer();
  var gl = mapRenderer.getGL();

  if (!goog.isDef(this.framebufferDimension_) ||
      this.framebufferDimension_ != framebufferDimension) {

    var map = this.getMap();
    frameState.postRenderFunctions.push(
        goog.partial(function(gl, framebuffer, texture) {
          if (!gl.isContextLost()) {
            gl.deleteFramebuffer(framebuffer);
            gl.deleteTexture(texture);
          }
        }, gl, this.framebuffer_, this.texture_));

    var texture = gl.createTexture();
    gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
    gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA,
        framebufferDimension, framebufferDimension, 0, goog.webgl.RGBA,
        goog.webgl.UNSIGNED_BYTE, null);
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
 * @inheritDoc
 */
ol.renderer.webgl.TileLayer.prototype.disposeInternal = function() {
  var mapRenderer = this.getMapRenderer();
  var gl = mapRenderer.getGL();
  if (!gl.isContextLost()) {
    gl.deleteBuffer(this.arrayBuffer_);
    gl.deleteFramebuffer(this.framebuffer_);
    gl.deleteTexture(this.texture_);
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.TileLayer.prototype.getTexCoordMatrix = function() {
  return this.texCoordMatrix_;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.TileLayer.prototype.getTexture = function() {
  return this.texture_;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.TileLayer.prototype.getProjectionMatrix = function() {
  return this.projectionMatrix_;
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
  this.locations_ = null;
  this.arrayBuffer_ = null;
  this.texture_ = null;
  this.framebuffer_ = null;
  this.framebufferDimension_ = undefined;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.TileLayer.prototype.renderFrame =
    function(frameState, layerState) {

  var mapRenderer = this.getMapRenderer();
  var gl = mapRenderer.getGL();

  var view2DState = frameState.view2DState;
  var projection = view2DState.projection;

  var tileLayer = this.getTileLayer();
  var tileSource = tileLayer.getTileSource();
  var tileSourceKey = goog.getUid(tileSource).toString();
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
    var framebufferDimension =
        Math.pow(2, Math.ceil(Math.log(maxDimension) / Math.log(2)));
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

    this.bindFramebuffer_(frameState, framebufferDimension);
    gl.viewport(0, 0, framebufferDimension, framebufferDimension);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(goog.webgl.COLOR_BUFFER_BIT);
    gl.disable(goog.webgl.BLEND);

    var program = mapRenderer.getProgram(
        this.fragmentShader_, this.vertexShader_);
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
    var deltaX, deltaY, priority, tile, tileCenter, tileCoord, tileState, x, y;
    for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

        tileCoord = new ol.TileCoord(z, x, y);
        tile = tileSource.getTile(tileCoord, tileGrid, projection);
        tileState = tile.getState();
        if (tileState == ol.TileState.IDLE) {
          this.updateWantedTiles(frameState.wantedTiles, tileSource, tileCoord);
          tileCenter = tileGrid.getTileCoordCenter(tileCoord);
          frameState.tileQueue.enqueue(tile, tileSourceKey, tileCenter);
        } else if (tileState == ol.TileState.LOADED) {
          if (mapRenderer.isTileTextureLoaded(tile)) {
            tilesToDrawByZ[z][tileCoord.toString()] = tile;
            continue;
          } else {
            tileCenter = tileGrid.getTileCoordCenter(tileCoord);
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
        tileGrid.forEachTileCoordParentTileRange(tileCoord, findLoadedTiles);

      }

    }

    /** @type {Array.<number>} */
    var zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
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
  tileSource.useLowResolutionTiles(z, extent, tileGrid);
  this.scheduleExpireCache(frameState, tileSource);

  goog.vec.Mat4.makeIdentity(this.texCoordMatrix_);
  goog.vec.Mat4.translate(this.texCoordMatrix_,
      (center.x - framebufferExtent.minX) /
          (framebufferExtent.maxX - framebufferExtent.minX),
      (center.y - framebufferExtent.minY) /
          (framebufferExtent.maxY - framebufferExtent.minY),
      0);
  goog.vec.Mat4.rotateZ(this.texCoordMatrix_, view2DState.rotation);
  goog.vec.Mat4.scale(this.texCoordMatrix_,
      frameState.size.width * view2DState.resolution /
          (framebufferExtent.maxX - framebufferExtent.minX),
      frameState.size.height * view2DState.resolution /
          (framebufferExtent.maxY - framebufferExtent.minY),
      1);
  goog.vec.Mat4.translate(this.texCoordMatrix_,
      -0.5,
      -0.5,
      0);

};
