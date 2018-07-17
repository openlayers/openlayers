/**
 * @module ol/webgl/Vertex
 */
import {inherits} from '../util.js';
import {VERTEX_SHADER} from '../webgl.js';
import WebGLShader from '../webgl/Shader.js';

/**
 * @extends {module:ol/webgl/Shader}
 */
class WebGLVertex {

  /**
   * @param {string} source Source.
   */
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
