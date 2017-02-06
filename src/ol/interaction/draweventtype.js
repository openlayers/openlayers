goog.provide('ol.interaction.DrawEventType');


/**
 * @enum {string}
 */
ol.interaction.DrawEventType = {
  /**
   * Triggered upon feature draw start
   * @event ol.interaction.Draw.Event#drawstart
   * @api
   */
  DRAWSTART: 'drawstart',
  /**
   * Triggered upon feature draw end
   * @event ol.interaction.Draw.Event#drawend
   * @api
   */
  DRAWEND: 'drawend'
};
