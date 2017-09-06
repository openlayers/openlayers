import _ol_ from './index';

/**
 * Objects that need to clean up after themselves.
 * @constructor
 */
var _ol_Disposable_ = function() {};

/**
 * The object has already been disposed.
 * @type {boolean}
 * @private
 */
_ol_Disposable_.prototype.disposed_ = false;

/**
 * Clean up.
 */
_ol_Disposable_.prototype.dispose = function() {
  if (!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
  }
};

/**
 * Extension point for disposable objects.
 * @protected
 */
_ol_Disposable_.prototype.disposeInternal = _ol_.nullFunction;
export default _ol_Disposable_;
