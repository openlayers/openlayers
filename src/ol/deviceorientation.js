goog.provide('ol.DeviceOrientation');
goog.provide('ol.DeviceOrientationProperty');

goog.require('goog.events');
goog.require('goog.math');
goog.require('ol.Object');
goog.require('ol.has');


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
 * @classdesc
 * The ol.DeviceOrientation class provides access to DeviceOrientation
 * information and events, see the [HTML 5 DeviceOrientation Specification](
 * http://www.w3.org/TR/orientation-event/) for more details.
 *
 * Many new computers, and especially mobile phones
 * and tablets, provide hardware support for device orientation. Web
 * developers targetting mobile devices will be especially interested in this
 * class.
 *
 * Device orientation data are relative to a common starting point. For mobile
 * devices, the starting point is to lay your phone face up on a table with the
 * top of the phone pointing north. This represents the zero state. All
 * angles are then relative to this state. For computers, it is the same except
 * the screen is open at 90 degrees.
 *
 * Device orientation is reported as three angles - `alpha`, `beta`, and
 * `gamma` - relative to the starting position along the three planar axes X, Y
 * and Z. The X axis runs from the left edge to the right edge through the
 * middle of the device. Similarly, the Y axis runs from the bottom to the top
 * of the device through the middle. The Z axis runs from the back to the front
 * through the middle. In the starting position, the X axis points to the
 * right, the Y axis points away from you and the Z axis points straight up
 * from the device lying flat.
 *
 * The three angles representing the device orientation are relative to the
 * three axes. `alpha` indicates how much the device has been rotated around the
 * Z axis, which is commonly interpreted as the compass heading (see note
 * below). `beta` indicates how much the device has been rotated around the X
 * axis, or how much it is tilted from front to back.  `gamma` indicates how
 * much the device has been rotated around the Y axis, or how much it is tilted
 * from left to right.
 *
 * For most browsers, the `alpha` value returns the compass heading so if the
 * device points north, it will be 0.  With Safari on iOS, the 0 value of
 * `alpha` is calculated from when device orientation was first requested.
 * ol.DeviceOrientation provides the `heading` property which normalizes this
 * behavior across all browsers for you.
 *
 * It is important to note that the HTML 5 DeviceOrientation specification
 * indicates that `alpha`, `beta` and `gamma` are in degrees while the
 * equivalent properties in ol.DeviceOrientation are in radians for consistency
 * with all other uses of angles throughout OpenLayers.
 *
 * @see http://www.w3.org/TR/orientation-event/
 *
 * @constructor
 * @extends {ol.Object}
 * @fires change Triggered when the device orientation changes.
 * @param {olx.DeviceOrientationOptions=} opt_options Options.
 * @api
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
    } else if (goog.isDefAndNotNull(event.webkitCompassHeading) &&
               goog.isDefAndNotNull(event.webkitCompassAccuracy) &&
               event.webkitCompassAccuracy != -1) {
      var heading = goog.math.toRadians(event.webkitCompassHeading);
      this.set(ol.DeviceOrientationProperty.HEADING, heading);
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
  this.dispatchChangeEvent();
};


/**
 * @return {number|undefined} The euler angle in radians of the device from the
 *     standard Z axis.
 * @observable
 * @api
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
 * @return {number|undefined} The euler angle in radians of the device from the
 *     planar X axis.
 * @observable
 * @api
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
 * @return {number|undefined} The euler angle in radians of the device from the
 *     planar Y axis.
 * @observable
 * @api
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
 * @return {number|undefined} The heading of the device relative to north, in
 *     radians, normalizing for different browser behavior.
 * @observable
 * @api
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
 * @return {boolean} The status of tracking changes to alpha, beta and gamma.
 *     If true, changes are tracked and reported immediately.
 * @observable
 * @api
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
  if (ol.has.DEVICE_ORIENTATION) {
    var tracking = this.getTracking();
    if (tracking && goog.isNull(this.listenerKey_)) {
      this.listenerKey_ = goog.events.listen(goog.global, 'deviceorientation',
          this.orientationChange_, false, this);
    } else if (!tracking && !goog.isNull(this.listenerKey_)) {
      goog.events.unlistenByKey(this.listenerKey_);
      this.listenerKey_ = null;
    }
  }
};


/**
 * Enable or disable tracking of DeviceOrientation events.
 * @param {boolean} tracking The status of tracking changes to alpha, beta and
 *     gamma. If true, changes are tracked and reported immediately.
 * @observable
 * @api
 */
ol.DeviceOrientation.prototype.setTracking = function(tracking) {
  this.set(ol.DeviceOrientationProperty.TRACKING, tracking);
};
goog.exportProperty(
    ol.DeviceOrientation.prototype,
    'setTracking',
    ol.DeviceOrientation.prototype.setTracking);
