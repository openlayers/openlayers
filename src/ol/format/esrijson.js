import _ol_ from '../index';
import _ol_Feature_ from '../feature';
import _ol_asserts_ from '../asserts';
import _ol_extent_ from '../extent';
import _ol_format_Feature_ from '../format/feature';
import _ol_format_JSONFeature_ from '../format/jsonfeature';
import _ol_geom_GeometryLayout_ from '../geom/geometrylayout';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_geom_LineString_ from '../geom/linestring';
import _ol_geom_LinearRing_ from '../geom/linearring';
import _ol_geom_MultiLineString_ from '../geom/multilinestring';
import _ol_geom_MultiPoint_ from '../geom/multipoint';
import _ol_geom_MultiPolygon_ from '../geom/multipolygon';
import _ol_geom_Point_ from '../geom/point';
import _ol_geom_Polygon_ from '../geom/polygon';
import _ol_geom_flat_deflate_ from '../geom/flat/deflate';
import _ol_geom_flat_orient_ from '../geom/flat/orient';
import _ol_obj_ from '../obj';
import _ol_proj_ from '../proj';

/**
 * @classdesc
 * Feature format for reading and writing data in the EsriJSON format.
 *
 * @constructor
 * @extends {ol.format.JSONFeature}
 * @param {olx.format.EsriJSONOptions=} opt_options Options.
 * @api
 */
var _ol_format_EsriJSON_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  _ol_format_JSONFeature_.call(this);

  /**
   * Name of the geometry attribute for features.
   * @type {string|undefined}
   * @private
   */
  this.geometryName_ = options.geometryName;

};

_ol_.inherits(_ol_format_EsriJSON_, _ol_format_JSONFeature_);


/**
 * @param {EsriJSONGeometry} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @private
 * @return {ol.geom.Geometry} Geometry.
 */
