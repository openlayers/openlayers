/**
 * @module ol/structs/RBush
 */
import RBush_ from 'rbush';
import {createOrUpdate, equals} from '../extent.js';
import {getUid} from '../util.js';
import {isEmpty} from '../obj.js';

/**
 * @typedef {Object} Entry
 * @property {number} minX
 * @property {number} minY
 * @property {number} maxX
 * @property {number} maxY
 * @property {Object} [value]
 */

/**
 * @classdesc
 * Wrapper around the RBush by Vladimir Agafonkin.
 * See https://github.com/mourner/rbush.
 *
 * @template T
 */
class RBush {
  /**
   * @param {number=} opt_maxEntries Max entries.
   */
  constructor(opt_maxEntries) {
    /**
     * @private
     */
    this.rbush_ = new RBush_(opt_maxEntries);

    /**
     * A mapping between the objects added to this rbush wrapper
     * and the objects that are actually added to the internal rbush.
     * @private
     * @type {Object<string, Entry>}
     */
    this.items_ = {};
  }

  /**
   * Insert a value into the RBush.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {T} value Value.
   */
  insert(extent, value) {
    /** @type {Entry} */
    const item = {
      minX: extent[0],
      minY: extent[1],
      maxX: extent[2],
      maxY: extent[3],
      value: value,
    };

    this.rbush_.insert(item);
    this.items_[getUid(value)] = item;
  }

  /**
   * Bulk-insert values into the RBush.
   * @param {Array<import("../extent.js").Extent>} extents Extents.
   * @param {Array<T>} values Values.
   */
  load(extents, values) {
    const items = new Array(values.length);
    for (let i = 0, l = values.length; i < l; i++) {
      const extent = extents[i];
      const value = values[i];

      /** @type {Entry} */
      const item = {
        minX: extent[0],
        minY: extent[1],
        maxX: extent[2],
        maxY: extent[3],
        value: value,
      };
      items[i] = item;
      this.items_[getUid(value)] = item;
    }
    this.rbush_.load(items);
  }

  /**
   * Remove a value from the RBush.
   * @param {T} value Value.
   * @return {boolean} Removed.
   */
  remove(value) {
    const uid = getUid(value);

    // get the object in which the value was wrapped when adding to the
    // internal rbush. then use that object to do the removal.
    const item = this.items_[uid];
    delete this.items_[uid];
    return this.rbush_.remove(item) !== null;
  }

  /**
   * Update the extent of a value in the RBush.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {T} value Value.
   */
  update(extent, value) {
    const item = this.items_[getUid(value)];
    const bbox = [item.minX, item.minY, item.maxX, item.maxY];
    if (!equals(bbox, extent)) {
      this.remove(value);
      this.insert(extent, value);
    }
  }

  /**
   * Return all values in the RBush.
   * @return {Array<T>} All.
   */
  getAll() {
    const items = this.rbush_.all();
    return items.map(function (item) {
      return item.value;
    });
  }

  /**
   * Return all values in the given extent.
   * @param {import("../extent.js").Extent} extent Extent.
   * @return {Array<T>} All in extent.
   */
  getInExtent(extent) {
    /** @type {Entry} */
    const bbox = {
      minX: extent[0],
      minY: extent[1],
      maxX: extent[2],
      maxY: extent[3],
    };
    const items = this.rbush_.search(bbox);
    return items.map(function (item) {
      return item.value;
    });
  }

  /**
   * Calls a callback function with each value in the tree.
   * If the callback returns a truthy value, this value is returned without
   * checking the rest of the tree.
   * @param {function(T): *} callback Callback.
   * @return {*} Callback return value.
   */
  forEach(callback) {
    return this.forEach_(this.getAll(), callback);
  }

  /**
   * Calls a callback function with each value in the provided extent.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {function(T): *} callback Callback.
   * @return {*} Callback return value.
   */
  forEachInExtent(extent, callback) {
    return this.forEach_(this.getInExtent(extent), callback);
  }

  /**
   * @param {Array<T>} values Values.
   * @param {function(T): *} callback Callback.
   * @private
   * @return {*} Callback return value.
   */
  forEach_(values, callback) {
    let result;
    for (let i = 0, l = values.length; i < l; i++) {
      result = callback(values[i]);
      if (result) {
        return result;
      }
    }
    return result;
  }

  /**
   * @return {boolean} Is empty.
   */
  isEmpty() {
    return isEmpty(this.items_);
  }

  /**
   * Remove all values from the RBush.
   */
  clear() {
    this.rbush_.clear();
    this.items_ = {};
  }

  /**
   * @param {import("../extent.js").Extent=} opt_extent Extent.
   * @return {import("../extent.js").Extent} Extent.
   */
  getExtent(opt_extent) {
    const data = this.rbush_.toJSON();
    return createOrUpdate(
      data.minX,
      data.minY,
      data.maxX,
      data.maxY,
      opt_extent
    );
  }

  /**
   * @param {RBush} rbush R-Tree.
   */
  concat(rbush) {
    this.rbush_.load(rbush.rbush_.all());
    for (const i in rbush.items_) {
      this.items_[i] = rbush.items_[i];
    }
  }
}

export default RBush;
