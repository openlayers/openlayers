/**
 * @module ol/webgl/Fragment
 */
import {inherits} from '../util.js';
import {FRAGMENT_SHADER} from '../webgl.js';
import WebGLShader from '../webgl/Shader.js';

/**
 * @extends {module:ol/webgl/Shader}
 */
class WebGLFragment {

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
    return FRAGMENT_SHADER;
  }
}

inherits(WebGLFragment, WebGLShader);


export default WebGLFragment;
