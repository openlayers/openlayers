/**
 * @module ol/webgl/Shader
 */

/**
 * @abstract
 */
class WebGLShader {

  /**
   * @param {string} source Source.
   */
  constructor(source) {

    /**
     * @private
     * @type {string}
     */
    this.source_ = source;

  }

  /**
   * @return {boolean} Is animated?
   */
  isAnimated() {
    return false;
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


export default WebGLShader;
