
/**
 * An implementation of Google Maps' MVCArray.
 * @see https://developers.google.com/maps/documentation/javascript/reference
 */

goog.provide('ol.Collection');
goog.provide('ol.CollectionEvent');
goog.provide('ol.CollectionEventType');

goog.require('goog.array');
goog.require('goog.events.Event');
goog.require('ol.Object');


/**
 * @enum {string}
 */
ol.CollectionEventType = {
  ADD: 'add',
  INSERT_AT: 'insert_at',
  REMOVE: 'remove',
  REMOVE_AT: 'remove_at',
  SET_AT: 'set_at'
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {ol.CollectionEventType} type Type.
 * @param {*=} opt_elem Element.
 * @param {number=} opt_index Index.
 * @param {*=} opt_prev Value.
 * @param {Object=} opt_target Target.
 */
ol.CollectionEvent =
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
goog.inherits(ol.CollectionEvent, goog.events.Event);


/**
 * @enum {string}
 */
ol.CollectionProperty = {
  LENGTH: 'length'
};



/**
 * @constructor
 * @extends {ol.Object}
 * @param {Array=} opt_array Array.
 */
ol.Collection = function(opt_array) {

  goog.base(this);

  /**
   * @private
   * @type {Array}
   */
  this.array_ = opt_array || [];

  this.updateLength_();

};
goog.inherits(ol.Collection, ol.Object);


/**
 * Remove all elements from the collection.
 */
ol.Collection.prototype.clear = function() {
  while (this.getLength() > 0) {
    this.pop();
  }
};


/**
 * @param {Function} f Function.
 * @param {Object=} opt_obj Object.
 */
ol.Collection.prototype.forEach = function(f, opt_obj) {
  goog.array.forEach(this.array_, f, opt_obj);
};


/**
 * @return {Array} Array.
 */
ol.Collection.prototype.getArray = function() {
  return this.array_;
};


/**
 * @param {number} index Index.
 * @return {*} Element.
 */
ol.Collection.prototype.getAt = function(index) {
  return this.array_[index];
};


/**
 * @return {number} Length.
 */
ol.Collection.prototype.getLength = function() {
  return /** @type {number} */ (this.get(ol.CollectionProperty.LENGTH));
};


/**
 * @param {number} index Index.
 * @param {*} elem Element.
 */
ol.Collection.prototype.insertAt = function(index, elem) {
  goog.array.insertAt(this.array_, elem, index);
  this.updateLength_();
  this.dispatchEvent(new ol.CollectionEvent(
      ol.CollectionEventType.ADD, elem, undefined, undefined, this));
  this.dispatchEvent(new ol.CollectionEvent(
      ol.CollectionEventType.INSERT_AT, elem, index, undefined, this));
};


/**
 * @return {*} Element.
 */
ol.Collection.prototype.pop = function() {
  return this.removeAt(this.getLength() - 1);
};


/**
 * @param {*} elem Element.
 * @return {number} Length.
 */
ol.Collection.prototype.push = function(elem) {
  var n = this.array_.length;
  this.insertAt(n, elem);
  return n;
};


/**
 * @param {number} index Index.
 * @return {*} Value.
 */
ol.Collection.prototype.removeAt = function(index) {
  var prev = this.array_[index];
  goog.array.removeAt(this.array_, index);
  this.updateLength_();
  this.dispatchEvent(new ol.CollectionEvent(
      ol.CollectionEventType.REMOVE, prev, undefined, undefined, this));
  this.dispatchEvent(new ol.CollectionEvent(ol.CollectionEventType.REMOVE_AT,
      undefined, index, prev, this));
  return prev;
};


/**
 * @param {number} index Index.
 * @param {*} elem Element.
 */
ol.Collection.prototype.setAt = function(index, elem) {
  var n = this.getLength();
  if (index < n) {
    var prev = this.array_[index];
    this.array_[index] = elem;
    this.dispatchEvent(new ol.CollectionEvent(ol.CollectionEventType.SET_AT,
        elem, index, prev, this));
    this.dispatchEvent(new ol.CollectionEvent(ol.CollectionEventType.REMOVE,
        prev, undefined, undefined, this));
    this.dispatchEvent(new ol.CollectionEvent(ol.CollectionEventType.ADD,
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
ol.Collection.prototype.updateLength_ = function() {
  this.set(ol.CollectionProperty.LENGTH, this.array_.length);
};
