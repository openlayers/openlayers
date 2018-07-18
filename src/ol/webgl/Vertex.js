/**
 * @module ol/webgl/Vertex
 */

import {VERTEX_SHADER} from '../webgl.js';
import WebGLShader from '../webgl/Shader.js';

class WebGLVertex extends WebGLShader {

  /**
   * @param {string} source Source.
   */
  constructor(source) {
    super(source);
  }

  /**
   * @inheritDoc
   */
  getType() {
    return VERTEX_SHADER;
  }
}


export default WebGLVertex;
