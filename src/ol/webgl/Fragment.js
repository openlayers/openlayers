/**
 * @module ol/webgl/Fragment
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
const WebGLFragment = function(source) {
  WebGLShader.call(this, source);
};

inherits(WebGLFragment, WebGLShader);


/**
 * @inheritDoc
 */
WebGLFragment.prototype.getType = function() {
  return _ol_webgl_.FRAGMENT_SHADER;
};
export default WebGLFragment;
