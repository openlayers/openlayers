goog.provide('ol');
goog.provide('ol.layer');

goog.require('goog.dom');
goog.require('ol3.Collection');
goog.require('ol3.Coordinate');
goog.require('ol3.Layer');
goog.require('ol3.Map');
goog.require('ol3.Object');
goog.require('ol3.Projection');
goog.require('ol3.createMap');
goog.require('ol3.layer.OpenStreetMap');


goog.exportSymbol('ol', ol);


/**
 * @typedef {Array|ol3.Collection}
 */
ol.Collection;


/**
 * @typedef {Array.<number>|ol3.Coordinate|{x: number, y: number}}
 */
ol.Coordinate;


/**
 * @typedef {{center: (ol.Coordinate|undefined),
 *            layers: (ol.Collection|undefined),
 *            renderTo: (Element|string|undefined),
 *            resolution: (number|undefined),
 *            zoom: (number|undefined)}}
 */
ol.MapOptions;


/**
 * @typedef {Object|ol3.Object}
 */
ol.Object;


/**
 * @typedef {ol3.Projection|string}
 */
ol.Projection;


/**
 * @param {ol.Collection} collection Collection.
 * @return {ol3.Collection} Collection.
 */
ol.collection = function(collection) {
  if (collection instanceof ol3.Collection) {
    return collection;
  } else if (goog.isArray(collection)) {
    var array = /** @type {Array} */ collection;
    return new ol3.Collection(collection);
  } else {
    return null;
  }
};
goog.exportProperty(ol, 'collection', ol.collection);


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {ol3.Coordinate} Coordinate.
 */
ol.coordinate = function(coordinate) {
  if (coordinate instanceof ol3.Coordinate) {
    return coordinate;
  } else if (goog.isArray(coordinate)) {
    var array = /** @type {Array.<number>} */ coordinate;
    return new ol3.Coordinate(array[1], array[0]);
  } else if (goog.isObject(coordinate)) {
    var object = /** @type {{x: number, y: number}} */ coordinate;
    return new ol3.Coordinate(object.x, object.y);
  } else {
    return null;
  }
};
goog.exportProperty(ol, 'coordinate', ol.coordinate);


goog.exportProperty(ol, 'layer', ol.layer);


/**
 * @return {ol3.Layer} Layer.
 */
ol.layer.osm = function() {
  return new ol3.layer.OpenStreetMap();
};
goog.exportProperty(ol.layer, 'osm', ol.layer.osm);


/**
 * @param {ol.MapOptions=} opt_mapOptions Options.
 * @return {ol3.Map} Map.
 */
ol.map = function(opt_mapOptions) {
  var options = opt_mapOptions || {};
  var center = ol.coordinate(/** @type {ol.Coordinate} */
      (goog.object.get(options, 'center', null)));
  var layers = ol.collection(/** @type {ol.Collection} */
      (goog.object.get(options, 'layers', null)));
  var projection = ol.projection(/** @type {ol.Projection} */
      (goog.object.get(options, 'projection', 'EPSG:3857')));
  var resolution = /** @type {number|undefined} */
      goog.object.get(options, 'resolution');
  if (!goog.isDef(resolution) && goog.object.containsKey(options, 'zoom')) {
    var zoom = /** @type {number} */ goog.object.get(options, 'zoom');
    resolution = ol3.Projection.EPSG_3857_HALF_SIZE / (128 << zoom);
  }
  var target = goog.dom.getElement(/** @type {Element|string} */
      (goog.object.get(options, 'renderTo', 'map')));
  var userProjection = ol.projection(/** @type {ol.Projection} */
      (goog.object.get(options, 'userProjection', 'EPSG:4326')));
  var map = ol3.createMap(target, {
    'layers': layers,
    'projection': projection,
    'resolution': resolution,
    'userProjection': userProjection
  });
  if (!goog.isNull(center)) {
    map.setUserCenter(center);
  }
  return map;
};
goog.exportProperty(ol, 'map', ol.map);


/**
 * @param {ol.Object} object Object.
 * @return {ol3.Object} Object.
 */
ol.object = function(object) {
  if (object instanceof ol3.Object) {
    return object;
  } else if (goog.isObject(object)) {
    var values = /** @type {Object} */ object;
    return new ol3.Object(values);
  } else {
    return null;
  }
};
goog.exportProperty(ol, 'object', ol.object);


/**
 * @param {ol.Projection} projection Projection.
 * @return {ol3.Projection} Projection.
 */
ol.projection = function(projection) {
  if (projection instanceof ol3.Projection) {
    return projection;
  } else if (goog.isString(projection)) {
    var code = /** @type {string} */ projection;
    return ol3.Projection.getFromCode(code);
  } else {
    return null;
  }
};
goog.exportProperty(ol, 'projection', ol.projection);
