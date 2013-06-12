
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
  REMOVE: 'remove'
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {ol.CollectionEventType} type Type.
 * @param {*=} opt_elem Element.
 * @param {Object=} opt_target Target.
 */
ol.CollectionEvent = function(type, opt_elem, opt_target) {

  goog.base(this, type, opt_target);

  /**
   * @type {*}
   */
  this.elem = opt_elem;

};
goog.inherits(ol.CollectionEvent, goog.events.Event);


/**
 * @enum {string}
 */
ol.CollectionProperty = {
  LENGTH: 'length'
};



/**
 * A mutable MVC Array.
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
 * @param {Array} arr Array.
 */
ol.Collection.prototype.extend = function(arr) {
  var i, ii;
  for (i = 0, ii = arr.length; i < ii; ++i) {
    this.push(arr[i]);
  }
};


/**
 * Iterate over each element, calling the provided callback.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array). The return
 *     value is ignored.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
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
 * Get the element at the provided index.
 * @param {number} index Index.
 * @return {*} Element.
 */
ol.Collection.prototype.getAt = function(index) {
  return this.array_[index];
};


/**
 * Get the length of this collection.
 * @return {number} Length.
 */
ol.Collection.prototype.getLength = function() {
  return /** @type {number} */ (this.get(ol.CollectionProperty.LENGTH));
};


/**
 * Insert an element at the provided index.
 * @param {number} index Index.
 * @param {*} elem Element.
 */
ol.Collection.prototype.insertAt = function(index, elem) {
  goog.array.insertAt(this.array_, elem, index);
  this.updateLength_();
  this.dispatchEvent(
      new ol.CollectionEvent(ol.CollectionEventType.ADD, elem, this));
};


/**
 * Remove the last element of the collection.
 * @return {*} Element.
 */
ol.Collection.prototype.pop = function() {
  return this.removeAt(this.getLength() - 1);
};


/**
 * Insert the provided element at the end of the collection.
 * @param {*} elem Element.
 * @return {number} Length.
 */
ol.Collection.prototype.push = function(elem) {
  var n = this.array_.length;
  this.insertAt(n, elem);
  return n;
};


/**
 * Removes the first occurence of elem from the collection.
 * @param {*} elem Element.
 * @return {*} The removed element or undefined if elem was not found.
 */
ol.Collection.prototype.remove = function(elem) {
  var arr = this.array_;
  var i, ii;
  for (i = 0, ii = arr.length; i < ii; ++i) {
    if (arr[i] === elem) {
      return this.removeAt(i);
    }
  }
  return undefined;
};


/**
 * Remove the element at the provided index.
 * @param {number} index Index.
 * @return {*} Value.
 */
ol.Collection.prototype.removeAt = function(index) {
  var prev = this.array_[index];
  goog.array.removeAt(this.array_, index);
  this.updateLength_();
  this.dispatchEvent(
      new ol.CollectionEvent(ol.CollectionEventType.REMOVE, prev, this));
  return prev;
};


/**
 * Set the element at the provided index.
 * @param {number} index Index.
 * @param {*} elem Element.
 */
ol.Collection.prototype.setAt = function(index, elem) {
  var n = this.getLength();
  if (index < n) {
    var prev = this.array_[index];
    this.array_[index] = elem;
    this.dispatchEvent(
        new ol.CollectionEvent(ol.CollectionEventType.REMOVE, prev, this));
    this.dispatchEvent(
        new ol.CollectionEvent(ol.CollectionEventType.ADD, elem, this));
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
