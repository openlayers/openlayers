goog.provide('ol.structs.RTree');

goog.require('ol.Rectangle');



/**
 * @private
 * @constructor
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 * @param {ol.RTreeNode_} parent Parent node.
 * @param {number} level Level in the tree hierarchy.
 * @extends {ol.Rectangle}
 */
ol.RTreeNode_ = function(minX, minY, maxX, maxY, parent, level) {

  goog.base(this, minX, minY, maxX, maxY);

  /**
   * @type {Object}
   */
  this.object;

  /**
   * @type {string}
   */
  this.objectId;

  /**
   * @type {ol.RTreeNode_}
   */
  this.parent = parent;

  /**
   * @type {number}
   */
  this.level = level;

  /**
   * @type {Array.<ol.RTreeNode_>}
   */
  this.children = [];

};
goog.inherits(ol.RTreeNode_, ol.Rectangle);


/**
 * Find all objects intersected by a rectangle.
 * @param {ol.Rectangle} bounds Bounding box.
 * @param {Object.<string, Object>} results Target object for results.
 */
ol.RTreeNode_.prototype.find = function(bounds, results) {
  if (this.intersects(bounds)) {
    var numChildren = this.children.length;
    if (numChildren === 0) {
      results[this.objectId] = this.object;
    } else {
      for (var i = 0; i < numChildren; ++i) {
        this.children[i].find(bounds, results);
      }
    }
  }
};


/**
 * Find the appropriate node for insertion.
 * @param {ol.Rectangle} bounds Bounding box.
 * @return {ol.RTreeNode_|undefined} Matching node.
 */
ol.RTreeNode_.prototype.get = function(bounds) {
  if (this.intersects(bounds)) {
    var numChildren = this.children.length;
    if (numChildren === 0) {
      return goog.isNull(this.parent) ? this : this.parent;
    }
    var node;
    for (var i = 0; i < numChildren; ++i) {
      node = this.children[i].get(bounds);
      if (goog.isDef(node)) {
        return node;
      }
    }
    return this;
  }
};


/**
 * Update boxes up to the root to ensure correct bounding
 * @param {ol.Rectangle} bounds Bounding box.
 */
ol.RTreeNode_.prototype.update = function(bounds) {
  this.extend(bounds);
  if (!goog.isNull(this.parent)) {
    this.parent.update(bounds);
  }
};


/**
 * Divide @this node's children in half and create two new boxes containing
 * the split items. The top left will be the topmost leftmost child and the
 * bottom right will be the rightmost bottommost child.
 */
ol.RTreeNode_.prototype.divide = function() {
  var numChildren = this.children.length;
  if (numChildren === 0) {
    return;
  }

  var half = Math.ceil(numChildren / 2),
      child, node;

  for (var i = 0; i < numChildren; ++i) {
    child = this.children[i];
    if (i % half === 0) {
      node = new ol.RTreeNode_(child.minX, child.minY, child.maxX, child.maxY,
          this, this.level + 1);
      this.children.push(node);
    }
    child.parent = /** @type {ol.RTreeNode_} */ node;
    node.children.push(child);
    node.extend(child);
  }
};



/**
 * @constructor
 */
ol.structs.RTree = function() {

  /**
   * @private
   * @type {ol.RTreeNode_}
   */
  this.root_ = new ol.RTreeNode_(
      Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, null, 0);

};


/**
 * @param {ol.Rectangle} bounds Bounding box.
 * @return {Object.<string, Object>} Results for the passed bounding box.
 */
ol.structs.RTree.prototype.find = function(bounds) {
  var results = /** @type {Object.<string, Object>} */ {};
  this.root_.find(bounds, results);
  return results;
};


/**
 * @param {ol.Rectangle} bounds Bounding box.
 * @param {Object} object Object to store with the passed bounds.
 */
ol.structs.RTree.prototype.put = function(bounds, object) {
  var found = this.root_.get(bounds);
  if (found) {
    var node = new ol.RTreeNode_(
        bounds.minX, bounds.minY, bounds.maxX, bounds.maxY,
        found, found.level + 1);
    node.object = object;
    node.objectId = goog.getUid(object).toString();

    found.children.push(node);
    found.update(bounds);

    if (found.children.length >= ol.structs.RTree.MAX_OBJECTS &&
        found.level < ol.structs.RTree.MAX_SUB_DIVISIONS) {
      found.divide();
    }
  }
};


/**
 * @type {number}
 */
ol.structs.RTree.MAX_SUB_DIVISIONS = 6;


/**
 * @type {number}
 */
ol.structs.RTree.MAX_OBJECTS = 6;

