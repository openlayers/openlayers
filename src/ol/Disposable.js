/**
 * @module ol/Disposable
 */

/**
 * @classdesc
 * Objects that need to clean up after themselves.
 */
class Disposable {

  constructor() {
    /**
     * The object has already been disposed.
     * @type {boolean}
     * @private
     */
    this.disposed_ = false;
  }

  /**
   * Clean up.
   */
  dispose() {
    if (!this.disposed_) {
      this.disposed_ = true;
      this.disposeInternal();
    }
  }

  /**
   * Extension point for disposable objects.
   * @protected
   */
  disposeInternal() {}
}

export default Disposable;
