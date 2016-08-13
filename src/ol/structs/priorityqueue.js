goog.provide('ol.structs.PriorityQueue');

goog.require('ol.asserts');
goog.require('ol.obj');


/**
 * Priority queue.
 *
 * The implementation is inspired from the Closure Library's Heap class and
 * Python's heapq module.
 *
 * @see http://closure-library.googlecode.com/svn/docs/closure_goog_structs_heap.js.source.html
 * @see http://hg.python.org/cpython/file/2.7/Lib/heapq.py
 *
 * @constructor
 * @param {function(T): number} priorityFunction Priority function.
 * @param {function(T): string} keyFunction Key function.
 * @struct
 * @template T
 */
ol.structs.PriorityQueue = function(priorityFunction, keyFunction) {

  /**
   * @type {function(T): number}
   * @private
   */
  this.priorityFunction_ = priorityFunction;

  /**
   * @type {function(T): string}
   * @private
   */
  this.keyFunction_ = keyFunction;

  /**
   * @type {Array.<T>}
   * @private
   */
  this.elements_ = [];

  /**
   * @type {Array.<number>}
   * @private
   */
  this.priorities_ = [];

  /**
   * @type {Object.<string, boolean>}
   * @private
   */
  this.queuedElements_ = {};

};


/**
 * @const
 * @type {number}
 */
ol.structs.PriorityQueue.DROP = Infinity;


if (goog.DEBUG) {
  /**
   * FIXME empty description for jsdoc
   */
  ol.structs.PriorityQueue.prototype.assertValid = function() {
    var elements = this.elements_;
    var priorities = this.priorities_;
    var n = elements.length;
    console.assert(priorities.length == n);
    var i, priority;
    for (i = 0; i < (n >> 1) - 1; ++i) {
      priority = priorities[i];
      console.assert(priority <= priorities[this.getLeftChildIndex_(i)],
          'priority smaller than or equal to priority of left child (%s <= %s)',
          priority, priorities[this.getLeftChildIndex_(i)]);
      console.assert(priority <= priorities[this.getRightChildIndex_(i)],
          'priority smaller than or equal to priority of right child (%s <= %s)',
          priority, priorities[this.getRightChildIndex_(i)]);
    }
  };
}


/**
 * FIXME empty description for jsdoc
 */
ol.structs.PriorityQueue.prototype.clear = function() {
  this.elements_.length = 0;
  this.priorities_.length = 0;
  ol.obj.clear(this.queuedElements_);
};


/**
 * Remove and return the highest-priority element. O(log N).
 * @return {T} Element.
 */
ol.structs.PriorityQueue.prototype.dequeue = function() {
  var elements = this.elements_;
  goog.DEBUG && console.assert(elements.length > 0,
      'must have elements in order to be able to dequeue');
  var priorities = this.priorities_;
  var element = elements[0];
  if (elements.length == 1) {
    elements.length = 0;
    priorities.length = 0;
  } else {
    elements[0] = elements.pop();
    priorities[0] = priorities.pop();
    this.siftUp_(0);
  }
  var elementKey = this.keyFunction_(element);
  goog.DEBUG && console.assert(elementKey in this.queuedElements_,
      'key %s is not listed as queued', elementKey);
  delete this.queuedElements_[elementKey];
  return element;
};


/**
 * Enqueue an element. O(log N).
 * @param {T} element Element.
 * @return {boolean} The element was added to the queue.
 */
ol.structs.PriorityQueue.prototype.enqueue = function(element) {
  ol.asserts.assert(!(this.keyFunction_(element) in this.queuedElements_),
      31); // Tried to enqueue an `element` that was already added to the queue
  var priority = this.priorityFunction_(element);
  if (priority != ol.structs.PriorityQueue.DROP) {
    this.elements_.push(element);
    this.priorities_.push(priority);
    this.queuedElements_[this.keyFunction_(element)] = true;
    this.siftDown_(0, this.elements_.length - 1);
    return true;
  }
  return false;
};


/**
 * @return {number} Count.
 */
