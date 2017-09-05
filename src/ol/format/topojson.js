import _ol_ from '../index';
import _ol_Feature_ from '../feature';
import _ol_format_Feature_ from '../format/feature';
import _ol_format_JSONFeature_ from '../format/jsonfeature';
import _ol_geom_LineString_ from '../geom/linestring';
import _ol_geom_MultiLineString_ from '../geom/multilinestring';
import _ol_geom_MultiPoint_ from '../geom/multipoint';
import _ol_geom_MultiPolygon_ from '../geom/multipolygon';
import _ol_geom_Point_ from '../geom/point';
import _ol_geom_Polygon_ from '../geom/polygon';
import _ol_proj_ from '../proj';

/**
 * @classdesc
 * Feature format for reading data in the TopoJSON format.
 *
 * @constructor
 * @extends {ol.format.JSONFeature}
 * @param {olx.format.TopoJSONOptions=} opt_options Options.
 * @api
 */
var _ol_format_TopoJSON_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  _ol_format_JSONFeature_.call(this);

  /**
   * @private
   * @type {string|undefined}
   */
  this.layerName_ = options.layerName;

  /**
   * @private
   * @type {Array.<string>}
   */
  this.layers_ = options.layers ? options.layers : null;

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = _ol_proj_.get(
      options.defaultDataProjection ?
        options.defaultDataProjection : 'EPSG:4326');

};

_ol_.inherits(_ol_format_TopoJSON_, _ol_format_JSONFeature_);


/**
 * Concatenate arcs into a coordinate array.
 * @param {Array.<number>} indices Indices of arcs to concatenate.  Negative
 *     values indicate arcs need to be reversed.
 * @param {Array.<Array.<ol.Coordinate>>} arcs Array of arcs (already
 *     transformed).
 * @return {Array.<ol.Coordinate>} Coordinates array.
 * @private
 */
_ol_format_TopoJSON_.concatenateArcs_ = function(indices, arcs) {
  /** @type {Array.<ol.Coordinate>} */
  var coordinates = [];
  var index, arc;
  var i, ii;
  var j, jj;
  for (i = 0, ii = indices.length; i < ii; ++i) {
    index = indices[i];
    if (i > 0) {
      // splicing together arcs, discard last point
      coordinates.pop();
    }
    if (index >= 0) {
      // forward arc
      arc = arcs[index];
    } else {
      // reverse arc
      arc = arcs[~index].slice().reverse();
    }
    coordinates.push.apply(coordinates, arc);
  }
  // provide fresh copies of coordinate arrays
  for (j = 0, jj = coordinates.length; j < jj; ++j) {
    coordinates[j] = coordinates[j].slice();
  }
  return coordinates;
};


/**
 * Create a point from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON object.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @return {ol.geom.Point} Geometry.
 * @private
 */
_ol_format_TopoJSON_.readPointGeometry_ = function(object, scale, translate) {
  var coordinates = object.coordinates;
  if (scale && translate) {
    _ol_format_TopoJSON_.transformVertex_(coordinates, scale, translate);
  }
  return new _ol_geom_Point_(coordinates);
};


/**
 * Create a multi-point from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON object.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @return {ol.geom.MultiPoint} Geometry.
 * @private
 */
_ol_format_TopoJSON_.readMultiPointGeometry_ = function(object, scale,
    translate) {
  var coordinates = object.coordinates;
  var i, ii;
  if (scale && translate) {
    for (i = 0, ii = coordinates.length; i < ii; ++i) {
      _ol_format_TopoJSON_.transformVertex_(coordinates[i], scale, translate);
    }
  }
  return new _ol_geom_MultiPoint_(coordinates);
};


/**
 * Create a linestring from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON object.
 * @param {Array.<Array.<ol.Coordinate>>} arcs Array of arcs.
 * @return {ol.geom.LineString} Geometry.
 * @private
 */
_ol_format_TopoJSON_.readLineStringGeometry_ = function(object, arcs) {
  var coordinates = _ol_format_TopoJSON_.concatenateArcs_(object.arcs, arcs);
  return new _ol_geom_LineString_(coordinates);
};


/**
 * Create a multi-linestring from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON object.
 * @param {Array.<Array.<ol.Coordinate>>} arcs Array of arcs.
 * @return {ol.geom.MultiLineString} Geometry.
 * @private
 */
