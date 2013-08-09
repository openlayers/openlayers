goog.provide('ol.DeviceOrientation');
goog.provide('ol.DeviceOrientation.SUPPORTED');
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
  GAMMA: 'gamma',
  HEADING: 'heading',
  TRACKING: 'tracking'
};



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.DeviceOrientationOptions=} opt_options Options.
 */
ol.DeviceOrientation = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {goog.events.Key}
   */
  this.listenerKey_ = null;

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.DeviceOrientationProperty.TRACKING),
      this.handleTrackingChanged_, false, this);

  this.setTracking(goog.isDef(options.tracking) ? options.tracking : false);

};
goog.inherits(ol.DeviceOrientation, ol.Object);


/**
 * @inheritDoc
 */
ol.DeviceOrientation.prototype.disposeInternal = function() {
  this.setTracking(false);
  goog.base(this, 'disposeInternal');
};


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
    var alpha = goog.math.toRadians(event.alpha);
    this.set(ol.DeviceOrientationProperty.ALPHA, alpha);
    // event.absolute is undefined in iOS.
    if (goog.isBoolean(event.absolute) && event.absolute) {
      this.set(ol.DeviceOrientationProperty.HEADING, alpha);
    }
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
  return /** @type {number|undefined} */ (
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
  return /** @type {number|undefined} */ (
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
  return /** @type {number|undefined} */ (
      this.get(ol.DeviceOrientationProperty.GAMMA));
};
goog.exportProperty(
    ol.DeviceOrientation.prototype,
    'getGamma',
    ol.DeviceOrientation.prototype.getGamma);


/**
 * @return {number|undefined} heading.
 */
ol.DeviceOrientation.prototype.getHeading = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.DeviceOrientationProperty.HEADING));
};
goog.exportProperty(
    ol.DeviceOrientation.prototype,
    'getHeading',
    ol.DeviceOrientation.prototype.getHeading);


/**
 * Are we tracking the device's orientation?
 * @return {boolean} tracking.
 */
ol.DeviceOrientation.prototype.getTracking = function() {
  return /** @type {boolean} */ (
      this.get(ol.DeviceOrientationProperty.TRACKING));
};
goog.exportProperty(
    ol.DeviceOrientation.prototype,
    'getTracking',
    ol.DeviceOrientation.prototype.getTracking);


/**
 * @private
 */
ol.DeviceOrientation.prototype.handleTrackingChanged_ = function() {
  if (ol.DeviceOrientation.SUPPORTED) {
    var tracking = this.getTracking();
    if (tracking && goog.isNull(this.listenerKey_)) {
      this.listenerKey_ = goog.events.listen(window, 'deviceorientation',
          this.orientationChange_, false, this);
    } else if (!tracking && !goog.isNull(this.listenerKey_)) {
      goog.events.unlistenByKey(this.listenerKey_);
      this.listenerKey_ = null;
    }
  }
};


/**
 * @param {boolean} tracking Enable or disable tracking.
 */
ol.DeviceOrientation.prototype.setTracking = function(tracking) {
  this.set(ol.DeviceOrientationProperty.TRACKING, tracking);
};
goog.exportProperty(
    ol.DeviceOrientation.prototype,
    'setTracking',
    ol.DeviceOrientation.prototype.setTracking);
