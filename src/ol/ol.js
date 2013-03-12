goog.provide('ol');

goog.require('goog.debug.Logger');


if (goog.DEBUG) {
  var logger = goog.debug.Logger.getLogger('ol');
  logger.setLevel(goog.debug.Logger.Level.FINEST);
}


/**
 * The CSS class that we'll give the DOM elements to have them unselectable.
 *
 * @const {string}
 */
ol.CSS_CLASS_UNSELECTABLE = 'ol-unselectable';
