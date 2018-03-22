/**
 * @module ol/structs/RBush
 */
import {getUid} from '../index.js';
import rbush from 'rbush';
import {createOrUpdate, equals} from '../extent.js';
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
 * Wrapper around the RBush by Vladimir Agafonkin.
 *
 * @constructor
 * @param {number=} opt_maxEntries Max entries.
 * @see https://github.com/mourner/rbush
 * @struct
 * @template T
 */
const RBush = function(opt_maxEntries) {

  /**
   * @private
   */
  this.rbush_ = rbush(opt_maxEntries);

  /**
   * A mapping between the objects added to this rbush wrapper
   * and the objects that are actually added to the internal rbush.
   * @private
   * @type {Object.<number, module:ol/structs/RBush~Entry>}
   */
  this.items_ = {};

};


/**
 * Insert a value into the RBush.
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {T} value Value.
 */
RBush.prototype.insert = function(extent, value) {
  /** @type {module:ol/structs/RBush~Entry} */
  const item = {
    minX: extent[0],
    minY: extent[1],
    maxX: extent[2],
    maxY: extent[3],
    value: value
  };

  this.rbush_.insert(item);
  this.items_[getUid(value)] = item;
};


/**
 * Bulk-insert values into the RBush.
 * @param {Array.<module:ol/extent~Extent>} extents Extents.
 * @param {Array.<T>} values Values.
 */
RBush.prototype.load = function(extents, values) {
  const items = new Array(values.length);
  for (let i = 0, l = values.length; i < l; i++) {
    const extent = extents[i];
    const value = values[i];

    /** @type {module:ol/structs/RBush~Entry} */
    const item = {
      minX: extent[0],
      minY: extent[1],
      maxX: extent[2],
      maxY: extent[3],
      value: value
    };
    items[i] = item;
    this.items_[getUid(value)] = item;
  }
  this.rbush_.load(items);
};


/**
 * Remove a value from the RBush.
 * @param {T} value Value.
 * @return {boolean} Removed.
 */
RBush.prototype.remove = function(value) {
  const uid = getUid(value);

  // get the object in which the value was wrapped when adding to the
  // internal rbush. then use that object to do the removal.
  const item = this.items_[uid];
  delete this.items_[uid];
  return this.rbush_.remove(item) !== null;
};


/**
 * Update the extent of a value in the RBush.
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {T} value Value.
 */
RBush.prototype.update = function(extent, value) {
  const item = this.items_[getUid(value)];
  const bbox = [item.minX, item.minY, item.maxX, item.maxY];
  if (!equals(bbox, extent)) {
    this.remove(value);
    this.insert(extent, value);
  }
};


/**
 * Return all values in the RBush.
 * @return {Array.<T>} All.
 */
RBush.prototype.getAll = function() {
  const items = this.rbush_.all();
  return items.map(function(item) {
    return item.value;
  });
};


/**
 * Return all values in the given extent.
 * @param {module:ol/extent~Extent} extent Extent.
 * @return {Array.<T>} All in extent.
 */
RBush.prototype.getInExtent = function(extent) {
  /** @type {module:ol/structs/RBush~Entry} */
  const bbox = {
    minX: extent[0],
    minY: extent[1],
    maxX: extent[2],
    maxY: extent[3]
  };
  const items = this.rbush_.search(bbox);
  return items.map(function(item) {
    return item.value;
  });
};


/**
 * Calls a callback function with each value in the tree.
 * If the callback returns a truthy value, this value is returned without
 * checking the rest of the tree.
 * @param {function(this: S, T): *} callback Callback.
 * @param {S=} opt_this The object to use as `this` in `callback`.
 * @return {*} Callback return value.
 * @template S
 */
RBush.prototype.forEach = function(callback, opt_this) {
  return this.forEach_(this.getAll(), callback, opt_this);
};


/**
 * Calls a callback function with each value in the provided extent.
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {function(this: S, T): *} callback Callback.
 * @param {S=} opt_this The object to use as `this` in `callback`.
 * @return {*} Callback return value.
 * @template S
 */
RBush.prototype.forEachInExtent = function(extent, callback, opt_this) {
  return this.forEach_(this.getInExtent(extent), callback, opt_this);
};


/**
 * @param {Array.<T>} values Values.
 * @param {function(this: S, T): *} callback Callback.
 * @param {S=} opt_this The object to use as `this` in `callback`.
 * @private
 * @return {*} Callback return value.
 * @template S
 */
RBush.prototype.forEach_ = function(values, callback, opt_this) {
  let result;
  for (let i = 0, l = values.length; i < l; i++) {
    result = callback.call(opt_this, values[i]);
    if (result) {
      return result;
    }
  }
  return result;
};


/**
 * @return {boolean} Is empty.
 */
RBush.prototype.isEmpty = function() {
  return isEmpty(this.items_);
};


/**
 * Remove all values from the RBush.
 */
RBush.prototype.clear = function() {
  this.rbush_.clear();
  this.items_ = {};
};


/**
 * @param {module:ol/extent~Extent=} opt_extent Extent.
 * @return {module:ol/extent~Extent} Extent.
 */
RBush.prototype.getExtent = function(opt_extent) {
  // FIXME add getExtent() to rbush
  const data = this.rbush_.data;
  return createOrUpdate(data.minX, data.minY, data.maxX, data.maxY, opt_extent);
};


/**
 * @param {ol.structs.RBush} rbush R-Tree.
 */
RBush.prototype.concat = function(rbush) {
  this.rbush_.load(rbush.rbush_.all());
  for (const i in rbush.items_) {
    this.items_[i | 0] = rbush.items_[i | 0];
  }
};
export default RBush;
