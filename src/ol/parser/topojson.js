goog.provide('ol.parser.TopoJSON');

goog.require('ol.Feature');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.Vertex');
goog.require('ol.geom.VertexArray');
goog.require('ol.parser.Parser');
goog.require('ol.parser.ReadFeaturesOptions');
goog.require('ol.parser.StringFeatureParser');



/**
 * @constructor
 * @implements {ol.parser.StringFeatureParser}
 * @extends {ol.parser.Parser}
 */
ol.parser.TopoJSON = function() {

  /**
   * Common feature for all shared vertex creation.
   * // TODO: make feature optional in shared vertex callback
   *
   * @type {ol.Feature}
   * @private
   */
  this.feature_ = new ol.Feature();

};
goog.inherits(ol.parser.TopoJSON, ol.parser.Parser);
goog.addSingletonGetter(ol.parser.TopoJSON);


/**
 * Concatenate arcs into a coordinate array.
 * @param {Array.<number>} indices Indices of arcs to concatenate.  Negative
 *     values indicate arcs need to be reversed.
 * @param {Array.<ol.geom.VertexArray>} arcs Arcs (already transformed).
 * @return {ol.geom.VertexArray} Coordinate array.
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
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.TopoJSON.prototype.readFeaturesFromString =
    function(str, opt_options) {
  var topology = /** @type {TopoJSONTopology} */ (JSON.parse(str));
  if (topology.type !== 'Topology') {
    throw new Error('Not a "Topology" type object');
  }
  return {features: this.readFeaturesFromTopology_(topology, opt_options),
    metadata: {projection: 'EPSG:4326'}};
};


/**
 * Create features from a TopoJSON topology object.
 *
 * @param {TopoJSONTopology} topology TopoJSON topology object.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.TopoJSON.prototype.readFeaturesFromObject =
    function(topology, opt_options) {
  if (topology.type !== 'Topology') {
    throw new Error('Not a "Topology" type object');
  }
  return {features: this.readFeaturesFromTopology_(topology, opt_options),
    metadata: {projection: 'EPSG:4326'}};
};


/**
 * Create a feature from a TopoJSON geometry object.
 *
 * @param {TopoJSONGeometry} object TopoJSON geometry object.
 * @param {Array.<ol.geom.VertexArray>} arcs Array of arcs.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {ol.Feature} Feature.
 * @private
 */
ol.parser.TopoJSON.prototype.readFeatureFromGeometry_ = function(object, arcs,
    scale, translate, opt_options) {
  var geometry;
  var type = object.type;
  if (type === 'Point') {
    geometry = this.readPoint_(/** @type {TopoJSONPoint} */ (object), scale,
        translate, opt_options);
  } else if (type === 'LineString') {
    geometry = this.readLineString_(/** @type {TopoJSONLineString} */ (object),
        arcs, opt_options);
  } else if (type === 'Polygon') {
    geometry = this.readPolygon_(/** @type {TopoJSONPolygon} */ (object), arcs,
        opt_options);
  } else if (type === 'MultiPoint') {
    geometry = this.readMultiPoint_(/** @type {TopoJSONMultiPoint} */ (object),
        scale, translate, opt_options);
  } else if (type === 'MultiLineString') {
    geometry = this.readMultiLineString_(
        /** @type {TopoJSONMultiLineString} */(object), arcs, opt_options);
  } else if (type === 'MultiPolygon') {
    geometry = this.readMultiPolygon_(
        /** @type {TopoJSONMultiPolygon} */ (object), arcs, opt_options);
  } else {
    throw new Error('Unsupported geometry type: ' + type);
  }
  var feature = new ol.Feature();
  feature.setGeometry(geometry);
  if (goog.isDef(object.id)) {
    feature.setFeatureId(String(object.id));
  }
  return feature;
};


/**
 * Create features from a TopoJSON GeometryCollection object.
 *
 * @param {TopoJSONGeometryCollection} collection TopoJSON GeometryCollection
 *     object.
 * @param {Array.<ol.geom.VertexArray>} arcs Array of arcs.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {Array.<ol.Feature>} Array of features.
 * @private
 */
ol.parser.TopoJSON.prototype.readFeaturesFromGeometryCollection_ = function(
    collection, arcs, scale, translate, opt_options) {
  var geometries = collection.geometries;
  var num = geometries.length;
  var features = new Array(num);
  for (var i = 0; i < num; ++i) {
    features[i] = this.readFeatureFromGeometry_(geometries[i], arcs, scale,
        translate, opt_options);
  }
  return features;
};


/**
 * @param {TopoJSONTopology} topology TopoJSON object.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {Array.<ol.Feature>} Parsed features.
 * @private
 */
ol.parser.TopoJSON.prototype.readFeaturesFromTopology_ = function(
    topology, opt_options) {
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
          arcs, scale, translate, opt_options));
    } else {
      features.push(this.readFeatureFromGeometry_(
          /** @type {TopoJSONGeometry} */ (objects[key]),
          arcs, scale, translate, opt_options));
    }
  }
  return features;
};


/**
 * Create a linestring from a TopoJSON geometry object.
 *
 * @param {TopoJSONLineString} object TopoJSON object.
 * @param {Array.<ol.geom.VertexArray>} arcs Array of arcs.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {ol.geom.LineString} Geometry.
 * @private
 */
