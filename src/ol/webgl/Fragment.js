/**
 * @module ol/webgl/Fragment
 */

import {FRAGMENT_SHADER} from '../webgl.js';
import WebGLShader from '../webgl/Shader.js';

class WebGLFragment extends WebGLShader {

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
    return FRAGMENT_SHADER;
  }
}


export default WebGLFragment;
