goog.provide('ol.parser.TopoJSON');

goog.require('ol.Coordinate');
goog.require('ol.CoordinateArray');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.Parser');
goog.require('ol.parser.StringFeatureParser');



/**
 * Read [TopoJSON](https://github.com/mbostock/topojson)
 *
 * @constructor
 * @implements {ol.parser.StringFeatureParser}
 * @extends {ol.parser.Parser}
 * @todo stability experimental
 */
ol.parser.TopoJSON = function() {};
goog.inherits(ol.parser.TopoJSON, ol.parser.Parser);
goog.addSingletonGetter(ol.parser.TopoJSON);


/**
 * Concatenate arcs into a coordinate array.
 * @param {Array.<number>} indices Indices of arcs to concatenate.  Negative
 *     values indicate arcs need to be reversed.
 * @param {Array.<ol.CoordinateArray>} arcs Arcs (already transformed).
 * @return {ol.CoordinateArray} Coordinate array.
 * @private
 */
ol.parser.TopoJSON.prototype.concatenateArcs_ = function(indices, arcs) {
  var coordinates = [];
  var index, arc;
  for (var i = 0, ii = indices.length; i < ii; ++i) {
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
  for (var j = 0, jj = coordinates.length; j < jj; ++j) {
    coordinates[j] = coordinates[j].slice();
  }
  return coordinates;
};


/**
 * Parse a TopoJSON string.
 * @param {string} str TopoJSON string.
 * @return {Array.<ol.Feature>} Array of features.
 */
ol.parser.TopoJSON.prototype.read = function(str) {
  var topology = /** @type {TopoJSONTopology} */ (JSON.parse(str));
  return this.readFeaturesFromObject(topology).features;
};


/**
 * Create features from a TopoJSON topology string.
 *
 * @param {string} str TopoJSON topology string.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.TopoJSON.prototype.readFeaturesFromString = function(str) {
  var topology = /** @type {TopoJSONTopology} */ (JSON.parse(str));
  if (topology.type !== 'Topology') {
    throw new Error('Not a "Topology" type object');
  }
  return {
    features: this.readFeaturesFromTopology_(topology),
    metadata: {projection: 'EPSG:4326'}
  };
};


/**
 * Create features from a TopoJSON topology object.
 *
 * @param {TopoJSONTopology} topology TopoJSON topology object.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.TopoJSON.prototype.readFeaturesFromObject = function(topology) {
  if (topology.type !== 'Topology') {
    throw new Error('Not a "Topology" type object');
  }
  return {
    features: this.readFeaturesFromTopology_(topology),
    metadata: {projection: 'EPSG:4326'}
  };
};


/**
 * Create a feature from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON geometry object.
 * @param {Array.<ol.CoordinateArray>} arcs Array of arcs.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @return {ol.Feature} Feature.
 * @private
 */
ol.parser.TopoJSON.prototype.readFeatureFromGeometry_ = function(object, arcs,
    scale, translate) {
  var geometry;
  var type = object.type;
  if (type === 'Point') {
    geometry = this.readPoint_(/** @type {TopoJSONPoint} */ (object), scale,
        translate);
  } else if (type === 'LineString') {
    geometry = this.readLineString_(/** @type {TopoJSONLineString} */ (object),
        arcs);
  } else if (type === 'Polygon') {
    geometry = this.readPolygon_(/** @type {TopoJSONPolygon} */ (object), arcs);
  } else if (type === 'MultiPoint') {
    geometry = this.readMultiPoint_(/** @type {TopoJSONMultiPoint} */ (object),
        scale, translate);
  } else if (type === 'MultiLineString') {
    geometry = this.readMultiLineString_(
        /** @type {TopoJSONMultiLineString} */(object), arcs);
  } else if (type === 'MultiPolygon') {
    geometry = this.readMultiPolygon_(
        /** @type {TopoJSONMultiPolygon} */ (object), arcs);
  } else {
    throw new Error('Unsupported geometry type: ' + type);
  }
  var feature = new ol.Feature();
  feature.setGeometry(geometry);
  if (goog.isDef(object.id)) {
    feature.setId(String(object.id));
  }
  return feature;
};


/**
 * Create features from a TopoJSON GeometryCollection object.
 *
 * @param {TopoJSONGeometryCollection} collection TopoJSON GeometryCollection
 *     object.
 * @param {Array.<ol.CoordinateArray>} arcs Array of arcs.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @return {Array.<ol.Feature>} Array of features.
 * @private
 */
ol.parser.TopoJSON.prototype.readFeaturesFromGeometryCollection_ = function(
    collection, arcs, scale, translate) {
  var geometries = collection.geometries;
  var num = geometries.length;
  var features = new Array(num);
  for (var i = 0; i < num; ++i) {
    features[i] = this.readFeatureFromGeometry_(geometries[i], arcs, scale,
        translate);
  }
  return features;
};


/**
 * @param {TopoJSONTopology} topology TopoJSON object.
 * @return {Array.<ol.Feature>} Parsed features.
 * @private
 */
ol.parser.TopoJSON.prototype.readFeaturesFromTopology_ = function(topology) {
  var transform = topology.transform;
  var scale = transform.scale;
  var translate = transform.translate;
  var arcs = topology.arcs;
  this.transformArcs_(arcs, scale, translate);
  var objects = topology.objects;
  var features = [];
  for (var key in objects) {
    if (objects[key].type === 'GeometryCollection') {
      features.push.apply(features, this.readFeaturesFromGeometryCollection_(
          /** @type {TopoJSONGeometryCollection} */ (objects[key]),
          arcs, scale, translate));
    } else {
      features.push(this.readFeatureFromGeometry_(
          /** @type {TopoJSONGeometry} */ (objects[key]),
          arcs, scale, translate));
    }
  }
  return features;
};


