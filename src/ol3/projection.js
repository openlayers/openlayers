goog.provide('ol3.Projection');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol3.Coordinate');
goog.require('ol3.Extent');
goog.require('ol3.TransformFunction');


/**
 * @define {boolean} Enable Proj4js.
 */
ol3.ENABLE_PROJ4JS = true;


/**
 * @enum {string}
 */
ol3.ProjectionUnits = {
  DEGREES: 'degrees',
  METERS: 'm'
};



/**
 * @constructor
 * @param {string} code Code.
 * @param {ol3.ProjectionUnits} units Units.
 * @param {ol3.Extent} extent Extent.
 */
ol3.Projection = function(code, units, extent) {

  /**
   * @private
   * @type {string}
   */
  this.code_ = code;

  /**
   * @private
   * @type {ol3.ProjectionUnits}
   */
  this.units_ = units;

  /**
   * @private
   * @type {ol3.Extent}
   */
  this.extent_ = extent;

};


/**
 * @return {string} Code.
 */
ol3.Projection.prototype.getCode = function() {
  return this.code_;
};


/**
 * @return {ol3.Extent} Extent.
 */
ol3.Projection.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @return {ol3.ProjectionUnits} Units.
 */
ol3.Projection.prototype.getUnits = function() {
  return this.units_;
};



/**
 * @constructor
 * @extends {ol3.Projection}
 * @param {string} code Code.
 * @param {Proj4js.Proj} proj4jsProj Proj4js projection.
 */
ol3.Proj4jsProjection = function(code, proj4jsProj) {

  var units = /** @type {ol3.ProjectionUnits} */ proj4jsProj.units;

  goog.base(this, code, units, null);

  /**
   * @private
   * @type {Proj4js.Proj}
   */
  this.proj4jsProj_ = proj4jsProj;

};
goog.inherits(ol3.Proj4jsProjection, ol3.Projection);


/**
 * @return {Proj4js.Proj} Proj4js projection.
 */
ol3.Proj4jsProjection.prototype.getProj4jsProj = function() {
  return this.proj4jsProj_;
};


/**
 * @private
 * @type {Object.<string, ol3.Proj4jsProjection>}
 */
ol3.Projection.proj4jsProjections_ = {};


/**
 * @private
 * @type {Object.<string, ol3.Projection>}
 */
ol3.Projection.projections_ = {};


/**
 * @private
 * @type {Object.<string, Object.<string, ol3.TransformFunction>>}
 */
ol3.Projection.transforms_ = {};


/**
 * @param {Array.<ol3.Projection>} projections Projections.
 * @private
 */
ol3.Projection.addEquivalentProjections_ = function(projections) {
  ol3.Projection.addProjections(projections);
  goog.array.forEach(projections, function(source) {
    goog.array.forEach(projections, function(destination) {
      ol3.Projection.addTransform(
          source, destination, ol3.Projection.cloneTransform);
    });
  });
};


/**
 * @param {Array.<ol3.Projection>} projections1 Projections.
 * @param {Array.<ol3.Projection>} projections2 Projections.
 * @param {ol3.TransformFunction} forwardTransform Forward transform.
 * @param {ol3.TransformFunction} inverseTransform Inverse transform.
 * @private
 */
ol3.Projection.addEquivalentTransforms_ =
    function(projections1, projections2, forwardTransform, inverseTransform) {
  goog.array.forEach(projections1, function(projection1) {
    goog.array.forEach(projections2, function(projection2) {
      ol3.Projection.addTransform(projection1, projection2, forwardTransform);
      ol3.Projection.addTransform(projection2, projection1, inverseTransform);
    });
  });
};


/**
 * @param {ol3.Proj4jsProjection} proj4jsProjection Proj4js projection.
 */
ol3.Projection.addProj4jsProjection = function(proj4jsProjection) {
  var proj4jsProjections = ol3.Projection.proj4jsProjections_;
  var code = proj4jsProjection.getCode();
  goog.asserts.assert(!goog.object.containsKey(proj4jsProjections, code));
  proj4jsProjections[code] = proj4jsProjection;
};


/**
 * @param {ol3.Projection} projection Projection.
 */
ol3.Projection.addProjection = function(projection) {
  var projections = ol3.Projection.projections_;
  var code = projection.getCode();
  goog.asserts.assert(!goog.object.containsKey(projections, code));
  projections[code] = projection;
};


/**
 * @param {Array.<ol3.Projection>} projections Projections.
 */
ol3.Projection.addProjections = function(projections) {
  goog.array.forEach(projections, function(projection) {
    ol3.Projection.addProjection(projection);
  });
};


/**
 * @param {ol3.Projection} source Source.
 * @param {ol3.Projection} destination Destination.
 * @param {ol3.TransformFunction} transformFn Transform.
 */
