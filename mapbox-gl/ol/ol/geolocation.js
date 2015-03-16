// FIXME handle geolocation not supported

goog.provide('ol.Geolocation');
goog.provide('ol.GeolocationProperty');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.math');
goog.require('ol.Coordinate');
goog.require('ol.Object');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.Polygon');
goog.require('ol.has');
goog.require('ol.proj');
goog.require('ol.sphere.WGS84');


/**
 * @enum {string}
 */
ol.GeolocationProperty = {
  ACCURACY: 'accuracy',
  ACCURACY_GEOMETRY: 'accuracyGeometry',
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
 * @classdesc
 * Helper class for providing HTML5 Geolocation capabilities.
 * The [Geolocation API](http://www.w3.org/TR/geolocation-API/)
 * is used to locate a user's position.
 *
 * Example:
 *
 *     var geolocation = new ol.Geolocation({
 *       // take the projection to use from the map's view
 *       projection: view.getProjection()
 *     });
 *     // listen to changes in position
 *     geolocation.on('change', function(evt) {
 *       window.console.log(geolocation.getPosition());
 *     });
 *
 * @constructor
 * @extends {ol.Object}
 * @fires change Triggered when the position changes.
 * @param {olx.GeolocationOptions=} opt_options Options.
 * @api stable
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
  this.transform_ = ol.proj.identityTransform;

  /**
   * @private
   * @type {number|undefined}
   */
  this.watchId_ = undefined;

  goog.events.listen(
      this, ol.Object.getChangeEventType(ol.GeolocationProperty.PROJECTION),
      this.handleProjectionChanged_, false, this);
  goog.events.listen(
      this, ol.Object.getChangeEventType(ol.GeolocationProperty.TRACKING),
      this.handleTrackingChanged_, false, this);

  if (goog.isDef(options.projection)) {
    this.setProjection(ol.proj.get(options.projection));
  }
  if (goog.isDef(options.trackingOptions)) {
    this.setTrackingOptions(options.trackingOptions);
  }

  this.setTracking(goog.isDef(options.tracking) ? options.tracking : false);

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
    this.transform_ = ol.proj.getTransformFromProjections(
        ol.proj.get('EPSG:4326'), projection);
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
  if (ol.has.GEOLOCATION) {
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
  var projectedPosition = this.transform_(this.position_);
  this.set(ol.GeolocationProperty.POSITION, projectedPosition);
  this.set(ol.GeolocationProperty.SPEED,
      goog.isNull(coords.speed) ? undefined : coords.speed);
  var geometry = ol.geom.Polygon.circular(
      ol.sphere.WGS84, this.position_, coords.accuracy);
  geometry.applyTransform(this.transform_);
  this.set(ol.GeolocationProperty.ACCURACY_GEOMETRY, geometry);
  this.changed();
};


/**
 * @private
 * @param {GeolocationPositionError} error error object.
 */
ol.Geolocation.prototype.positionError_ = function(error) {
  error.type = goog.events.EventType.ERROR;
  this.setTracking(false);
  this.dispatchEvent(error);
};


/**
 * Get the accuracy of the position in meters.
 * @return {number|undefined} The accuracy of the position measurement in
 *     meters.
 * @observable
 * @api stable
 */
ol.Geolocation.prototype.getAccuracy = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.GeolocationProperty.ACCURACY));
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getAccuracy',
    ol.Geolocation.prototype.getAccuracy);


/**
 * Get a geometry of the position accuracy.
 * @return {?ol.geom.Geometry} A geometry of the position accuracy.
 * @observable
 * @api stable
 */
ol.Geolocation.prototype.getAccuracyGeometry = function() {
  return /** @type {?ol.geom.Geometry} */ (
      this.get(ol.GeolocationProperty.ACCURACY_GEOMETRY) || null);
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getAccuracyGeometry',
    ol.Geolocation.prototype.getAccuracyGeometry);


/**
 * Get the altitude associated with the position.
 * @return {number|undefined} The altitude of the position in meters above mean
 *     sea level.
 * @observable
 * @api stable
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
 * Get the altitude accuracy of the position.
 * @return {number|undefined} The accuracy of the altitude measurement in
 *     meters.
 * @observable
 * @api stable
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
 * Get the heading as radians clockwise from North.
 * @return {number|undefined} The heading of the device in radians from north.
 * @observable
 * @api stable
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
 * Get the position of the device.
 * @return {ol.Coordinate|undefined} The current position of the device reported
 *     in the current projection.
 * @observable
 * @api stable
 */
ol.Geolocation.prototype.getPosition = function() {
  return /** @type {ol.Coordinate|undefined} */ (
      this.get(ol.GeolocationProperty.POSITION));
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getPosition',
    ol.Geolocation.prototype.getPosition);


/**
 * Get the projection associated with the position.
 * @return {ol.proj.Projection|undefined} The projection the position is
 *     reported in.
 * @observable
 * @api stable
 */
ol.Geolocation.prototype.getProjection = function() {
  return /** @type {ol.proj.Projection|undefined} */ (
      this.get(ol.GeolocationProperty.PROJECTION));
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getProjection',
    ol.Geolocation.prototype.getProjection);


/**
 * Get the speed in meters per second.
 * @return {number|undefined} The instantaneous speed of the device in meters
 *     per second.
 * @observable
 * @api stable
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
 * Are we tracking the user's position?
 * @return {boolean} Whether to track the device's position.
 * @observable
 * @api stable
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
 * Get the tracking options.
 * @see http://www.w3.org/TR/geolocation-API/#position-options
 * @return {GeolocationPositionOptions|undefined} PositionOptions as defined by
 *     the HTML5 Geolocation spec at
 *     {@link http://www.w3.org/TR/geolocation-API/#position_options_interface}
 * @observable
 * @api stable
 */
ol.Geolocation.prototype.getTrackingOptions = function() {
  return /** @type {GeolocationPositionOptions|undefined} */ (
      this.get(ol.GeolocationProperty.TRACKING_OPTIONS));
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'getTrackingOptions',
    ol.Geolocation.prototype.getTrackingOptions);


/**
 * Set the projection to use for transforming the coordinates.
 * @param {ol.proj.Projection} projection The projection the position is
 *     reported in.
 * @observable
 * @api stable
 */
ol.Geolocation.prototype.setProjection = function(projection) {
  this.set(ol.GeolocationProperty.PROJECTION, projection);
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'setProjection',
    ol.Geolocation.prototype.setProjection);


/**
 * Enable/disable tracking.
 * @param {boolean} tracking Whether to track the device's position.
 * @observable
 * @api stable
 */
ol.Geolocation.prototype.setTracking = function(tracking) {
  this.set(ol.GeolocationProperty.TRACKING, tracking);
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'setTracking',
    ol.Geolocation.prototype.setTracking);


/**
 * Set the tracking options.
 * @see http://www.w3.org/TR/geolocation-API/#position-options
 * @param {GeolocationPositionOptions} options PositionOptions as defined by the
 *     HTML5 Geolocation spec at
 *     {@link http://www.w3.org/TR/geolocation-API/#position_options_interface}
 * @observable
 * @api stable
 */
ol.Geolocation.prototype.setTrackingOptions = function(options) {
  this.set(ol.GeolocationProperty.TRACKING_OPTIONS, options);
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'setTrackingOptions',
    ol.Geolocation.prototype.setTrackingOptions);
