// FIXME: handle errors ?

goog.provide('ol.Geolocation');
goog.provide('ol.GeolocationProperty');

goog.require('ol.Coordinate');
goog.require('ol.Object');
goog.require('ol.Projection');


/**
 * @enum {string}
 */
ol.GeolocationProperty = {
  ACCURACY: 'accuracy',
  POSITION: 'position',
  PROJECTION: 'projection'
};



/**
 * @constructor
 * @extends {ol.Object}
 * @param {GeolocationPositionOptions=} opt_positionOptions PositionOptions.
 */
ol.Geolocation = function(opt_positionOptions) {

  goog.base(this);

  // set the default projection
  this.setProjection(ol.Projection.getFromCode('EPSG:4326'));

  /**
   * @private
   * @type {number}
   */
  this.watchId_ = navigator.geolocation.watchPosition(
      goog.bind(this.positionChange_, this),
      goog.bind(this.positionError_, this),
      opt_positionOptions);
};
goog.inherits(ol.Geolocation, ol.Object);


/**
 * @inheritDoc
 */
ol.Geolocation.prototype.disposeInternal = function() {
  navigator.geolocation.clearWatch(this.watchId_);
  goog.base(this, 'disposeInternal');
};


/**
 * @private
 * @param {GeolocationPosition} position position event.
 */
ol.Geolocation.prototype.positionChange_ = function(position) {
  var coords = position.coords;
  var coord = new ol.Coordinate(coords.longitude, coords.latitude);
  this.set(ol.GeolocationProperty.POSITION, this.transformCoords_(coord));
  this.set(ol.GeolocationProperty.ACCURACY, coords.accuracy);
};


/**
 * @private
 * @param {GeolocationPositionError} error error object.
 */
ol.Geolocation.prototype.positionError_ = function(error) {
};


/**
 * The position of the device.
 * @return {ol.Coordinate} position.
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
 * The accuracy of the position in meters.
 * @return {number} accuracy.
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
 * @return {ol.Projection} projection.
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
 * @param {ol.Projection} projection Projection.
 */
ol.Geolocation.prototype.setProjection = function(projection) {
  this.set(ol.GeolocationProperty.PROJECTION, projection);

  this.transformCoords_ = ol.Projection.getTransform(
      ol.Projection.getFromCode('EPSG:4326'), projection);
};
goog.exportProperty(
    ol.Geolocation.prototype,
    'setProjection',
    ol.Geolocation.prototype.setProjection);


/**
 * @private
 */
ol.Geolocation.prototype.transformCoords_ = goog.functions.identity;
