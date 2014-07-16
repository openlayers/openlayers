// Based on rbush https://github.com/mourner/rbush
// Copyright (c) 2013 Vladimir Agafonkin
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// FIXME bulk inserts
// FIXME is level argument needed to insert_?

goog.provide('ol.structs.RBush');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.extent');



/**
 * @constructor
 * @param {ol.Extent} extent Extent.
 * @param {number} height Height.
 * @param {Array.<ol.structs.RBushNode.<T>>} children Children.
 * @param {?T} value Value.
 * @struct
 * @template T
 */
ol.structs.RBushNode = function(extent, height, children, value) {

  if (height === 0) {
    goog.asserts.assert(goog.isNull(children));
    goog.asserts.assert(!goog.isNull(value));
  } else {
    goog.asserts.assert(!goog.isNull(children));
    goog.asserts.assert(goog.isNull(value));
  }

  /**
   * @type {ol.Extent}
   */
  this.extent = extent;

  /**
   * @type {number}
   */
  this.height = height;

  /**
   * @type {Array.<ol.structs.RBushNode.<T>>}
   */
  this.children = children;

  /**
   * @type {?T}
   */
  this.value = value;

};


/**
 * @param {ol.structs.RBushNode.<T>} node1 Node 1.
 * @param {ol.structs.RBushNode.<T>} node2 Node 2.
 * @return {number} Compare minimum X.
 * @template T
 */
ol.structs.RBushNode.compareMinX = function(node1, node2) {
  return node1.extent[0] - node2.extent[0];
};


/**
 * @param {ol.structs.RBushNode.<T>} node1 Node 1.
 * @param {ol.structs.RBushNode.<T>} node2 Node 2.
 * @return {number} Compare minimum Y.
 * @template T
 */
ol.structs.RBushNode.compareMinY = function(node1, node2) {
  return node1.extent[1] - node2.extent[1];
};


/**
 * @param {number} maxEntries Max entries.
 */
ol.structs.RBushNode.prototype.assertValid = function(maxEntries) {
  if (this.height === 0) {
    goog.asserts.assert(goog.isNull(this.children));
    goog.asserts.assert(!goog.isNull(this.value));
  } else {
    goog.asserts.assert(!goog.isNull(this.children));
    goog.asserts.assert(goog.isNull(this.value));
    goog.asserts.assert(this.children.length <= maxEntries);
    var i, ii;
    for (i = 0, ii = this.children.length; i < ii; ++i) {
      var child = this.children[i];
      goog.asserts.assert(ol.extent.containsExtent(this.extent, child.extent));
      child.assertValid(maxEntries);
    }
  }
};


/**
 * @param {number} start Start.
 * @param {number} stop Stop.
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} Extent.
 */
