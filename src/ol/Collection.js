/**
 * @module ol/Collection
 */
import AssertionError from './AssertionError.js';
import BaseObject from './Object.js';
import CollectionEventType from './CollectionEventType.js';
import Event from './events/Event.js';

/**
 * @enum {string}
 * @private
 */
const Property = {
  LENGTH: 'length',
};

/**
 * @classdesc
 * Events emitted by {@link module:ol/Collection~Collection} instances are instances of this
 * type.
 */
export class CollectionEvent extends Event {
  /**
   * @param {import("./CollectionEventType.js").default} type Type.
   * @param {*} [opt_element] Element.
   * @param {number} [opt_index] The index of the added or removed element.
   */
  constructor(type, opt_element, opt_index) {
    super(type);

    /**
     * The element that is added to or removed from the collection.
     * @type {*}
     * @api
     */
    this.element = opt_element;

    /**
     * The index of the added or removed element.
     * @type {number}
     * @api
     */
    this.index = opt_index;
  }
}

/***
 * @template Return
 * @typedef {import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return> &
 *   import("./Observable").OnSignature<import("./ObjectEventType").Types|'change:length', import("./Object").ObjectEvent, Return> &
 *   import("./Observable").OnSignature<'add'|'remove', CollectionEvent, Return> &
 *   import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|import("./ObjectEventType").Types|
 *     'change:length'|'add'|'remove',Return>} CollectionOnSignature
 */

/**
 * @typedef {Object} Options
 * @property {boolean} [unique=false] Disallow the same item from being added to
 * the collection twice.
 */

/**
 * @classdesc
 * An expanded version of standard JS Array, adding convenience methods for
 * manipulation. Add and remove changes to the Collection trigger a Collection
 * event. Note that this does not cover changes to the objects _within_ the
 * Collection; they trigger events on the appropriate object, not on the
 * Collection as a whole.
 *
 * @fires CollectionEvent
 *
 * @template T
 * @api
 */
class Collection extends BaseObject {
  /**
   * @param {Array<T>} [opt_array] Array.
   * @param {Options} [opt_options] Collection options.
   */
  constructor(opt_array, opt_options) {
    super();

    /***
     * @type {CollectionOnSignature<import("./Observable.js").OnReturn>}
     */
    this.on;

    /***
     * @type {CollectionOnSignature<import("./Observable.js").OnReturn>}
     */
    this.once;

    /***
     * @type {CollectionOnSignature<void>}
     */
    this.un;

    const options = opt_options || {};

    /**
     * @private
     * @type {boolean}
     */
    this.unique_ = !!options.unique;

    /**
     * @private
     * @type {!Array<T>}
     */
    this.array_ = opt_array ? opt_array : [];

    if (this.unique_) {
      for (let i = 0, ii = this.array_.length; i < ii; ++i) {
        this.assertUnique_(this.array_[i], i);
      }
    }

    this.updateLength_();
  }

  /**
   * Remove all elements from the collection.
   * @api
   */
  clear() {
    while (this.getLength() > 0) {
      this.pop();
    }
  }

  /**
   * Add elements to the collection.  This pushes each item in the provided array
   * to the end of the collection.
   * @param {!Array<T>} arr Array.
   * @return {Collection<T>} This collection.
   * @api
   */
  extend(arr) {
    for (let i = 0, ii = arr.length; i < ii; ++i) {
      this.push(arr[i]);
    }
    return this;
  }

  /**
   * Iterate over each element, calling the provided callback.
   * @param {function(T, number, Array<T>): *} f The function to call
   *     for every element. This function takes 3 arguments (the element, the
   *     index and the array). The return value is ignored.
   * @api
   */
  forEach(f) {
    const array = this.array_;
    for (let i = 0, ii = array.length; i < ii; ++i) {
      f(array[i], i, array);
    }
  }

  /**
   * Get a reference to the underlying Array object. Warning: if the array
   * is mutated, no events will be dispatched by the collection, and the
   * collection's "length" property won't be in sync with the actual length
   * of the array.
   * @return {!Array<T>} Array.
   * @api
   */
  getArray() {
    return this.array_;
  }

  /**
   * Get the element at the provided index.
   * @param {number} index Index.
   * @return {T} Element.
   * @api
   */
  item(index) {
    return this.array_[index];
  }

  /**
   * Get the length of this collection.
   * @return {number} The length of the array.
   * @observable
   * @api
   */
  getLength() {
    return this.get(Property.LENGTH);
  }

  /**
   * Insert an element at the provided index.
   * @param {number} index Index.
   * @param {T} elem Element.
   * @api
   */
  insertAt(index, elem) {
    if (this.unique_) {
      this.assertUnique_(elem);
    }
    this.array_.splice(index, 0, elem);
    this.updateLength_();
    this.dispatchEvent(
      new CollectionEvent(CollectionEventType.ADD, elem, index)
    );
  }

  /**
   * Remove the last element of the collection and return it.
   * Return `undefined` if the collection is empty.
   * @return {T|undefined} Element.
   * @api
   */
  pop() {
    return this.removeAt(this.getLength() - 1);
  }

  /**
   * Insert the provided element at the end of the collection.
   * @param {T} elem Element.
   * @return {number} New length of the collection.
   * @api
   */
  push(elem) {
    if (this.unique_) {
      this.assertUnique_(elem);
    }
    const n = this.getLength();
    this.insertAt(n, elem);
    return this.getLength();
  }

  /**
   * Remove the first occurrence of an element from the collection.
   * @param {T} elem Element.
   * @return {T|undefined} The removed element or undefined if none found.
   * @api
   */
  remove(elem) {
    const arr = this.array_;
    for (let i = 0, ii = arr.length; i < ii; ++i) {
      if (arr[i] === elem) {
        return this.removeAt(i);
      }
    }
    return undefined;
  }

  /**
   * Remove the element at the provided index and return it.
   * Return `undefined` if the collection does not contain this index.
   * @param {number} index Index.
   * @return {T|undefined} Value.
   * @api
   */
  removeAt(index) {
    const prev = this.array_[index];
    this.array_.splice(index, 1);
    this.updateLength_();
    this.dispatchEvent(
      new CollectionEvent(CollectionEventType.REMOVE, prev, index)
    );
    return prev;
  }

  /**
   * Set the element at the provided index.
   * @param {number} index Index.
   * @param {T} elem Element.
   * @api
   */
  setAt(index, elem) {
    const n = this.getLength();
    if (index < n) {
      if (this.unique_) {
        this.assertUnique_(elem, index);
      }
      const prev = this.array_[index];
      this.array_[index] = elem;
      this.dispatchEvent(
        new CollectionEvent(CollectionEventType.REMOVE, prev, index)
      );
      this.dispatchEvent(
        new CollectionEvent(CollectionEventType.ADD, elem, index)
      );
    } else {
      for (let j = n; j < index; ++j) {
        this.insertAt(j, undefined);
      }
      this.insertAt(index, elem);
    }
  }

  /**
   * @private
   */
  updateLength_() {
    this.set(Property.LENGTH, this.array_.length);
  }

  /**
   * @private
   * @param {T} elem Element.
   * @param {number} [opt_except] Optional index to ignore.
   */
  assertUnique_(elem, opt_except) {
    for (let i = 0, ii = this.array_.length; i < ii; ++i) {
      if (this.array_[i] === elem && i !== opt_except) {
        throw new AssertionError(58);
      }
    }
  }
}

export default Collection;
