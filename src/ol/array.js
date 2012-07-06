
/**
 * @fileoverview An implementation of Google Maps' MVCArray.
 * @see https://developers.google.com/maps/documentation/javascript/reference
 */

goog.provide('ol.Array');
goog.provide('ol.ArrayEvent');
goog.provide('ol.ArrayEventType');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events.Event');
goog.require('ol.Object');


/**
 * @enum {string}
 */
ol.ArrayEventType = {
  INSERT_AT: 'insert_at',
  REMOVE_AT: 'remove_at',
  SET_AT: 'set_at'
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {ol.ArrayEventType} type Type.
 * @param {number} index Index.
 * @param {*=} opt_prev Value.
 * @param {Object=} opt_target Target.
 */
ol.ArrayEvent = function(type, index, opt_prev, opt_target) {

  goog.base(this, type, opt_target);

  /**
   * @type {number}
   */
  this.index = index;

  /**
   * @type {*}
   */
  this.prev = opt_prev;

};
goog.inherits(ol.ArrayEvent, goog.events.Event);



/**
 * @constructor
 * @extends {ol.Object}
 * @param {Array=} opt_array Array.
 */
ol.Array = function(opt_array) {

  goog.base(this);

  /**
   * @private
   * @type {Array}
   */
  this.array_ = goog.isDefAndNotNull(opt_array) ? opt_array : [];

  this.updateLength_();

};
goog.inherits(ol.Array, ol.Object);


/**
 * @const
 * @type {string}
 */
ol.Array.LENGTH = 'length';


/**
 * @param {ol.Array|Array} arg Argument.
 * @return {ol.Array} Array.
 */
ol.Array.create = function(arg) {
  if (arg instanceof ol.Array) {
    return arg;
  } else {
    return new ol.Array(arg);
  }
};


/**
 */
ol.Array.prototype.clear = function() {
  while (this[ol.Array.LENGTH]) {
    this.pop();
  }
};


/**
 * @param {function(*, number)} callback Callback.
 */
ol.Array.prototype.forEach = function(callback) {
  goog.array.forEach(this.array_, callback);
};


/**
 * @return {Array} Array.
 */
ol.Array.prototype.getArray = function() {
  return this.array_;
};


/**
 * @param {number} index Index.
 * @return {*} Element.
 */
ol.Array.prototype.getAt = function(index) {
  return this.array_[index];
};


/**
 * @return {number} Length.
 */
ol.Array.prototype.getLength = function() {
  return /** @type {number} */ (this.get(ol.Array.LENGTH));
};


/**
 * @param {number} index Index.
 * @param {*} elem Element.
 */
ol.Array.prototype.insertAt = function(index, elem) {
  goog.array.insertAt(this.array_, elem, index);
  this.updateLength_();
  this.dispatchEvent(new ol.ArrayEvent(
      ol.ArrayEventType.INSERT_AT, index, undefined, this));
  if (this[ol.ArrayEventType.INSERT_AT]) {
    this[ol.ArrayEventType.INSERT_AT](index);
  }
};


/**
 * @return {*} Element.
 */
ol.Array.prototype.pop = function() {
  return this.removeAt(this.getLength() - 1);
};


/**
 * @param {*} elem Element.
 * @return {number} Length.
 */
ol.Array.prototype.push = function(elem) {
  var n = this.array_.length;
  this.insertAt(n, elem);
  return n;
};


/**
 * @param {number} index Index.
 * @return {*} Value.
 */
ol.Array.prototype.removeAt = function(index) {
  var prev = this.array_[index];
  goog.array.removeAt(this.array_, index);
  this.updateLength_();
  this.dispatchEvent(new ol.ArrayEvent(ol.ArrayEventType.REMOVE_AT,
      index, prev, this));
  if (this[ol.ArrayEventType.REMOVE_AT]) {
    this[ol.ArrayEventType.REMOVE_AT](index);
  }
  return prev;
};


/**
 * @param {number} index Index.
 * @param {*} elem Element.
 */
ol.Array.prototype.setAt = function(index, elem) {
  var n = this[ol.Array.LENGTH];
  if (index < n) {
    var prev = this.array_[index];
    this.array_[index] = elem;
    this.dispatchEvent(new ol.ArrayEvent(ol.ArrayEventType.SET_AT,
        index, prev, this));
    if (this[ol.ArrayEventType.SET_AT]) {
      this[ol.ArrayEventType.SET_AT](index, prev);
    }
  } else {
    var j;
    for (j = n; j < index; ++j) {
      this.insertAt(j, undefined);
    }
    this.insertAt(index, elem);
  }
};


/**
 * @private
 */
ol.Array.prototype.updateLength_ = function() {
  this.set('length', this.array_.length);
};
