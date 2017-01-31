goog.provide('ol.interaction.TranslateEventType');


/**
 * @enum {string}
 */
ol.interaction.TranslateEventType = {
  /**
   * Triggered upon feature translation start.
   * @event ol.interaction.Translate.Event#translatestart
   * @api
   */
  TRANSLATESTART: 'translatestart',
  /**
   * Triggered upon feature translation.
   * @event ol.interaction.Translate.Event#translating
   * @api
   */
  TRANSLATING: 'translating',
  /**
   * Triggered upon feature translation end.
   * @event ol.interaction.Translate.Event#translateend
   * @api
   */
  TRANSLATEEND: 'translateend'
};
