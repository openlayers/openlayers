/**
 * @module ol/webgl/Vertex
 */
import {inherits} from '../index.js';
import _ol_webgl_ from '../webgl.js';
import WebGLShader from '../webgl/Shader.js';

/**
 * @constructor
 * @extends {ol.webgl.Shader}
 * @param {string} source Source.
 * @struct
 */
const WebGLVertex = function(source) {
  WebGLShader.call(this, source);
};

inherits(WebGLVertex, WebGLShader);


/**
 * @inheritDoc
 */
WebGLVertex.prototype.getType = function() {
  return _ol_webgl_.VERTEX_SHADER;
};
export default WebGLVertex;
