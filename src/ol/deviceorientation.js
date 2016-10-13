goog.provide('ol.DeviceOrientation');

goog.require('ol.events');
goog.require('ol');
goog.require('ol.Object');
goog.require('ol.has');
goog.require('ol.math');


/**
 * @classdesc
 * The ol.DeviceOrientation class provides access to information from
 * DeviceOrientation events.  See the [HTML 5 DeviceOrientation Specification](
 * http://www.w3.org/TR/orientation-event/) for more details.
 *
 * Many new computers, and especially mobile phones
 * and tablets, provide hardware support for device orientation. Web
 * developers targeting mobile devices will be especially interested in this
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
 * To get notified of device orientation changes, register a listener for the
 * generic `change` event on your `ol.DeviceOrientation` instance.
 *
 * @see {@link http://www.w3.org/TR/orientation-event/}
 *
 * @constructor
 * @extends {ol.Object}
 * @param {olx.DeviceOrientationOptions=} opt_options Options.
 * @api
 */
ol.DeviceOrientation = function(opt_options) {

  ol.Object.call(this);

  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {?ol.EventsKey}
   */
  this.listenerKey_ = null;

  ol.events.listen(this,
      ol.Object.getChangeEventType(ol.DeviceOrientation.Property.TRACKING),
      this.handleTrackingChanged_, this);

  this.setTracking(options.tracking !== undefined ? options.tracking : false);

};
ol.inherits(ol.DeviceOrientation, ol.Object);


/**
 * @inheritDoc
 */
ol.DeviceOrientation.prototype.disposeInternal = function() {
  this.setTracking(false);
  ol.Object.prototype.disposeInternal.call(this);
};


/**
 * @private
 * @param {Event} originalEvent Event.
 */
ol.DeviceOrientation.prototype.orientationChange_ = function(originalEvent) {
  var event = /** @type {DeviceOrientationEvent} */ (originalEvent);
  if (event.alpha !== null) {
    var alpha = ol.math.toRadians(event.alpha);
    this.set(ol.DeviceOrientation.Property.ALPHA, alpha);
    // event.absolute is undefined in iOS.
    if (typeof event.absolute === 'boolean' && event.absolute) {
      this.set(ol.DeviceOrientation.Property.HEADING, alpha);
    } else if (typeof event.webkitCompassHeading === 'number' &&
               event.webkitCompassAccuracy != -1) {
      var heading = ol.math.toRadians(event.webkitCompassHeading);
      this.set(ol.DeviceOrientation.Property.HEADING, heading);
    }
  }
  if (event.beta !== null) {
    this.set(ol.DeviceOrientation.Property.BETA,
        ol.math.toRadians(event.beta));
  }
  if (event.gamma !== null) {
    this.set(ol.DeviceOrientation.Property.GAMMA,
        ol.math.toRadians(event.gamma));
  }
  this.changed();
};


/**
 * Rotation around the device z-axis (in radians).
 * @return {number|undefined} The euler angle in radians of the device from the
 *     standard Z axis.
 * @observable
 * @api
 */
ol.DeviceOrientation.prototype.getAlpha = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.DeviceOrientation.Property.ALPHA));
};


/**
 * Rotation around the device x-axis (in radians).
 * @return {number|undefined} The euler angle in radians of the device from the
 *     planar X axis.
 * @observable
 * @api
 */
ol.DeviceOrientation.prototype.getBeta = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.DeviceOrientation.Property.BETA));
};


/**
 * Rotation around the device y-axis (in radians).
 * @return {number|undefined} The euler angle in radians of the device from the
 *     planar Y axis.
 * @observable
 * @api
 */
ol.DeviceOrientation.prototype.getGamma = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.DeviceOrientation.Property.GAMMA));
};


/**
 * The heading of the device relative to north (in radians).
 * @return {number|undefined} The heading of the device relative to north, in
 *     radians, normalizing for different browser behavior.
 * @observable
 * @api
 */
ol.DeviceOrientation.prototype.getHeading = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.DeviceOrientation.Property.HEADING));
};


/**
 * Determine if orientation is being tracked.
 * @return {boolean} Changes in device orientation are being tracked.
 * @observable
 * @api
 */
ol.DeviceOrientation.prototype.getTracking = function() {
  return /** @type {boolean} */ (
      this.get(ol.DeviceOrientation.Property.TRACKING));
};


/**
 * @private
 */
ol.DeviceOrientation.prototype.handleTrackingChanged_ = function() {
  if (ol.has.DEVICE_ORIENTATION) {
    var tracking = this.getTracking();
    if (tracking && !this.listenerKey_) {
      this.listenerKey_ = ol.events.listen(window, 'deviceorientation',
          this.orientationChange_, this);
    } else if (!tracking && this.listenerKey_ !== null) {
      ol.events.unlistenByKey(this.listenerKey_);
      this.listenerKey_ = null;
    }
  }
};


/**
 * Enable or disable tracking of device orientation events.
 * @param {boolean} tracking The status of tracking changes to alpha, beta and
 *     gamma. If true, changes are tracked and reported immediately.
 * @observable
 * @api
 */
ol.DeviceOrientation.prototype.setTracking = function(tracking) {
  this.set(ol.DeviceOrientation.Property.TRACKING, tracking);
};


/**
 * @enum {string}
 */
ol.DeviceOrientation.Property = {
  ALPHA: 'alpha',
  BETA: 'beta',
  GAMMA: 'gamma',
  HEADING: 'heading',
  TRACKING: 'tracking'
};