ol.structs.PriorityQueue.prototype.getCount = function() {
  return this.elements_.length;
};


/**
 * Gets the index of the left child of the node at the given index.
 * @param {number} index The index of the node to get the left child for.
 * @return {number} The index of the left child.
 * @private
 */
ol.structs.PriorityQueue.prototype.getLeftChildIndex_ = function(index) {
  return index * 2 + 1;
};


/**
 * Gets the index of the right child of the node at the given index.
 * @param {number} index The index of the node to get the right child for.
 * @return {number} The index of the right child.
 * @private
 */
ol.structs.PriorityQueue.prototype.getRightChildIndex_ = function(index) {
  return index * 2 + 2;
};


/**
 * Gets the index of the parent of the node at the given index.
 * @param {number} index The index of the node to get the parent for.
 * @return {number} The index of the parent.
 * @private
 */
ol.structs.PriorityQueue.prototype.getParentIndex_ = function(index) {
  return (index - 1) >> 1;
};


/**
 * Make this a heap. O(N).
 * @private
 */
ol.structs.PriorityQueue.prototype.heapify_ = function() {
  var i;
  for (i = (this.elements_.length >> 1) - 1; i >= 0; i--) {
    this.siftUp_(i);
  }
};


/**
 * @return {boolean} Is empty.
 */
ol.structs.PriorityQueue.prototype.isEmpty = function() {
  return this.elements_.length === 0;
};


/**
 * @param {string} key Key.
 * @return {boolean} Is key queued.
 */
ol.structs.PriorityQueue.prototype.isKeyQueued = function(key) {
  return key in this.queuedElements_;
};


/**
 * @param {T} element Element.
 * @return {boolean} Is queued.
 */
ol.structs.PriorityQueue.prototype.isQueued = function(element) {
  return this.isKeyQueued(this.keyFunction_(element));
};


/**
 * @param {number} index The index of the node to move down.
 * @private
 */
ol.structs.PriorityQueue.prototype.siftUp_ = function(index) {
  var elements = this.elements_;
  var priorities = this.priorities_;
  var count = elements.length;
  var element = elements[index];
  var priority = priorities[index];
  var startIndex = index;

  while (index < (count >> 1)) {
    var lIndex = this.getLeftChildIndex_(index);
    var rIndex = this.getRightChildIndex_(index);

    var smallerChildIndex = rIndex < count &&
        priorities[rIndex] < priorities[lIndex] ?
        rIndex : lIndex;

    elements[index] = elements[smallerChildIndex];
    priorities[index] = priorities[smallerChildIndex];
    index = smallerChildIndex;
  }

  elements[index] = element;
  priorities[index] = priority;
  this.siftDown_(startIndex, index);
};


/**
 * @param {number} startIndex The index of the root.
 * @param {number} index The index of the node to move up.
 * @private
 */
ol.structs.PriorityQueue.prototype.siftDown_ = function(startIndex, index) {
  var elements = this.elements_;
  var priorities = this.priorities_;
  var element = elements[index];
  var priority = priorities[index];

  while (index > startIndex) {
    var parentIndex = this.getParentIndex_(index);
    if (priorities[parentIndex] > priority) {
      elements[index] = elements[parentIndex];
      priorities[index] = priorities[parentIndex];
      index = parentIndex;
    } else {
      break;
    }
  }
  elements[index] = element;
  priorities[index] = priority;
};


/**
 * FIXME empty description for jsdoc
 */
ol.structs.PriorityQueue.prototype.reprioritize = function() {
  var priorityFunction = this.priorityFunction_;
  var elements = this.elements_;
  var priorities = this.priorities_;
  var index = 0;
  var n = elements.length;
  var element, i, priority;
  for (i = 0; i < n; ++i) {
    element = elements[i];
    priority = priorityFunction(element);
    if (priority == ol.structs.PriorityQueue.DROP) {
      delete this.queuedElements_[this.keyFunction_(element)];
    } else {
      priorities[index] = priority;
      elements[index++] = element;
    }
  }
  elements.length = index;
  priorities.length = index;
  this.heapify_();
};
