goog.provide('ol.format.EsriJSON');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.format.Feature');
goog.require('ol.format.JSONFeature');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.flat.orient');
goog.require('ol.proj');



/**
 * @classdesc
 * Feature format for reading and writing data in the EsriJSON format.
 *
 * @constructor
 * @extends {ol.format.JSONFeature}
 * @param {olx.format.EsriJSONOptions=} opt_options Options.
 * @api
 */
ol.format.EsriJSON = function(opt_options) {

  var options = opt_options ? opt_options : {};

  goog.base(this);

  /**
   * Name of the geometry attribute for features.
   * @type {string|undefined}
   * @private
   */
  this.geometryName_ = options.geometryName;

};
goog.inherits(ol.format.EsriJSON, ol.format.JSONFeature);


/**
 * @param {EsriJSONGeometry} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @private
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.EsriJSON.readGeometry_ = function(object, opt_options) {
  if (!object) {
    return null;
  }
  var type;
  if (goog.isNumber(object.x) && goog.isNumber(object.y)) {
    type = ol.geom.GeometryType.POINT;
  } else if (object.points) {
    type = ol.geom.GeometryType.MULTI_POINT;
  } else if (object.paths) {
    if (object.paths.length === 1) {
      type = ol.geom.GeometryType.LINE_STRING;
    } else {
      type = ol.geom.GeometryType.MULTI_LINE_STRING;
    }
  } else if (object.rings) {
    var layout = ol.format.EsriJSON.getGeometryLayout_(object);
    var rings = ol.format.EsriJSON.convertRings_(object.rings, layout);
    object = /** @type {EsriJSONGeometry} */(goog.object.clone(object));
    if (rings.length === 1) {
      type = ol.geom.GeometryType.POLYGON;
      object.rings = rings[0];
    } else {
      type = ol.geom.GeometryType.MULTI_POLYGON;
      object.rings = rings;
    }
  }
  goog.asserts.assert(type, 'geometry type should be defined');
  var geometryReader = ol.format.EsriJSON.GEOMETRY_READERS_[type];
  goog.asserts.assert(geometryReader,
      'geometryReader should be defined');
  return /** @type {ol.geom.Geometry} */ (
      ol.format.Feature.transformWithOptions(
          geometryReader(object), false, opt_options));
};


/**
 * Determines inner and outer rings.
 * Checks if any polygons in this array contain any other polygons in this
 * array. It is used for checking for holes.
 * Logic inspired by: https://github.com/Esri/terraformer-arcgis-parser
 * @param {Array.<!Array.<!Array.<number>>>} rings Rings.
 * @param {ol.geom.GeometryLayout} layout Geometry layout.
 * @private
 * @return {Array.<!Array.<!Array.<number>>>} Transoformed rings.
 */