ol3.Projection.addTransform = function(source, destination, transformFn) {
  var projections = ol3.Projection.projections_;
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  var transforms = ol3.Projection.transforms_;
  if (!goog.object.containsKey(transforms, sourceCode)) {
    transforms[sourceCode] = {};
  }
  goog.asserts.assert(
      !goog.object.containsKey(transforms[sourceCode], destinationCode));
  transforms[sourceCode][destinationCode] = transformFn;
};


/**
 * @param {string} code Code.
 * @return {ol3.Projection} Projection.
 */
ol3.Projection.getFromCode = function(code) {
  var projection = ol3.Projection.projections_[code];
  if (ol3.Projection.isProj4jsSupported() && !goog.isDef(projection)) {
    projection = ol3.Projection.getProj4jsProjectionFromCode_(code);
  }
  if (!goog.isDef(projection)) {
    goog.asserts.assert(goog.isDef(projection));
    projection = null;
  }
  return projection;
};


/**
 * @param {string} code Code.
 * @private
 * @return {ol3.Proj4jsProjection} Proj4js projection.
 */
ol3.Projection.getProj4jsProjectionFromCode_ = function(code) {
  var proj4jsProjections = ol3.Projection.proj4jsProjections_;
  var proj4jsProjection = proj4jsProjections[code];
  if (!goog.isDef(proj4jsProjection)) {
    var proj4jsProj = new Proj4js.Proj(code);
    proj4jsProjection = new ol3.Proj4jsProjection(code, proj4jsProj);
    proj4jsProjections[code] = proj4jsProjection;
  }
  return proj4jsProjection;
};


/**
 * @param {ol3.Projection} projection1 Projection 1.
 * @param {ol3.Projection} projection2 Projection 2.
 * @return {boolean} Equivalent.
 */
ol3.Projection.equivalent = function(projection1, projection2) {
  if (projection1 === projection2) {
    return true;
  } else if (projection1.getUnits() != projection2.getUnits()) {
    return false;
  } else {
    var transformFn = ol3.Projection.getTransform(projection1, projection2);
    return transformFn === ol3.Projection.cloneTransform;
  }
};


/**
 * @param {ol3.Projection} source Source.
 * @param {ol3.Projection} destination Destination.
 * @return {ol3.TransformFunction} Transform.
 */
ol3.Projection.getTransform = function(source, destination) {
  var transforms = ol3.Projection.transforms_;
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  var transform;
  if (goog.object.containsKey(transforms, sourceCode) &&
      goog.object.containsKey(transforms[sourceCode], destinationCode)) {
    transform = transforms[sourceCode][destinationCode];
  }
  if (ol3.Projection.isProj4jsSupported() && !goog.isDef(transform)) {
    var proj4jsSource;
    if (source instanceof ol3.Proj4jsProjection) {
      proj4jsSource = source;
    } else {
      proj4jsSource =
          ol3.Projection.getProj4jsProjectionFromCode_(source.getCode());
    }
    var sourceProj4jsProj = proj4jsSource.getProj4jsProj();
    var proj4jsDestination;
    if (destination instanceof ol3.Proj4jsProjection) {
      proj4jsDestination = destination;
    } else {
      proj4jsDestination =
          ol3.Projection.getProj4jsProjectionFromCode_(source.getCode());
    }
    var destinationProj4jsProj = proj4jsDestination.getProj4jsProj();
    transform =
        /**
         * @param {ol3.Coordinate} coordinate Coordinate.
         * @return {ol3.Coordinate} Coordinate.
         */
        function(coordinate) {
      var proj4jsPoint = new Proj4js.Point(coordinate.x, coordinate.y);
      proj4jsPoint = Proj4js.transform(
          sourceProj4jsProj, destinationProj4jsProj, proj4jsPoint);
      return new ol3.Coordinate(proj4jsPoint.x, proj4jsPoint.y);
    };
    ol3.Projection.addTransform(source, destination, transform);
  }
  if (!goog.isDef(transform)) {
    goog.asserts.assert(goog.isDef(transform));
    transform = ol3.Projection.identityTransform;
  }
  return transform;
};


/**
 * @param {string} sourceCode Source code.
 * @param {string} destinationCode Destination code.
 * @return {ol3.TransformFunction} Transform.
 */
ol3.Projection.getTransformFromCodes = function(sourceCode, destinationCode) {
  var source = ol3.Projection.getFromCode(sourceCode);
  var destination = ol3.Projection.getFromCode(destinationCode);
  return ol3.Projection.getTransform(source, destination);
};


/**
 * @return {boolean} Has Proj4js.
 */
ol3.Projection.isProj4jsSupported = function() {
  return ol3.ENABLE_PROJ4JS && 'Proj4js' in goog.global;
};


/**
 * @param {ol3.Coordinate} point Point.
 * @return {ol3.Coordinate} Point.
 */
