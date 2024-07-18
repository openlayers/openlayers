/**
 * @module ol/structs/LinkedList
 */

/**
 * @template T
 * @typedef {Object} Item
 * @property {Item<T>|undefined} prev Previous.
 * @property {Item<T>|undefined} next Next.
 * @property {T} data Data.
 */

/**
 * @classdesc
 * Creates an empty linked list structure.
 * @template T
 */
class LinkedList {
  /**
   * @param {boolean} [circular] The last item is connected to the first one,
   * and the first item to the last one. Default is true.
   */
  constructor(circular) {
    /**
     * @private
     * @type {Item<T>|undefined}
     */
    this.first_ = undefined;

    /**
     * @private
     * @type {Item<T>|undefined}
     */
    this.last_ = undefined;

    /**
     * @private
     * @type {Item<T>|undefined}
     */
    this.head_ = undefined;

    /**
     * @private
     * @type {boolean}
     */
    this.circular_ = circular ?? true;

    /**
     * @private
     * @type {number}
     */
    this.length_ = 0;
  }

  /**
   * Inserts an item into the linked list right after the current one.
   *
   * @param {T} data Item data.
   */
  insertItem(data) {
    /** @type {Item<T>} */
    const item = {
      prev: undefined,
      next: undefined,
      data: data,
    };

    const head = this.head_;

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
      const next = head.next;
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
  }

  /**
   * Removes the current item from the list. Sets the cursor to the next item,
   * if possible.
   */
  removeItem() {
    const head = this.head_;
    if (!head) {
      return;
    }
    const next = head.next;
    const prev = head.prev;
    if (next) {
      next.prev = prev;
    }
    if (prev) {
      prev.next = next;
    }
    this.head_ = next ?? prev;

    if (this.first_ === this.last_) {
      this.head_ = undefined;
      this.first_ = undefined;
      this.last_ = undefined;
    } else if (this.first_ === head) {
      this.first_ = this.head_;
    } else if (this.last_ === head) {
      this.last_ = prev ? /** @type {Item<T>} */ (this.head_).prev : this.head_;
    }
    this.length_--;
  }

  /**
   * Sets the cursor to the first item, and returns the associated data.
   *
   * @return {T|undefined} Item data.
   */
  firstItem() {
    this.head_ = this.first_;
    if (this.head_) {
      return this.head_.data;
    }
    return undefined;
  }

  /**
   * Sets the cursor to the last item, and returns the associated data.
   *
   * @return {T|undefined} Item data.
   */
  lastItem() {
    this.head_ = this.last_;
    if (this.head_) {
      return this.head_.data;
    }
    return undefined;
  }

  /**
   * Sets the cursor to the next item, and returns the associated data.
   *
   * @return {T|undefined} Item data.
   */
  nextItem() {
    if (this.head_ && this.head_.next) {
      this.head_ = this.head_.next;
      return this.head_.data;
    }
    return undefined;
  }

  /**
   * Returns the next item's data without moving the cursor.
   *
   * @return {T|undefined} Item data.
   */
  getNextItem() {
    if (this.head_ && this.head_.next) {
      return this.head_.next.data;
    }
    return undefined;
  }

  /**
   * Sets the cursor to the previous item, and returns the associated data.
   *
   * @return {T|undefined}} Item data.
   */
  prevItem() {
    if (this.head_ && this.head_.prev) {
      this.head_ = this.head_.prev;
      return this.head_.data;
    }
    return undefined;
  }

  /**
   * Returns the previous item's data without moving the cursor.
   *
   * @return {T|undefined} Item data.
   */
  getPrevItem() {
    if (this.head_ && this.head_.prev) {
      return this.head_.prev.data;
    }
    return undefined;
  }

  /**
   * Returns the current item's data.
   *
   * @return {T|undefined} Item data.
   */
  getCurrItem() {
    if (this.head_) {
      return this.head_.data;
    }
    return undefined;
  }

  /**
   * Sets the first item of the list. This only works for circular lists, and sets
   * the last item accordingly.
   */
  setFirstItem() {
    if (this.circular_ && this.head_) {
      this.first_ = this.head_;
      this.last_ = this.head_.prev;
    }
  }

  /**
   * Concatenates two lists.
   * @param {LinkedList<T>} list List to merge into the current list.
   */
  concat(list) {
    if (!list.head_) {
      return;
    }
    if (this.head_) {
      const end = this.head_.next;
      this.head_.next = list.first_;
      /** @type {Item<T>} */ (list.first_).prev = this.head_;
      if (end) {
        end.prev = list.last_;
      } else {
        this.last_ = list.last_;
      }
      /** @type {Item<T>} */ (list.last_).next = end;
      this.length_ += list.length_;
    } else {
      this.head_ = list.head_;
      this.first_ = list.first_;
      this.last_ = list.last_;
      this.length_ = list.length_;
      /** @type {Item<T>} */ (this.first_).prev = this.circular_
        ? this.last_
        : undefined;
      /** @type {Item<T>} */ (this.last_).next = this.circular_
        ? this.first_
        : undefined;
    }
    list.head_ = undefined;
    list.first_ = undefined;
    list.last_ = undefined;
    list.length_ = 0;
  }

  /**
   * Returns the current length of the list.
   *
   * @return {number} Length.
   */
  getLength() {
    return this.length_;
  }
}

export default LinkedList;
