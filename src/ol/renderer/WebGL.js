/**
 * @fileoverview WebGL based MapRenderer drawing all the supplied layers in OpenGL
 */

goog.provide('ol.renderer.WebGL');

goog.require('ol.renderer.MapRenderer');
goog.require('ol.layer.Layer');
goog.require('ol.Loc');

goog.require('goog.events');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('goog.webgl');

/**
 * Initialization of the native WebGL renderer (canvas, context, layers)
 * @constructor
 * @param {!Element} container
 * @extends {ol.renderer.MapRenderer}
 */
ol.renderer.WebGL = function(container) {

    /**
     * @private
     * @type {!Element}
     */
    this.canvas_ = goog.dom.createDom('canvas', 'ol-renderer-webgl-canvas'); // Suppose to have: style: 'width:100%;height:100%;'

    /**
     * @private
     * @type {WebGLRenderingContext}
     */
    this.gl_ = (this.canvas_.getContext('experimental-webgl', {
        'alpha': false,
        'depth': false,
        'antialias': true,
        'stencil': false,
        'preserveDrawingBuffer': false
    }));
    goog.asserts.assert(!goog.isNull(this.gl_), "The WebGL is not supported on your browser. Check http://get.webgl.org/");

    goog.dom.append(container, this.canvas_);

    goog.base(this, container);

    /**
     * @private
     * @type {Object.<string, WebGLTexture>}
     */
    this.textureCache_ = {};

    var gl = this.gl_;

    var clearColor = [0, 0, 0]; // hardcoded background color
    gl.clearColor(clearColor[0], clearColor[1], clearColor[2], 1);
    gl.disable(goog.webgl.DEPTH_TEST);
    gl.disable(goog.webgl.SCISSOR_TEST);
    gl.disable(goog.webgl.CULL_FACE);

    var fragmentShader = gl.createShader(goog.webgl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, [
        'precision mediump float;',
        '',
        'uniform sampler2D uTexture;',
        '',
        'varying vec2 vTexCoord;',
        '',
        'void main(void) {',
        '  gl_FragColor = vec4(vec3(texture2D(uTexture, vTexCoord)), 1.);',
        '}'
    ].join('\n'));
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, goog.webgl.COMPILE_STATUS)) {
        window.console.log(gl.getShaderInfoLog(fragmentShader));
        goog.asserts.assert(gl.getShaderParameter(fragmentShader, goog.webgl.COMPILE_STATUS));
    }

    var vertexShader = gl.createShader(goog.webgl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, [
        'attribute vec2 aPosition;',
        'attribute vec2 aTexCoord;',
        '',
        'uniform mat4 uMVPMatrix;',
        '',
        'varying vec2 vTexCoord;',
        '',
        'void main(void) {',
        '  gl_Position = uMVPMatrix * vec4(aPosition, 0.0, 1.0);',
        '  vTexCoord = aTexCoord;',
        '}'
    ].join('\n'));
    if (!gl.getShaderParameter(vertexShader, goog.webgl.COMPILE_STATUS)) {
        window.console.log(gl.getShaderInfoLog(vertexShader));
        goog.asserts.assert(gl.getShaderParameter(vertexShader, goog.webgl.COMPILE_STATUS));
    }

    var program = gl.createProgram();
    gl.attachShader(program, fragmentShader);
    gl.attachShader(program, vertexShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, goog.webgl.LINK_STATUS)) {
        window.console.log(gl.getProgramInfoLog(program));
        goog.asserts.assert(gl.getProgramParameter(program, goog.webgl.LINK_STATUS));
    }

    this.mvpMatrixLocation_ = gl.getUniformLocation(program, 'uMVPMatrix');
    this.textureLocation_ = gl.getUniformLocation(program, 'uTexture');

    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(goog.webgl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(goog.webgl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), goog.webgl.STATIC_DRAW);
    var texCoordLocation = gl.getAttributeLocation(program, 'aTexCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, goog.webgl.FLOAT, false, 0, 0);
    gl.bindBuffer(goog.webgl.ARRAY_BUFFER, null);

    this.positionLocation_ = gl.getAttributeLocation(program, 'aPosition');
    gl.enableVertexAttribArray(this.positionLocation_);
    this.positionBuffer_ = gl.createBuffer();

};

goog.inherits(ol.renderer.WebGL, ol.renderer.MapRenderer);


/**
 * Determine if this renderer type is supported in this environment.
 * A static method.
 * @returns {boolean} This renderer is supported.
 */
ol.renderer.WebGL.isSupported = function() {
    return !goog.isNull( goog.dom.createDom('canvas').getContext('experimental-webgl') );
};


/**
 * @param {ol.Tile} tile Tile.
 * @protected
 */
ol.renderer.WebGL.prototype.bindTexture = function(tile) {
    var gl = this.gl_;
    var url = tile.getUrl();
    if (url in this.textureCache_) {
        gl.bindTexture(gl.TEXTURE_2D, this.textureCache_[url]);
    } else {
        var texture = gl.createTexture();
        gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
        gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE, tile.getImg());
        gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER, goog.webgl.LINEAR);
        gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER, goog.webgl.LINEAR);
        this.textureCache_[url] = texture;
    }
};