ol3.Projection.identityTransform = function(point) {
  return point;
};


/**
 * @param {ol3.Coordinate} point Point.
 * @return {ol3.Coordinate} Point.
 */
ol3.Projection.cloneTransform = function(point) {
  return point.clone();
};


/**
 * @param {ol3.Coordinate} point Point.
 * @param {ol3.Projection} source Source.
 * @param {ol3.Projection} destination Destination.
 * @return {ol3.Coordinate} Point.
 */
ol3.Projection.transform = function(point, source, destination) {
  var transformFn = ol3.Projection.getTransform(source, destination);
  return transformFn(point);
};


/**
 * @param {ol3.Coordinate} point Point.
 * @param {string} sourceCode Source code.
 * @param {string} destinationCode Destination code.
 * @return {ol3.Coordinate} Point.
 */
ol3.Projection.transformWithCodes =
    function(point, sourceCode, destinationCode) {
  var transformFn = ol3.Projection.getTransformFromCodes(
      sourceCode, destinationCode);
  return transformFn(point);
};


/**
 * @const
 * @type {number}
 */
ol3.Projection.EPSG_3857_RADIUS = 6378137;


/**
 * @param {ol3.Coordinate} point Point.
 * @return {ol3.Coordinate} Point.
 */
ol3.Projection.forwardSphericalMercator = function(point) {
  var x = ol3.Projection.EPSG_3857_RADIUS * Math.PI * point.x / 180;
  var y = ol3.Projection.EPSG_3857_RADIUS *
      Math.log(Math.tan(Math.PI * (point.y + 90) / 360));
  return new ol3.Coordinate(x, y);
};


/**
 * @param {ol3.Coordinate} point Point.
 * @return {ol3.Coordinate} Point.
 */
ol3.Projection.inverseSphericalMercator = function(point) {
  var x = 180 * point.x / (ol3.Projection.EPSG_3857_RADIUS * Math.PI);
  var y = 360 * Math.atan(
      Math.exp(point.y / ol3.Projection.EPSG_3857_RADIUS)) / Math.PI - 90;
  return new ol3.Coordinate(x, y);
};


/**
 * @const
 * @type {number}
 */
ol3.Projection.EPSG_3857_HALF_SIZE = Math.PI * ol3.Projection.EPSG_3857_RADIUS;


/**
 * @const
 * @type {ol3.Extent}
 */
ol3.Projection.EPSG_3857_EXTENT = new ol3.Extent(
    -ol3.Projection.EPSG_3857_HALF_SIZE,
    -ol3.Projection.EPSG_3857_HALF_SIZE,
    ol3.Projection.EPSG_3857_HALF_SIZE,
    ol3.Projection.EPSG_3857_HALF_SIZE);


/**
 * @private
 * @type {Array.<string>}
 */
ol3.Projection.EPSG_3857_LIKE_CODES_ = [
  'EPSG:3857',
  'EPSG:102100',
  'EPSG:102113',
  'EPSG:900913'
];


/**
 * @const
 * @private
 * @type {Array.<ol3.Projection>}
 */
ol3.Projection.EPSG_3857_LIKE_PROJECTIONS_ = goog.array.map(
    ol3.Projection.EPSG_3857_LIKE_CODES_,
    function(code) {
      return new ol3.Projection(
          code,
          ol3.ProjectionUnits.METERS,
          ol3.Projection.EPSG_3857_EXTENT);
    });


/**
 * @const
 * @private
 * @type {ol3.Extent}
 */
ol3.Projection.EPSG_4326_EXTENT_ = new ol3.Extent(-180, -90, 180, 90);


/**
 * @private
 * @type {Array.<string>}
 */
ol3.Projection.EPSG_4326_LIKE_CODES_ = [
  'CRS:84',
  'EPSG:4326',
  'urn:ogc:def:crs:EPSG:6.6:4326'
];


/**
 * @const
 * @type {Array.<ol3.Projection>}
 */
ol3.Projection.EPSG_4326_LIKE_PROJECTIONS = goog.array.map(
    ol3.Projection.EPSG_4326_LIKE_CODES_,
    function(code) {
      return new ol3.Projection(
          code,
          ol3.ProjectionUnits.DEGREES,
          ol3.Projection.EPSG_4326_EXTENT_);
    });


ol3.Projection.addEquivalentProjections_(
    ol3.Projection.EPSG_3857_LIKE_PROJECTIONS_);
ol3.Projection.addEquivalentProjections_(
    ol3.Projection.EPSG_4326_LIKE_PROJECTIONS);
ol3.Projection.addEquivalentTransforms_(
    ol3.Projection.EPSG_4326_LIKE_PROJECTIONS,
    ol3.Projection.EPSG_3857_LIKE_PROJECTIONS_,
    ol3.Projection.forwardSphericalMercator,
    ol3.Projection.inverseSphericalMercator);
