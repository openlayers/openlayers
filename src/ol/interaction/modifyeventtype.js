goog.provide('ol.interaction.ModifyEventType');


/**
 * @enum {string}
 */
ol.interaction.ModifyEventType = {
  /**
   * Triggered upon feature modification start
   * @event ol.interaction.Modify.Event#modifystart
   * @api
   */
  MODIFYSTART: 'modifystart',
  /**
   * Triggered upon feature modification end
   * @event ol.interaction.Modify.Event#modifyend
   * @api
   */
  MODIFYEND: 'modifyend'
};