/**
 * @param {ol.Tile} tile Tile.
 * @protected
 */
ol.renderer.WebGL.prototype.handleTileLoad = function(tile) {
    this.redraw();
};


/**
 * @param {ol.Tile} tile Tile.
 * @protected
 */
ol.renderer.WebGL.prototype.handleTileDestroy = function(tile) {
    var gl = this.gl_;
    var url = tile.getUrl();
    if (url in this.textureCache_) {
        gl.deleteTexture(this.textureCache_[url]);
        delete this.textureCache_[url];
    }
};


/**
 * @inheritDoc
 */
ol.renderer.WebGL.prototype.draw = function(layers, center, resolution, animate) {

    var gl = this.gl_;

    var width = this.canvas_.width;
    var height = this.canvas_.height;

    var bounds = new ol.Bounds(
            center.getX() - width * resolution / 2,
            center.getY() - height * resolution / 2,
            center.getX() + width * resolution / 2,
            center.getY() + height * resolution / 2,
            center.getProjection());

    /** @type {goog.vec.Mat4.Type} */
    var cameraMatrix;
    goog.vec.Mat4.makeIdentity(cameraMatrix);
    goog.vec.Mat4.scale(cameraMatrix, resolution, resolution, 1);
    goog.vec.Mat4.translate(cameraMatrix, -center.getX(), -center.getY(), 0);

    /** @type {goog.vec.Mat4.Type} */
    var positionToViewportMatrix;
    goog.vec.Mat4.makeIdentity(positionToViewportMatrix);
    goog.vec.Mat4.scale(positionToViewportMatrix, 1 / width, 1 / height, 1);
    goog.vec.Mat4.multMat(positionToViewportMatrix, cameraMatrix, positionToViewportMatrix);

    /** @type {goog.vec.Mat4.Type} */
    var viewportToPositionMatrix;
    var inverted = goog.vec.Mat4.invert(positionToViewportMatrix, viewportToPositionMatrix);
    goog.asserts.assert(inverted);

    /** @type {goog.vec.Mat4.Type} */
    var targetPixelToPositionMatrix;
    goog.vec.Mat4.makeIdentity(targetPixelToPositionMatrix);
    goog.vec.Mat4.translate(targetPixelToPositionMatrix, -1, 1, 0);
    goog.vec.Mat4.scale(targetPixelToPositionMatrix, 2 / width, -2 / height, 1);
    goog.vec.Mat4.multMat(viewportToPositionMatrix, targetPixelToPositionMatrix, targetPixelToPositionMatrix);

    gl.clear(goog.webgl.COLOR_BUFFER_BIT);
    gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.positionBuffer_);
    gl.uniform1i(this.textureLocation_, 0);
    gl.uniformMatrix4fv(this.positionLocation_, false, positionToViewportMatrix);

    goog.array.forEach(layers, function(layer) {
        if (!(layer instanceof ol.layer.TileLayer)) {
            return;
        }
        var tileLayer = /** @type {ol.layer.TileLayer} */ (layer);
        var tileSet = layer.getData(bounds, resolution);
        var tiles = tileSet.getTiles();
        var i, j, row, tile, tileBounds, positions, texture;
        for (i = 0; i < tiles.length; ++i) {
            row = tiles[i];
            for (j = 0; j < row.length; ++j) {
                tile = row[j];
                if (!tile.isLoaded()) {
                    if (!tile.isLoading()) {
                        goog.events.listen(tile, 'load', this.handleTileLoad,
                                           undefined, this);
                        goog.events.listen(tile, 'destroy', this.handleTileDestroy,
                                           undefined, this);
                        tile.load();
                    }
                    continue;
                }
                tileBounds = tile.getBounds();
                positions = [
                    tileBounds.getMinX(), tileBounds.getMinY(),
                    tileBounds.getMaxX(), tileBounds.getMinY(),
                    tileBounds.getMinX(), tileBounds.getMaxY(),
                    tileBounds.getMaxX(), tileBounds.getMaxY()
                ];
                gl.bufferData(goog.webgl.ARRAY_BUFFER, new Float32Array(positions), goog.webgl.DYNAMIC_DRAW);
                gl.vertexAttribPointer(this.positionLocation_, 2, goog.webgl.FLOAT, false, 0, 0);
                this.bindTexture(tile);
                gl.drawArrays(goog.webgl.TRIANGLES, 0, 4);
            }
        }
    }, this);

    this.renderedLayers_ = layers;
    this.renderedCenter_ = center;
    this.renderedResolution_ = resolution;
    this.renderedAnimate_ = animate;

};


/**
 */
ol.renderer.WebGL.prototype.redraw = function() {
    this.draw(this.renderedLayers_, this.renderedCenter_, this.renderedResolution_, this.renderedAnimate_);
};
