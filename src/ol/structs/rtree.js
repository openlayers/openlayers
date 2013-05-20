/******************************************************************************
  rtree.js - General-Purpose Non-Recursive Javascript R-Tree Library
  Version 0.6.2, December 5st 2009

  Copyright (c) 2009 Jon-Carlos Rivera

  Permission is hereby granted, free of charge, to any person obtaining
  a copy of this software and associated documentation files (the
  "Software"), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so, subject to
  the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

  Jon-Carlos Rivera - imbcmdth@hotmail.com
******************************************************************************/


goog.provide('ol.structs.RTree');

goog.require('goog.array');
goog.require('ol.extent');


/**
 * @typedef {{extent: (ol.Extent), leaf: (Object|undefined),
 *     nodes: (Array.<ol.structs.RTreeNode>|undefined),
 *     target: (Object|undefined), type: (string|undefined)}}
 */
ol.structs.RTreeNode;



/**
 * @param {number=} opt_width Width before a node is split. Default is 6.
 * @constructor
 */
ol.structs.RTree = function(opt_width) {
  // Variables to control tree-dimensions
  var minWidth = 3;  // Minimum width of any node before a merge
  var maxWidth = 6;  // Maximum width of any node before a split
  if (!isNaN(opt_width)) {
    minWidth = Math.floor(opt_width / 2);
    maxWidth = opt_width;
  }
  // Start with an empty root-tree
  var rootTree = /** @type {ol.structs.RTreeNode} */
      ({extent: [0, 0, 0, 0], nodes: []});

  /**
   * This is Jon-Carlos Rivera's special addition to the world of r-trees.
   * Every other (simple) method he found produced crap trees.
   * This skews insertions to prefering squarer and emptier nodes.
   *
   * @param {number} l L.
   * @param {number} w W.
   * @param {number} fill Fill.
   * @return {number} Squarified ratio.
   */
  var squarifiedRatio = function(l, w, fill) {
    // Area of new enlarged rectangle
    var peri = (l + w) / 2; // Average size of a side of the new rectangle
    var area = l * w; // Area of new rectangle
    // return the ratio of the perimeter to the area - the closer to 1 we are,
    // the more "square" a rectangle is. conversly, when approaching zero the
    // more elongated a rectangle is
    var geo = area / (peri * peri);
    return area * fill / geo;
  };

  /**
   * Generates a minimally bounding rectangle for all rectangles in
   * array "nodes". `rect` is modified into the MBR.
   *
   * @param {Array} nodes Nodes.
   * @param {ol.structs.RTreeNode} rect Rectangle.
   * @return {ol.structs.RTreeNode} Rectangle.
   */
  var makeMBR = function(nodes, rect) {
    if (nodes.length < 1) {
      return {extent: [0, 0, 0, 0]};
    }
    rect.extent = goog.array.concat(nodes[0].extent);

    for (var i = nodes.length - 1; i > 0; --i) {
      ol.extent.extend(rect.extent, nodes[i].extent);
    }

    return rect;
  };

  /**
   * Find the best specific node(s) for object to be deleted from.
   *
   * @param {ol.structs.RTreeNode} rect Rectangle.
   * @param {Object} obj Object.
   * @param {ol.structs.RTreeNode} root Root to start search.
   * @return {Array} Leaf node parent.
   */
  var removeSubtree = function(rect, obj, root) {
    var hitStack = []; // Contains the elements that overlap
    var countStack = []; // Contains the elements that overlap
    var returnArray = [];
    var currentDepth = 1;

    if (!rect || !ol.extent.intersects(rect.extent, root.extent)) {
      return returnArray;
    }

    /** @type {ol.structs.RTreeNode} */
    var workingObject = /** @type {ol.structs.RTreeNode} */
        ({extent: goog.array.concat(rect), target: obj});

    countStack.push(root.nodes.length);
    hitStack.push(root);

    do {
      var tree = hitStack.pop();
      var i = countStack.pop() - 1;

      if (goog.isDef(workingObject.target)) {
        // We are searching for a target
        while (i >= 0) {
          var lTree = tree.nodes[i];
          if (ol.extent.intersects(workingObject.extent, lTree.extent)) {
            if ((workingObject.target && goog.isDef(lTree.leaf) &&
                lTree.leaf === workingObject.target) ||
                (!workingObject.target && (goog.isDef(lTree.leaf) ||
                ol.extent.containsExtent(workingObject.extent, lTree.extent))))
            { // A Match !!
              // Yup we found a match...
              // we can cancel search and start walking up the list
              if (goog.isDef(lTree.nodes)) {
                // If we are deleting a node not a leaf...
                returnArray = searchSubtree(lTree, true, [], lTree);
                tree.nodes.splice(i, 1);
              } else {
                returnArray = tree.nodes.splice(i, 1);
              }
              // Resize MBR down...
              makeMBR(tree.nodes, tree);
              workingObject.target = undefined;
              if (tree.nodes.length < minWidth) { // Underflow
                workingObject.nodes = /** @type {Array} */
                    (searchSubtree(tree, true, [], tree));
              }
              break;
            } else if (goog.isDef(lTree.nodes)) {
              // Not a Leaf
              currentDepth += 1;
              countStack.push(i);
              hitStack.push(tree);
              tree = lTree;
              i = lTree.nodes.length;
            }
          }
          i -= 1;
        }
      } else if (goog.isDef(workingObject.nodes)) {
        // We are unsplitting
        tree.nodes.splice(i + 1, 1); // Remove unsplit node
        // workingObject.nodes contains a list of elements removed from the
        // tree so far
        if (tree.nodes.length > 0)
          makeMBR(tree.nodes, tree);
        for (var t = 0, tt = workingObject.nodes.length; t < tt; ++t)
          insertSubtree(workingObject.nodes[t], tree);
        workingObject.nodes.length = 0;
        if (hitStack.length === 0 && tree.nodes.length <= 1) {
          // Underflow..on root!
          workingObject.nodes = /** @type {Array} */
              (searchSubtree(tree, true, workingObject.nodes, tree));
          tree.nodes.length = 0;
          hitStack.push(tree);
          countStack.push(1);
        } else if (hitStack.length > 0 && tree.nodes.length < minWidth) {
          // Underflow..AGAIN!
          workingObject.nodes = /** @type {Array} */
              (searchSubtree(tree, true, workingObject.nodes, tree));
          tree.nodes.length = 0;
        } else {
          workingObject.nodes = undefined; // Just start resizing
        }
      } else { // we are just resizing
        makeMBR(tree.nodes, tree);
      }
      currentDepth -= 1;
    } while (hitStack.length > 0);

    return returnArray;
  };

  /**
   * Choose the best damn node for rectangle to be inserted into.
   *
   * @param {ol.structs.RTreeNode} rect Rectangle.
   * @param {ol.structs.RTreeNode} root Root to start search.
   * @return {Array} Leaf node parent.
   */
  var chooseLeafSubtree = function(rect, root) {
    var bestChoiceIndex = -1;
    var bestChoiceStack = [];
    var bestChoiceArea;

    bestChoiceStack.push(root);
    var nodes = root.nodes;

    do {
      if (bestChoiceIndex != -1) {
        bestChoiceStack.push(nodes[bestChoiceIndex]);
        nodes = nodes[bestChoiceIndex].nodes;
        bestChoiceIndex = -1;
      }

      for (var i = nodes.length - 1; i >= 0; --i) {
        var lTree = nodes[i];
        if (goog.isDef(lTree.leaf)) {
          // Bail out of everything and start inserting
          bestChoiceIndex = -1;
          break;
        }
        // Area of new enlarged rectangle
        var oldLRatio = squarifiedRatio(lTree.extent[1] - lTree.extent[0],
            lTree.extent[3] - lTree.extent[2], lTree.nodes.length + 1);

        // Enlarge rectangle to fit new rectangle
        var nw = (lTree.extent[1] > rect.extent[1] ?
            lTree.extent[1] : rect.extent[1]) -
            (lTree.extent[0] < rect.extent[0] ?
            lTree.extent[0] : rect.extent[0]);
        var nh = (lTree.extent[3] > rect.extent[3] ?
            lTree.extent[3] : rect.extent[3]) -
            (lTree.extent[2] < rect.extent[2] ?
            lTree.extent[2] : rect.extent[2]);

        // Area of new enlarged rectangle
        var lRatio = squarifiedRatio(nw, nh, lTree.nodes.length + 2);

        if (bestChoiceIndex < 0 ||
            Math.abs(lRatio - oldLRatio) < bestChoiceArea) {
          bestChoiceArea = Math.abs(lRatio - oldLRatio);
          bestChoiceIndex = i;
        }
      }
    } while (bestChoiceIndex != -1);

    return bestChoiceStack;
  };

  /**
   * Split a set of nodes into two roughly equally-filled nodes.
   *
   * @param {Array.<ol.structs.RTreeNode>} nodes Array of nodes.
   * @return {Array.<Array.<ol.structs.RTreeNode>>} An array of two new arrays
   *     of nodes.
   */
  var linearSplit = function(nodes) {
    var n = pickLinear(nodes);
    while (nodes.length > 0) {
      pickNext(nodes, n[0], n[1]);
    }
    return n;
  };

  /**
   * Insert the best source rectangle into the best fitting parent node: a or b.
   *
   * @param {Array.<ol.structs.RTreeNode>} nodes Source node array.
   * @param {ol.structs.RTreeNode} a Target node array a.
   * @param {ol.structs.RTreeNode} b Target node array b.
   */
  var pickNext = function(nodes, a, b) {
    // Area of new enlarged rectangle
    var areaA = squarifiedRatio(a.extent[1] - a.extent[0],
        a.extent[3] - a.extent[2], a.nodes.length + 1);
    var areaB = squarifiedRatio(b.extent[1] - b.extent[0],
        b.extent[3] - b.extent[2], b.nodes.length + 1);
    var highAreaDelta;
    var highAreaNode;
    var lowestGrowthGroup;

    for (var i = nodes.length - 1; i >= 0; --i) {
      var l = nodes[i];

      var newAreaA = [
        a.extent[0] < l.extent[0] ? a.extent[0] : l.extent[0],
        a.extent[1] > l.extent[1] ? a.extent[1] : l.extent[1],
        a.extent[2] < l.extent[2] ? a.extent[2] : l.extent[2],
        a.extent[3] > l.extent[3] ? a.extent[3] : l.extent[3]
      ];
      var changeNewAreaA = Math.abs(squarifiedRatio(newAreaA[1] - newAreaA[0],
          newAreaA[3] - newAreaA[2], a.nodes.length + 2) - areaA);

      var newAreaB = [
        b.extent[0] < l.extent[0] ? b.extent[0] : l.extent[0],
        b.extent[1] > l.extent[1] ? b.extent[1] : l.extent[1],
        b.extent[2] < l.extent[2] ? b.extent[2] : l.extent[2],
        b.extent[3] > l.extent[3] ? b.extent[3] : l.extent[3]
      ];
      var changeNewAreaB = Math.abs(squarifiedRatio(
          newAreaB[1] - newAreaB[0], newAreaB[3] - newAreaB[2],
          b.nodes.length + 2) - areaB);

      if (!highAreaNode || !highAreaDelta ||
          Math.abs(changeNewAreaB - changeNewAreaA) < highAreaDelta) {
        highAreaNode = i;
        highAreaDelta = Math.abs(changeNewAreaB - changeNewAreaA);
        lowestGrowthGroup = changeNewAreaB < changeNewAreaA ? b : a;
      }
    }
    var tempNode = nodes.splice(highAreaNode, 1)[0];
    if (a.nodes.length + nodes.length + 1 <= minWidth) {
      a.nodes.push(tempNode);
      ol.extent.extend(a.extent, tempNode.extent);
    } else if (b.nodes.length + nodes.length + 1 <= minWidth) {
      b.nodes.push(tempNode);
      ol.extent.extend(b.extent, tempNode.extent);
    }
    else {
      lowestGrowthGroup.nodes.push(tempNode);
      ol.extent.extend(lowestGrowthGroup.extent, tempNode.extent);
    }
  };

  /**
   * Pick the "best" two starter nodes to use as seeds using the "linear"
   * criteria.
   *
   * @param {Array.<ol.structs.RTreeNode>} nodes Array of source nodes.
   * @return {Array.<ol.structs.RTreeNode>} An array of two new arrays
   *     of nodes.
   */
  var pickLinear = function(nodes) {
    var lowestHighX = nodes.length - 1;
    var highestLowX = 0;
    var lowestHighY = nodes.length - 1;
    var highestLowY = 0;
    var t1, t2;

    for (var i = nodes.length - 2; i >= 0; --i) {
      var l = nodes[i];
      if (l.extent[0] > nodes[highestLowX].extent[0]) {
        highestLowX = i;
      } else if (l.extent[1] < nodes[lowestHighX].extent[2]) {
        lowestHighX = i;
      }
      if (l.extent[2] > nodes[highestLowY].extent[2]) {
        highestLowY = i;
      } else if (l.extent[3] < nodes[lowestHighY].extent[3]) {
        lowestHighY = i;
      }
    }
    var dx = Math.abs(nodes[lowestHighX].extent[1] -
        nodes[highestLowX].extent[0]);
    var dy = Math.abs(nodes[lowestHighY].extent[3] -
        nodes[highestLowY].extent[2]);
    if (dx > dy) {
      if (lowestHighX > highestLowX) {
        t1 = nodes.splice(lowestHighX, 1)[0];
        t2 = nodes.splice(highestLowX, 1)[0];
      } else {
        t2 = nodes.splice(highestLowX, 1)[0];
        t1 = nodes.splice(lowestHighX, 1)[0];
      }
    } else {
      if (lowestHighY > highestLowY) {
        t1 = nodes.splice(lowestHighY, 1)[0];
        t2 = nodes.splice(highestLowY, 1)[0];
      } else {
        t2 = nodes.splice(highestLowY, 1)[0];
        t1 = nodes.splice(lowestHighY, 1)[0];
      }
    }
    return [
      /** @type {ol.structs.RTreeNode} */
      ({extent: goog.array.concat(t1.extent), nodes: [t1]}),
      /** @type {ol.structs.RTreeNode} */
      ({extent: goog.array.concat(t2.extent), nodes: [t2]})
    ];
  };


  /**
   * Non-recursive internal search function
   *
   * @param {ol.structs.RTreeNode} rect Rectangle.
   * @param {boolean} returnNode Do we return nodes?
   * @param {Array|Object} result Result.
   * @param {ol.structs.RTreeNode} root Root.
   * @param {string=} opt_type Optional type to search for.
   * @return {Array|Object} Result.
   */
  var searchSubtree = function(rect, returnNode, result, root, opt_type) {
    var hitStack = []; // Contains the elements that overlap

    if (!ol.extent.intersects(rect.extent, root.extent)) {
      return result;
    }

    hitStack.push(root.nodes);

    do {
      var nodes = hitStack.pop();

      for (var i = nodes.length - 1; i >= 0; --i) {
        var lTree = nodes[i];
        if (ol.extent.intersects(rect.extent, lTree.extent)) {
          if (goog.isDef(lTree.nodes)) { // Not a Leaf
            hitStack.push(lTree.nodes);
          } else if (goog.isDef(lTree.leaf)) { // A Leaf !!
            if (!returnNode) {
              // TODO keep track of type on all nodes so we don't have to
              // walk all the way in to the leaf to know that we don't need it
              if (!goog.isDef(opt_type) || lTree.type == opt_type) {
                var obj = lTree.leaf;
                result[goog.getUid(obj).toString()] = obj;
              }
            } else {
              result.push(lTree);
            }
          }
        }
      }
    } while (hitStack.length > 0);

    return result;
  };

  /**
   * Non-recursive internal insert function.
   *
   * @param {ol.structs.RTreeNode} node Node to insert.
   * @param {ol.structs.RTreeNode} root Root to begin insertion at.
   */
  var insertSubtree = function(node, root) {
    var bc; // Best Current node
    // Initial insertion is special because we resize the Tree and we don't
    // care about any overflow (seriously, how can the first object overflow?)
    if (root.nodes.length === 0) {
      root.extent = goog.array.concat(node.extent);
      root.nodes.push(node);
      return;
    }

    // Find the best fitting leaf node
    // chooseLeaf returns an array of all tree levels (including root)
    // that were traversed while trying to find the leaf
    var treeStack = chooseLeafSubtree(node, root);
    var workingObject = node;

    // Walk back up the tree resizing and inserting as needed
    do {
      //handle the case of an empty node (from a split)
      if (bc && goog.isDef(bc.nodes) && bc.nodes.length === 0) {
        var pbc = bc; // Past bc
        bc = treeStack.pop();
        for (var t = 0, tt = bc.nodes.length; t < tt; ++t) {
          if (bc.nodes[t] === pbc || bc.nodes[t].nodes.length === 0) {
            bc.nodes.splice(t, 1);
            break;
          }
        }
      } else {
        bc = treeStack.pop();
      }

      // If there is data attached to this workingObject
      var isArray = goog.isArray(workingObject);
      if (goog.isDef(workingObject.leaf) ||
          goog.isDef(workingObject.nodes) || isArray) {
        // Do Insert
        if (isArray) {
          for (var ai = 0, aii = workingObject.length; ai < aii; ++ai) {
            ol.extent.extend(bc.extent, workingObject[ai].extent);
          }
          bc.nodes = bc.nodes.concat(workingObject);
        } else {
          ol.extent.extend(bc.extent, workingObject.extent);
          bc.nodes.push(workingObject); // Do Insert
        }

        if (bc.nodes.length <= maxWidth) { // Start Resizeing Up the Tree
          workingObject = {extent: goog.array.concat(bc.extent)};
        } else { // Otherwise Split this Node
          // linearSplit() returns an array containing two new nodes
          // formed from the split of the previous node's overflow
          var a = linearSplit(bc.nodes);
          workingObject = a;//[1];

          if (treeStack.length < 1) { // If are splitting the root..
            bc.nodes.push(a[0]);
            treeStack.push(bc);     // Reconsider the root element
            workingObject = a[1];
          }
        }
      } else { // Otherwise Do Resize
        //Just keep applying the new bounding rectangle to the parents..
        ol.extent.extend(bc.extent, workingObject.extent);
        workingObject = ({extent: goog.array.concat(bc.extent)});
      }
    } while (treeStack.length > 0);
  };

  /**
   * Non-recursive search function
   *
   * @param {ol.Extent} extent Extent.
   * @param {string=} opt_type Optional type of the objects we want to find.
   * @return {Object} Result. Keys are UIDs of the values.
   * @this {ol.structs.RTree}
   */
  this.find = function(extent, opt_type) {
    var rect = ({extent: extent});
    return searchSubtree.apply(this, [rect, false, {}, rootTree, opt_type]);
  };

  /**
   * Non-recursive function that deletes a specific region.
   *
   * @param {ol.structs.RTreeNode} rect Rectangle.
   * @param {Object=} opt_obj Object.
   * @return {Array} Result.
   * @this {ol.structs.RTree}
   */
  this.remove = function(rect, opt_obj) {
    switch (arguments.length) {
      case 1:
        arguments[1] = false; // opt_obj == false for conditionals
      case 2:
        arguments[2] = rootTree; // Add root node to end of argument list
      default:
        arguments.length = 3;
    }
    if (arguments[1] === false) { // Do area-wide †
      var numberDeleted = 0;
      var result = [];
      do {
        numberDeleted = result.length;
        result = result.concat(removeSubtree.apply(this, arguments));
      } while (numberDeleted != result.length);
      return result;
    } else { // Delete a specific item
      return removeSubtree.apply(this, arguments);
    }
  };

  /**
   * Non-recursive insert function.
   *
   * @param {ol.Extent} extent Extent.
   * @param {Object} obj Object to insert.
   * @param {string=} opt_type Optional type to store along with the object.
   */
  this.put = function(extent, obj, opt_type) {
    var node = ({extent: extent, leaf: obj});
    if (goog.isDef(opt_type)) {
      node.type = opt_type;
    }
    insertSubtree(node, rootTree);
  };

  //End of RTree
};
