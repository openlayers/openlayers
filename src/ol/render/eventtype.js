goog.provide('ol.render.EventType');

/**
 * @enum {string}
 */
ol.render.EventType = {
  /**
   * @event ol.render.Event#postcompose
   * @api
   */
  POSTCOMPOSE: 'postcompose',
  /**
   * @event ol.render.Event#precompose
   * @api
   */
  PRECOMPOSE: 'precompose',
  /**
   * @event ol.render.Event#render
   * @api
   */
  RENDER: 'render'
};
