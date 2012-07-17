goog.provide('ol.webgl.Map');

goog.require('goog.dispose');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.style');
goog.require('goog.webgl');
goog.require('ol.Layer');
goog.require('ol.Map');
goog.require('ol.TileLayer');
goog.require('ol.webgl.Shader');
goog.require('ol.webgl.TileLayerRenderer');
goog.require('ol.webgl.WebGLContextEventType');
goog.require('ol.webgl.shader.Fragment');
goog.require('ol.webgl.shader.Vertex');



/**
 * @define {boolean} Enable WebGL debugging.
 */
ol.DEBUG_WEBGL = false;



/**
 * @constructor
 * @extends {ol.Map}
 * @param {!HTMLDivElement} target Target.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.webgl.Map = function(target, opt_values) {

  goog.base(this, target);

  /**
   * @private
   * @type {Element}
   */
  this.canvas_ = goog.dom.createElement(goog.dom.TagName.CANVAS);
  this.canvas_.height = target.clientHeight;
  this.canvas_.width = target.clientWidth;
  this.canvas_.style.overflow = 'hidden';
  target.appendChild(this.canvas_);

  /**
   * @private
   * @type {WebGLRenderingContext}
   */
  this.gl_ = this.canvas_.getContext('experimental-webgl', {
    alpha: false,
    antialias: true,
    depth: false,
    preserveDrawingBuffer: false,
    stencil: false
  });
  goog.asserts.assert(!goog.isNull(this.gl_));

  if (ol.DEBUG_WEBGL) {
    this.gl_ = WebGLDebugUtils.makeDebugContext(this.gl_);
  }

  goog.events.listen(this.canvas_, ol.webgl.WebGLContextEventType.LOST,
      this.handleWebGLContextLost, false, this);
  goog.events.listen(this.canvas_, ol.webgl.WebGLContextEventType.RESTORED,
      this.handleWebGLContextRestored, false, this);

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
   * @type {ol.webgl.shader.Fragment}
   */
  this.fragmentShader_ = ol.webgl.Map.createFragmentShader_();

  /**
   * @private
   * @type {ol.webgl.shader.Vertex}
   */
  this.vertexShader_ = ol.webgl.Map.createVertexShader_();

  /**
   * @private
   * @type {Object.<number, null|number>}
   */
  this.layerRendererChangeListenKeys_ = {};

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

  this.handleViewportResize();
  this.handleWebGLContextRestored();

};
goog.inherits(ol.webgl.Map, ol.Map);


/**
 * @private
 * @return {ol.webgl.shader.Fragment} Fragment shader.
 */
ol.webgl.Map.createFragmentShader_ = function() {
  return new ol.webgl.shader.Fragment([
    'precision mediump float;',
    '',
    'uniform float uAlpha;',
    'uniform sampler2D uTexture;',
    '',
    'varying vec2 vTexCoord;',
    '',
    'void main(void) {',
    '  gl_FragColor = vec4(texture2D(uTexture, vTexCoord).rgb, uAlpha);',
    '}'
  ].join('\n'));
};


/**
 * @private
 * @return {ol.webgl.shader.Vertex} Vertex shader.
 */
