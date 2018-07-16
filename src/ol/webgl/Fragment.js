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
class WebGLFragment {
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
