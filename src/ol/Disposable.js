/**
 * @module ol/Disposable
 */
import {UNDEFINED} from './functions.js';

/**
 * Objects that need to clean up after themselves.
 * @constructor
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
Disposable.prototype.disposeInternal = UNDEFINED;
export default Disposable;