ol.structs.RBushNode.prototype.getChildrenExtent =
    function(start, stop, opt_extent) {
  goog.asserts.assert(!this.isLeaf());
  var children = this.children;
  var extent = ol.extent.createOrUpdateEmpty(opt_extent);
  var i;
  for (i = start; i < stop; ++i) {
    ol.extent.extend(extent, children[i].extent);
  }
  return extent;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {T} value Value.
 * @param {Array.<ol.structs.RBushNode.<T>>} path Path.
 * @return {boolean} Removed.
 */
ol.structs.RBushNode.prototype.remove = function(extent, value, path) {
  var children = this.children;
  var ii = children.length;
  var child, i;
  if (this.height == 1) {
    for (i = 0; i < ii; ++i) {
      child = children[i];
      if (child.value === value) {
        goog.array.removeAt(children, i);
        return true;
      }
    }
  } else {
    goog.asserts.assert(this.height > 1);
    for (i = 0; i < ii; ++i) {
      child = children[i];
      if (ol.extent.containsExtent(child.extent, extent)) {
        path.push(child);
        if (child.remove(extent, value, path)) {
          return true;
        }
        path.pop();
      }
    }
  }
  return false;
};


/**
 * FIXME empty description for jsdoc
 */
ol.structs.RBushNode.prototype.updateExtent = function() {
  goog.asserts.assert(!this.isLeaf());
  var extent = ol.extent.createOrUpdateEmpty(this.extent);
  var children = this.children;
  var i, ii;
  for (i = 0, ii = children.length; i < ii; ++i) {
    ol.extent.extend(extent, children[i].extent);
  }
};


/**
 * @return {boolean} Is leaf.
 */
ol.structs.RBushNode.prototype.isLeaf = function() {
  return goog.isNull(this.children);
};



/**
 * @constructor
 * @param {number=} opt_maxEntries Max entries.
 * @see https://github.com/mourner/rbush
 * @struct
 * @template T
 */
ol.structs.RBush = function(opt_maxEntries) {

  /**
   * @private
   * @type {number}
   */
  this.maxEntries_ =
      Math.max(4, goog.isDef(opt_maxEntries) ? opt_maxEntries : 9);

  /**
   * @private
   * @type {number}
   */
  this.minEntries_ = Math.max(2, Math.ceil(0.4 * this.maxEntries_));

  /**
   * @private
   * @type {ol.structs.RBushNode.<T>}
   */
  this.root_ = new ol.structs.RBushNode(ol.extent.createEmpty(), 1, [], null);

  /**
   * @private
   * @type {Object.<string, ol.Extent>}
   */
  this.valueExtent_ = {};

  if (goog.DEBUG) {
    /**
     * @private
     * @type {number}
     */
    this.readers_ = 0;
  }

};


/**
 * @param {ol.structs.RBushNode.<T>} node Node.
 * @param {function(ol.structs.RBushNode.<T>, ol.structs.RBushNode.<T>): number}
 *     compare Compare.
 * @private
 * @return {number} All distance margin.
 */
ol.structs.RBush.prototype.allDistMargin_ = function(node, compare) {
  var children = node.children;
  var m = this.minEntries_;
  var M = children.length;
  var i;
  goog.array.sort(children, compare);
  var leftExtent = node.getChildrenExtent(0, m);
  var rightExtent = node.getChildrenExtent(M - m, M);
  var margin =
      ol.extent.getMargin(leftExtent) + ol.extent.getMargin(rightExtent);
  for (i = m; i < M - m; ++i) {
    ol.extent.extend(leftExtent, children[i].extent);
    margin += ol.extent.getMargin(leftExtent);
  }
  for (i = M - m - 1; i >= m; --i) {
    ol.extent.extend(rightExtent, children[i].extent);
    margin += ol.extent.getMargin(rightExtent);
  }
  return margin;
};


/**
 * FIXME empty description for jsdoc
 */
ol.structs.RBush.prototype.assertValid = function() {
  this.root_.assertValid(this.maxEntries_);
};


/**
 * @param {ol.structs.RBushNode.<T>} node Node.
 * @private
 */
ol.structs.RBush.prototype.chooseSplitAxis_ = function(node) {
  var xMargin = this.allDistMargin_(node, ol.structs.RBushNode.compareMinX);
  var yMargin = this.allDistMargin_(node, ol.structs.RBushNode.compareMinY);
  if (xMargin < yMargin) {
    goog.array.sort(node.children, ol.structs.RBushNode.compareMinX);
  }
};


/**
 * @param {ol.structs.RBushNode.<T>} node Node.
 * @private
 * @return {number} Split index.
 */
ol.structs.RBush.prototype.chooseSplitIndex_ = function(node) {
  var children = node.children;
  var m = this.minEntries_;
  var M = children.length;
  var minOverlap = Infinity;
  var minArea = Infinity;
  var extent1 = ol.extent.createEmpty();
  var extent2 = ol.extent.createEmpty();
  var index = 0;
  var i;
  for (i = m; i <= M - m; ++i) {
    extent1 = node.getChildrenExtent(0, i, extent1);
    extent2 = node.getChildrenExtent(i, M, extent2);
    var overlap = ol.extent.getIntersectionArea(extent1, extent2);
    var area = ol.extent.getArea(extent1) + ol.extent.getArea(extent2);
    if (overlap < minOverlap) {
      minOverlap = overlap;
      minArea = Math.min(area, minArea);
      index = i;
    } else if (overlap == minOverlap && area < minArea) {
      minArea = area;
      index = i;
    }
  }
  return index;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.structs.RBushNode.<T>} node Node.
 * @param {number} level Level.
 * @param {Array.<ol.structs.RBushNode.<T>>} path Path.
 * @private
 * @return {ol.structs.RBushNode.<T>} Node.
 */
ol.structs.RBush.prototype.chooseSubtree_ =
    function(extent, node, level, path) {
  while (!node.isLeaf() && path.length - 1 != level) {
    var minArea = Infinity;
    var minEnlargement = Infinity;
    var children = node.children;
    var bestChild = null;
    var i, ii;
    for (i = 0, ii = children.length; i < ii; ++i) {
      var child = children[i];
      var area = ol.extent.getArea(child.extent);
      var enlargement = ol.extent.getEnlargedArea(child.extent, extent) - area;
      if (enlargement < minEnlargement) {
        minEnlargement = enlargement;
        minArea = Math.min(area, minArea);
        bestChild = child;
      } else if (enlargement == minEnlargement && area < minArea) {
        minArea = area;
        bestChild = child;
      }
    }
    goog.asserts.assert(!goog.isNull(bestChild));
    node = bestChild;
    path.push(node);
  }
  return node;
};


/**
 * FIXME empty description for jsdoc
 */
ol.structs.RBush.prototype.clear = function() {
  var node = this.root_;
  node.extent = ol.extent.createOrUpdateEmpty(this.root_.extent);
  node.height = 1;
  node.children.length = 0;
  node.value = null;
  goog.object.clear(this.valueExtent_);
};


/**
 * @param {Array.<ol.structs.RBushNode.<T>>} path Path.
 * @private
 */
ol.structs.RBush.prototype.condense_ = function(path) {
  var i;
  for (i = path.length - 1; i >= 0; --i) {
    var node = path[i];
    if (node.children.length === 0) {
      if (i > 0) {
        goog.array.remove(path[i - 1].children, node);
      } else {
        this.clear();
      }
    } else {
      node.updateExtent();
    }
  }
};


/**
 * Calls a callback function with each node in the tree. Inside the callback,
 * no tree modifications (insert, update, remove) can be made.
 * If the callback returns a truthy value, this value is returned without
 * checking the rest of the tree.
 * @param {function(this: S, T): *} callback Callback.
 * @param {S=} opt_this The object to use as `this` in `callback`.
 * @return {*} Callback return value.
 * @template S
 */
ol.structs.RBush.prototype.forEach = function(callback, opt_this) {
  if (goog.DEBUG) {
    ++this.readers_;
    try {
      return this.forEach_(this.root_, callback, opt_this);
    } finally {
      --this.readers_;
    }
  } else {
    return this.forEach_(this.root_, callback, opt_this);
  }
};


/**
 * @param {ol.structs.RBushNode.<T>} node Node.
 * @param {function(this: S, T): *} callback Callback.
 * @param {S=} opt_this The object to use as `this` in `callback`.
 * @private
 * @return {*} Callback return value.
 * @template S
 */
ol.structs.RBush.prototype.forEach_ = function(node, callback, opt_this) {
  goog.asserts.assert(!node.isLeaf());
  /** @type {Array.<ol.structs.RBushNode.<T>>} */
  var toVisit = [node];
  var children, i, ii, result;
  while (toVisit.length > 0) {
    node = toVisit.pop();
    children = node.children;
    if (node.height == 1) {
      for (i = 0, ii = children.length; i < ii; ++i) {
        result = callback.call(opt_this, children[i].value);
        if (result) {
          return result;
        }
      }
    } else {
      toVisit.push.apply(toVisit, children);
    }
  }
};


/**
 * Calls a callback function with each node in the provided extent. Inside the
 * callback, no tree modifications (insert, update, remove) can be made.
 * @param {ol.Extent} extent Extent.
 * @param {function(this: S, T): *} callback Callback.
 * @param {S=} opt_this The object to use as `this` in `callback`.
 * @return {*} Callback return value.
 * @template S
 */
ol.structs.RBush.prototype.forEachInExtent =
    function(extent, callback, opt_this) {
  if (goog.DEBUG) {
    ++this.readers_;
    try {
      return this.forEachInExtent_(extent, callback, opt_this);
    } finally {
      --this.readers_;
    }
  } else {
    return this.forEachInExtent_(extent, callback, opt_this);
  }
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {function(this: S, T): *} callback Callback.
 * @param {S=} opt_this The object to use as `this` in `callback`.
 * @private
 * @return {*} Callback return value.
 * @template S
 */
ol.structs.RBush.prototype.forEachInExtent_ =
    function(extent, callback, opt_this) {
  /** @type {Array.<ol.structs.RBushNode.<T>>} */
  var toVisit = [this.root_];
  var result;
  while (toVisit.length > 0) {
    var node = toVisit.pop();
    if (ol.extent.intersects(extent, node.extent)) {
      if (node.isLeaf()) {
        result = callback.call(opt_this, node.value);
        if (result) {
          return result;
        }
      } else if (ol.extent.containsExtent(extent, node.extent)) {
        result = this.forEach_(node, callback, opt_this);
        if (result) {
          return result;
        }
      } else {
        toVisit.push.apply(toVisit, node.children);
      }
    }
  }
  return undefined;
};


/**
 * @param {function(this: S, ol.structs.RBushNode.<T>): *} callback Callback.
 * @param {S=} opt_this The object to use as `this` in `callback`.
 * @return {*} Callback return value.
 * @template S
 */
ol.structs.RBush.prototype.forEachNode = function(callback, opt_this) {
  /** @type {Array.<ol.structs.RBushNode.<T>>} */
  var toVisit = [this.root_];
  while (toVisit.length > 0) {
    var node = toVisit.pop();
    var result = callback.call(opt_this, node);
    if (result) {
      return result;
    }
    if (!node.isLeaf()) {
      toVisit.push.apply(toVisit, node.children);
    }
  }
  return undefined;
};


/**
 * @return {Array.<T>} All.
 */
ol.structs.RBush.prototype.getAll = function() {
  var values = [];
  this.forEach(
      /**
       * @param {T} value Value.
       */
      function(value) {
        values.push(value);
      });
  return values;
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {Array.<T>} All in extent.
 */
ol.structs.RBush.prototype.getInExtent = function(extent) {
  var values = [];
  this.forEachInExtent(extent,
      /**
       * @param {T} value Value.
       */
      function(value) {
        values.push(value);
      });
  return values;
};


/**
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} Extent.
 */
ol.structs.RBush.prototype.getExtent = function(opt_extent) {
  return ol.extent.returnOrUpdate(this.root_.extent, opt_extent);
};


/**
 * @param {T} value Value.
 * @private
 * @return {string} Key.
 */
ol.structs.RBush.prototype.getKey_ = function(value) {
  goog.asserts.assert(goog.isObject(value));
  return goog.getUid(value).toString();
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {T} value Value.
 */
ol.structs.RBush.prototype.insert = function(extent, value) {
  if (goog.DEBUG && this.readers_) {
    throw new Error('cannot insert value while reading');
  }
  var key = this.getKey_(value);
  goog.asserts.assert(!this.valueExtent_.hasOwnProperty(key));
  this.insert_(extent, value, this.root_.height - 1);
  this.valueExtent_[key] = ol.extent.clone(extent);
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {T} value Value.
 * @param {number} level Level.
 * @private
 * @return {ol.structs.RBushNode.<T>} Node.
 */
ol.structs.RBush.prototype.insert_ = function(extent, value, level) {
  /** @type {Array.<ol.structs.RBushNode.<T>>} */
  var path = [this.root_];
  var node = this.chooseSubtree_(extent, this.root_, level, path);
  node.children.push(new ol.structs.RBushNode(extent, 0, null, value));
  ol.extent.extend(node.extent, extent);
  var i;
  for (i = path.length - 1; i >= 0; --i) {
    if (path[i].children.length > this.maxEntries_) {
      this.split_(path, i);
    } else {
      break;
    }
  }
  for (; i >= 0; --i) {
    ol.extent.extend(path[i].extent, extent);
  }
  return node;
};


/**
 * @return {boolean} Is empty.
 */
ol.structs.RBush.prototype.isEmpty = function() {
  return this.root_.children.length === 0;
};


/**
 * @param {T} value Value.
 * @return {boolean} Removed.
 */
ol.structs.RBush.prototype.remove = function(value) {
  if (goog.DEBUG && this.readers_) {
    throw new Error('cannot remove value while reading');
  }
  var key = this.getKey_(value);
  goog.asserts.assert(this.valueExtent_.hasOwnProperty(key));
  var extent = this.valueExtent_[key];
  delete this.valueExtent_[key];
  return this.remove_(extent, value);
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {T} value Value.
 * @private
 * @return {boolean} Removed.
 */
ol.structs.RBush.prototype.remove_ = function(extent, value) {
  var root = this.root_;
  var path = [root];
  var removed = root.remove(extent, value, path);
  if (removed) {
    this.condense_(path);
  } else {
    goog.asserts.assert(path.length == 1);
    goog.asserts.assert(path[0] === root);
  }
  return removed;
};


/**
 * @param {Array.<ol.structs.RBushNode.<T>>} path Path.
 * @param {number} level Level.
 * @private
 */
ol.structs.RBush.prototype.split_ = function(path, level) {
  var node = path[level];
  this.chooseSplitAxis_(node);
  var splitIndex = this.chooseSplitIndex_(node);
  // FIXME too few arguments to splice here
  var newChildren = node.children.splice(splitIndex);
  var newNode = new ol.structs.RBushNode(
      ol.extent.createEmpty(), node.height, newChildren, null);
  node.updateExtent();
  newNode.updateExtent();
  if (level) {
    path[level - 1].children.push(newNode);
  } else {
    this.splitRoot_(node, newNode);
  }
};


/**
 * @param {ol.structs.RBushNode.<T>} node1 Node 1.
 * @param {ol.structs.RBushNode.<T>} node2 Node 2.
 * @private
 */
ol.structs.RBush.prototype.splitRoot_ = function(node1, node2) {
  goog.asserts.assert(node1 === this.root_);
  var height = node1.height + 1;
  var extent = ol.extent.extend(node1.extent.slice(), node2.extent);
  var children = [node1, node2];
  this.root_ = new ol.structs.RBushNode(extent, height, children, null);
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {T} value Value.
 */
ol.structs.RBush.prototype.update = function(extent, value) {
  var key = this.getKey_(value);
  var currentExtent = this.valueExtent_[key];
  goog.asserts.assert(goog.isDef(currentExtent));
  if (!ol.extent.equals(currentExtent, extent)) {
    if (goog.DEBUG && this.readers_) {
      throw new Error('cannot update extent while reading');
    }
    var removed = this.remove_(currentExtent, value);
    goog.asserts.assert(removed);
    this.insert_(extent, value, this.root_.height - 1);
    this.valueExtent_[key] = ol.extent.clone(extent, currentExtent);
  }
};
