/**
 * @module ol/webgl/Fragment
 */
import {inherits} from '../util.js';
import {FRAGMENT_SHADER} from '../webgl.js';
import WebGLShader from '../webgl/Shader.js';

/**
 * @constructor
 * @extends {module:ol/webgl/Shader}
 * @param {string} source Source.
 * @struct
 */
const WebGLFragment = function(source) {
  WebGLShader.call(this, source);
};

inherits(WebGLFragment, WebGLShader);


/**
 * @inheritDoc
 */
WebGLFragment.prototype.getType = function() {
  return FRAGMENT_SHADER;
};
export default WebGLFragment;
