/**
 * @module ol/format/TopoJSON
 */
import {inherits} from '../util.js';
import Feature from '../Feature.js';
import {transformWithOptions} from '../format/Feature.js';
import JSONFeature from '../format/JSONFeature.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import {get as getProjection} from '../proj.js';


/**
 * @typedef {Object} Options
 * @property {module:ol/proj~ProjectionLike} [dataProjection='EPSG:4326'] Default data projection.
 * @property {string} [layerName] Set the name of the TopoJSON topology
 * `objects`'s children as feature property with the specified name. This means
 * that when set to `'layer'`, a topology like
 * ```
 * {
 *   "type": "Topology",
 *   "objects": {
 *     "example": {
 *       "type": "GeometryCollection",
 *       "geometries": []
 *     }
 *   }
 * }
 * ```
 * will result in features that have a property `'layer'` set to `'example'`.
 * When not set, no property will be added to features.
 * @property {Array.<string>} [layers] Names of the TopoJSON topology's
 * `objects`'s children to read features from.  If not provided, features will
 * be read from all children.
 */


/**
 * @classdesc
 * Feature format for reading data in the TopoJSON format.
 *
 * @constructor
 * @extends {module:ol/format/JSONFeature}
 * @param {module:ol/format/TopoJSON~Options=} opt_options Options.
 * @api
 */
const TopoJSON = function(opt_options) {

  const options = opt_options ? opt_options : {};

  JSONFeature.call(this);

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
  this.dataProjection = getProjection(
    options.dataProjection ?
      options.dataProjection : 'EPSG:4326');

};

inherits(TopoJSON, JSONFeature);


/**
 * @const
 * @type {Object.<string, function(TopoJSONGeometry, Array, ...Array): module:ol/geom/Geometry>}
 */
const GEOMETRY_READERS = {
  'Point': readPointGeometry,
  'LineString': readLineStringGeometry,
  'Polygon': readPolygonGeometry,
  'MultiPoint': readMultiPointGeometry,
  'MultiLineString': readMultiLineStringGeometry,
  'MultiPolygon': readMultiPolygonGeometry
};


/**
 * Concatenate arcs into a coordinate array.
 * @param {Array.<number>} indices Indices of arcs to concatenate.  Negative
 *     values indicate arcs need to be reversed.
 * @param {Array.<Array.<module:ol/coordinate~Coordinate>>} arcs Array of arcs (already
 *     transformed).
 * @return {Array.<module:ol/coordinate~Coordinate>} Coordinates array.
 */
