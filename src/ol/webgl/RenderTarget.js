/**
 * A wrapper class to simplify rendering to a texture instead of the final canvas
 * @module ol/webgl/RenderTarget
 */
import {equals} from '../array.js';


/**
 * @classdesc
 * This class is a wrapper around the association of both a `WebGLTexture` and a `WebGLFramebuffer` instances,
 * simplifying initialization and binding for rendering.
 * @api
 */
class WebGLRenderTarget {

  /**
   * @param {import("./Helper.js").default} helper WebGL helper; mandatory.
   * @param {Array<number>} [opt_size] Expected size of the render target texture; note: this can be changed later on.
   */
  constructor(helper, opt_size) {
    /**
     * @private
     * @type {import("./Helper.js").default}
     */
    this.helper_ = helper;
    const gl = helper.getGL();

    /**
     * @private
     * @type {WebGLTexture}
     */
    this.texture_ = gl.createTexture();

    /**
     * @private
     * @type {WebGLFramebuffer}
     */
    this.framebuffer_ = gl.createFramebuffer();

    /**
     * @type {Array<number>}
     * @private
     */
    this.size_ = opt_size || [1, 1];

    /**
     * @type {Uint8Array}
     * @private
     */
    this.data_ = new Uint8Array(1);

    this.updateSize_();
  }

  /**
   * Changes the size of the render target texture. Note: will do nothing if the size
   * is already the same.
   * @param {Array<number>} size Expected size of the render target texture
   * @api
   */
  setSize(size) {
    if (equals(size, this.size_)) {
      return;
    }
    this.size_[0] = size[0];
    this.size_[1] = size[1];
    this.updateSize_();
  }

  /**
   * Returns the size of the render target texture
   * @return {Array<number>} Size of the render target texture
   * @api
   */
  getSize() {
    return this.size_;
  }

  /**
   * Returns the content of the render target texture as raw data (series of r,g,b,a values)
   * @return {Uint8Array} Integer array of color values
   * @api
   */
  read() {
    const size = this.size_;
    const gl = this.helper_.getGL();

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer_);
    gl.readPixels(0, 0, size[0], size[1], gl.RGBA, gl.UNSIGNED_BYTE, this.data_);
    return this.data_;
  }

  /**
   * @return {WebGLTexture} Texture to render to
   */
  getTexture() {
    return this.texture_;
  }

  /**
   * @return {WebGLFramebuffer} Frame buffer of the render target
   */
  getFramebuffer() {
    return this.framebuffer_;
  }

  /**
   * @private
   */
  updateSize_() {
    const size = this.size_;
    const gl = this.helper_.getGL();

    this.texture_ = this.helper_.createTexture(size, null, this.texture_);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer_);
    gl.viewport(0, 0, size[0], size[1]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture_, 0);

    this.data_ = new Uint8Array(size[0] * size[1] * 4);
  }
}

export default WebGLRenderTarget;
