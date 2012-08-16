goog.provide('ol3');
goog.provide('ol3.layer');

goog.require('goog.dom');
goog.require('ol.Coordinate');
goog.require('ol.Layer');
goog.require('ol.Map');
goog.require('ol.Object');
goog.require('ol.Projection');
goog.require('ol.createMap');
goog.require('ol.layer.OpenStreetMap');


goog.exportSymbol('ol3', ol3);


/**
 * @typedef {Array.<number>|ol.Coordinate|{x: number, y: number}}
 */
ol3.Coordinate;


/**
 * @typedef {Array.<ol.Layer>|ol.Collection}
 */
ol3.Layers;


/**
 * @typedef {{center: (ol3.Coordinate|undefined),
 *            layers: (ol3.Layers|undefined),
 *            renderTo: (Element|string|undefined),
 *            resolution: (number|undefined),
 *            zoom: (number|undefined)}}
 */
ol3.MapOptions;


/**
 * @typedef {Object|ol.Object}
 */
ol3.Object;


/**
 * @typedef {ol.Projection|string}
 */
ol3.Projection;


/**
 * @param {ol3.Coordinate} coordinate Coordinate.
 * @return {ol.Coordinate} Coordinate.
 */
ol3.coordinate = function(coordinate) {
  if (coordinate instanceof ol.Coordinate) {
    return coordinate;
  } else if (goog.isArray(coordinate)) {
    var array = /** @type {Array.<number>} */ coordinate;
    return new ol.Coordinate(array[1], array[0]);
  } else if (goog.isObject(coordinate)) {
    var object = /** @type {{x: number, y: number}} */ coordinate;
    return new ol.Coordinate(object.x, object.y);
  } else {
    return null;
  }
};
goog.exportProperty(ol3, 'coordinate', ol3.coordinate);


goog.exportProperty(ol3, 'layer', ol3.layer);


/**
 * @return {ol.Layer} Layer.
 */
ol3.layer.osm = function() {
  return new ol.layer.OpenStreetMap();
};
goog.exportProperty(ol3.layer, 'osm', ol3.layer.osm);


/**
 * @param {ol3.Layers} layers Layers.
 * @return {ol.Collection} Layers.
 */
ol3.layers = function(layers) {
  if (layers instanceof ol.Collection) {
    return layers;
  } else if (goog.isArray(layers)) {
    return new ol.Collection(layers);
  } else {
    return null;
  }
};
goog.exportProperty(ol3, 'layers', ol3.layers);


/**
 * @param {ol3.MapOptions=} opt_mapOptions Options.
 * @return {ol.Map} Map.
 */
ol3.map = function(opt_mapOptions) {
  var options = opt_mapOptions || {};
  var center = ol3.coordinate(/** @type {ol3.Coordinate} */
      (goog.object.get(options, 'center', null)));
  var layers = ol3.layers(/** @type {ol3.Layers} */
      (goog.object.get(options, 'layers', null)));
  var projection = ol3.projection(/** @type {ol3.Projection} */
      (goog.object.get(options, 'projection', 'EPSG:3857')));
  var resolution = /** @type {number|undefined} */
      goog.object.get(options, 'resolution');
  if (!goog.isDef(resolution) && goog.object.containsKey(options, 'zoom')) {
    var zoom = /** @type {number} */ goog.object.get(options, 'zoom');
    resolution = ol.Projection.EPSG_3857_HALF_SIZE / (128 << zoom);
  }
  var target = goog.dom.getElement(/** @type {Element|string} */
      (goog.object.get(options, 'renderTo', 'map')));
  var userProjection = ol3.projection(/** @type {ol3.Projection} */
      (goog.object.get(options, 'userProjection', 'EPSG:4326')));
  var map = ol.createMap(target, {
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
goog.exportProperty(ol3, 'map', ol3.map);


/**
 * @param {ol3.Object} object Object.
 * @return {ol.Object} Object.
 */
ol3.object = function(object) {
  if (object instanceof ol.Object) {
    return object;
  } else if (goog.isObject(object)) {
    var values = /** @type {Object} */ object;
    return new ol.Object(values);
  } else {
    return null;
  }
};
goog.exportProperty(ol3, 'object', ol3.object);


/**
 * @param {ol3.Projection} projection Projection.
 * @return {ol.Projection} Projection.
 */
ol3.projection = function(projection) {
  if (projection instanceof ol.Projection) {
    return projection;
  } else if (goog.isString(projection)) {
    var code = /** @type {string} */ projection;
    return ol.Projection.getFromCode(code);
  } else {
    return null;
  }
};
goog.exportProperty(ol3, 'projection', ol3.projection);
