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
  /**
   * Triggered when an item is added to the collection.
   * @event ol.CollectionEvent#add
   * @todo api
   */
  ADD: 'add',
  /**
   * Triggered when an item is removed from the collection.
   * @event ol.CollectionEvent#remove
   * @todo api
   */
  REMOVE: 'remove'
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @implements {oli.CollectionEvent}
 * @param {ol.CollectionEventType} type Type.
 * @param {*=} opt_element Element.
 * @param {Object=} opt_target Target.
 */
ol.CollectionEvent = function(type, opt_element, opt_target) {

  goog.base(this, type, opt_target);

  /**
   * The element that is added to or removed from the collection.
   * @type {*}
   */
  this.element = opt_element;

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
 * @fires {@link ol.CollectionEvent} ol.CollectionEvent
 * @param {Array=} opt_array Array.
 * @todo observable length {number} readonly the length of the array
 * @todo api
 */
ol.Collection = function(opt_array) {

  goog.base(this);

  /**
   * @private
   * @type {Array.<*>}
   */
  this.array_ = opt_array || [];

  this.updateLength_();

};
goog.inherits(ol.Collection, ol.Object);


/**
 * Remove all elements from the collection.
 * @todo api
 */
ol.Collection.prototype.clear = function() {
  while (this.getLength() > 0) {
    this.pop();
  }
};


/**
 * @param {Array} arr Array.
 * @return {ol.Collection} This collection.
 * @todo api
 */
ol.Collection.prototype.extend = function(arr) {
  var i, ii;
  for (i = 0, ii = arr.length; i < ii; ++i) {
    this.push(arr[i]);
  }
  return this;
};


/**
 * Iterate over each element, calling the provided callback.
 * @param {function(this: S, T, number, Array.<T>): *} f The function to call
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array). The return value is ignored.
 * @param {S=} opt_this The object to use as `this` in `f`.
 * @template T,S
 * @todo api
 */
ol.Collection.prototype.forEach = function(f, opt_this) {
  goog.array.forEach(this.array_, f, opt_this);
};


/**
 * Get a reference to the underlying Array object. Warning: if the array
 * is mutated, no events will be dispatched by the collection, and the
 * collection's "length" property won't be in sync with the actual length
 * of the array.
 * @return {Array} Array.
 * @todo api
 */
ol.Collection.prototype.getArray = function() {
  return this.array_;
};


/**
 * Get the element at the provided index.
 * @param {number} index Index.
 * @return {*} Element.
 * @todo api
 */
ol.Collection.prototype.getAt = function(index) {
  return this.array_[index];
};


/**
 * Get the length of this collection.
 * @return {number} Length.
 * @todo api
 */
ol.Collection.prototype.getLength = function() {
  return /** @type {number} */ (this.get(ol.CollectionProperty.LENGTH));
};


/**
 * Insert an element at the provided index.
 * @param {number} index Index.
 * @param {*} elem Element.
 * @todo api
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
 * @todo api
 */
ol.Collection.prototype.pop = function() {
  return this.removeAt(this.getLength() - 1);
};


/**
 * Insert the provided element at the end of the collection.
 * @param {*} elem Element.
 * @return {number} Length.
 * @todo api
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
 * @todo api
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
 * @todo api
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
 * @todo api
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
