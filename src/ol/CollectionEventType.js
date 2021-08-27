/**
 * @module ol/CollectionEventType
 */

/**
 * @enum {string}
 */
const CollectionEventType = {
  /**
   * Triggered when an item is added to the collection.
   * @event module:ol/Collection.CollectionEvent#add
   * @api
   */
  ADD: 'add',
  /**
   * Triggered when an item is removed from the collection.
   * @event module:ol/Collection.CollectionEvent#remove
   * @api
   */
  REMOVE: 'remove',
};

export default CollectionEventType;
