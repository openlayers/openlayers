
/**
 * @fileoverview An implementation of Google Maps' MVCArray.
 * @see https://developers.google.com/maps/documentation/javascript/reference
 */

goog.provide('ol.MVCArray');
goog.provide('ol.MVCArrayEvent');
goog.provide('ol.MVCArrayEventType');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events.Event');
goog.require('ol.Object');


/**
 * @enum {string}
 */
ol.MVCArrayEventType = {
  INSERT_AT: 'insert_at',
  REMOVE_AT: 'remove_at',
  SET_AT: 'set_at'
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {ol.MVCArrayEventType} type Type.
 * @param {number} index Index.
 * @param {*=} opt_prev Value.
 * @param {Object=} opt_target Target.
 */
ol.MVCArrayEvent = function(type, index, opt_prev, opt_target) {

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
goog.inherits(ol.MVCArrayEvent, goog.events.Event);



/**
 * @constructor
 * @extends {ol.Object}
 * @param {Array=} opt_array Array.
 */
ol.MVCArray = function(opt_array) {

  goog.base(this);

  /**
   * @private
   * @type {Array}
   */
  this.array_ = goog.isDefAndNotNull(opt_array) ? opt_array : [];

  this.updateLength_();

};
goog.inherits(ol.MVCArray, ol.Object);


/**
 * @const
 * @type {string}
 */
ol.MVCArray.LENGTH = 'length';


/**
 * @param {ol.MVCArray|Array} arg Argument.
 * @return {ol.MVCArray} MVCArray.
 */
ol.MVCArray.create = function(arg) {
  if (arg instanceof ol.MVCArray) {
    return arg;
  } else {
    return new ol.MVCArray(arg);
  }
};


/**
 */
ol.MVCArray.prototype.clear = function() {
  while (this[ol.MVCArray.LENGTH]) {
    this.pop();
  }
};


/**
 * @param {function(*, number)} callback Callback.
 */
ol.MVCArray.prototype.forEach = function(callback) {
  goog.array.forEach(this.array_, callback);
};


/**
 * @return {Array} Array.
 */
ol.MVCArray.prototype.getArray = function() {
  return this.array_;
};


/**
 * @param {number} index Index.
 * @return {*} Element.
 */
ol.MVCArray.prototype.getAt = function(index) {
  return this.array_[index];
};


/**
 * @return {number} Length.
 */
ol.MVCArray.prototype.getLength = function() {
  return /** @type {number} */ (this.get(ol.MVCArray.LENGTH));
};


/**
 * @param {number} index Index.
 * @param {*} elem Element.
 */
ol.MVCArray.prototype.insertAt = function(index, elem) {
  goog.array.insertAt(this.array_, elem, index);
  this.updateLength_();
  this.dispatchEvent(new ol.MVCArrayEvent(
      ol.MVCArrayEventType.INSERT_AT, index, undefined, this));
  if (this[ol.MVCArrayEventType.INSERT_AT]) {
    this[ol.MVCArrayEventType.INSERT_AT](index);
  }
};


/**
 * @return {*} Element.
 */
ol.MVCArray.prototype.pop = function() {
  return this.removeAt(this.getLength() - 1);
};


/**
 * @param {*} elem Element.
 * @return {number} Length.
 */
ol.MVCArray.prototype.push = function(elem) {
  var n = this.array_.length;
  this.insertAt(n, elem);
  return n;
};


/**
 * @param {number} index Index.
 * @return {*} Value.
 */
ol.MVCArray.prototype.removeAt = function(index) {
  var prev = this.array_[index];
  goog.array.removeAt(this.array_, index);
  this.updateLength_();
  this.dispatchEvent(new ol.MVCArrayEvent(ol.MVCArrayEventType.REMOVE_AT,
      index, prev, this));
  if (this[ol.MVCArrayEventType.REMOVE_AT]) {
    this[ol.MVCArrayEventType.REMOVE_AT](index);
  }
  return prev;
};


/**
 * @param {number} index Index.
 * @param {*} elem Element.
 */
ol.MVCArray.prototype.setAt = function(index, elem) {
  var n = this[ol.MVCArray.LENGTH];
  if (index < n) {
    var prev = this.array_[index];
    this.array_[index] = elem;
    this.dispatchEvent(new ol.MVCArrayEvent(ol.MVCArrayEventType.SET_AT,
        index, prev, this));
    if (this[ol.MVCArrayEventType.SET_AT]) {
      this[ol.MVCArrayEventType.SET_AT](index, prev);
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
ol.MVCArray.prototype.updateLength_ = function() {
  this.set('length', this.array_.length);
};