_ol_format_EsriJSON_.readGeometry_ = function(object, opt_options) {
  if (!object) {
    return null;
  }
  /** @type {ol.geom.GeometryType} */
  var type;
  if (typeof object.x === 'number' && typeof object.y === 'number') {
    type = _ol_geom_GeometryType_.POINT;
  } else if (object.points) {
    type = _ol_geom_GeometryType_.MULTI_POINT;
  } else if (object.paths) {
    if (object.paths.length === 1) {
      type = _ol_geom_GeometryType_.LINE_STRING;
    } else {
      type = _ol_geom_GeometryType_.MULTI_LINE_STRING;
    }
  } else if (object.rings) {
    var layout = _ol_format_EsriJSON_.getGeometryLayout_(object);
    var rings = _ol_format_EsriJSON_.convertRings_(object.rings, layout);
    object = /** @type {EsriJSONGeometry} */(_ol_obj_.assign({}, object));
    if (rings.length === 1) {
      type = _ol_geom_GeometryType_.POLYGON;
      object.rings = rings[0];
    } else {
      type = _ol_geom_GeometryType_.MULTI_POLYGON;
      object.rings = rings;
    }
  }
  var geometryReader = _ol_format_EsriJSON_.GEOMETRY_READERS_[type];
  return (
    /** @type {ol.geom.Geometry} */ _ol_format_Feature_.transformWithOptions(
        geometryReader(object), false, opt_options)
  );
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
_ol_format_EsriJSON_.convertRings_ = function(rings, layout) {
  var flatRing = [];
  var outerRings = [];
  var holes = [];
  var i, ii;
  for (i = 0, ii = rings.length; i < ii; ++i) {
    flatRing.length = 0;
    _ol_geom_flat_deflate_.coordinates(flatRing, 0, rings[i], layout.length);
    // is this ring an outer ring? is it clockwise?
    var clockwise = _ol_geom_flat_orient_.linearRingIsClockwise(flatRing, 0,
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
      var containsHole = _ol_extent_.containsExtent(
          new _ol_geom_LinearRing_(outerRing).getExtent(),
          new _ol_geom_LinearRing_(hole).getExtent()
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
_ol_format_EsriJSON_.readPointGeometry_ = function(object) {
  var point;
  if (object.m !== undefined && object.z !== undefined) {
    point = new _ol_geom_Point_([object.x, object.y, object.z, object.m],
        _ol_geom_GeometryLayout_.XYZM);
  } else if (object.z !== undefined) {
    point = new _ol_geom_Point_([object.x, object.y, object.z],
        _ol_geom_GeometryLayout_.XYZ);
  } else if (object.m !== undefined) {
    point = new _ol_geom_Point_([object.x, object.y, object.m],
        _ol_geom_GeometryLayout_.XYM);
  } else {
    point = new _ol_geom_Point_([object.x, object.y]);
  }
  return point;
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} LineString.
 */
_ol_format_EsriJSON_.readLineStringGeometry_ = function(object) {
  var layout = _ol_format_EsriJSON_.getGeometryLayout_(object);
  return new _ol_geom_LineString_(object.paths[0], layout);
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} MultiLineString.
 */
_ol_format_EsriJSON_.readMultiLineStringGeometry_ = function(object) {
  var layout = _ol_format_EsriJSON_.getGeometryLayout_(object);
  return new _ol_geom_MultiLineString_(object.paths, layout);
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.GeometryLayout} The geometry layout to use.
 */
_ol_format_EsriJSON_.getGeometryLayout_ = function(object) {
  var layout = _ol_geom_GeometryLayout_.XY;
  if (object.hasZ === true && object.hasM === true) {
    layout = _ol_geom_GeometryLayout_.XYZM;
  } else if (object.hasZ === true) {
    layout = _ol_geom_GeometryLayout_.XYZ;
  } else if (object.hasM === true) {
    layout = _ol_geom_GeometryLayout_.XYM;
  }
  return layout;
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} MultiPoint.
 */
_ol_format_EsriJSON_.readMultiPointGeometry_ = function(object) {
  var layout = _ol_format_EsriJSON_.getGeometryLayout_(object);
  return new _ol_geom_MultiPoint_(object.points, layout);
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} MultiPolygon.
 */
_ol_format_EsriJSON_.readMultiPolygonGeometry_ = function(object) {
  var layout = _ol_format_EsriJSON_.getGeometryLayout_(object);
  return new _ol_geom_MultiPolygon_(
      /** @type {Array.<Array.<Array.<Array.<number>>>>} */(object.rings),
      layout);
};


/**
 * @param {EsriJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} Polygon.
 */
_ol_format_EsriJSON_.readPolygonGeometry_ = function(object) {
  var layout = _ol_format_EsriJSON_.getGeometryLayout_(object);
  return new _ol_geom_Polygon_(object.rings, layout);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {EsriJSONGeometry} EsriJSON geometry.
 */
_ol_format_EsriJSON_.writePointGeometry_ = function(geometry, opt_options) {
  var coordinates = /** @type {ol.geom.Point} */ (geometry).getCoordinates();
  var esriJSON;
  var layout = /** @type {ol.geom.Point} */ (geometry).getLayout();
  if (layout === _ol_geom_GeometryLayout_.XYZ) {
    esriJSON = /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1],
      z: coordinates[2]
    });
  } else if (layout === _ol_geom_GeometryLayout_.XYM) {
    esriJSON = /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1],
      m: coordinates[2]
    });
  } else if (layout === _ol_geom_GeometryLayout_.XYZM) {
    esriJSON = /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1],
      z: coordinates[2],
      m: coordinates[3]
    });
  } else if (layout === _ol_geom_GeometryLayout_.XY) {
    esriJSON = /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1]
    });
  } else {
    _ol_asserts_.assert(false, 34); // Invalid geometry layout
  }
  return /** @type {EsriJSONGeometry} */ (esriJSON);
};


/**
 * @param {ol.geom.SimpleGeometry} geometry Geometry.
 * @private
 * @return {Object} Object with boolean hasZ and hasM keys.
 */