/**
 * Create a linestring from a TopoJSON geometry object.
 *
 * @param {TopoJSONLineString} object TopoJSON object.
 * @param {Array.<ol.CoordinateArray>} arcs Array of arcs.
 * @return {ol.geom.LineString} Geometry.
 * @private
 */
ol.parser.TopoJSON.prototype.readLineString_ = function(object, arcs) {
  var coordinates = this.concatenateArcs_(object.arcs, arcs);
  return new ol.geom.LineString(coordinates);
};


/**
 * Create a multi-linestring from a TopoJSON geometry object.
 *
 * @param {TopoJSONMultiLineString} object TopoJSON object.
 * @param {Array.<ol.CoordinateArray>} arcs Array of arcs.
 * @return {ol.geom.MultiLineString} Geometry.
 * @private
 */
ol.parser.TopoJSON.prototype.readMultiLineString_ = function(object, arcs) {
  var array = object.arcs; // I'm out of good names
  var num = array.length;
  var coordinates = new Array(num);
  for (var i = 0; i < num; ++i) {
    coordinates[i] = this.concatenateArcs_(array[i], arcs);
  }
  return new ol.geom.MultiLineString(coordinates);
};


/**
 * Create a multi-point from a TopoJSON geometry object.
 *
 * @param {TopoJSONMultiPoint} object TopoJSON object.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @return {ol.geom.MultiPoint} Geometry.
 * @private
 */
ol.parser.TopoJSON.prototype.readMultiPoint_ = function(object, scale,
    translate) {
  var coordinates = object.coordinates;
  for (var i = 0, ii = coordinates.length; i < ii; ++i) {
    this.transformVertex_(coordinates[i], scale, translate);
  }
  return new ol.geom.MultiPoint(coordinates);
};


/**
 * Create a multi-polygon from a TopoJSON geometry object.
 *
 * @param {TopoJSONMultiPolygon} object TopoJSON object.
 * @param {Array.<ol.CoordinateArray>} arcs Array of arcs.
 * @return {ol.geom.MultiPolygon} Geometry.
 * @private
 */
ol.parser.TopoJSON.prototype.readMultiPolygon_ = function(object, arcs) {
  var array = object.arcs;
  var numPolys = array.length;
  var coordinates = new Array(numPolys);
  var polyArray, numRings, ringCoords, j;
  for (var i = 0; i < numPolys; ++i) {
    // for each polygon
    polyArray = array[i];
    numRings = polyArray.length;
    ringCoords = new Array(numRings);
    for (j = 0; j < numRings; ++j) {
      // for each ring
      ringCoords[j] = this.concatenateArcs_(polyArray[j], arcs);
    }
    coordinates[i] = ringCoords;
  }
  return new ol.geom.MultiPolygon(coordinates);
};


/**
 * Create a point from a TopoJSON geometry object.
 *
 * @param {TopoJSONPoint} object TopoJSON object.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @return {ol.geom.Point} Geometry.
 * @private
 */
ol.parser.TopoJSON.prototype.readPoint_ = function(object, scale, translate) {
  var coordinates = object.coordinates;
  this.transformVertex_(coordinates, scale, translate);
  return new ol.geom.Point(coordinates);
};


/**
 * Create a polygon from a TopoJSON geometry object.
 *
 * @param {TopoJSONPolygon} object TopoJSON object.
 * @param {Array.<ol.CoordinateArray>} arcs Array of arcs.
 * @return {ol.geom.Polygon} Geometry.
 * @private
 */
ol.parser.TopoJSON.prototype.readPolygon_ = function(object, arcs) {
  var array = object.arcs; // I'm out of good names
  var num = array.length;
  var coordinates = new Array(num);
  for (var i = 0; i < num; ++i) {
    coordinates[i] = this.concatenateArcs_(array[i], arcs);
  }
  return new ol.geom.Polygon(coordinates);
};


/**
 * Apply a linear transform to array of arcs.  The provided array of arcs is
 * modified in place.
 *
 * @param {Array.<ol.CoordinateArray>} arcs Array of arcs.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @private
 */
ol.parser.TopoJSON.prototype.transformArcs_ = function(arcs, scale, translate) {
  for (var i = 0, ii = arcs.length; i < ii; ++i) {
    this.transformArc_(arcs[i], scale, translate);
  }
};


/**
 * Apply a linear transform to an arc.  The provided arc is modified in place.
 *
 * @param {ol.CoordinateArray} arc Arc.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @private
 */
ol.parser.TopoJSON.prototype.transformArc_ = function(arc, scale, translate) {
  var x = 0;
  var y = 0;
  var vertex;
  for (var i = 0, ii = arc.length; i < ii; ++i) {
    vertex = arc[i];
    x += vertex[0];
    y += vertex[1];
    vertex[0] = x;
    vertex[1] = y;
    this.transformVertex_(vertex, scale, translate);
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
ol.parser.TopoJSON.prototype.transformVertex_ = function(vertex, scale,
    translate) {
  vertex[0] = vertex[0] * scale[0] + translate[0];
  vertex[1] = vertex[1] * scale[1] + translate[1];
};


/**
 * Parse a TopoJSON string.
 * @param {string} str TopoJSON string.
 * @return {Array.<ol.Feature>} Array of features.
 */
ol.parser.TopoJSON.read = function(str) {
  return ol.parser.TopoJSON.getInstance().read(str);
};
