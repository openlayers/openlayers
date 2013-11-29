goog.provide('ol.DeviceMotion');
goog.provide('ol.DeviceMotion.SUPPORTED');
goog.provide('ol.DeviceMotionProperty');

goog.require('goog.events');
goog.require('goog.math');
goog.require('ol.Object');


/**
 * @enum {string}
 */
ol.DeviceMotionProperty = {
  ALPHA_RATE: 'alphaRate',
  BETA_RATE: 'betaRate',
  GAMMA_RATE: 'gammaRate',
  ACCELERATION: 'acceleration',
  ACCELERATION_INCLUDING_GRAVITY: 'accelerationIncludingGravity',
  TRACKING: 'tracking'
};



/**
 * The ol.DeviceOrientation class provides access to HTML 5 DeviceMotion
 * information and events.
 *
 * @see http://dev.w3.org/geo/api/spec-source-orientation.html#devicemotion
 *
 * @constructor
 * @extends {ol.Object}
 * @param {ol.DeviceMotionOptions=} opt_options Options.
 */
ol.DeviceMotion = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {goog.events.Key}
   */
  this.listenerKey_ = null;

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.DeviceMotionProperty.TRACKING),
      this.handleTrackingChanged_, false, this);

  this.setTracking(goog.isDef(options.tracking) ? options.tracking : false);

};
goog.inherits(ol.DeviceMotion, ol.Object);


/**
 * @inheritDoc
 */
ol.DeviceMotion.prototype.disposeInternal = function() {
  this.setTracking(false);
  goog.base(this, 'disposeInternal');
};


/**
 * Indicates if DeviceMotion is supported in the user's browser.
 * @const
 * @type {boolean}
 */
ol.DeviceMotion.SUPPORTED = 'DeviceMotionEvent' in window;


/**
 * @private
 * @param {goog.events.BrowserEvent} browserEvent Event.
 */
ol.DeviceMotion.prototype.motionChange_ = function(browserEvent) {
  var event = /** @type {DeviceMotionEvent} */
      (browserEvent.getBrowserEvent());

  this.set(ol.DeviceMotionProperty.ACCELERATION,
      event.acceleration || undefined);
  this.set(ol.DeviceMotionProperty.ACCELERATION_INCLUDING_GRAVITY,
      event.accelerationIncludingGravity || undefined);
  if (goog.isDefAndNotNull(event.rotationRate)) {
    this.set(ol.DeviceMotionProperty.ALPHA_RATE,
        goog.math.toRadians(event.rotationRate.alpha));
    this.set(ol.DeviceMotionProperty.BETA_RATE,
        goog.math.toRadians(event.rotationRate.beta));
    this.set(ol.DeviceMotionProperty.GAMMA_RATE,
        goog.math.toRadians(event.rotationRate.gamma));
  }
};


/**
 * @return {number|undefined} The alpha angle rate of change in radians/s.
 */
ol.DeviceMotion.prototype.getAlphaRate = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.DeviceMotionProperty.ALPHA_RATE));
};
goog.exportProperty(
    ol.DeviceMotion.prototype,
    'getAlphaRate',
    ol.DeviceMotion.prototype.getAlphaRate);


/**
 * @return {number|undefined} The beta angle rate of change in radians/s.
 */
ol.DeviceMotion.prototype.getBetaRate = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.DeviceMotionProperty.BETA_RATE));
};
goog.exportProperty(
    ol.DeviceMotion.prototype,
    'getBetaRate',
    ol.DeviceMotion.prototype.getBetaRate);


/**
 * @return {number|undefined} The gamma angle rate of change in radians/s.
 */
ol.DeviceMotion.prototype.getGammaRate = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.DeviceMotionProperty.GAMMA_RATE));
};
goog.exportProperty(
    ol.DeviceMotion.prototype,
    'getGammaRate',
    ol.DeviceMotion.prototype.getGammaRate);


/**
 * @return {DeviceAcceleration|undefined} acceleration.
 */
ol.DeviceMotion.prototype.getAcceleration = function() {
  return /** @type {DeviceAcceleration|undefined} */ (
      this.get(ol.DeviceMotionProperty.ACCELERATION));
};
goog.exportProperty(
    ol.DeviceMotion.prototype,
    'getAcceleration',
    ol.DeviceMotion.prototype.getAcceleration);


/**
 * @return {DeviceAcceleration|undefined} acceleration including gravity.
 */
ol.DeviceMotion.prototype.getAccelerationIncludingGravity = function() {
  return /** @type {DeviceAcceleration|undefined} */ (
      this.get(ol.DeviceMotionProperty.ACCELERATION_INCLUDING_GRAVITY));
};
goog.exportProperty(
    ol.DeviceMotion.prototype,
    'getAccelerationIncludingGravity',
    ol.DeviceMotion.prototype.getAccelerationIncludingGravity);


/**
 * @return {boolean} The current tracking state, true if tracking is on.
 */
ol.DeviceMotion.prototype.getTracking = function() {
  return /** @type {boolean} */ (
      this.get(ol.DeviceMotionProperty.TRACKING));
};
goog.exportProperty(
    ol.DeviceMotion.prototype,
    'getTracking',
    ol.DeviceMotion.prototype.getTracking);


/**
 * @private
 */
ol.DeviceMotion.prototype.handleTrackingChanged_ = function() {
  if (ol.DeviceMotion.SUPPORTED) {
    var tracking = this.getTracking();
    if (tracking && goog.isNull(this.listenerKey_)) {
      this.listenerKey_ = goog.events.listen(window, 'devicemotion',
          this.motionChange_, false, this);
    } else if (!tracking && !goog.isNull(this.listenerKey_)) {
      goog.events.unlistenByKey(this.listenerKey_);
      this.listenerKey_ = null;
    }
  }
};


/**
 * Enable or disable tracking of DeviceMotion events.
 * @param {boolean} tracking True to enable and false to disable tracking.
 */
ol.DeviceMotion.prototype.setTracking = function(tracking) {
  this.set(ol.DeviceMotionProperty.TRACKING, tracking);
};
goog.exportProperty(
    ol.DeviceMotion.prototype,
    'setTracking',
    ol.DeviceMotion.prototype.setTracking);
