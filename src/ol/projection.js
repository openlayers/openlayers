goog.provide('ol.Projection');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.math.Coordinate');
goog.require('goog.object');
goog.require('ol.Extent');
goog.require('ol.TransformFunction');


/**
 * @enum {string}
 */
ol.ProjectionUnits = {
  DEGREES: 'degrees',
  METERS: 'm'
};



/**
 * @constructor
 * @param {string} code Code.
 * @param {ol.ProjectionUnits} units Units.
 * @param {ol.Extent} extent Extent.
 */
ol.Projection = function(code, units, extent) {

  /**
   * @private
   * @type {string}
   */
  this.code_ = code;

  /**
   * @private
   * @type {ol.ProjectionUnits}
   */
  this.units_ = units;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = extent;

};


/**
 * @return {string} Code.
 */
ol.Projection.prototype.getCode = function() {
  return this.code_;
};


/**
 * @return {ol.Extent} Extent.
 */
ol.Projection.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @return {ol.ProjectionUnits} Units.
 */
ol.Projection.prototype.getUnits = function() {
  return this.units_;
};


/**
 * @private
 * @type {Object.<string, ol.Projection>}
 */
ol.Projection.projections_ = {};


/**
 * @private
 * @type {Object.<string, Object.<string, ol.TransformFunction>>}
 */
ol.Projection.transforms_ = {};


/**
 * @param {Array.<ol.Projection>} projections Projections.
 */
ol.Projection.addEquivalentProjections = function(projections) {
  ol.Projection.addProjections(projections);
  goog.array.forEach(projections, function(source) {
    goog.array.forEach(projections, function(destination) {
      ol.Projection.addTransform(
          source, destination, ol.Projection.identityTransform);
    });
  });
};


/**
 * @param {Array.<ol.Projection>} projections1 Projections.
 * @param {Array.<ol.Projection>} projections2 Projections.
 * @param {ol.TransformFunction} forwardTransform Forward transform.
 * @param {ol.TransformFunction} inverseTransform Inverse transform.
 */
ol.Projection.addEquivalentTransforms =
    function(projections1, projections2, forwardTransform, inverseTransform) {
  goog.array.forEach(projections1, function(projection1) {
    goog.array.forEach(projections2, function(projection2) {
      ol.Projection.addTransform(projection1, projection2, forwardTransform);
      ol.Projection.addTransform(projection2, projection1, inverseTransform);
    });
  });
};


/**
 * @param {ol.Projection} projection Projection.
 */
ol.Projection.addProjection = function(projection) {
  var projections = ol.Projection.projections_;
  var code = projection.getCode();
  goog.asserts.assert(!goog.object.containsKey(projections, code));
  projections[code] = projection;
};


/**
 * @param {Array.<ol.Projection>} projections Projections.
 */
ol.Projection.addProjections = function(projections) {
  goog.array.forEach(projections, function(projection) {
    ol.Projection.addProjection(projection);
  });
};


/**
 * @param {ol.Projection} source Source.
 * @param {ol.Projection} destination Destination.
 * @param {ol.TransformFunction} transform Transform.
 */
ol.Projection.addTransform = function(source, destination, transform) {
  var projections = ol.Projection.projections_;
  var sourceCode = source.getCode();
  goog.asserts.assert(goog.object.containsKey(projections, sourceCode));
  var destinationCode = destination.getCode();
  goog.asserts.assert(goog.object.containsKey(projections, destinationCode));
  var transforms = ol.Projection.transforms_;
  if (!goog.object.containsKey(transforms, sourceCode)) {
    transforms[sourceCode] = {};
  }
  goog.asserts.assert(
      !goog.object.containsKey(transforms[sourceCode], destinationCode));
  transforms[sourceCode][destinationCode] = transform;
};


/**
 * @param {string} code Code.
 * @return {ol.Projection} Projection.
 */
ol.Projection.createFromCode = function(code) {
  var projections = ol.Projection.projections_;
  goog.asserts.assert(goog.object.containsKey(projections, code));
  return projections[code];
};


/**
 * @param {ol.Projection} projection1 Projection 1.
 * @param {ol.Projection} projection2 Projection 2.
 * @return {boolean} Equivalent.
 */
ol.Projection.equivalent = function(projection1, projection2) {
  if (projection1.getUnits() != projection2.getUnits()) {
    return false;
  } else {
    var transform = ol.Projection.getTransform(projection1, projection2);
    return transform === ol.Projection.identityTransform;
  }
};


/**
 * @param {ol.Projection} source Source.
 * @param {ol.Projection} destination Destination.
 * @return {ol.TransformFunction} Transform.
 */
ol.Projection.getTransform = function(source, destination) {
  var transforms = ol.Projection.transforms_;
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  goog.asserts.assert(goog.object.containsKey(transforms, sourceCode));
  goog.asserts.assert(
      goog.object.containsKey(transforms[sourceCode], destinationCode));
  return transforms[sourceCode][destinationCode];
};


