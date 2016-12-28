goog.provide('ol.CollectionEventType');

/**
 * @enum {string}
 */
ol.CollectionEventType = {
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
