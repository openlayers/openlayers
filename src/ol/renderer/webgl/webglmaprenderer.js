// FIXME clear textureCache
// FIXME defer texture loads until after render when animating
// FIXME generational tile texture garbage collector newFrame/get
// FIXME defer cleanup until post-render
// FIXME check against gl.getParameter(webgl.MAX_TEXTURE_SIZE)

goog.provide('ol.renderer.webgl.Map');
goog.provide('ol.renderer.webgl.map.shader');

goog.require('goog.debug.Logger');
goog.require('goog.dispose');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('goog.style');
goog.require('goog.vec.Mat4');
goog.require('goog.webgl');
goog.require('ol.layer.Layer');
goog.require('ol.layer.TileLayer');
goog.require('ol.renderer.webgl.FragmentShader');
goog.require('ol.renderer.webgl.TileLayer');
goog.require('ol.renderer.webgl.VertexShader');
goog.require('ol.webgl');
goog.require('ol.webgl.WebGLContextEventType');


/**
 * @typedef {{magFilter: number, minFilter: number, texture: WebGLTexture}}
 */
ol.renderer.webgl.TextureCacheEntry;



/**
 * @constructor
 * @extends {ol.renderer.webgl.FragmentShader}
 * @see https://svn.webkit.org/repository/webkit/trunk/Source/WebCore/platform/graphics/filters/skia/SkiaImageFilterBuilder.cpp
 */
ol.renderer.webgl.map.shader.Fragment = function() {
  goog.base(this, [
    'precision mediump float;',
    '',
    'uniform mat4 uColorMatrix;',
    'uniform float uOpacity;',
    'uniform mat4 uMatrix;',
    'uniform sampler2D uTexture;',
    '',
    'varying vec2 vTexCoord;',
    '',
    'void main(void) {',
    '',
    '  vec4 texCoord = uMatrix * vec4(vTexCoord, 0., 1.);',
    '  vec4 texColor = texture2D(uTexture, texCoord.st);',
    '  vec4 color = uColorMatrix * vec4(texColor.rgb, 1.);',
    '  color.a = texColor.a * uOpacity;',
    '',
    '  gl_FragColor = color;',
    '',
    '}'
  ].join('\n'));
};
goog.inherits(
    ol.renderer.webgl.map.shader.Fragment, ol.renderer.webgl.FragmentShader);
goog.addSingletonGetter(ol.renderer.webgl.map.shader.Fragment);



/**
 * @constructor
 * @extends {ol.renderer.webgl.VertexShader}
 */
ol.renderer.webgl.map.shader.Vertex = function() {
  goog.base(this, [
    'attribute vec2 aPosition;',
    'attribute vec2 aTexCoord;',
    '',
    'varying vec2 vTexCoord;',
    '',
    'void main(void) {',
    '  gl_Position = vec4(aPosition, 0., 1.);',
    '  vTexCoord = aTexCoord;',
    '}'
  ].join('\n'));
};
goog.inherits(
    ol.renderer.webgl.map.shader.Vertex, ol.renderer.webgl.VertexShader);
goog.addSingletonGetter(ol.renderer.webgl.map.shader.Vertex);



/**
 * @constructor
 * @extends {ol.renderer.Map}
 * @param {Element} container Container.
 * @param {ol.Map} map Map.
 */
