/**
 * @module ol/webgl/Vertex
 */
import {inherits} from '../util.js';
import {VERTEX_SHADER} from '../webgl.js';
import WebGLShader from '../webgl/Shader.js';

/**
 * @constructor
 * @extends {module:ol/webgl/Shader}
 * @param {string} source Source.
 * @struct
 */
class WebGLVertex {
 constructor(source) {
   WebGLShader.call(this, source);
 }

 /**
  * @inheritDoc
  */
 getType() {
   return VERTEX_SHADER;
 }
}

inherits(WebGLVertex, WebGLShader);


export default WebGLVertex;