_ol_format_EsriJSON_.getHasZM_ = function(geometry) {
  var layout = geometry.getLayout();
  return {
    hasZ: (layout === _ol_geom_GeometryLayout_.XYZ ||
      layout === _ol_geom_GeometryLayout_.XYZM),
    hasM: (layout === _ol_geom_GeometryLayout_.XYM ||
      layout === _ol_geom_GeometryLayout_.XYZM)
  };
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @private
 * @return {EsriJSONPolyline} EsriJSON geometry.
 */
_ol_format_EsriJSON_.writeLineStringGeometry_ = function(geometry, opt_options) {
  var hasZM = _ol_format_EsriJSON_.getHasZM_(/** @type {ol.geom.LineString} */(geometry));
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
_ol_format_EsriJSON_.writePolygonGeometry_ = function(geometry, opt_options) {
  // Esri geometries use the left-hand rule
  var hasZM = _ol_format_EsriJSON_.getHasZM_(/** @type {ol.geom.Polygon} */(geometry));
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
_ol_format_EsriJSON_.writeMultiLineStringGeometry_ = function(geometry, opt_options) {
  var hasZM = _ol_format_EsriJSON_.getHasZM_(/** @type {ol.geom.MultiLineString} */(geometry));
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
_ol_format_EsriJSON_.writeMultiPointGeometry_ = function(geometry, opt_options) {
  var hasZM = _ol_format_EsriJSON_.getHasZM_(/** @type {ol.geom.MultiPoint} */(geometry));
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
_ol_format_EsriJSON_.writeMultiPolygonGeometry_ = function(geometry,
    opt_options) {
  var hasZM = _ol_format_EsriJSON_.getHasZM_(/** @type {ol.geom.MultiPolygon} */(geometry));
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
_ol_format_EsriJSON_.GEOMETRY_READERS_ = {};
_ol_format_EsriJSON_.GEOMETRY_READERS_[_ol_geom_GeometryType_.POINT] =
  _ol_format_EsriJSON_.readPointGeometry_;
_ol_format_EsriJSON_.GEOMETRY_READERS_[_ol_geom_GeometryType_.LINE_STRING] =
  _ol_format_EsriJSON_.readLineStringGeometry_;
_ol_format_EsriJSON_.GEOMETRY_READERS_[_ol_geom_GeometryType_.POLYGON] =
  _ol_format_EsriJSON_.readPolygonGeometry_;
_ol_format_EsriJSON_.GEOMETRY_READERS_[_ol_geom_GeometryType_.MULTI_POINT] =
  _ol_format_EsriJSON_.readMultiPointGeometry_;
_ol_format_EsriJSON_.GEOMETRY_READERS_[_ol_geom_GeometryType_.MULTI_LINE_STRING] =
  _ol_format_EsriJSON_.readMultiLineStringGeometry_;
_ol_format_EsriJSON_.GEOMETRY_READERS_[_ol_geom_GeometryType_.MULTI_POLYGON] =
  _ol_format_EsriJSON_.readMultiPolygonGeometry_;


/**
 * @const
 * @private
 * @type {Object.<string, function(ol.geom.Geometry, olx.format.WriteOptions=): (EsriJSONGeometry)>}
 */
_ol_format_EsriJSON_.GEOMETRY_WRITERS_ = {};
_ol_format_EsriJSON_.GEOMETRY_WRITERS_[_ol_geom_GeometryType_.POINT] =
  _ol_format_EsriJSON_.writePointGeometry_;
_ol_format_EsriJSON_.GEOMETRY_WRITERS_[_ol_geom_GeometryType_.LINE_STRING] =
  _ol_format_EsriJSON_.writeLineStringGeometry_;
_ol_format_EsriJSON_.GEOMETRY_WRITERS_[_ol_geom_GeometryType_.POLYGON] =
  _ol_format_EsriJSON_.writePolygonGeometry_;
_ol_format_EsriJSON_.GEOMETRY_WRITERS_[_ol_geom_GeometryType_.MULTI_POINT] =
  _ol_format_EsriJSON_.writeMultiPointGeometry_;
_ol_format_EsriJSON_.GEOMETRY_WRITERS_[_ol_geom_GeometryType_.MULTI_LINE_STRING] =
  _ol_format_EsriJSON_.writeMultiLineStringGeometry_;
_ol_format_EsriJSON_.GEOMETRY_WRITERS_[_ol_geom_GeometryType_.MULTI_POLYGON] =
  _ol_format_EsriJSON_.writeMultiPolygonGeometry_;


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
_ol_format_EsriJSON_.prototype.readFeature;


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
_ol_format_EsriJSON_.prototype.readFeatures;


/**
 * @inheritDoc
 */
_ol_format_EsriJSON_.prototype.readFeatureFromObject = function(
    object, opt_options) {
  var esriJSONFeature = /** @type {EsriJSONFeature} */ (object);
  var geometry = _ol_format_EsriJSON_.readGeometry_(esriJSONFeature.geometry,
      opt_options);
  var feature = new _ol_Feature_();
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
_ol_format_EsriJSON_.prototype.readFeaturesFromObject = function(
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
_ol_format_EsriJSON_.prototype.readGeometry;


/**
 * @inheritDoc
 */
_ol_format_EsriJSON_.prototype.readGeometryFromObject = function(
    object, opt_options) {
  return _ol_format_EsriJSON_.readGeometry_(
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
_ol_format_EsriJSON_.prototype.readProjection;


/**
 * @inheritDoc
 */
_ol_format_EsriJSON_.prototype.readProjectionFromObject = function(object) {
  var esriJSONObject = /** @type {EsriJSONObject} */ (object);
  if (esriJSONObject.spatialReference && esriJSONObject.spatialReference.wkid) {
    var crs = esriJSONObject.spatialReference.wkid;
    return _ol_proj_.get('EPSG:' + crs);
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
_ol_format_EsriJSON_.writeGeometry_ = function(geometry, opt_options) {
  var geometryWriter = _ol_format_EsriJSON_.GEOMETRY_WRITERS_[geometry.getType()];
  return geometryWriter(/** @type {ol.geom.Geometry} */(
    _ol_format_Feature_.transformWithOptions(geometry, true, opt_options)),
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
_ol_format_EsriJSON_.prototype.writeGeometry;


/**
 * Encode a geometry as a EsriJSON object.
 *
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {EsriJSONGeometry} Object.
 * @override
 * @api
 */
_ol_format_EsriJSON_.prototype.writeGeometryObject = function(geometry,
    opt_options) {
  return _ol_format_EsriJSON_.writeGeometry_(geometry,
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
_ol_format_EsriJSON_.prototype.writeFeature;


/**
 * Encode a feature as a esriJSON Feature object.
 *
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 * @override
 * @api
 */
_ol_format_EsriJSON_.prototype.writeFeatureObject = function(
    feature, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  var object = {};
  var geometry = feature.getGeometry();
  if (geometry) {
    object['geometry'] =
      _ol_format_EsriJSON_.writeGeometry_(geometry, opt_options);
    if (opt_options && opt_options.featureProjection) {
      object['geometry']['spatialReference'] = /** @type {EsriJSONCRS} */({
        wkid: _ol_proj_.get(
            opt_options.featureProjection).getCode().split(':').pop()
      });
    }
  }
  var properties = feature.getProperties();
  delete properties[feature.getGeometryName()];
  if (!_ol_obj_.isEmpty(properties)) {
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
_ol_format_EsriJSON_.prototype.writeFeatures;


/**
 * Encode an array of features as a EsriJSON object.
 *
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {Object} EsriJSON Object.
 * @override
 * @api
 */
_ol_format_EsriJSON_.prototype.writeFeaturesObject = function(features, opt_options) {
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
export default _ol_format_EsriJSON_;
