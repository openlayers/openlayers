/**
 * @module ol/Disposable
 */
import {VOID} from './functions.js';

/**
 * @classdesc
 * Objects that need to clean up after themselves.
 */
class Disposable {
  /**
   * Clean up.
   */
  dispose() {
    if (!this.disposed_) {
      this.disposed_ = true;
      this.disposeInternal();
    }
  }
}

/**
 * The object has already been disposed.
 * @type {boolean}
 * @private
 */
Disposable.prototype.disposed_ = false;

/**
 * Extension point for disposable objects.
 * @protected
 */
Disposable.prototype.disposeInternal = VOID;

export default Disposable;