/**
 * @param {string} sourceCode Source code.
 * @param {string} destinationCode Destination code.
 * @return {ol.TransformFunction} Transform.
 */
ol.Projection.getTransformFromCodes = function(sourceCode, destinationCode) {
  var source = ol.Projection.createFromCode(sourceCode);
  var destination = ol.Projection.createFromCode(destinationCode);
  return ol.Projection.getTransform(source, destination);
};


/**
 * @param {goog.math.Coordinate} point Point.
 * @return {goog.math.Coordinate} Point.
 */
ol.Projection.identityTransform = function(point) {
  return point.clone();
};


/**
 * @param {goog.math.Coordinate} point Point.
 * @param {ol.Projection} source Source.
 * @param {ol.Projection} destination Destination.
 * @return {goog.math.Coordinate} Point.
 */
ol.Projection.transform = function(point, source, destination) {
  var transform = ol.Projection.getTransform(source, destination);
  return transform(point);
};


/**
 * @param {goog.math.Coordinate} point Point.
 * @param {string} sourceCode Source code.
 * @param {string} destinationCode Destination code.
 * @return {goog.math.Coordinate} Point.
 */
ol.Projection.transformWithCodes =
    function(point, sourceCode, destinationCode) {
  var transform = ol.Projection.getTransformFromCodes(
      sourceCode, destinationCode);
  return transform(point);
};


/**
 * @const
 * @type {number}
 */
ol.Projection.EPSG_3857_RADIUS = 6378137;


/**
 * @param {goog.math.Coordinate} point Point.
 * @return {goog.math.Coordinate} Point.
 */
ol.Projection.forwardSphericalMercator = function(point) {
  var x = ol.Projection.EPSG_3857_RADIUS * Math.PI * point.x / 180;
  var y = ol.Projection.EPSG_3857_RADIUS *
      Math.log(Math.tan(Math.PI * (point.y + 90) / 360));
  return new goog.math.Coordinate(x, y);
};


/**
 * @param {goog.math.Coordinate} point Point.
 * @return {goog.math.Coordinate} Point.
 */
ol.Projection.inverseSphericalMercator = function(point) {
  var x = 180 * point.x / (ol.Projection.EPSG_3857_RADIUS * Math.PI);
  var y = 360 * Math.atan(
      Math.exp(point.y / ol.Projection.EPSG_3857_RADIUS)) / Math.PI - 90;
  return new goog.math.Coordinate(x, y);
};


/**
 * @const
 * @type {number}
 */
ol.Projection.EPSG_3857_HALF_SIZE = Math.PI * ol.Projection.EPSG_3857_RADIUS;


/**
 * @const
 * @type {ol.Extent}
 */
ol.Projection.EPSG_3857_EXTENT = new ol.Extent(
    ol.Projection.EPSG_3857_HALF_SIZE,
    ol.Projection.EPSG_3857_HALF_SIZE,
    -ol.Projection.EPSG_3857_HALF_SIZE,
    -ol.Projection.EPSG_3857_HALF_SIZE);


/**
 * @type {Array.<string>}
 */
ol.Projection.EPSG_3857_LIKE_CODES = [
  'EPSG:3857',
  'EPSG:102113',
  'EPSG:102100',
  'EPSG:900913'
];


/**
 * @const
 * @type {Array.<ol.Projection>}
 */
ol.Projection.EPSG_3857_LIKE_PROJECTIONS = goog.array.map(
    ol.Projection.EPSG_3857_LIKE_CODES,
    function(code) {
      return new ol.Projection(
          code,
          ol.ProjectionUnits.METERS,
          ol.Projection.EPSG_3857_EXTENT);
    });


/**
 * @const
 * @type {ol.Extent}
 */
ol.Projection.EPSG_4326_EXTENT = new ol.Extent(180, 90, -180, -90);


/**
 * @type {Array.<string>}
 */
ol.Projection.EPSG_4326_LIKE_CODES = [
  'EPSG:4326',
  'CRS:84',
  'urn:ogc:def:crs:EPSG:6.6:4326'
];


/**
 * @const
 * @type {Array.<ol.Projection>}
 */
ol.Projection.EPSG_4326_LIKE_PROJECTIONS = goog.array.map(
    ol.Projection.EPSG_4326_LIKE_CODES,
    function(code) {
      return new ol.Projection(
          code,
          ol.ProjectionUnits.DEGREES,
          ol.Projection.EPSG_4326_EXTENT);
    });


ol.Projection.addEquivalentProjections(
    ol.Projection.EPSG_3857_LIKE_PROJECTIONS);
ol.Projection.addEquivalentProjections(
    ol.Projection.EPSG_4326_LIKE_PROJECTIONS);
ol.Projection.addEquivalentTransforms(
    ol.Projection.EPSG_4326_LIKE_PROJECTIONS,
    ol.Projection.EPSG_3857_LIKE_PROJECTIONS,
    ol.Projection.forwardSphericalMercator,
    ol.Projection.inverseSphericalMercator);