ol.format.EsriJSON.convertRings_ = function(rings, layout) {
  var outerRings = [];
  var holes = [];
  var i, ii;
  for (i = 0, ii = rings.length; i < ii; ++i) {
    var flatRing = goog.array.flatten(rings[i]);
    // is this ring an outer ring? is it clockwise?
    var clockwise = ol.geom.flat.orient.linearRingIsClockwise(flatRing, 0,
        flatRing.length, layout.length);
    if (clockwise) {
      outerRings.push([rings[i]]);
    } else {
      holes.push(rings[i]);
    }
  }
  while (holes.length) {
    var hole = holes.shift();
    var matched = false;
    // loop over all outer rings and see if they contain our hole.
    for (i = outerRings.length - 1; i >= 0; i--) {
      var outerRing = outerRings[i][0];
      if (ol.extent.containsExtent(new ol.geom.LinearRing(
          outerRing).getExtent(),
          new ol.geom.LinearRing(hole).getExtent())) {
        // the hole is contained push it into our polygon
        outerRings[i].push(hole);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // no outer rings contain this hole turn it into and outer
      // ring (reverse it)
      outerRings.push([hole.reverse()]);
    }
  }
  return outerRings;
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} Point.
 */
ol.format.EsriJSON.readPointGeometry_ = function(object) {
  goog.asserts.assert(goog.isNumber(object.x), 'object.x should be number');
  goog.asserts.assert(goog.isNumber(object.y), 'object.y should be number');
  var point;
  if (object.m !== undefined && object.z !== undefined) {
    point = new ol.geom.Point([object.x, object.y, object.z, object.m],
        ol.geom.GeometryLayout.XYZM);
  } else if (object.z !== undefined) {
    point = new ol.geom.Point([object.x, object.y, object.z],
        ol.geom.GeometryLayout.XYZ);
  } else if (object.m !== undefined) {
    point = new ol.geom.Point([object.x, object.y, object.m],
        ol.geom.GeometryLayout.XYM);
  } else {
    point = new ol.geom.Point([object.x, object.y]);
  }
  return point;
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} LineString.
 */
ol.format.EsriJSON.readLineStringGeometry_ = function(object) {
  goog.asserts.assert(goog.isArray(object.paths),
      'object.paths should be an array');
  goog.asserts.assert(object.paths.length === 1,
      'object.paths array length should be 1');
  var layout = ol.format.EsriJSON.getGeometryLayout_(object);
  return new ol.geom.LineString(object.paths[0], layout);
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} MultiLineString.
 */
ol.format.EsriJSON.readMultiLineStringGeometry_ = function(object) {
  goog.asserts.assert(goog.isArray(object.paths),
      'object.paths should be an array');
  goog.asserts.assert(object.paths.length > 1,
      'object.paths array length should be more than 1');
  var layout = ol.format.EsriJSON.getGeometryLayout_(object);
  return new ol.geom.MultiLineString(object.paths, layout);
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.GeometryLayout} The geometry layout to use.
 */
ol.format.EsriJSON.getGeometryLayout_ = function(object) {
  var layout = ol.geom.GeometryLayout.XY;
  if (object.hasZ === true && object.hasM === true) {
    layout = ol.geom.GeometryLayout.XYZM;
  } else if (object.hasZ === true) {
    layout = ol.geom.GeometryLayout.XYZ;
  } else if (object.hasM === true) {
    layout = ol.geom.GeometryLayout.XYM;
  }
  return layout;
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} MultiPoint.
 */
ol.format.EsriJSON.readMultiPointGeometry_ = function(object) {
  goog.asserts.assert(object.points, 'object.points should be defined');
  var layout = ol.format.EsriJSON.getGeometryLayout_(object);
  return new ol.geom.MultiPoint(object.points, layout);
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} MultiPolygon.
 */
ol.format.EsriJSON.readMultiPolygonGeometry_ = function(object) {
  goog.asserts.assert(object.rings);
  goog.asserts.assert(object.rings.length > 1,
      'object.rings should have length larger than 1');
  var layout = ol.format.EsriJSON.getGeometryLayout_(object);
  return new ol.geom.MultiPolygon(
      /** @type {Array.<Array.<Array.<Array.<number>>>>} */(object.rings),
      layout);
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} Polygon.
 */
ol.format.EsriJSON.readPolygonGeometry_ = function(object) {
  goog.asserts.assert(object.rings);
  var layout = ol.format.EsriJSON.getGeometryLayout_(object);
  return new ol.geom.Polygon(object.rings, layout);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {EsriJSONGeometry} EsriJSON geometry.
 */
ol.format.EsriJSON.writePointGeometry_ = function(geometry, opt_options) {
  goog.asserts.assertInstanceof(geometry, ol.geom.Point,
      'geometry should be an ol.geom.Point');
  var coordinates = geometry.getCoordinates();
  var layout = geometry.getLayout();
  if (layout === ol.geom.GeometryLayout.XYZ) {
    return /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1],
      z: coordinates[2]
    });
  } else if (layout === ol.geom.GeometryLayout.XYM) {
    return /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1],
      m: coordinates[2]
    });
  } else if (layout === ol.geom.GeometryLayout.XYZM) {
    return /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1],
      z: coordinates[2],
      m: coordinates[3]
    });
  } else if (layout === ol.geom.GeometryLayout.XY) {
    return /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1]
    });
  } else {
    goog.asserts.fail('Unknown geometry layout');
  }
};