_ol_format_TopoJSON_.readMultiLineStringGeometry_ = function(object, arcs) {
  var coordinates = [];
  var i, ii;
  for (i = 0, ii = object.arcs.length; i < ii; ++i) {
    coordinates[i] = _ol_format_TopoJSON_.concatenateArcs_(object.arcs[i], arcs);
  }
  return new _ol_geom_MultiLineString_(coordinates);
};


/**
 * Create a polygon from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON object.
 * @param {Array.<Array.<ol.Coordinate>>} arcs Array of arcs.
 * @return {ol.geom.Polygon} Geometry.
 * @private
 */
_ol_format_TopoJSON_.readPolygonGeometry_ = function(object, arcs) {
  var coordinates = [];
  var i, ii;
  for (i = 0, ii = object.arcs.length; i < ii; ++i) {
    coordinates[i] = _ol_format_TopoJSON_.concatenateArcs_(object.arcs[i], arcs);
  }
  return new _ol_geom_Polygon_(coordinates);
};


/**
 * Create a multi-polygon from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON object.
 * @param {Array.<Array.<ol.Coordinate>>} arcs Array of arcs.
 * @return {ol.geom.MultiPolygon} Geometry.
 * @private
 */
_ol_format_TopoJSON_.readMultiPolygonGeometry_ = function(object, arcs) {
  var coordinates = [];
  var polyArray, ringCoords, j, jj;
  var i, ii;
  for (i = 0, ii = object.arcs.length; i < ii; ++i) {
    // for each polygon
    polyArray = object.arcs[i];
    ringCoords = [];
    for (j = 0, jj = polyArray.length; j < jj; ++j) {
      // for each ring
      ringCoords[j] = _ol_format_TopoJSON_.concatenateArcs_(polyArray[j], arcs);
    }
    coordinates[i] = ringCoords;
  }
  return new _ol_geom_MultiPolygon_(coordinates);
};


/**
 * Create features from a TopoJSON GeometryCollection object.
 *
 * @param {TopoJSONGeometryCollection} collection TopoJSON Geometry
 *     object.
 * @param {Array.<Array.<ol.Coordinate>>} arcs Array of arcs.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @param {string|undefined} property Property to set the `GeometryCollection`'s parent
 *     object to.
 * @param {string} name Name of the `Topology`'s child object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Array of features.
 * @private
 */
_ol_format_TopoJSON_.readFeaturesFromGeometryCollection_ = function(
    collection, arcs, scale, translate, property, name, opt_options) {
  var geometries = collection.geometries;
  var features = [];
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    features[i] = _ol_format_TopoJSON_.readFeatureFromGeometry_(
        geometries[i], arcs, scale, translate, property, name, opt_options);
  }
  return features;
};


/**
 * Create a feature from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON geometry object.
 * @param {Array.<Array.<ol.Coordinate>>} arcs Array of arcs.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @param {string|undefined} property Property to set the `GeometryCollection`'s parent
 *     object to.
 * @param {string} name Name of the `Topology`'s child object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 * @private
 */
_ol_format_TopoJSON_.readFeatureFromGeometry_ = function(object, arcs,
    scale, translate, property, name, opt_options) {
  var geometry;
  var type = object.type;
  var geometryReader = _ol_format_TopoJSON_.GEOMETRY_READERS_[type];
  if ((type === 'Point') || (type === 'MultiPoint')) {
    geometry = geometryReader(object, scale, translate);
  } else {
    geometry = geometryReader(object, arcs);
  }
  var feature = new _ol_Feature_();
  feature.setGeometry(/** @type {ol.geom.Geometry} */ (
    _ol_format_Feature_.transformWithOptions(geometry, false, opt_options)));
  if (object.id !== undefined) {
    feature.setId(object.id);
  }
  var properties = object.properties;
  if (property) {
    if (!properties) {
      properties = {};
    }
    properties[property] = name;
  }
  if (properties) {
    feature.setProperties(properties);
  }
  return feature;
};


/**
 * Read all features from a TopoJSON source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
_ol_format_TopoJSON_.prototype.readFeatures;


/**
 * @inheritDoc
 */
