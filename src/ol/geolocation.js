// FIXME handle geolocation not supported
// FIXME handle geolocation errors

goog.provide('ol.Geolocation');
goog.provide('ol.GeolocationProperty');

goog.require('goog.events');
goog.require('goog.math');
goog.require('ol.Coordinate');
goog.require('ol.Object');
goog.require('ol.Projection');
goog.require('ol.projection');


/**
 * @enum {string}
 */
ol.GeolocationProperty = {
  ACCURACY: 'accuracy',
  ALTITUDE: 'altitude',
  ALTITUDE_ACCURACY: 'altitudeAccuracy',
  HEADING: 'heading',
  POSITION: 'position',
  PROJECTION: 'projection',
  SPEED: 'speed',
  TRACKING: 'tracking',
  TRACKING_OPTIONS: 'trackingOptions'
};



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.GeolocationOptions=} opt_options Options.
 */
ol.Geolocation = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * The unprojected (EPSG:4326) device position.
   * @private
   * @type {ol.Coordinate}
   */
  this.position_ = null;

  /**
   * @private
   * @type {ol.TransformFunction}
   */
  this.transform_ = ol.projection.identityTransform;

  /**
   * @private
   * @type {number|undefined}
   */
  this.watchId_ = undefined;

  goog.events.listen(
      this, ol.Object.getChangedEventType(ol.GeolocationProperty.PROJECTION),
      this.handleProjectionChanged_, false, this);
  goog.events.listen(
      this, ol.Object.getChangedEventType(ol.GeolocationProperty.TRACKING),
      this.handleTrackingChanged_, false, this);

  if (goog.isDef(options.projection)) {
    this.setProjection(ol.projection.get(options.projection));
  }
  if (goog.isDef(options.trackingOptions)) {
    this.setTrackingOptions(options.trackingOptions);
  }
  if (goog.isDef(options.tracking)) {
    this.setTracking(options.tracking);
  }

};
goog.inherits(ol.Geolocation, ol.Object);


/**
 * @inheritDoc
 */
ol.Geolocation.prototype.disposeInternal = function() {
  this.setTracking(false);
  goog.base(this, 'disposeInternal');
};


/**
 * @private
 */
ol.Geolocation.prototype.handleProjectionChanged_ = function() {
  var projection = this.getProjection();
  if (goog.isDefAndNotNull(projection)) {
    this.transform_ = ol.projection.getTransformFromProjections(
        ol.projection.get('EPSG:4326'), projection);
    if (!goog.isNull(this.position_)) {
      this.set(
          ol.GeolocationProperty.POSITION, this.transform_(this.position_));
    }
  }
};


/**
 * @private
 */
ol.Geolocation.prototype.handleTrackingChanged_ = function() {
  if (ol.Geolocation.SUPPORTED) {
    var tracking = this.getTracking();
    if (tracking && !goog.isDef(this.watchId_)) {
      this.watchId_ = goog.global.navigator.geolocation.watchPosition(
          goog.bind(this.positionChange_, this),
          goog.bind(this.positionError_, this),
          this.getTrackingOptions());
    } else if (!tracking && goog.isDef(this.watchId_)) {
      goog.global.navigator.geolocation.clearWatch(this.watchId_);
      this.watchId_ = undefined;
    }
  }
};


/**
 * Is supported.
 * @const
 * @type {boolean}
 */
ol.Geolocation.SUPPORTED = 'geolocation' in goog.global.navigator;


/**
 * @private
 * @param {GeolocationPosition} position position event.
 */
ol.Geolocation.prototype.positionChange_ = function(position) {
  var coords = position.coords;
  this.set(ol.GeolocationProperty.ACCURACY, coords.accuracy);
  this.set(ol.GeolocationProperty.ALTITUDE,
      goog.isNull(coords.altitude) ? undefined : coords.altitude);
  this.set(ol.GeolocationProperty.ALTITUDE_ACCURACY,
      goog.isNull(coords.altitudeAccuracy) ?
      undefined : coords.altitudeAccuracy);
  this.set(ol.GeolocationProperty.HEADING, goog.isNull(coords.heading) ?
      undefined : goog.math.toRadians(coords.heading));
  if (goog.isNull(this.position_)) {
    this.position_ = [coords.longitude, coords.latitude];
  } else {
    this.position_[0] = coords.longitude;
    this.position_[1] = coords.latitude;
  }
  this.set(ol.GeolocationProperty.POSITION, this.transform_(this.position_));
  this.set(ol.GeolocationProperty.SPEED,
      goog.isNull(coords.speed) ? undefined : coords.speed);
};