ol.renderer.webgl.Map = function(container, map) {

  goog.base(this, container, map);

  if (goog.DEBUG) {
    /**
     * @inheritDoc
     */
    this.logger = goog.debug.Logger.getLogger(
        'ol.renderer.webgl.maprenderer.' + goog.getUid(this));
  }

  /**
   * @private
   * @type {Element}
   */
  this.canvas_ = goog.dom.createElement(goog.dom.TagName.CANVAS);
  this.canvas_.height = container.clientHeight;
  this.canvas_.width = container.clientWidth;
  this.canvas_.className = 'ol-unselectable';
  goog.dom.insertChildAt(container, this.canvas_, 0);

  /**
   * @private
   * @type {ol.Size}
   */
  this.canvasSize_ = new ol.Size(container.clientHeight, container.clientWidth);

  /**
   * @private
   * @type {WebGLRenderingContext}
   */
  this.gl_ = ol.webgl.getContext(this.canvas_, {
    alpha: false,
    antialias: true,
    depth: false,
    preserveDrawingBuffer: false,
    stencil: false
  });
  goog.asserts.assert(!goog.isNull(this.gl_));

  goog.events.listen(this.canvas_, ol.webgl.WebGLContextEventType.LOST,
      this.handleWebGLContextLost, false, this);
  goog.events.listen(this.canvas_, ol.webgl.WebGLContextEventType.RESTORED,
      this.handleWebGLContextResourced, false, this);

  /**
   * @private
   * @type {ol.Color}
   */
  this.clearColor_ = new ol.Color(1, 1, 1, 1);

  /**
   * @private
   * @type {{aPosition: number,
   *         aTexCoord: number,
   *         uColorMatrix: WebGLUniformLocation,
   *         uMatrix: WebGLUniformLocation,
   *         uOpacity: WebGLUniformLocation,
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
   * @type {Object.<number, WebGLShader>}
   */
  this.shaderCache_ = {};

  /**
   * @private
   * @type {Object.<string, WebGLProgram>}
   */
  this.programCache_ = {};

  /**
   * @private
   * @type {Object.<string, ol.renderer.webgl.TextureCacheEntry>}
   */
  this.textureCache_ = {};

  /**
   * @private
   * @type {ol.renderer.webgl.FragmentShader}
   */
  this.fragmentShader_ = ol.renderer.webgl.map.shader.Fragment.getInstance();

  /**
   * @private
   * @type {ol.renderer.webgl.VertexShader}
   */
  this.vertexShader_ = ol.renderer.webgl.map.shader.Vertex.getInstance();

  /**
   * @private
   * @type {Object.<number, null|number>}
   */
  this.layerRendererChangeListenKeys_ = {};

  this.initializeGL_();

};
goog.inherits(ol.renderer.webgl.Map, ol.renderer.Map);


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.addLayer = function(layer) {
  goog.base(this, 'addLayer', layer);
  if (layer.getVisible()) {
    this.getMap().render();
  }
};


/**
 * @param {Image} image Image.
 * @param {number} magFilter Mag filter.
 * @param {number} minFilter Min filter.
 */
ol.renderer.webgl.Map.prototype.bindImageTexture =
    function(image, magFilter, minFilter) {
  var gl = this.getGL();
  var imageKey = image.src;
  var textureCacheEntry = this.textureCache_[imageKey];
  if (goog.isDef(textureCacheEntry)) {
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
        goog.webgl.UNSIGNED_BYTE, image);
    gl.texParameteri(
        goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(
        goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_S,
        goog.webgl.CLAMP_TO_EDGE);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_T,
        goog.webgl.CLAMP_TO_EDGE);
    this.textureCache_[imageKey] = {
      texture: texture,
      magFilter: magFilter,
      minFilter: minFilter
    };
  }
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.canRotate = goog.functions.TRUE;


/**
 * @param {number} value Hue value.
 * @return {!goog.vec.Mat4.Float32} Matrix.
 */
ol.renderer.webgl.Map.prototype.createHueRotateMatrix = function(value) {
  var cosHue = Math.cos(value);
  var sinHue = Math.sin(value);
  var v00 = 0.213 + cosHue * 0.787 - sinHue * 0.213;
  var v01 = 0.715 - cosHue * 0.715 - sinHue * 0.715;
  var v02 = 0.072 - cosHue * 0.072 + sinHue * 0.928;
  var v03 = 0;
  var v10 = 0.213 - cosHue * 0.213 + sinHue * 0.143;
  var v11 = 0.715 + cosHue * 0.285 + sinHue * 0.140;
  var v12 = 0.072 - cosHue * 0.072 - sinHue * 0.283;
  var v13 = 0;
  var v20 = 0.213 - cosHue * 0.213 - sinHue * 0.787;
  var v21 = 0.715 - cosHue * 0.715 + sinHue * 0.715;
  var v22 = 0.072 + cosHue * 0.928 + sinHue * 0.072;
  var v23 = 0;
  var v30 = 0;
  var v31 = 0;
  var v32 = 0;
  var v33 = 1;
  var matrix = goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.setFromValues(matrix,
      v00, v10, v20, v30,
      v01, v11, v21, v31,
      v02, v12, v22, v32,
      v03, v13, v23, v33);
  return matrix;
};


