/**
 * Creates an empty linked list structure.
 *
 * @constructor
 * @struct
 * @param {boolean=} opt_circular The last item is connected to the first one,
 * and the first item to the last one. Default is true.
 */
var _ol_structs_LinkedList_ = function(opt_circular) {

  /**
   * @private
   * @type {ol.LinkedListItem|undefined}
   */
  this.first_ = undefined;

  /**
   * @private
   * @type {ol.LinkedListItem|undefined}
   */
  this.last_ = undefined;

  /**
   * @private
   * @type {ol.LinkedListItem|undefined}
   */
  this.head_ = undefined;

  /**
   * @private
   * @type {boolean}
   */
  this.circular_ = opt_circular === undefined ? true : opt_circular;

  /**
   * @private
   * @type {number}
   */
  this.length_ = 0;
};

/**
 * Inserts an item into the linked list right after the current one.
 *
 * @param {?} data Item data.
 */
_ol_structs_LinkedList_.prototype.insertItem = function(data) {

  /** @type {ol.LinkedListItem} */
  var item = {
    prev: undefined,
    next: undefined,
    data: data
  };

  var head = this.head_;

  //Initialize the list.
  if (!head) {
    this.first_ = item;
    this.last_ = item;
    if (this.circular_) {
      item.next = item;
      item.prev = item;
    }
  } else {
    //Link the new item to the adjacent ones.
    var next = head.next;
    item.prev = head;
    item.next = next;
    head.next = item;
    if (next) {
      next.prev = item;
    }

    if (head === this.last_) {
      this.last_ = item;
    }
  }
  this.head_ = item;
  this.length_++;
};

/**
 * Removes the current item from the list. Sets the cursor to the next item,
 * if possible.
 */
_ol_structs_LinkedList_.prototype.removeItem = function() {
  var head = this.head_;
  if (head) {
    var next = head.next;
    var prev = head.prev;
    if (next) {
      next.prev = prev;
    }
    if (prev) {
      prev.next = next;
    }
    this.head_ = next || prev;

    if (this.first_ === this.last_) {
      this.head_ = undefined;
      this.first_ = undefined;
      this.last_ = undefined;
    } else if (this.first_ === head) {
      this.first_ = this.head_;
    } else if (this.last_ === head) {
      this.last_ = prev ? this.head_.prev : this.head_;
    }
    this.length_--;
  }
};

/**
 * Sets the cursor to the first item, and returns the associated data.
 *
 * @return {?} Item data.
 */
_ol_structs_LinkedList_.prototype.firstItem = function() {
  this.head_ = this.first_;
  if (this.head_) {
    return this.head_.data;
  }
  return undefined;
};

/**
* Sets the cursor to the last item, and returns the associated data.
*
* @return {?} Item data.
*/
_ol_structs_LinkedList_.prototype.lastItem = function() {
  this.head_ = this.last_;
  if (this.head_) {
    return this.head_.data;
  }
  return undefined;
};

/**
 * Sets the cursor to the next item, and returns the associated data.
 *
 * @return {?} Item data.
 */
_ol_structs_LinkedList_.prototype.nextItem = function() {
  if (this.head_ && this.head_.next) {
    this.head_ = this.head_.next;
    return this.head_.data;
  }
  return undefined;
};

/**
 * Returns the next item's data without moving the cursor.
 *
 * @return {?} Item data.
 */
_ol_structs_LinkedList_.prototype.getNextItem = function() {
  if (this.head_ && this.head_.next) {
    return this.head_.next.data;
  }
  return undefined;
};

/**
 * Sets the cursor to the previous item, and returns the associated data.
 *
 * @return {?} Item data.
 */
_ol_structs_LinkedList_.prototype.prevItem = function() {
  if (this.head_ && this.head_.prev) {
    this.head_ = this.head_.prev;
    return this.head_.data;
  }
  return undefined;
};

/**
 * Returns the previous item's data without moving the cursor.
 *
 * @return {?} Item data.
 */
_ol_structs_LinkedList_.prototype.getPrevItem = function() {
  if (this.head_ && this.head_.prev) {
    return this.head_.prev.data;
  }
  return undefined;
};

/**
 * Returns the current item's data.
 *
 * @return {?} Item data.
 */
_ol_structs_LinkedList_.prototype.getCurrItem = function() {
  if (this.head_) {
    return this.head_.data;
  }
  return undefined;
};

/**
 * Sets the first item of the list. This only works for circular lists, and sets
 * the last item accordingly.
 */
_ol_structs_LinkedList_.prototype.setFirstItem = function() {
  if (this.circular_ && this.head_) {
    this.first_ = this.head_;
    this.last_ = this.head_.prev;
  }
};

/**
 * Concatenates two lists.
 * @param {ol.structs.LinkedList} list List to merge into the current list.
 */
_ol_structs_LinkedList_.prototype.concat = function(list) {
  if (list.head_) {
    if (this.head_) {
      var end = this.head_.next;
      this.head_.next = list.first_;
      list.first_.prev = this.head_;
      end.prev = list.last_;
      list.last_.next = end;
      this.length_ += list.length_;
    } else {
      this.head_ = list.head_;
      this.first_ = list.first_;
      this.last_ = list.last_;
      this.length_ = list.length_;
    }
    list.head_ = undefined;
    list.first_ = undefined;
    list.last_ = undefined;
    list.length_ = 0;
  }
};

/**
 * Returns the current length of the list.
 *
 * @return {number} Length.
 */
_ol_structs_LinkedList_.prototype.getLength = function() {
  return this.length_;
};
export default _ol_structs_LinkedList_;
