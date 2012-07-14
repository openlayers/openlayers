goog.provide('ol.webgl.ProgramCache');

goog.require('goog.dispose');
goog.require('goog.object');
goog.require('ol.webgl.GLObject');
goog.require('ol.webgl.Program');
goog.require('ol.webgl.shader.Fragment');
goog.require('ol.webgl.shader.Vertex');



/**
 * @constructor
 * @extends {ol.webgl.GLObject}
 */
ol.webgl.ProgramCache = function() {

  goog.base(this);

  /**
   * @private
   * @type {Object.<string, Object.<string, ol.webgl.Program>>}
   */
  this.programss_ = {};

};
goog.inherits(ol.webgl.ProgramCache, ol.webgl.GLObject);


/**
 * @param {ol.webgl.shader.Fragment} fragmentShader Fragment shader.
 * @param {ol.webgl.shader.Vertex} vertexShader Vertex shader.
 * @return {ol.webgl.Program} Program.
 */
ol.webgl.ProgramCache.prototype.get =
    function(fragmentShader, vertexShader) {
  var program, programs;
  var fragmentShaderKey = goog.getUid(fragmentShader);
  if (fragmentShaderKey in this.programss_) {
    programs = this.programss_[fragmentShaderKey];
  } else {
    programs = {};
    this.programss_[fragmentShaderKey] = programs;
  }
  var vertexShaderKey = goog.getUid(vertexShader);
  if (vertexShaderKey in programs) {
    program = programs[vertexShaderKey];
  } else {
    program = new ol.webgl.Program(fragmentShader, vertexShader);
    programs[vertexShaderKey] = program;
  }
  return program;
};


/**
 * @inheritDoc
 */
ol.webgl.ProgramCache.prototype.setGL = function(gl) {
  goog.object.forEach(this.programss_, function(programs) {
    goog.disposeAll(goog.object.getValues(programs));
  });
  goog.base(this, 'setGL', gl);
};
