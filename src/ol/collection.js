/**
 * An implementation of Google Maps' MVCArray.
 * @see https://developers.google.com/maps/documentation/javascript/reference
 */

goog.provide('ol.Collection');

goog.require('ol');
goog.require('ol.events.Event');
goog.require('ol.Object');


/**
 * @classdesc
 * An expanded version of standard JS Array, adding convenience methods for
 * manipulation. Add and remove changes to the Collection trigger a Collection
 * event. Note that this does not cover changes to the objects _within_ the
 * Collection; they trigger events on the appropriate object, not on the
 * Collection as a whole.
 *
 * @constructor
 * @extends {ol.Object}
 * @fires ol.Collection.Event
 * @param {!Array.<T>=} opt_array Array.
 * @template T
 * @api stable
 */
ol.Collection = function(opt_array) {

  ol.Object.call(this);

  /**
   * @private
   * @type {!Array.<T>}
   */
  this.array_ = opt_array ? opt_array : [];

  this.updateLength_();

};
ol.inherits(ol.Collection, ol.Object);


/**
 * Remove all elements from the collection.
 * @api stable
 */
ol.Collection.prototype.clear = function() {
  while (this.getLength() > 0) {
    this.pop();
  }
};


/**
 * Add elements to the collection.  This pushes each item in the provided array
 * to the end of the collection.
 * @param {!Array.<T>} arr Array.
 * @return {ol.Collection.<T>} This collection.
 * @api stable
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
 * @template S
 * @api stable
 */
ol.Collection.prototype.forEach = function(f, opt_this) {
  this.array_.forEach(f, opt_this);
};


/**
 * Get a reference to the underlying Array object. Warning: if the array
 * is mutated, no events will be dispatched by the collection, and the
 * collection's "length" property won't be in sync with the actual length
 * of the array.
 * @return {!Array.<T>} Array.
 * @api stable
 */
ol.Collection.prototype.getArray = function() {
  return this.array_;
};


/**
 * Get the element at the provided index.
 * @param {number} index Index.
 * @return {T} Element.
 * @api stable
 */
ol.Collection.prototype.item = function(index) {
  return this.array_[index];
};


/**
 * Get the length of this collection.
 * @return {number} The length of the array.
 * @observable
 * @api stable
 */
ol.Collection.prototype.getLength = function() {
  return /** @type {number} */ (this.get(ol.Collection.Property.LENGTH));
};


/**
 * Insert an element at the provided index.
 * @param {number} index Index.
 * @param {T} elem Element.
 * @api stable
 */
ol.Collection.prototype.insertAt = function(index, elem) {
  this.array_.splice(index, 0, elem);
  this.updateLength_();
  this.dispatchEvent(
      new ol.Collection.Event(ol.Collection.EventType.ADD, elem));
};


/**
 * Remove the last element of the collection and return it.
 * Return `undefined` if the collection is empty.
 * @return {T|undefined} Element.
 * @api stable
 */
ol.Collection.prototype.pop = function() {
  return this.removeAt(this.getLength() - 1);
};


/**
 * Insert the provided element at the end of the collection.
 * @param {T} elem Element.
 * @return {number} New length of the collection.
 * @api stable
 */
ol.Collection.prototype.push = function(elem) {
  var n = this.getLength();
  this.insertAt(n, elem);
  return this.getLength();
};


/**
 * Remove the first occurrence of an element from the collection.
 * @param {T} elem Element.
 * @return {T|undefined} The removed element or undefined if none found.
 * @api stable
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
 * Remove the element at the provided index and return it.
 * Return `undefined` if the collection does not contain this index.
 * @param {number} index Index.
 * @return {T|undefined} Value.
 * @api stable
 */
ol.Collection.prototype.removeAt = function(index) {
  var prev = this.array_[index];
  this.array_.splice(index, 1);
  this.updateLength_();
  this.dispatchEvent(
      new ol.Collection.Event(ol.Collection.EventType.REMOVE, prev));
  return prev;
};


/**
 * Set the element at the provided index.
 * @param {number} index Index.
 * @param {T} elem Element.
 * @api stable
 */
ol.Collection.prototype.setAt = function(index, elem) {
  var n = this.getLength();
  if (index < n) {
    var prev = this.array_[index];
    this.array_[index] = elem;
    this.dispatchEvent(
        new ol.Collection.Event(ol.Collection.EventType.REMOVE, prev));
    this.dispatchEvent(
        new ol.Collection.Event(ol.Collection.EventType.ADD, elem));
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
  this.set(ol.Collection.Property.LENGTH, this.array_.length);
};


/**
 * @enum {string}
 */
ol.Collection.Property = {
  LENGTH: 'length'
};


/**
 * @enum {string}
 */
ol.Collection.EventType = {
  /**
   * Triggered when an item is added to the collection.
   * @event ol.Collection.Event#add
   * @api stable
   */
  ADD: 'add',
  /**
   * Triggered when an item is removed from the collection.
   * @event ol.Collection.Event#remove
   * @api stable
   */
  REMOVE: 'remove'
};


/**
 * @classdesc
 * Events emitted by {@link ol.Collection} instances are instances of this
 * type.
 *
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.Collection.Event}
 * @param {ol.Collection.EventType} type Type.
 * @param {*=} opt_element Element.
 */
ol.Collection.Event = function(type, opt_element) {

  ol.events.Event.call(this, type);

  /**
   * The element that is added to or removed from the collection.
   * @type {*}
   * @api stable
   */
  this.element = opt_element;

};
ol.inherits(ol.Collection.Event, ol.events.Event);