function concatenateArcs(indices, arcs) {
  /** @type {Array.<module:ol/coordinate~Coordinate>} */
  const coordinates = [];
  let index, arc;
  for (let i = 0, ii = indices.length; i < ii; ++i) {
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
  for (let j = 0, jj = coordinates.length; j < jj; ++j) {
    coordinates[j] = coordinates[j].slice();
  }
  return coordinates;
}


/**
 * Create a point from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON object.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @return {module:ol/geom/Point} Geometry.
 */
function readPointGeometry(object, scale, translate) {
  const coordinates = object.coordinates;
  if (scale && translate) {
    transformVertex(coordinates, scale, translate);
  }
  return new Point(coordinates);
}


/**
 * Create a multi-point from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON object.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @return {module:ol/geom/MultiPoint} Geometry.
 */
function readMultiPointGeometry(object, scale, translate) {
  const coordinates = object.coordinates;
  if (scale && translate) {
    for (let i = 0, ii = coordinates.length; i < ii; ++i) {
      transformVertex(coordinates[i], scale, translate);
    }
  }
  return new MultiPoint(coordinates);
}


/**
 * Create a linestring from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON object.
 * @param {Array.<Array.<module:ol/coordinate~Coordinate>>} arcs Array of arcs.
 * @return {module:ol/geom/LineString} Geometry.
 */
function readLineStringGeometry(object, arcs) {
  const coordinates = concatenateArcs(object.arcs, arcs);
  return new LineString(coordinates);
}


/**
 * Create a multi-linestring from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON object.
 * @param {Array.<Array.<module:ol/coordinate~Coordinate>>} arcs Array of arcs.
 * @return {module:ol/geom/MultiLineString} Geometry.
 */
function readMultiLineStringGeometry(object, arcs) {
  const coordinates = [];
  for (let i = 0, ii = object.arcs.length; i < ii; ++i) {
    coordinates[i] = concatenateArcs(object.arcs[i], arcs);
  }
  return new MultiLineString(coordinates);
}


/**
 * Create a polygon from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON object.
 * @param {Array.<Array.<module:ol/coordinate~Coordinate>>} arcs Array of arcs.
 * @return {module:ol/geom/Polygon} Geometry.
 */
function readPolygonGeometry(object, arcs) {
  const coordinates = [];
  for (let i = 0, ii = object.arcs.length; i < ii; ++i) {
    coordinates[i] = concatenateArcs(object.arcs[i], arcs);
  }
  return new Polygon(coordinates);
}


/**
 * Create a multi-polygon from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON object.
 * @param {Array.<Array.<module:ol/coordinate~Coordinate>>} arcs Array of arcs.
 * @return {module:ol/geom/MultiPolygon} Geometry.
 */
function readMultiPolygonGeometry(object, arcs) {
  const coordinates = [];
  for (let i = 0, ii = object.arcs.length; i < ii; ++i) {
    // for each polygon
    const polyArray = object.arcs[i];
    const ringCoords = [];
    for (let j = 0, jj = polyArray.length; j < jj; ++j) {
      // for each ring
      ringCoords[j] = concatenateArcs(polyArray[j], arcs);
    }
    coordinates[i] = ringCoords;
  }
  return new MultiPolygon(coordinates);
}


/**
 * Create features from a TopoJSON GeometryCollection object.
 *
 * @param {TopoJSONGeometryCollection} collection TopoJSON Geometry
 *     object.
 * @param {Array.<Array.<module:ol/coordinate~Coordinate>>} arcs Array of arcs.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @param {string|undefined} property Property to set the `GeometryCollection`'s parent
 *     object to.
 * @param {string} name Name of the `Topology`'s child object.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {Array.<module:ol/Feature>} Array of features.
 */
function readFeaturesFromGeometryCollection(collection, arcs, scale, translate, property, name, opt_options) {
  const geometries = collection.geometries;
  const features = [];
  for (let i = 0, ii = geometries.length; i < ii; ++i) {
    features[i] = readFeatureFromGeometry(
      geometries[i], arcs, scale, translate, property, name, opt_options);
  }
  return features;
}


/**
 * Create a feature from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON geometry object.
 * @param {Array.<Array.<module:ol/coordinate~Coordinate>>} arcs Array of arcs.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @param {string|undefined} property Property to set the `GeometryCollection`'s parent
 *     object to.
 * @param {string} name Name of the `Topology`'s child object.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/Feature} Feature.
 */
function readFeatureFromGeometry(object, arcs, scale, translate, property, name, opt_options) {
  let geometry;
  const type = object.type;
  const geometryReader = GEOMETRY_READERS[type];
  if ((type === 'Point') || (type === 'MultiPoint')) {
    geometry = geometryReader(object, scale, translate);
  } else {
    geometry = geometryReader(object, arcs);
  }
  const feature = new Feature();
  feature.setGeometry(/** @type {module:ol/geom/Geometry} */ (
    transformWithOptions(geometry, false, opt_options)));
  if (object.id !== undefined) {
    feature.setId(object.id);
  }
  let properties = object.properties;
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
}


/**
 * Read all features from a TopoJSON source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {Array.<module:ol/Feature>} Features.
 * @api
 */
TopoJSON.prototype.readFeatures;


/**
 * @inheritDoc
 */
TopoJSON.prototype.readFeaturesFromObject = function(object, opt_options) {
  if (object.type == 'Topology') {
    const topoJSONTopology = /** @type {TopoJSONTopology} */ (object);
    let transform, scale = null, translate = null;
    if (topoJSONTopology.transform) {
      transform = topoJSONTopology.transform;
      scale = transform.scale;
      translate = transform.translate;
    }
    const arcs = topoJSONTopology.arcs;
    if (transform) {
      transformArcs(arcs, scale, translate);
    }
    /** @type {Array.<module:ol/Feature>} */
    const features = [];
    const topoJSONFeatures = topoJSONTopology.objects;
    const property = this.layerName_;
    let feature;
    for (const objectName in topoJSONFeatures) {
      if (this.layers_ && this.layers_.indexOf(objectName) == -1) {
        continue;
      }
      if (topoJSONFeatures[objectName].type === 'GeometryCollection') {
        feature = /** @type {TopoJSONGeometryCollection} */ (topoJSONFeatures[objectName]);
        features.push.apply(features, readFeaturesFromGeometryCollection(
          feature, arcs, scale, translate, property, objectName, opt_options));
      } else {
        feature = /** @type {TopoJSONGeometry} */ (topoJSONFeatures[objectName]);
        features.push(readFeatureFromGeometry(
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
 * @param {Array.<Array.<module:ol/coordinate~Coordinate>>} arcs Array of arcs.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 */
function transformArcs(arcs, scale, translate) {
  for (let i = 0, ii = arcs.length; i < ii; ++i) {
    transformArc(arcs[i], scale, translate);
  }
}


/**
 * Apply a linear transform to an arc.  The provided arc is modified in place.
 *
 * @param {Array.<module:ol/coordinate~Coordinate>} arc Arc.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 */
function transformArc(arc, scale, translate) {
  let x = 0;
  let y = 0;
  for (let i = 0, ii = arc.length; i < ii; ++i) {
    const vertex = arc[i];
    x += vertex[0];
    y += vertex[1];
    vertex[0] = x;
    vertex[1] = y;
    transformVertex(vertex, scale, translate);
  }
}


/**
 * Apply a linear transform to a vertex.  The provided vertex is modified in
 * place.
 *
 * @param {module:ol/coordinate~Coordinate} vertex Vertex.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 */
function transformVertex(vertex, scale, translate) {
  vertex[0] = vertex[0] * scale[0] + translate[0];
  vertex[1] = vertex[1] * scale[1] + translate[1];
}


/**
 * Read the projection from a TopoJSON source.
 *
 * @param {Document|Node|Object|string} object Source.
 * @return {module:ol/proj/Projection} Projection.
 * @override
 * @api
 */
TopoJSON.prototype.readProjection;


/**
 * @inheritDoc
 */
TopoJSON.prototype.readProjectionFromObject = function(object) {
  return this.dataProjection;
};


/**
 * Not implemented.
 * @inheritDoc
 */
TopoJSON.prototype.writeFeatureObject = function(feature, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
TopoJSON.prototype.writeFeaturesObject = function(features, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
TopoJSON.prototype.writeGeometryObject = function(geometry, opt_options) {};


/**
 * Not implemented.
 * @override
 */
TopoJSON.prototype.readGeometryFromObject = function() {};


/**
 * Not implemented.
 * @override
 */
TopoJSON.prototype.readFeatureFromObject = function() {};
export default TopoJSON;
