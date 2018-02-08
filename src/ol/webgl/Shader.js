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
const WebGLShader = function(source) {

  /**
   * @private
   * @type {string}
   */
  this.source_ = source;

};


/**
 * @abstract
 * @return {number} Type.
 */
WebGLShader.prototype.getType = function() {};


/**
 * @return {string} Source.
 */
WebGLShader.prototype.getSource = function() {
  return this.source_;
};


/**
 * @return {boolean} Is animated?
 */
WebGLShader.prototype.isAnimated = FALSE;
export default WebGLShader;