/**
 * @param {number} value Brightness value.
 * @return {!goog.vec.Mat4.Float32} Matrix.
 */
ol.renderer.webgl.Map.prototype.createBrightnessMatrix = function(value) {
  var matrix = goog.vec.Mat4.createFloat32Identity();
  goog.vec.Mat4.setColumnValues(matrix, 3, value, value, value, 1);
  return matrix;
};


/**
 * @param {number} value Contrast value.
 * @return {!goog.vec.Mat4.Float32} Matrix.
 */
ol.renderer.webgl.Map.prototype.createContrastMatrix = function(value) {
  var matrix = goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.setDiagonalValues(matrix, value, value, value, 1);
  var translateValue = (-0.5 * value + 0.5);
  goog.vec.Mat4.setColumnValues(matrix, 3,
      translateValue, translateValue, translateValue, 1);
  return matrix;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.createLayerRenderer = function(layer) {
  var gl = this.getGL();
  if (layer instanceof ol.layer.TileLayer) {
    return new ol.renderer.webgl.TileLayer(this, layer);
  } else {
    goog.asserts.assert(false);
    return null;
  }
};


/**
 * @param {number} value Saturation value.
 * @return {!goog.vec.Mat4.Float32} Matrix.
 */
ol.renderer.webgl.Map.prototype.createSaturateMatrix = function(value) {
  var v00 = 0.213 + 0.787 * value;
  var v01 = 0.715 - 0.715 * value;
  var v02 = 0.072 - 0.072 * value;
  var v03 = 0;
  var v10 = 0.213 - 0.213 * value;
  var v11 = 0.715 + 0.285 * value;
  var v12 = 0.072 - 0.072 * value;
  var v13 = 0;
  var v20 = 0.213 - 0.213 * value;
  var v21 = 0.715 - 0.715 * value;
  var v22 = 0.072 + 0.928 * value;
  var v23 = 0;
  var v30 = 0;
  var v31 = 0;
  var v32 = 0;
  var v33 = 1;
  var matrix = goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.setFromValues(matrix,
      v00, v10, v20, v30,
      v01, v11, v21, v31,
      v02, v12, v22, v32,
      v03, v13, v23, v33);
  return matrix;

};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.disposeInternal = function() {
  var gl = this.getGL();
  if (!gl.isContextLost()) {
    goog.object.forEach(this.programCache_, function(program) {
      gl.deleteProgram(program);
    });
    goog.object.forEach(this.shaderCache_, function(shader) {
      gl.deleteShader(shader);
    });
    goog.object.forEach(this.textureCache_, function(textureCacheEntry) {
      gl.deleteTexture(textureCacheEntry.texture);
    });
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @return {WebGLRenderingContext} GL.
 */
ol.renderer.webgl.Map.prototype.getGL = function() {
  return this.gl_;
};


/**
 * @param {ol.renderer.webgl.FragmentShader} fragmentShaderObject
 *     Fragment shader.
 * @param {ol.renderer.webgl.VertexShader} vertexShaderObject Vertex shader.
 * @return {WebGLProgram} Program.
 */
ol.renderer.webgl.Map.prototype.getProgram = function(
    fragmentShaderObject, vertexShaderObject) {
  var programKey =
      goog.getUid(fragmentShaderObject) + '/' + goog.getUid(vertexShaderObject);
  if (programKey in this.programCache_) {
    return this.programCache_[programKey];
  } else {
    var gl = this.getGL();
    var program = gl.createProgram();
    gl.attachShader(program, this.getShader(fragmentShaderObject));
    gl.attachShader(program, this.getShader(vertexShaderObject));
    gl.linkProgram(program);
    if (goog.DEBUG) {
      if (!gl.getProgramParameter(program, goog.webgl.LINK_STATUS) &&
          !gl.isContextLost()) {
        this.logger.severe(gl.getProgramInfoLog(program));
        goog.asserts.assert(
            gl.getProgramParameter(program, goog.webgl.LINK_STATUS));
      }
    }
    this.programCache_[programKey] = program;
    return program;
  }
};


/**
 * @param {ol.renderer.webgl.Shader} shaderObject Shader object.
 * @return {WebGLShader} Shader.
 */
ol.renderer.webgl.Map.prototype.getShader = function(shaderObject) {
  var shaderKey = goog.getUid(shaderObject);
  if (shaderKey in this.shaderCache_) {
    return this.shaderCache_[shaderKey];
  } else {
    var gl = this.getGL();
    var shader = gl.createShader(shaderObject.getType());
    gl.shaderSource(shader, shaderObject.getSource());
    gl.compileShader(shader);
    if (goog.DEBUG) {
      if (!gl.getShaderParameter(shader, goog.webgl.COMPILE_STATUS) &&
          !gl.isContextLost()) {
        this.logger.severe(gl.getShaderInfoLog(shader));
        goog.asserts.assert(
            gl.getShaderParameter(shader, goog.webgl.COMPILE_STATUS));
      }
    }
    this.shaderCache_[shaderKey] = shader;
    return shader;
  }
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.handleBackgroundColorChanged = function() {
  var backgroundColor = this.getMap().getBackgroundColor();
  this.clearColor_ = new ol.Color(
      backgroundColor.r / 255,
      backgroundColor.g / 255,
      backgroundColor.b / 255,
      backgroundColor.a / 255);
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.handleCenterChanged = function() {
  goog.base(this, 'handleCenterChanged');
  this.getMap().render();
};


/**
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol.renderer.webgl.Map.prototype.handleLayerRendererChange = function(event) {
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.handleResolutionChanged = function() {
  goog.base(this, 'handleResolutionChanged');
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.handleRotationChanged = function() {
  goog.base(this, 'handleRotationChanged');
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.handleSizeChanged = function() {
  goog.base(this, 'handleSizeChanged');
  this.getMap().render();
};


/**
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol.renderer.webgl.Map.prototype.handleWebGLContextLost = function(event) {
  if (goog.DEBUG) {
    this.logger.info('WebGLContextLost');
  }
  event.preventDefault();
  this.locations_ = null;
  this.arrayBuffer_ = null;
  this.shaderCache_ = {};
  this.programCache_ = {};
  this.textureCache_ = {};
  goog.object.forEach(this.layerRenderers, function(layerRenderer) {
    layerRenderer.handleWebGLContextLost();
  });
};


/**
 * @protected
 */
ol.renderer.webgl.Map.prototype.handleWebGLContextResourced = function() {
  if (goog.DEBUG) {
    this.logger.info('WebGLContextResourced');
  }
  this.initializeGL_();
  this.getMap().render();
};


/**
 * @private
 */
ol.renderer.webgl.Map.prototype.initializeGL_ = function() {
  var gl = this.gl_;
  gl.activeTexture(goog.webgl.TEXTURE0);
  gl.blendFunc(goog.webgl.SRC_ALPHA, goog.webgl.ONE_MINUS_SRC_ALPHA);
  gl.disable(goog.webgl.CULL_FACE);
  gl.disable(goog.webgl.DEPTH_TEST);
  gl.disable(goog.webgl.SCISSOR_TEST);
};


/**
 * @param {Image} image Image.
 * @return {boolean} Is image texture loaded.
 */
ol.renderer.webgl.Map.prototype.isImageTextureLoaded = function(image) {
  return image.src in this.textureCache_;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.removeLayer = function(layer) {
  goog.base(this, 'removeLayer', layer);
  if (layer.getVisible()) {
    this.getMap().render();
  }
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.removeLayerRenderer = function(layer) {
  var layerRenderer = goog.base(this, 'removeLayerRenderer', layer);
  if (!goog.isNull(layerRenderer)) {
    var layerKey = goog.getUid(layer);
    goog.events.unlistenByKey(this.layerRendererChangeListenKeys_[layerKey]);
    delete this.layerRendererChangeListenKeys_[layerKey];
  }
  return layerRenderer;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.renderFrame = function(time) {

  var map = this.getMap();
  if (!map.isDef()) {
    return;
  }

  var requestRenderFrame = false;

  this.forEachReadyVisibleLayer(function(layer, layerRenderer) {
    if (layerRenderer.renderFrame(time)) {
      requestRenderFrame = true;
    }
  });

  var size = /** @type {ol.Size} */ this.getMap().getSize();
  if (!this.canvasSize_.equals(size)) {
    this.canvas_.width = size.width;
    this.canvas_.height = size.height;
    this.canvasSize_ = size;
  }

  var gl = this.getGL();

  gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, null);

  gl.clearColor(this.clearColor_.r, this.clearColor_.g, this.clearColor_.b,
      this.clearColor_.a);
  gl.clear(goog.webgl.COLOR_BUFFER_BIT);
  gl.enable(goog.webgl.BLEND);
  gl.viewport(0, 0, size.width, size.height);

  var program = this.getProgram(this.fragmentShader_, this.vertexShader_);
  gl.useProgram(program);
  if (goog.isNull(this.locations_)) {
    this.locations_ = {
      aPosition: gl.getAttribLocation(program, 'aPosition'),
      aTexCoord: gl.getAttribLocation(program, 'aTexCoord'),
      uColorMatrix: gl.getUniformLocation(program, 'uColorMatrix'),
      uMatrix: gl.getUniformLocation(program, 'uMatrix'),
      uOpacity: gl.getUniformLocation(program, 'uOpacity'),
      uTexture: gl.getUniformLocation(program, 'uTexture')
    };
  }

  if (goog.isNull(this.arrayBuffer_)) {
    var arrayBuffer = gl.createBuffer();
    gl.bindBuffer(goog.webgl.ARRAY_BUFFER, arrayBuffer);
    gl.bufferData(goog.webgl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      -1, 1, 0, 1,
      1, 1, 1, 1
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

  this.forEachReadyVisibleLayer(function(layer, layerRenderer) {
    gl.uniformMatrix4fv(
        this.locations_.uMatrix, false, layerRenderer.getMatrix());
    var hueRotateMatrix = this.createHueRotateMatrix(layer.getHue());
    var saturateMatrix = this.createSaturateMatrix(layer.getSaturation());
    var brightnessMatrix = this.createBrightnessMatrix(layer.getBrightness());
    var contrastMatrix = this.createContrastMatrix(layer.getContrast());
    var colorMatrix = goog.vec.Mat4.createFloat32Identity();
    goog.vec.Mat4.multMat(colorMatrix, contrastMatrix, colorMatrix);
    goog.vec.Mat4.multMat(colorMatrix, brightnessMatrix, colorMatrix);
    goog.vec.Mat4.multMat(colorMatrix, saturateMatrix, colorMatrix);
    goog.vec.Mat4.multMat(colorMatrix, hueRotateMatrix, colorMatrix);
    gl.uniformMatrix4fv(this.locations_.uColorMatrix, false, colorMatrix);
    gl.uniform1f(this.locations_.uOpacity, layer.getOpacity());
    gl.bindTexture(goog.webgl.TEXTURE_2D, layerRenderer.getTexture());
    gl.drawArrays(goog.webgl.TRIANGLE_STRIP, 0, 4);
  }, this);

  if (requestRenderFrame) {
    this.getMap().requestRenderFrame();
  }

};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Map.prototype.setLayerRenderer = function(
    layer, layerRenderer) {
  goog.base(this, 'setLayerRenderer', layer, layerRenderer);
  var layerKey = goog.getUid(layer);
  this.layerRendererChangeListenKeys_[layerKey] = goog.events.listen(
      layerRenderer, goog.events.EventType.CHANGE,
      this.handleLayerRendererChange, false, this);
};