_ol_format_TopoJSON_.prototype.readFeaturesFromObject = function(
    object, opt_options) {
  if (object.type == 'Topology') {
    var topoJSONTopology = /** @type {TopoJSONTopology} */ (object);
    var transform, scale = null, translate = null;
    if (topoJSONTopology.transform) {
      transform = topoJSONTopology.transform;
      scale = transform.scale;
      translate = transform.translate;
    }
    var arcs = topoJSONTopology.arcs;
    if (transform) {
      _ol_format_TopoJSON_.transformArcs_(arcs, scale, translate);
    }
    /** @type {Array.<ol.Feature>} */
    var features = [];
    var topoJSONFeatures = topoJSONTopology.objects;
    var property = this.layerName_;
    var objectName, feature;
    for (objectName in topoJSONFeatures) {
      if (this.layers_ && this.layers_.indexOf(objectName) == -1) {
        continue;
      }
      if (topoJSONFeatures[objectName].type === 'GeometryCollection') {
        feature = /** @type {TopoJSONGeometryCollection} */
          (topoJSONFeatures[objectName]);
        features.push.apply(features,
            _ol_format_TopoJSON_.readFeaturesFromGeometryCollection_(
                feature, arcs, scale, translate, property, objectName, opt_options));
      } else {
        feature = /** @type {TopoJSONGeometry} */
          (topoJSONFeatures[objectName]);
        features.push(_ol_format_TopoJSON_.readFeatureFromGeometry_(
            feature, arcs, scale, translate, property, objectName, opt_options));
      }
    }
    return features;
  } else {
    return [];
  }
};


/**
 * Apply a linear transform to array of arcs.  The provided array of arcs is
 * modified in place.
 *
 * @param {Array.<Array.<ol.Coordinate>>} arcs Array of arcs.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @private
 */
_ol_format_TopoJSON_.transformArcs_ = function(arcs, scale, translate) {
  var i, ii;
  for (i = 0, ii = arcs.length; i < ii; ++i) {
    _ol_format_TopoJSON_.transformArc_(arcs[i], scale, translate);
  }
};


/**
 * Apply a linear transform to an arc.  The provided arc is modified in place.
 *
 * @param {Array.<ol.Coordinate>} arc Arc.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @private
 */
_ol_format_TopoJSON_.transformArc_ = function(arc, scale, translate) {
  var x = 0;
  var y = 0;
  var vertex;
  var i, ii;
  for (i = 0, ii = arc.length; i < ii; ++i) {
    vertex = arc[i];
    x += vertex[0];
    y += vertex[1];
    vertex[0] = x;
    vertex[1] = y;
    _ol_format_TopoJSON_.transformVertex_(vertex, scale, translate);
  }
};


/**
 * Apply a linear transform to a vertex.  The provided vertex is modified in
 * place.
 *
 * @param {ol.Coordinate} vertex Vertex.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @private
 */
_ol_format_TopoJSON_.transformVertex_ = function(vertex, scale, translate) {
  vertex[0] = vertex[0] * scale[0] + translate[0];
  vertex[1] = vertex[1] * scale[1] + translate[1];
};


/**
 * Read the projection from a TopoJSON source.
 *
 * @param {Document|Node|Object|string} object Source.
 * @return {ol.proj.Projection} Projection.
 * @override
 * @api
 */
_ol_format_TopoJSON_.prototype.readProjection;


/**
 * @inheritDoc
 */
_ol_format_TopoJSON_.prototype.readProjectionFromObject = function(object) {
  return this.defaultDataProjection;
};


/**
 * @const
 * @private
 * @type {Object.<string, function(TopoJSONGeometry, Array, ...Array): ol.geom.Geometry>}
 */
_ol_format_TopoJSON_.GEOMETRY_READERS_ = {
  'Point': _ol_format_TopoJSON_.readPointGeometry_,
  'LineString': _ol_format_TopoJSON_.readLineStringGeometry_,
  'Polygon': _ol_format_TopoJSON_.readPolygonGeometry_,
  'MultiPoint': _ol_format_TopoJSON_.readMultiPointGeometry_,
  'MultiLineString': _ol_format_TopoJSON_.readMultiLineStringGeometry_,
  'MultiPolygon': _ol_format_TopoJSON_.readMultiPolygonGeometry_
};


/**
 * Not implemented.
 * @inheritDoc
 */
_ol_format_TopoJSON_.prototype.writeFeatureObject = function(feature, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
_ol_format_TopoJSON_.prototype.writeFeaturesObject = function(features, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
_ol_format_TopoJSON_.prototype.writeGeometryObject = function(geometry, opt_options) {};


/**
 * Not implemented.
 * @override
 */
_ol_format_TopoJSON_.prototype.readGeometryFromObject = function() {};


/**
 * Not implemented.
 * @override
 */
_ol_format_TopoJSON_.prototype.readFeatureFromObject = function() {};
export default _ol_format_TopoJSON_;