ol.parser.TopoJSON.prototype.readLineString_ = function(object, arcs,
    opt_options) {
  var coordinates = this.concatenateArcs_(object.arcs, arcs);
  // TODO: make feature optional in callback
  var callback = opt_options && opt_options.callback;
  var sharedVertices;
  if (callback) {
    sharedVertices = callback(this.feature_, ol.geom.GeometryType.LINESTRING);
  }
  return new ol.geom.LineString(coordinates, sharedVertices);
};


/**
 * Create a multi-linestring from a TopoJSON geometry object.
 *
 * @param {TopoJSONMultiLineString} object TopoJSON object.
 * @param {Array.<ol.geom.VertexArray>} arcs Array of arcs.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {ol.geom.MultiLineString} Geometry.
 * @private
 */
ol.parser.TopoJSON.prototype.readMultiLineString_ = function(object, arcs,
    opt_options) {
  var array = object.arcs; // I'm out of good names
  var num = array.length;
  var coordinates = new Array(num);
  for (var i = 0; i < num; ++i) {
    coordinates[i] = this.concatenateArcs_(array[i], arcs);
  }
  // TODO: make feature optional in callback
  var callback = opt_options && opt_options.callback;
  var sharedVertices;
  if (callback) {
    sharedVertices = callback(this.feature_,
        ol.geom.GeometryType.MULTILINESTRING);
  }
  return new ol.geom.MultiLineString(coordinates, sharedVertices);
};


/**
 * Create a multi-point from a TopoJSON geometry object.
 *
 * @param {TopoJSONMultiPoint} object TopoJSON object.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {ol.geom.MultiPoint} Geometry.
 * @private
 */
ol.parser.TopoJSON.prototype.readMultiPoint_ = function(object, scale,
    translate, opt_options) {
  var coordinates = object.coordinates;
  for (var i = 0, ii = coordinates.length; i < ii; ++i) {
    this.transformVertex_(coordinates[i], scale, translate);
  }
  // TODO: make feature optional in callback
  var callback = opt_options && opt_options.callback;
  var sharedVertices;
  if (callback) {
    sharedVertices = callback(this.feature_, ol.geom.GeometryType.MULTIPOINT);
  }
  return new ol.geom.MultiPoint(coordinates, sharedVertices);
};


/**
 * Create a multi-polygon from a TopoJSON geometry object.
 *
 * @param {TopoJSONMultiPolygon} object TopoJSON object.
 * @param {Array.<ol.geom.VertexArray>} arcs Array of arcs.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {ol.geom.MultiPolygon} Geometry.
 * @private
 */
ol.parser.TopoJSON.prototype.readMultiPolygon_ = function(object, arcs,
    opt_options) {
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
  // TODO: make feature optional in callback
  var callback = opt_options && opt_options.callback;
  var sharedVertices;
  if (callback) {
    sharedVertices = callback(this.feature_, ol.geom.GeometryType.MULTIPOLYGON);
  }
  return new ol.geom.MultiPolygon(coordinates, sharedVertices);
};


/**
 * Create a point from a TopoJSON geometry object.
 *
 * @param {TopoJSONPoint} object TopoJSON object.
 * @param {Array.<number>} scale Scale for each dimension.
 * @param {Array.<number>} translate Translation for each dimension.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {ol.geom.Point} Geometry.
 * @private
 */
ol.parser.TopoJSON.prototype.readPoint_ = function(object, scale, translate,
    opt_options) {
  var coordinates = object.coordinates;
  this.transformVertex_(coordinates, scale, translate);
  // TODO: make feature optional in callback
  var callback = opt_options && opt_options.callback;
  var sharedVertices;
  if (callback) {
    sharedVertices = callback(this.feature_, ol.geom.GeometryType.POINT);
  }
  return new ol.geom.Point(coordinates, sharedVertices);
};


/**
 * Create a polygon from a TopoJSON geometry object.
 *
 * @param {TopoJSONPolygon} object TopoJSON object.
 * @param {Array.<ol.geom.VertexArray>} arcs Array of arcs.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {ol.geom.Polygon} Geometry.
 * @private
 */
ol.parser.TopoJSON.prototype.readPolygon_ = function(object, arcs,
    opt_options) {
  var array = object.arcs; // I'm out of good names
  var num = array.length;
  var coordinates = new Array(num);
  for (var i = 0; i < num; ++i) {
    coordinates[i] = this.concatenateArcs_(array[i], arcs);
  }
  // TODO: make feature optional in callback
  var callback = opt_options && opt_options.callback;
  var sharedVertices;
  if (callback) {
    sharedVertices = callback(this.feature_, ol.geom.GeometryType.POLYGON);
  }
  return new ol.geom.Polygon(coordinates, sharedVertices);
};


/**
 * Apply a linear transform to array of arcs.  The provided array of arcs is
 * modified in place.
 *
 * @param {Array.<ol.geom.VertexArray>} arcs Array of arcs.
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
 * @param {ol.geom.VertexArray} arc Arc.
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
 * @param {ol.geom.Vertex} vertex Vertex.
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
