goog.provide('ol.webglrenderer.ProgramCache');

goog.require('goog.dispose');
goog.require('goog.object');
goog.require('ol.webglrenderer.GLObject');
goog.require('ol.webglrenderer.Program');
goog.require('ol.webglrenderer.shader.Fragment');
goog.require('ol.webglrenderer.shader.Vertex');



/**
 * @constructor
 * @extends {ol.webglrenderer.GLObject}
 */
ol.webglrenderer.ProgramCache = function() {

  goog.base(this);

  /**
   * @private
   * @type {Object.<string, Object.<string, ol.webglrenderer.Program>>}
   */
  this.programss_ = {};

};
goog.inherits(ol.webglrenderer.ProgramCache, ol.webglrenderer.GLObject);


/**
 * @param {ol.webglrenderer.shader.Fragment} fragmentShader Fragment shader.
 * @param {ol.webglrenderer.shader.Vertex} vertexShader Vertex shader.
 * @return {ol.webglrenderer.Program} Program.
 */
ol.webglrenderer.ProgramCache.prototype.get =
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
    program = new ol.webglrenderer.Program(fragmentShader, vertexShader);
    programs[vertexShaderKey] = program;
  }
  return program;
};


/**
 * @inheritDoc
 */
ol.webglrenderer.ProgramCache.prototype.setGL = function(gl) {
  goog.object.forEach(this.programss_, function(programs) {
    goog.disposeAll(goog.object.getValues(programs));
  });
  goog.base(this, 'setGL', gl);
};
