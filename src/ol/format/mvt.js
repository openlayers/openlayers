//FIXME Implement projection handling

goog.provide('ol.format.MVT');

goog.require('ol');
goog.require('ol.ext.pbf');
goog.require('ol.ext.vectortile');
goog.require('ol.format.Feature');
goog.require('ol.format.FormatType');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj.Projection');
goog.require('ol.proj.Units');
goog.require('ol.render.Feature');


/**
 * @classdesc
 * Feature format for reading data in the Mapbox MVT format.
 *
 * @constructor
 * @extends {ol.format.Feature}
 * @param {olx.format.MVTOptions=} opt_options Options.
 * @api
 */
ol.format.MVT = function(opt_options) {

  ol.format.Feature.call(this);

  var options = opt_options ? opt_options : {};

  /**
   * @type {ol.proj.Projection}
   */
  this.defaultDataProjection = new ol.proj.Projection({
    code: '',
    units: ol.proj.Units.TILE_PIXELS
  });

  /**
   * @private
   * @type {function((ol.geom.Geometry|Object.<string, *>)=)|
   *     function(ol.geom.GeometryType,Array.<number>,
   *         (Array.<number>|Array.<Array.<number>>),Object.<string, *>)}
   */
  this.featureClass_ = options.featureClass ?
      options.featureClass : ol.render.Feature;

  /**
   * @private
   * @type {string}
   */
  this.geometryName_ = options.geometryName ?
      options.geometryName : 'geometry';

  /**
   * @private
   * @type {string}
   */
  this.layerName_ = options.layerName ? options.layerName : 'layer';

  /**
   * @private
   * @type {Array.<string>}
   */
  this.layers_ = options.layers ? options.layers : null;

};
ol.inherits(ol.format.MVT, ol.format.Feature);


/**
 * @inheritDoc
 */
ol.format.MVT.prototype.getType = function() {
  return ol.format.FormatType.ARRAY_BUFFER;
};


/**
 * @private
 * @param {Object} rawFeature Raw Mapbox feature.
 * @param {string} layer Layer.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 */
ol.format.MVT.prototype.readFeature_ = function(
    rawFeature, layer, opt_options) {
  var feature = new this.featureClass_();
  var id = rawFeature.id;
  var values = rawFeature.properties;
  values[this.layerName_] = layer;
  var geometry = ol.format.Feature.transformWithOptions(
      ol.format.MVT.readGeometry_(rawFeature), false,
      this.adaptOptions(opt_options));
  if (geometry) {
    values[this.geometryName_] = geometry;
  }
  feature.setId(id);
  feature.setProperties(values);
  feature.setGeometryName(this.geometryName_);
  return feature;
};


/**
 * @private
 * @param {Object} rawFeature Raw Mapbox feature.
 * @param {string} layer Layer.
 * @return {ol.render.Feature} Feature.
 */
ol.format.MVT.prototype.readRenderFeature_ = function(rawFeature, layer) {
  var coords = rawFeature.loadGeometry();
  var ends = [];
  var flatCoordinates = [];
  ol.format.MVT.calculateFlatCoordinates_(coords, flatCoordinates, ends);

  var type = rawFeature.type;
  /** @type {ol.geom.GeometryType} */
  var geometryType;
  if (type === 1) {
    geometryType = coords.length === 1 ?
        ol.geom.GeometryType.POINT : ol.geom.GeometryType.MULTI_POINT;
  } else if (type === 2) {
    if (coords.length === 1) {
      geometryType = ol.geom.GeometryType.LINE_STRING;
    } else {
      geometryType = ol.geom.GeometryType.MULTI_LINE_STRING;
    }
  } else if (type === 3) {
    geometryType = ol.geom.GeometryType.POLYGON;
  }

  var values = rawFeature.properties;
  values[this.layerName_] = layer;

  return new this.featureClass_(geometryType, flatCoordinates, ends, values);
};


/**
 * @inheritDoc
 * @api
 */
ol.format.MVT.prototype.readFeatures = function(source, opt_options) {
  var layers = this.layers_;

  var pbf = new ol.ext.pbf(/** @type {ArrayBuffer} */ (source));
  var tile = new ol.ext.vectortile.VectorTile(pbf);
  var features = [];
  var featureClass = this.featureClass_;
  var layer, feature;
  for (var name in tile.layers) {
    if (layers && layers.indexOf(name) == -1) {
      continue;
    }
    layer = tile.layers[name];

    for (var i = 0, ii = layer.length; i < ii; ++i) {
      if (featureClass === ol.render.Feature) {
        feature = this.readRenderFeature_(layer.feature(i), name);
      } else {
        feature = this.readFeature_(layer.feature(i), name, opt_options);
      }
      features.push(feature);
    }
  }

  return features;
};


/**
 * @inheritDoc
 * @api
 */
ol.format.MVT.prototype.readProjection = function(source) {
  return this.defaultDataProjection;
};


/**
 * Sets the layers that features will be read from.
 * @param {Array.<string>} layers Layers.
 * @api
 */
ol.format.MVT.prototype.setLayers = function(layers) {
  this.layers_ = layers;
};


/**
 * @private
 * @param {Object} coords Raw feature coordinates.
 * @param {Array.<number>} flatCoordinates Flat coordinates to be populated by
 *     this function.
 * @param {Array.<number>} ends Ends to be populated by this function.
 */
ol.format.MVT.calculateFlatCoordinates_ = function(
    coords, flatCoordinates, ends) {
  var end = 0;
  for (var i = 0, ii = coords.length; i < ii; ++i) {
    var line = coords[i];
    var j, jj;
    for (j = 0, jj = line.length; j < jj; ++j) {
      var coord = line[j];
      // Non-tilespace coords can be calculated here when a TileGrid and
      // TileCoord are known.
      flatCoordinates.push(coord.x, coord.y);
    }
    end += 2 * j;
    ends.push(end);
  }
};


/**
 * @private
 * @param {Object} rawFeature Raw Mapbox feature.
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.MVT.readGeometry_ = function(rawFeature) {
  var type = rawFeature.type;
  if (type === 0) {
    return null;
  }

  var coords = rawFeature.loadGeometry();
  var ends = [];
  var flatCoordinates = [];
  ol.format.MVT.calculateFlatCoordinates_(coords, flatCoordinates, ends);

  var geom;
  if (type === 1) {
    geom = coords.length === 1 ?
        new ol.geom.Point(null) : new ol.geom.MultiPoint(null);
  } else if (type === 2) {
    if (coords.length === 1) {
      geom = new ol.geom.LineString(null);
    } else {
      geom = new ol.geom.MultiLineString(null);
    }
  } else if (type === 3) {
    geom = new ol.geom.Polygon(null);
  }

  geom.setFlatCoordinates(ol.geom.GeometryLayout.XY, flatCoordinates,
      ends);

  return geom;
};
