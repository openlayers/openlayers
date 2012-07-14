goog.provide('ol.webgl.Program');

goog.require('goog.asserts');
goog.require('goog.webgl');
goog.require('ol.webgl.GLObject');
goog.require('ol.webgl.VertexAttrib');
goog.require('ol.webgl.shader.Fragment');
goog.require('ol.webgl.shader.Vertex');



/**
 * @constructor
 * @extends {ol.webgl.GLObject}
 * @param {ol.webgl.shader.Fragment} fragmentShader Fragment shader.
 * @param {ol.webgl.shader.Vertex} vertexShader Vertex shader.
 */
ol.webgl.Program = function(fragmentShader, vertexShader) {

  goog.base(this);

  /**
   * @private
   * @type {ol.webgl.shader.Fragment}
   */
  this.fragmentShader_ = fragmentShader;

  /**
   * @private
   * @type {ol.webgl.shader.Vertex}
   */
  this.vertexShader_ = vertexShader;

  /**
   * @private
   * @type {WebGLProgram}
   */
  this.program_ = null;

};
goog.inherits(ol.webgl.Program, ol.webgl.GLObject);


/**
 * @inheritDoc
 */
ol.webgl.Program.prototype.setGL = function(gl) {
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
ol.webgl.Program.prototype.use = function() {
  var gl = this.getGL();
  gl.useProgram(this.program_);
};
