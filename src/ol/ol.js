goog.provide('ol');

goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');


if (goog.DEBUG) {
  var logger = goog.debug.Logger.getLogger('ol');
  logger.setLevel(goog.debug.Logger.Level.FINEST);
}