/**
 * @private
 * @param {GeolocationPositionError} error error object.
 */
ol.Geolocation.prototype.positionError_ = function(error) {
};


/**
 * The accuracy of the position in meters.
 * @return {number|undefined} accuracy.
 */
ol.Geolocation.prototype.getAccuracy = function() {
  return /** @type {number} */ (
      this.get(ol.GeolocationProperty.ACCURACY));
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getAccuracy',
    ol.Geolocation.prototype.getAccuracy);


/**
 * @return {number|undefined} Altitude.
 */
ol.Geolocation.prototype.getAltitude = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.GeolocationProperty.ALTITUDE));
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getAltitude',
    ol.Geolocation.prototype.getAltitude);


/**
 * @return {number|undefined} Altitude accuracy.
 */
ol.Geolocation.prototype.getAltitudeAccuracy = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.GeolocationProperty.ALTITUDE_ACCURACY));
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getAltitudeAccuracy',
    ol.Geolocation.prototype.getAltitudeAccuracy);


/**
 * @return {number|undefined} Heading.
 */
ol.Geolocation.prototype.getHeading = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.GeolocationProperty.HEADING));
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getHeading',
    ol.Geolocation.prototype.getHeading);


/**
 * The position of the device.
 * @return {ol.Coordinate|undefined} position.
 */
ol.Geolocation.prototype.getPosition = function() {
  return /** @type {ol.Coordinate} */ (
      this.get(ol.GeolocationProperty.POSITION));
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getPosition',
    ol.Geolocation.prototype.getPosition);


/**
 * @return {ol.Projection|undefined} projection.
 */
ol.Geolocation.prototype.getProjection = function() {
  return /** @type {ol.Projection} */ (
      this.get(ol.GeolocationProperty.PROJECTION));
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getProjection',
    ol.Geolocation.prototype.getProjection);


/**
 * @return {number|undefined} Speed.
 */
ol.Geolocation.prototype.getSpeed = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.GeolocationProperty.SPEED));
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getSpeed',
    ol.Geolocation.prototype.getSpeed);


/**
 * @return {boolean|undefined} tracking.
 */
ol.Geolocation.prototype.getTracking = function() {
  return /** @type {boolean} */ (
      this.get(ol.GeolocationProperty.TRACKING));
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getTracking',
    ol.Geolocation.prototype.getTracking);


/**
 * @return {GeolocationPositionOptions|undefined} Tracking options.
 */
ol.Geolocation.prototype.getTrackingOptions = function() {
  return /** @type {GeolocationPositionOptions} */ (
      this.get(ol.GeolocationProperty.TRACKING_OPTIONS));
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getTrackingOptions',
    ol.Geolocation.prototype.getTrackingOptions);


/**
 * @param {ol.Projection} projection Projection.
 */
ol.Geolocation.prototype.setProjection = function(projection) {
  this.set(ol.GeolocationProperty.PROJECTION, projection);
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'setProjection',
    ol.Geolocation.prototype.setProjection);


/**
 * @param {boolean} tracking Enable or disable tracking.
 */
ol.Geolocation.prototype.setTracking = function(tracking) {
  this.set(ol.GeolocationProperty.TRACKING, tracking);
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'setTracking',
    ol.Geolocation.prototype.setTracking);


/**
 * @param {GeolocationPositionOptions} options Tracking options.
 */
ol.Geolocation.prototype.setTrackingOptions = function(options) {
  this.set(ol.GeolocationProperty.TRACKING_OPTIONS, options);
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'setTrackingOptions',
    ol.Geolocation.prototype.setTrackingOptions);
