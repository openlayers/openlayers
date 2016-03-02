goog.provide('ol.Disposable');

goog.require('ol');

/**
 * Objects that need to clean up after themselves.
 * @constructor
 */
ol.Disposable = function() {};

/**
 * The object has already been disposed.
 * @type {boolean}
 * @private
 */
ol.Disposable.prototype.disposed_ = false;

/**
 * Clean up.
 */
ol.Disposable.prototype.dispose = function() {
  if (!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
  }
};

/**
 * Extension point for disposable objects.
 * @protected
 */
ol.Disposable.prototype.disposeInternal = ol.nullFunction;