ol.webgl.Map.createVertexShader_ = function() {
  return new ol.webgl.shader.Vertex([
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


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.createLayerRenderer = function(layer) {
  var gl = this.getGL();
  if (gl.isContextLost()) {
    return null;
  }
  if (layer instanceof ol.TileLayer) {
    return new ol.webgl.TileLayerRenderer(this, layer);
  } else {
    goog.asserts.assert(false);
    return null;
  }
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.disposeInternal = function() {
  var gl = this.getGL();
  if (!gl.isContextLost()) {
    goog.object.forEach(this.programCache_, function(program) {
      gl.deleteProgram(program);
    });
    goog.object.forEach(this.shaderCache_, function(shader) {
      gl.deleteShader(shader);
    });
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @return {WebGLRenderingContext} GL.
 */
ol.webgl.Map.prototype.getGL = function() {
  return this.gl_;
};


/**
 * @param {ol.webgl.shader.Fragment} fragmentShaderObject Fragment shader.
 * @param {ol.webgl.shader.Vertex} vertexShaderObject Vertex shader.
 * @return {WebGLProgram} Program.
 */
ol.webgl.Map.prototype.getProgram = function(
    fragmentShaderObject, vertexShaderObject) {
  var key =
      goog.getUid(fragmentShaderObject) + '/' + goog.getUid(vertexShaderObject);
  if (key in this.programCache_) {
    return this.programCache_[key];
  } else {
    var gl = this.getGL();
    var program = gl.createProgram();
    gl.attachShader(program, this.getShader(fragmentShaderObject));
    gl.attachShader(program, this.getShader(vertexShaderObject));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, goog.webgl.LINK_STATUS) &&
        !gl.isContextLost()) {
      window.console.log(gl.getProgramInfoLog(program));
      goog.asserts.assert(
          gl.getProgramParameter(program, goog.webgl.LINK_STATUS));
    }
    this.programCache_[key] = program;
    return program;
  }
};


/**
 * @param {ol.webgl.Shader} shaderObject Shader object.
 * @return {WebGLShader} Shader.
 */
ol.webgl.Map.prototype.getShader = function(shaderObject) {
  var key = goog.getUid(shaderObject);
  if (key in this.shaderCache_) {
    return this.shaderCache_[key];
  } else {
    var gl = this.getGL();
    var shader = gl.createShader(shaderObject.getType());
    gl.shaderSource(shader, shaderObject.getSource());
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, goog.webgl.COMPILE_STATUS) &&
        !gl.isContextLost()) {
      window.console.log(gl.getShaderInfoLog(shader));
      goog.asserts.assert(
          gl.getShaderParameter(shader, goog.webgl.COMPILE_STATUS));
    }
    this.shaderCache_[key] = shader;
    return shader;
  }
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.handleCenterChanged = function() {
  goog.base(this, 'handleCenterChanged');
  this.redraw();
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.handleLayerAdd = function(layer) {
  goog.base(this, 'handleLayerAdd', layer);
  if (layer.getVisible()) {
    this.redraw();
  }
};


/**
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol.webgl.Map.prototype.handleLayerRendererChange = function(event) {
  var layerRenderer = /** @type {ol.LayerRenderer} */ (event.target);
  if (layerRenderer.getLayer().getVisible()) {
    this.redraw();
  }
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.handleLayerRemove = function(layer) {
  goog.base(this, 'handleLayerRemove', layer);
  if (layer.getVisible()) {
    this.redraw();
  }
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.handleResolutionChanged = function() {
  goog.base(this, 'handleResolutionChanged');
  this.redraw();
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.handleSizeChanged = function() {
  goog.base(this, 'handleSizeChanged');
  var size = this.getSize();
  if (!goog.isDef(size)) {
    return;
  }
  this.canvas_.width = size.width;
  this.canvas_.height = size.height;
  var gl = this.gl_;
  if (!goog.isNull(gl)) {
    gl.viewport(0, 0, size.width, size.height);
    this.redraw();
  }
};


/**
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol.webgl.Map.prototype.handleWebGLContextLost = function(event) {
  event.preventDefault();
  this.forEachLayer(function(layer) {
    var layerRenderer = this.removeLayerRenderer(layer);
    goog.dispose(layerRenderer);
  }, this);
  goog.asserts.assert(goog.object.isEmpty(this.layerRenderers));
  this.shaderCache_ = {};
  this.programCache_ = {};
};


/**
 * @protected
 */
ol.webgl.Map.prototype.handleWebGLContextRestored = function() {
  var gl = this.gl_;
  gl.clearColor(1, 0, 0, 1);
  gl.disable(goog.webgl.CULL_FACE);
  gl.disable(goog.webgl.SCISSOR_TEST);
  var layers = this.getLayers();
  layers.forEach(function(layer) {
    var layerRenderer = this.createLayerRenderer(layer);
    this.setLayerRenderer(layer, layerRenderer);
  }, this);
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.redrawInternal = function() {

  var animate = goog.base(this, 'redrawInternal');

  var gl = this.getGL();

  gl.clear(goog.webgl.COLOR_BUFFER_BIT);

  gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, null);

  var program = this.getProgram(this.fragmentShader_, this.vertexShader_);
  gl.useProgram(program);

  this.forEachLayer(function(layer) {
    if (!layer.getVisible()) {
      return;
    }
    var layerRenderer = /** @type {ol.webgl.LayerRenderer} */ (
        this.getLayerRenderer(layer));
    goog.asserts.assert(goog.isDefAndNotNull(layerRenderer));
    layerRenderer.redraw();
    gl.bindTexture(goog.webgl.TEXTURE_2D, layerRenderer.getTexture());
  }, this);

  return animate;

};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.removeLayerRenderer = function(layer) {
  var layerRenderer = goog.base(this, 'removeLayerRenderer', layer);
  if (!goog.isNull(layerRenderer)) {
    var key = goog.getUid(layer);
    goog.events.unlistenByKey(this.layerRendererChangeListenKeys_[key]);
    delete this.layerRendererChangeListenKeys_[key];
  }
  return layerRenderer;
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.setLayerRenderer = function(layer, layerRenderer) {
  goog.base(this, 'setLayerRenderer', layer, layerRenderer);
  var key = goog.getUid(layer);
  this.layerRendererChangeListenKeys_[key] = goog.events.listen(layerRenderer,
      goog.events.EventType.CHANGE, this.handleLayerRendererChange, false,
      this);
};
