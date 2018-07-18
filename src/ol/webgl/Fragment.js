/**
 * @module ol/webgl/Fragment
 */
import {inherits} from '../util.js';
import {FRAGMENT_SHADER} from '../webgl.js';
import WebGLShader from '../webgl/Shader.js';

/**
 * @extends {module:ol/webgl/Shader}
 */
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
