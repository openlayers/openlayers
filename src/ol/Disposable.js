/**
 * @module ol/Disposable
 */

/**
 * Objects that need to clean up after themselves.
 * @constructor
 */
export default class Disposable {
  /**
  * The object has already been disposed.
  * @type {boolean}
  * @private
  */
  constructor() {
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

