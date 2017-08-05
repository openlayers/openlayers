goog.provide('ol.format.EsriJSON');

goog.require('ol');
goog.require('ol.Feature');
goog.require('ol.asserts');
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
goog.require('ol.geom.flat.deflate');
goog.require('ol.geom.flat.orient');
goog.require('ol.obj');
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

  ol.format.JSONFeature.call(this);

  /**
   * Name of the geometry attribute for features.
   * @type {string|undefined}
   * @private
   */
  this.geometryName_ = options.geometryName;

};
ol.inherits(ol.format.EsriJSON, ol.format.JSONFeature);


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
  /** @type {ol.geom.GeometryType} */
  var type;
  if (typeof object.x === 'number' && typeof object.y === 'number') {
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
    object = /** @type {EsriJSONGeometry} */(ol.obj.assign({}, object));
    if (rings.length === 1) {
      type = ol.geom.GeometryType.POLYGON;
      object.rings = rings[0];
    } else {
      type = ol.geom.GeometryType.MULTI_POLYGON;
      object.rings = rings;
    }
  }
  var geometryReader = ol.format.EsriJSON.GEOMETRY_READERS_[type];
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
 * @return {Array.<!Array.<!Array.<number>>>} Transformed rings.
 */
ol.format.EsriJSON.convertRings_ = function(rings, layout) {
  var flatRing = [];
  var outerRings = [];
  var holes = [];
  var i, ii;
  for (i = 0, ii = rings.length; i < ii; ++i) {
    flatRing.length = 0;
    ol.geom.flat.deflate.coordinates(flatRing, 0, rings[i], layout.length);
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
      var containsHole = ol.extent.containsExtent(
          new ol.geom.LinearRing(outerRing).getExtent(),
          new ol.geom.LinearRing(hole).getExtent()
      );
      if (containsHole) {
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
  var layout = ol.format.EsriJSON.getGeometryLayout_(object);
  return new ol.geom.LineString(object.paths[0], layout);
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} MultiLineString.
 */
ol.format.EsriJSON.readMultiLineStringGeometry_ = function(object) {
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
  var layout = ol.format.EsriJSON.getGeometryLayout_(object);
  return new ol.geom.MultiPoint(object.points, layout);
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} MultiPolygon.
 */
ol.format.EsriJSON.readMultiPolygonGeometry_ = function(object) {
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
  var coordinates = /** @type {ol.geom.Point} */ (geometry).getCoordinates();
  var esriJSON;
  var layout = /** @type {ol.geom.Point} */ (geometry).getLayout();
  if (layout === ol.geom.GeometryLayout.XYZ) {
    esriJSON = /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1],
      z: coordinates[2]
    });
  } else if (layout === ol.geom.GeometryLayout.XYM) {
    esriJSON = /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1],
      m: coordinates[2]
    });
  } else if (layout === ol.geom.GeometryLayout.XYZM) {
    esriJSON = /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1],
      z: coordinates[2],
      m: coordinates[3]
    });
  } else if (layout === ol.geom.GeometryLayout.XY) {
    esriJSON = /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1]
    });
  } else {
    ol.asserts.assert(false, 34); // Invalid geometry layout
  }
  return /** @type {EsriJSONGeometry} */ (esriJSON);
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
  var hasZM = ol.format.EsriJSON.getHasZM_(/** @type {ol.geom.LineString} */(geometry));
  return /** @type {EsriJSONPolyline} */ ({
    hasZ: hasZM.hasZ,
    hasM: hasZM.hasM,
    paths: [
      /** @type {ol.geom.LineString} */ (geometry).getCoordinates()
    ]
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {EsriJSONPolygon} EsriJSON geometry.
 */
ol.format.EsriJSON.writePolygonGeometry_ = function(geometry, opt_options) {
  // Esri geometries use the left-hand rule
  var hasZM = ol.format.EsriJSON.getHasZM_(/** @type {ol.geom.Polygon} */(geometry));
  return /** @type {EsriJSONPolygon} */ ({
    hasZ: hasZM.hasZ,
    hasM: hasZM.hasM,
    rings: /** @type {ol.geom.Polygon} */ (geometry).getCoordinates(false)
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {EsriJSONPolyline} EsriJSON geometry.
 */
ol.format.EsriJSON.writeMultiLineStringGeometry_ = function(geometry, opt_options) {
  var hasZM = ol.format.EsriJSON.getHasZM_(/** @type {ol.geom.MultiLineString} */(geometry));
  return /** @type {EsriJSONPolyline} */ ({
    hasZ: hasZM.hasZ,
    hasM: hasZM.hasM,
    paths: /** @type {ol.geom.MultiLineString} */ (geometry).getCoordinates()
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {EsriJSONMultipoint} EsriJSON geometry.
 */
ol.format.EsriJSON.writeMultiPointGeometry_ = function(geometry, opt_options) {
  var hasZM = ol.format.EsriJSON.getHasZM_(/** @type {ol.geom.MultiPoint} */(geometry));
  return /** @type {EsriJSONMultipoint} */ ({
    hasZ: hasZM.hasZ,
    hasM: hasZM.hasM,
    points: /** @type {ol.geom.MultiPoint} */ (geometry).getCoordinates()
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
  var hasZM = ol.format.EsriJSON.getHasZM_(/** @type {ol.geom.MultiPolygon} */(geometry));
  var coordinates = /** @type {ol.geom.MultiPolygon} */ (geometry).getCoordinates(false);
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
  var geometry = ol.format.EsriJSON.readGeometry_(esriJSONFeature.geometry,
      opt_options);
  var feature = new ol.Feature();
  if (this.geometryName_) {
    feature.setGeometryName(this.geometryName_);
  }
  feature.setGeometry(geometry);
  if (opt_options && opt_options.idField &&
    esriJSONFeature.attributes[opt_options.idField]) {
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
      /** @type {EsriJSONGeometry} */(object), opt_options);
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
  return geometryWriter(/** @type {ol.geom.Geometry} */(
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
 * @override
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
 * @override
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
    if (opt_options && opt_options.featureProjection) {
      object['geometry']['spatialReference'] = /** @type {EsriJSONCRS} */({
        wkid: ol.proj.get(
            opt_options.featureProjection).getCode().split(':').pop()
      });
    }
  }
  var properties = feature.getProperties();
  delete properties[feature.getGeometryName()];
  if (!ol.obj.isEmpty(properties)) {
    object['attributes'] = properties;
  } else {
    object['attributes'] = {};
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
 * @override
 * @api
 */
ol.format.EsriJSON.prototype.writeFeaturesObject = function(features, opt_options) {
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