/**
 * @param {ol.geom.SimpleGeometry} geometry Geometry.
 * @private
 * @return {Object} Object with boolean hasZ and hasM keys.
 */
ol.format.EsriJSON.getHasZM_ = function(geometry) {
  var layout = geometry.getLayout();
  return {
    hasZ: (layout === ol.geom.GeometryLayout.XYZ ||
        layout === ol.geom.GeometryLayout.XYZM),
    hasM: (layout === ol.geom.GeometryLayout.XYM ||
        layout === ol.geom.GeometryLayout.XYZM)
  };
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {EsriJSONPolyline} EsriJSON geometry.
 */
ol.format.EsriJSON.writeLineStringGeometry_ = function(geometry, opt_options) {
  goog.asserts.assertInstanceof(geometry, ol.geom.LineString,
      'geometry should be an ol.geom.LineString');
  var hasZM = ol.format.EsriJSON.getHasZM_(geometry);
  return /** @type {EsriJSONPolyline} */ ({
    hasZ: hasZM.hasZ,
    hasM: hasZM.hasM,
    paths: [geometry.getCoordinates()]
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {EsriJSONPolygon} EsriJSON geometry.
 */
ol.format.EsriJSON.writePolygonGeometry_ = function(geometry, opt_options) {
  goog.asserts.assertInstanceof(geometry, ol.geom.Polygon,
      'geometry should be an ol.geom.Polygon');
  // Esri geometries use the left-hand rule
  var hasZM = ol.format.EsriJSON.getHasZM_(geometry);
  return /** @type {EsriJSONPolygon} */ ({
    hasZ: hasZM.hasZ,
    hasM: hasZM.hasM,
    rings: geometry.getCoordinates(false)
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {EsriJSONPolyline} EsriJSON geometry.
 */
ol.format.EsriJSON.writeMultiLineStringGeometry_ =
    function(geometry, opt_options) {
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiLineString,
      'geometry should be an ol.geom.MultiLineString');
  var hasZM = ol.format.EsriJSON.getHasZM_(geometry);
  return /** @type {EsriJSONPolyline} */ ({
    hasZ: hasZM.hasZ,
    hasM: hasZM.hasM,
    paths: geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {EsriJSONMultipoint} EsriJSON geometry.
 */
ol.format.EsriJSON.writeMultiPointGeometry_ = function(geometry, opt_options) {
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiPoint,
      'geometry should be an ol.geom.MultiPoint');
  var hasZM = ol.format.EsriJSON.getHasZM_(geometry);
  return /** @type {EsriJSONMultipoint} */ ({
    hasZ: hasZM.hasZ,
    hasM: hasZM.hasM,
    points: geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {EsriJSONPolygon} EsriJSON geometry.
 */
ol.format.EsriJSON.writeMultiPolygonGeometry_ = function(geometry,
    opt_options) {
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiPolygon,
      'geometry should be an ol.geom.MultiPolygon');
  var hasZM = ol.format.EsriJSON.getHasZM_(geometry);
  var coordinates = geometry.getCoordinates(false);
  var output = [];
  for (var i = 0; i < coordinates.length; i++) {
    for (var x = coordinates[i].length - 1; x >= 0; x--) {
      output.push(coordinates[i][x]);
    }
  }
  return /** @type {EsriJSONPolygon} */ ({
    hasZ: hasZM.hasZ,
    hasM: hasZM.hasM,
    rings: output
  });
};


/**
 * @const
 * @private
 * @type {Object.<ol.geom.GeometryType, function(EsriJSONGeometry): ol.geom.Geometry>}
 */
ol.format.EsriJSON.GEOMETRY_READERS_ = {};
ol.format.EsriJSON.GEOMETRY_READERS_[ol.geom.GeometryType.POINT] =
    ol.format.EsriJSON.readPointGeometry_;
ol.format.EsriJSON.GEOMETRY_READERS_[ol.geom.GeometryType.LINE_STRING] =
    ol.format.EsriJSON.readLineStringGeometry_;
ol.format.EsriJSON.GEOMETRY_READERS_[ol.geom.GeometryType.POLYGON] =
    ol.format.EsriJSON.readPolygonGeometry_;
ol.format.EsriJSON.GEOMETRY_READERS_[ol.geom.GeometryType.MULTI_POINT] =
    ol.format.EsriJSON.readMultiPointGeometry_;
ol.format.EsriJSON.GEOMETRY_READERS_[ol.geom.GeometryType.MULTI_LINE_STRING] =
    ol.format.EsriJSON.readMultiLineStringGeometry_;
ol.format.EsriJSON.GEOMETRY_READERS_[ol.geom.GeometryType.MULTI_POLYGON] =
    ol.format.EsriJSON.readMultiPolygonGeometry_;


/**
 * @const
 * @private
 * @type {Object.<string, function(ol.geom.Geometry, olx.format.WriteOptions=): (EsriJSONGeometry)>}
 */
ol.format.EsriJSON.GEOMETRY_WRITERS_ = {};
ol.format.EsriJSON.GEOMETRY_WRITERS_[ol.geom.GeometryType.POINT] =
    ol.format.EsriJSON.writePointGeometry_;
ol.format.EsriJSON.GEOMETRY_WRITERS_[ol.geom.GeometryType.LINE_STRING] =
    ol.format.EsriJSON.writeLineStringGeometry_;
ol.format.EsriJSON.GEOMETRY_WRITERS_[ol.geom.GeometryType.POLYGON] =
    ol.format.EsriJSON.writePolygonGeometry_;
ol.format.EsriJSON.GEOMETRY_WRITERS_[ol.geom.GeometryType.MULTI_POINT] =
    ol.format.EsriJSON.writeMultiPointGeometry_;
ol.format.EsriJSON.GEOMETRY_WRITERS_[ol.geom.GeometryType.MULTI_LINE_STRING] =
    ol.format.EsriJSON.writeMultiLineStringGeometry_;
ol.format.EsriJSON.GEOMETRY_WRITERS_[ol.geom.GeometryType.MULTI_POLYGON] =
    ol.format.EsriJSON.writeMultiPolygonGeometry_;


/**
 * Read a feature from a EsriJSON Feature source.  Only works for Feature,
 * use `readFeatures` to read FeatureCollection source.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 * @api
 */
ol.format.EsriJSON.prototype.readFeature;


/**
 * Read all features from a EsriJSON source.  Works with both Feature and
 * FeatureCollection sources.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
ol.format.EsriJSON.prototype.readFeatures;


/**
 * @inheritDoc
 */
ol.format.EsriJSON.prototype.readFeatureFromObject = function(
    object, opt_options) {
  var esriJSONFeature = /** @type {EsriJSONFeature} */ (object);
  goog.asserts.assert(esriJSONFeature.geometry ||
      esriJSONFeature.attributes,
      'geometry or attributes should be defined');
  var geometry = ol.format.EsriJSON.readGeometry_(esriJSONFeature.geometry,
      opt_options);
  var feature = new ol.Feature();
  if (this.geometryName_) {
    feature.setGeometryName(this.geometryName_);
  }
  feature.setGeometry(geometry);
  if (opt_options && opt_options.idField &&
      esriJSONFeature.attributes[opt_options.idField]) {
    goog.asserts.assert(
        goog.isNumber(esriJSONFeature.attributes[opt_options.idField]),
        'objectIdFieldName value should be a number');
    feature.setId(/** @type {number} */(
        esriJSONFeature.attributes[opt_options.idField]));
  }
  if (esriJSONFeature.attributes) {
    feature.setProperties(esriJSONFeature.attributes);
  }
  return feature;
};


/**
 * @inheritDoc
 */
ol.format.EsriJSON.prototype.readFeaturesFromObject = function(
    object, opt_options) {
  var esriJSONObject = /** @type {EsriJSONObject} */ (object);
  var options = opt_options ? opt_options : {};
  if (esriJSONObject.features) {
    var esriJSONFeatureCollection = /** @type {EsriJSONFeatureCollection} */
        (object);
    /** @type {Array.<ol.Feature>} */
    var features = [];
    var esriJSONFeatures = esriJSONFeatureCollection.features;
    var i, ii;
    options.idField = object.objectIdFieldName;
    for (i = 0, ii = esriJSONFeatures.length; i < ii; ++i) {
      features.push(this.readFeatureFromObject(esriJSONFeatures[i],
          options));
    }
    return features;
  } else {
    return [this.readFeatureFromObject(object, options)];
  }
};


/**
 * Read a geometry from a EsriJSON source.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.geom.Geometry} Geometry.
 * @api
 */
ol.format.EsriJSON.prototype.readGeometry;


/**
 * @inheritDoc
 */
ol.format.EsriJSON.prototype.readGeometryFromObject = function(
    object, opt_options) {
  return ol.format.EsriJSON.readGeometry_(
      /** @type {EsriJSONGeometry} */ (object), opt_options);
};


/**
 * Read the projection from a EsriJSON source.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 * @api
 */
ol.format.EsriJSON.prototype.readProjection;


/**
 * @inheritDoc
 */
ol.format.EsriJSON.prototype.readProjectionFromObject = function(object) {
  var esriJSONObject = /** @type {EsriJSONObject} */ (object);
  if (esriJSONObject.spatialReference && esriJSONObject.spatialReference.wkid) {
    var crs = esriJSONObject.spatialReference.wkid;
    return ol.proj.get('EPSG:' + crs);
  } else {
    return null;
  }
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {EsriJSONGeometry} EsriJSON geometry.
 */
ol.format.EsriJSON.writeGeometry_ = function(geometry, opt_options) {
  var geometryWriter = ol.format.EsriJSON.GEOMETRY_WRITERS_[geometry.getType()];
  goog.asserts.assert(geometryWriter, 'geometryWriter should be defined');
  return geometryWriter(/** @type {ol.geom.Geometry} */ (
      ol.format.Feature.transformWithOptions(geometry, true, opt_options)),
      opt_options);
};


/**
 * Encode a geometry as a EsriJSON string.
 *
 * @function
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} EsriJSON.
 * @api
 */
ol.format.EsriJSON.prototype.writeGeometry;


/**
 * Encode a geometry as a EsriJSON object.
 *
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {EsriJSONGeometry} Object.
 * @api
 */
ol.format.EsriJSON.prototype.writeGeometryObject = function(geometry,
    opt_options) {
  return ol.format.EsriJSON.writeGeometry_(geometry,
      this.adaptOptions(opt_options));
};


/**
 * Encode a feature as a EsriJSON Feature string.
 *
 * @function
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} EsriJSON.
 * @api
 */
ol.format.EsriJSON.prototype.writeFeature;


/**
 * Encode a feature as a esriJSON Feature object.
 *
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 * @api
 */
ol.format.EsriJSON.prototype.writeFeatureObject = function(
    feature, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  var object = {};
  var geometry = feature.getGeometry();
  if (geometry) {
    object['geometry'] =
        ol.format.EsriJSON.writeGeometry_(geometry, opt_options);
  }
  var properties = feature.getProperties();
  delete properties[feature.getGeometryName()];
  if (!goog.object.isEmpty(properties)) {
    object['attributes'] = properties;
  } else {
    object['attributes'] = {};
  }
  if (opt_options && opt_options.featureProjection) {
    object['spatialReference'] = /** @type {EsriJSONCRS} */({
      wkid: ol.proj.get(
          opt_options.featureProjection).getCode().split(':').pop()
    });
  }
  return object;
};


/**
 * Encode an array of features as EsriJSON.
 *
 * @function
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} EsriJSON.
 * @api
 */
ol.format.EsriJSON.prototype.writeFeatures;


/**
 * Encode an array of features as a EsriJSON object.
 *
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {Object} EsriJSON Object.
 * @api
 */
ol.format.EsriJSON.prototype.writeFeaturesObject =
    function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  var objects = [];
  var i, ii;
  for (i = 0, ii = features.length; i < ii; ++i) {
    objects.push(this.writeFeatureObject(features[i], opt_options));
  }
  return /** @type {EsriJSONFeatureCollection} */ ({
    'features': objects
  });
};
