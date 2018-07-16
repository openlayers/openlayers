/**
 * @module ol/webgl/Shader
 */
import {FALSE} from '../functions.js';

/**
 * @constructor
 * @abstract
 * @param {string} source Source.
 * @struct
 */
class WebGLShader {
 constructor(source) {

   /**
    * @private
    * @type {string}
    */
   this.source_ = source;

 }

 /**
  * @abstract
  * @return {number} Type.
  */
 getType() {}

 /**
  * @return {string} Source.
  */
 getSource() {
   return this.source_;
 }
}


/**
 * @return {boolean} Is animated?
 */
WebGLShader.prototype.isAnimated = FALSE;
export default WebGLShader;
