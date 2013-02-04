// FIXME: tracking property (same as ol.Geolocation)
// FIXME: event.absolute
goog.provide('ol.DeviceOrientation');
goog.provide('ol.DeviceOrientationProperty');

goog.require('goog.events');
goog.require('goog.math');
goog.require('ol.Object');


/**
 * @enum {string}
 */
ol.DeviceOrientationProperty = {
  ALPHA: 'alpha',
  BETA: 'beta',
  GAMMA: 'gamma'
};



/**
 * @constructor
 * @extends {ol.Object}
 */
ol.DeviceOrientation = function() {

  goog.base(this);

  if (ol.DeviceOrientation.SUPPORTED) {
    goog.events.listen(window, 'deviceorientation',
        this.orientationChange_, false, this);
  }
};
goog.inherits(ol.DeviceOrientation, ol.Object);


/**
 * Is supported.
 * @const
 * @type {boolean}
 */
ol.DeviceOrientation.SUPPORTED = 'DeviceOrientationEvent' in window;


/**
 * @private
 * @param {goog.events.BrowserEvent} browserEvent Event.
 */
ol.DeviceOrientation.prototype.orientationChange_ = function(browserEvent) {
  var event = /** @type {DeviceOrientationEvent} */
      (browserEvent.getBrowserEvent());
  if (goog.isDefAndNotNull(event.alpha)) {
    this.set(ol.DeviceOrientationProperty.ALPHA,
        goog.math.toRadians(event.alpha));
  }
  if (goog.isDefAndNotNull(event.beta)) {
    this.set(ol.DeviceOrientationProperty.BETA,
        goog.math.toRadians(event.beta));
  }
  if (goog.isDefAndNotNull(event.gamma)) {
    this.set(ol.DeviceOrientationProperty.GAMMA,
        goog.math.toRadians(event.gamma));
  }
};


/**
 * @return {number|undefined} alpha.
 */
ol.DeviceOrientation.prototype.getAlpha = function() {
  return /** @type {number} */ (
      this.get(ol.DeviceOrientationProperty.ALPHA));
};
goog.exportProperty(
    ol.DeviceOrientation.prototype,
    'getAlpha',
    ol.DeviceOrientation.prototype.getAlpha);


/**
 * @return {number|undefined} beta.
 */
ol.DeviceOrientation.prototype.getBeta = function() {
  return /** @type {number} */ (
      this.get(ol.DeviceOrientationProperty.BETA));
};
goog.exportProperty(
    ol.DeviceOrientation.prototype,
    'getBeta',
    ol.DeviceOrientation.prototype.getBeta);


/**
 * @return {number|undefined} gamma.
 */
ol.DeviceOrientation.prototype.getGamma = function() {
  return /** @type {number} */ (
      this.get(ol.DeviceOrientationProperty.GAMMA));
};
goog.exportProperty(
    ol.DeviceOrientation.prototype,
    'getGamma',
    ol.DeviceOrientation.prototype.getGamma);
