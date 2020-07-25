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
     * @protected
     */
    this.disposed = false;
  }

  /**
   * Clean up.
   */
  dispose() {
    if (!this.disposed) {
      this.disposed = true;
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
