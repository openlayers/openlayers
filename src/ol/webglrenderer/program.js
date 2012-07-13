goog.provide('ol.webglrenderer.Program');

goog.require('goog.asserts');
goog.require('goog.webgl');
goog.require('ol.webglrenderer.GLObject');
goog.require('ol.webglrenderer.VertexAttrib');
goog.require('ol.webglrenderer.shader.Fragment');
goog.require('ol.webglrenderer.shader.Vertex');



/**
 * @constructor
 * @extends {ol.webglrenderer.GLObject}
 * @param {ol.webglrenderer.shader.Fragment} fragmentShader Fragment shader.
 * @param {ol.webglrenderer.shader.Vertex} vertexShader Vertex shader.
 */
ol.webglrenderer.Program = function(fragmentShader, vertexShader) {

  goog.base(this);

  /**
   * @private
   * @type {ol.webglrenderer.shader.Fragment}
   */
  this.fragmentShader_ = fragmentShader;

  /**
   * @private
   * @type {ol.webglrenderer.shader.Vertex}
   */
  this.vertexShader_ = vertexShader;

  /**
   * @private
   * @type {WebGLProgram}
   */
  this.program_ = null;

};
goog.inherits(ol.webglrenderer.Program, ol.webglrenderer.GLObject);


/**
 * @inheritDoc
 */
ol.webglrenderer.Program.prototype.setGL = function(gl) {
  if (!goog.isNull(this.gl)) {
    if (!goog.isNull(this.program_)) {
      this.gl.deleteProgram(this.program_);
      this.program_ = null;
    }
    this.fragmentShader_.setGL(null);
    this.vertexShader_.setGL(null);
  }
  goog.base(this, 'setGL', gl);
  if (!goog.isNull(gl)) {
    this.fragmentShader_.setGL(gl);
    this.vertexShader_.setGL(gl);
    var program = gl.createProgram();
    gl.attachShader(program, this.fragmentShader_.get());
    gl.attachShader(program, this.vertexShader_.get());
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, goog.webgl.LINK_STATUS)) {
      window.console.log(gl.getProgramInfoLog(program));
      goog.asserts.assert(
          gl.getProgramParameter(program, goog.webgl.LINK_STATUS));
    }
    this.program_ = program;
  }
};


/**
 */
ol.webglrenderer.Program.prototype.use = function() {
  var gl = this.getGL();
  gl.useProgram(this.program_);
};
