
/**
 * @fileoverview An implementation of Google Maps' MVCArray.
 * @see https://developers.google.com/maps/documentation/javascript/reference
 */

goog.provide('ol3.Collection');
goog.provide('ol3.CollectionEvent');
goog.provide('ol3.CollectionEventType');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events.Event');
goog.require('ol3.Object');


/**
 * @enum {string}
 */
ol3.CollectionEventType = {
  ADD: 'add',
  INSERT_AT: 'insert_at',
  REMOVE: 'remove',
  REMOVE_AT: 'remove_at',
  SET_AT: 'set_at'
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {ol3.CollectionEventType} type Type.
 * @param {*=} opt_elem Element.
 * @param {number=} opt_index Index.
 * @param {*=} opt_prev Value.
 * @param {Object=} opt_target Target.
 */
ol3.CollectionEvent =
    function(type, opt_elem, opt_index, opt_prev, opt_target) {

  goog.base(this, type, opt_target);

  /**
   * @type {*}
   */
  this.elem = opt_elem;

  /**
   * @type {number|undefined}
   */
  this.index = opt_index;

  /**
   * @type {*}
   */
  this.prev = opt_prev;

};
goog.inherits(ol3.CollectionEvent, goog.events.Event);


/**
 * @enum {string}
 */
ol3.CollectionProperty = {
  LENGTH: 'length'
};



/**
 * @constructor
 * @extends {ol3.Object}
 * @param {Array=} opt_array Array.
 */
ol3.Collection = function(opt_array) {

  goog.base(this);

  /**
   * @private
   * @type {Array}
   */
  this.array_ = opt_array || [];

  this.updateLength_();

};
goog.inherits(ol3.Collection, ol3.Object);


/**
 * Remove all elements from the collection.
 */
ol3.Collection.prototype.clear = function() {
  while (this[ol3.CollectionProperty.LENGTH]) {
    this.pop();
  }
};


/**
 * @param {Function} f Function.
 * @param {Object=} opt_obj Object.
 */
ol3.Collection.prototype.forEach = function(f, opt_obj) {
  goog.array.forEach(this.array_, f, opt_obj);
};


/**
 * @return {Array} Array.
 */
ol3.Collection.prototype.getArray = function() {
  return this.array_;
};


/**
 * @param {number} index Index.
 * @return {*} Element.
 */
ol3.Collection.prototype.getAt = function(index) {
  return this.array_[index];
};


/**
 * @return {number} Length.
 */
ol3.Collection.prototype.getLength = function() {
  return /** @type {number} */ this.get(ol3.CollectionProperty.LENGTH);
};


/**
 * @param {number} index Index.
 * @param {*} elem Element.
 */
ol3.Collection.prototype.insertAt = function(index, elem) {
  goog.array.insertAt(this.array_, elem, index);
  this.updateLength_();
  this.dispatchEvent(new ol3.CollectionEvent(
      ol3.CollectionEventType.ADD, elem, undefined, undefined, this));
  this.dispatchEvent(new ol3.CollectionEvent(
      ol3.CollectionEventType.INSERT_AT, elem, index, undefined, this));
};


/**
 * @return {*} Element.
 */
ol3.Collection.prototype.pop = function() {
  return this.removeAt(this.getLength() - 1);
};


/**
 * @param {*} elem Element.
 * @return {number} Length.
 */
ol3.Collection.prototype.push = function(elem) {
  var n = this.array_.length;
  this.insertAt(n, elem);
  return n;
};


/**
 * @param {number} index Index.
 * @return {*} Value.
 */
ol3.Collection.prototype.removeAt = function(index) {
  var prev = this.array_[index];
  goog.array.removeAt(this.array_, index);
  this.updateLength_();
  this.dispatchEvent(new ol3.CollectionEvent(
      ol3.CollectionEventType.REMOVE, prev, undefined, undefined, this));
  this.dispatchEvent(new ol3.CollectionEvent(ol3.CollectionEventType.REMOVE_AT,
      undefined, index, prev, this));
  return prev;
};


/**
 * @param {number} index Index.
 * @param {*} elem Element.
 */
ol3.Collection.prototype.setAt = function(index, elem) {
  var n = this[ol3.CollectionProperty.LENGTH];
  if (index < n) {
    var prev = this.array_[index];
    this.array_[index] = elem;
    this.dispatchEvent(new ol3.CollectionEvent(ol3.CollectionEventType.SET_AT,
        elem, index, prev, this));
    this.dispatchEvent(new ol3.CollectionEvent(ol3.CollectionEventType.REMOVE,
        prev, undefined, undefined, this));
    this.dispatchEvent(new ol3.CollectionEvent(ol3.CollectionEventType.ADD,
        elem, undefined, undefined, this));
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
ol3.Collection.prototype.updateLength_ = function() {
  this.set(ol3.CollectionProperty.LENGTH, this.array_.length);
};
