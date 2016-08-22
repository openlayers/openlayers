// FIXME handle geolocation not supported

goog.provide('ol.Geolocation');

goog.require('ol');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.Object');
goog.require('ol.geom.Polygon');
goog.require('ol.has');
goog.require('ol.math');
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
 * To get notified of position changes, register a listener for the generic
 * `change` event on your instance of `ol.Geolocation`.
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
 * @fires error
 * @constructor
 * @extends {ol.Object}
 * @param {olx.GeolocationOptions=} opt_options Options.
 * @api stable
 */
ol.Geolocation = function(opt_options) {

  ol.Object.call(this);

  var options = opt_options || {};

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

  ol.events.listen(
      this, ol.Object.getChangeEventType(ol.GeolocationProperty.PROJECTION),
      this.handleProjectionChanged_, this);
  ol.events.listen(
      this, ol.Object.getChangeEventType(ol.GeolocationProperty.TRACKING),
      this.handleTrackingChanged_, this);

  if (options.projection !== undefined) {
    this.setProjection(ol.proj.get(options.projection));
  }
  if (options.trackingOptions !== undefined) {
    this.setTrackingOptions(options.trackingOptions);
  }

  this.setTracking(options.tracking !== undefined ? options.tracking : false);

};
ol.inherits(ol.Geolocation, ol.Object);


/**
 * @inheritDoc
 */
ol.Geolocation.prototype.disposeInternal = function() {
  this.setTracking(false);
  ol.Object.prototype.disposeInternal.call(this);
};


/**
 * @private
 */
ol.Geolocation.prototype.handleProjectionChanged_ = function() {
  var projection = this.getProjection();
  if (projection) {
    this.transform_ = ol.proj.getTransformFromProjections(
        ol.proj.get('EPSG:4326'), projection);
    if (this.position_) {
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
    if (tracking && this.watchId_ === undefined) {
      this.watchId_ = ol.global.navigator.geolocation.watchPosition(
          this.positionChange_.bind(this),
          this.positionError_.bind(this),
          this.getTrackingOptions());
    } else if (!tracking && this.watchId_ !== undefined) {
      ol.global.navigator.geolocation.clearWatch(this.watchId_);
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
      coords.altitude === null ? undefined : coords.altitude);
  this.set(ol.GeolocationProperty.ALTITUDE_ACCURACY,
      coords.altitudeAccuracy === null ?
      undefined : coords.altitudeAccuracy);
  this.set(ol.GeolocationProperty.HEADING, coords.heading === null ?
      undefined : ol.math.toRadians(coords.heading));
  if (!this.position_) {
    this.position_ = [coords.longitude, coords.latitude];
  } else {
    this.position_[0] = coords.longitude;
    this.position_[1] = coords.latitude;
  }
  var projectedPosition = this.transform_(this.position_);
  this.set(ol.GeolocationProperty.POSITION, projectedPosition);
  this.set(ol.GeolocationProperty.SPEED,
      coords.speed === null ? undefined : coords.speed);
  var geometry = ol.geom.Polygon.circular(
      ol.sphere.WGS84, this.position_, coords.accuracy);
  geometry.applyTransform(this.transform_);
  this.set(ol.GeolocationProperty.ACCURACY_GEOMETRY, geometry);
  this.changed();
};

/**
 * Triggered when the Geolocation returns an error.
 * @event error
 * @api
 */

/**
 * @private
 * @param {GeolocationPositionError} error error object.
 */
ol.Geolocation.prototype.positionError_ = function(error) {
  error.type = ol.events.EventType.ERROR;
  this.setTracking(false);
  this.dispatchEvent(/** @type {{type: string, target: undefined}} */ (error));
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


/**
 * Determine if the device location is being tracked.
 * @return {boolean} The device location is being tracked.
 * @observable
 * @api stable
 */
ol.Geolocation.prototype.getTracking = function() {
  return /** @type {boolean} */ (
      this.get(ol.GeolocationProperty.TRACKING));
};


/**
 * Get the tracking options.
 * @see http://www.w3.org/TR/geolocation-API/#position-options
 * @return {GeolocationPositionOptions|undefined} PositionOptions as defined by
 *     the [HTML5 Geolocation spec
 *     ](http://www.w3.org/TR/geolocation-API/#position_options_interface).
 * @observable
 * @api stable
 */
ol.Geolocation.prototype.getTrackingOptions = function() {
  return /** @type {GeolocationPositionOptions|undefined} */ (
      this.get(ol.GeolocationProperty.TRACKING_OPTIONS));
};


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


/**
 * Enable or disable tracking.
 * @param {boolean} tracking Enable tracking.
 * @observable
 * @api stable
 */
ol.Geolocation.prototype.setTracking = function(tracking) {
  this.set(ol.GeolocationProperty.TRACKING, tracking);
};


/**
 * Set the tracking options.
 * @see http://www.w3.org/TR/geolocation-API/#position-options
 * @param {GeolocationPositionOptions} options PositionOptions as defined by the
 *     [HTML5 Geolocation spec
 *     ](http://www.w3.org/TR/geolocation-API/#position_options_interface).
 * @observable
 * @api stable
 */
ol.Geolocation.prototype.setTrackingOptions = function(options) {
  this.set(ol.GeolocationProperty.TRACKING_OPTIONS, options);
};
