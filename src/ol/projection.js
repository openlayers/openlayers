goog.provide('ol.Projection');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.TransformFunction');


/**
 * @define {boolean} Enable Proj4js.
 */
ol.ENABLE_PROJ4JS = true;


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
 * @constructor
 * @extends {ol.Projection}
 * @param {string} code Code.
 * @param {Proj4js.Proj} proj4jsProj Proj4js projection.
 */
ol.Proj4jsProjection = function(code, proj4jsProj) {

  var units = /** @type {ol.ProjectionUnits} */ proj4jsProj.units;

  goog.base(this, code, units, null);

  /**
   * @private
   * @type {Proj4js.Proj}
   */
  this.proj4jsProj_ = proj4jsProj;

};
goog.inherits(ol.Proj4jsProjection, ol.Projection);


/**
 * @return {Proj4js.Proj} Proj4js projection.
 */
ol.Proj4jsProjection.prototype.getProj4jsProj = function() {
  return this.proj4jsProj_;
};


/**
 * @private
 * @type {Object.<string, ol.Proj4jsProjection>}
 */
ol.Projection.proj4jsProjections_ = {};


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
 * @private
 */
ol.Projection.addEquivalentProjections_ = function(projections) {
  ol.Projection.addProjections(projections);
  goog.array.forEach(projections, function(source) {
    goog.array.forEach(projections, function(destination) {
      if (source !== destination) {
        ol.Projection.addTransform(
            source, destination, ol.Projection.cloneTransform);
      }
    });
  });
};


/**
 * @param {Array.<ol.Projection>} projections1 Projections.
 * @param {Array.<ol.Projection>} projections2 Projections.
 * @param {ol.TransformFunction} forwardTransform Forward transform.
 * @param {ol.TransformFunction} inverseTransform Inverse transform.
 * @private
 */
ol.Projection.addEquivalentTransforms_ =
    function(projections1, projections2, forwardTransform, inverseTransform) {
  goog.array.forEach(projections1, function(projection1) {
    goog.array.forEach(projections2, function(projection2) {
      ol.Projection.addTransform(projection1, projection2, forwardTransform);
      ol.Projection.addTransform(projection2, projection1, inverseTransform);
    });
  });
};


/**
 * @param {ol.Proj4jsProjection} proj4jsProjection Proj4js projection.
 */
ol.Projection.addProj4jsProjection = function(proj4jsProjection) {
  var proj4jsProjections = ol.Projection.proj4jsProjections_;
  var code = proj4jsProjection.getCode();
  goog.asserts.assert(!goog.object.containsKey(proj4jsProjections, code));
  proj4jsProjections[code] = proj4jsProjection;
};


/**
 * @param {ol.Projection} projection Projection.
 */
ol.Projection.addProjection = function(projection) {
  var projections = ol.Projection.projections_;
  var code = projection.getCode();
  goog.asserts.assert(!goog.object.containsKey(projections, code));
  projections[code] = projection;
  ol.Projection.addTransform(
      projection, projection, ol.Projection.cloneTransform);
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
 * @param {ol.Projection|string|undefined} projection Projection.
 * @param {string} defaultCode Default code.
 * @return {ol.Projection} Projection.
 */
ol.Projection.createProjection = function(projection, defaultCode) {
  if (!goog.isDefAndNotNull(projection)) {
    return ol.Projection.getFromCode(defaultCode);
  } else if (goog.isString(projection)) {
    return ol.Projection.getFromCode(projection);
  } else {
    goog.asserts.assert(projection instanceof ol.Projection);
    return projection;
  }
};


/**
 * @param {ol.Projection} source Source.
 * @param {ol.Projection} destination Destination.
 * @param {ol.TransformFunction} transformFn Transform.
 */
ol.Projection.addTransform = function(source, destination, transformFn) {
  var projections = ol.Projection.projections_;
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  var transforms = ol.Projection.transforms_;
  if (!goog.object.containsKey(transforms, sourceCode)) {
    transforms[sourceCode] = {};
  }
  goog.asserts.assert(
      !goog.object.containsKey(transforms[sourceCode], destinationCode));
  transforms[sourceCode][destinationCode] = transformFn;
};


/**
 * @param {string} code Code.
 * @return {ol.Projection} Projection.
 */
ol.Projection.getFromCode = function(code) {
  var projection = ol.Projection.projections_[code];
  if (ol.Projection.isProj4jsSupported() && !goog.isDef(projection)) {
    projection = ol.Projection.getProj4jsProjectionFromCode_(code);
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
 * @return {ol.Proj4jsProjection} Proj4js projection.
 */
ol.Projection.getProj4jsProjectionFromCode_ = function(code) {
  var proj4jsProjections = ol.Projection.proj4jsProjections_;
  var proj4jsProjection = proj4jsProjections[code];
  if (!goog.isDef(proj4jsProjection)) {
    var proj4jsProj = new Proj4js.Proj(code);
    proj4jsProjection = new ol.Proj4jsProjection(code, proj4jsProj);
    proj4jsProjections[code] = proj4jsProjection;
  }
  return proj4jsProjection;
};


/**
 * @param {ol.Projection} projection1 Projection 1.
 * @param {ol.Projection} projection2 Projection 2.
 * @return {boolean} Equivalent.
 */
ol.Projection.equivalent = function(projection1, projection2) {
  if (projection1 === projection2) {
    return true;
  } else if (projection1.getUnits() != projection2.getUnits()) {
    return false;
  } else {
    var transformFn = ol.Projection.getTransform(projection1, projection2);
    return transformFn === ol.Projection.cloneTransform;
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
  var transform;
  if (goog.object.containsKey(transforms, sourceCode) &&
      goog.object.containsKey(transforms[sourceCode], destinationCode)) {
    transform = transforms[sourceCode][destinationCode];
  }
  if (ol.Projection.isProj4jsSupported() && !goog.isDef(transform)) {
    var proj4jsSource;
    if (source instanceof ol.Proj4jsProjection) {
      proj4jsSource = source;
    } else {
      proj4jsSource =
          ol.Projection.getProj4jsProjectionFromCode_(source.getCode());
    }
    var sourceProj4jsProj = proj4jsSource.getProj4jsProj();
    var proj4jsDestination;
    if (destination instanceof ol.Proj4jsProjection) {
      proj4jsDestination = destination;
    } else {
      proj4jsDestination =
          ol.Projection.getProj4jsProjectionFromCode_(source.getCode());
    }
    var destinationProj4jsProj = proj4jsDestination.getProj4jsProj();
    transform =
        /**
         * @param {ol.Coordinate} coordinate Coordinate.
         * @return {ol.Coordinate} Coordinate.
         */
        function(coordinate) {
      var proj4jsPoint = new Proj4js.Point(coordinate.x, coordinate.y);
      proj4jsPoint = Proj4js.transform(
          sourceProj4jsProj, destinationProj4jsProj, proj4jsPoint);
      return new ol.Coordinate(proj4jsPoint.x, proj4jsPoint.y);
    };
    ol.Projection.addTransform(source, destination, transform);
  }
  if (!goog.isDef(transform)) {
    goog.asserts.assert(goog.isDef(transform));
    transform = ol.Projection.identityTransform;
  }
  return transform;
};


/**
 * @param {string} sourceCode Source code.
 * @param {string} destinationCode Destination code.
 * @return {ol.TransformFunction} Transform.
 */
ol.Projection.getTransformFromCodes = function(sourceCode, destinationCode) {
  var source = ol.Projection.getFromCode(sourceCode);
  var destination = ol.Projection.getFromCode(destinationCode);
  return ol.Projection.getTransform(source, destination);
};


/**
 * @return {boolean} Has Proj4js.
 */
ol.Projection.isProj4jsSupported = function() {
  return ol.ENABLE_PROJ4JS && 'Proj4js' in goog.global;
};


/**
 * @param {ol.Coordinate} point Point.
 * @return {ol.Coordinate} Point.
 */
ol.Projection.identityTransform = function(point) {
  return point;
};


/**
 * @param {ol.Coordinate} point Point.
 * @return {ol.Coordinate} Point.
 */
ol.Projection.cloneTransform = function(point) {
  return new ol.Coordinate(point.x, point.y);
};


/**
 * @param {ol.Coordinate} point Point.
 * @param {ol.Projection} source Source.
 * @param {ol.Projection} destination Destination.
 * @return {ol.Coordinate} Point.
 */
ol.Projection.transform = function(point, source, destination) {
  var transformFn = ol.Projection.getTransform(source, destination);
  return transformFn(point);
};


/**
 * @param {ol.Coordinate} point Point.
 * @param {string} sourceCode Source code.
 * @param {string} destinationCode Destination code.
 * @return {ol.Coordinate} Point.
 */
ol.Projection.transformWithCodes =
    function(point, sourceCode, destinationCode) {
  var transformFn = ol.Projection.getTransformFromCodes(
      sourceCode, destinationCode);
  return transformFn(point);
};


/**
 * @const
 * @type {number}
 */
ol.Projection.EPSG_3857_RADIUS = 6378137;


/**
 * @param {ol.Coordinate} point Point.
 * @return {ol.Coordinate} Point.
 */
ol.Projection.forwardSphericalMercator = function(point) {
  var x = ol.Projection.EPSG_3857_RADIUS * Math.PI * point.x / 180;
  var y = ol.Projection.EPSG_3857_RADIUS *
      Math.log(Math.tan(Math.PI * (point.y + 90) / 360));
  return new ol.Coordinate(x, y);
};


/**
 * @param {ol.Coordinate} point Point.
 * @return {ol.Coordinate} Point.
 */
ol.Projection.inverseSphericalMercator = function(point) {
  var x = 180 * point.x / (ol.Projection.EPSG_3857_RADIUS * Math.PI);
  var y = 360 * Math.atan(
      Math.exp(point.y / ol.Projection.EPSG_3857_RADIUS)) / Math.PI - 90;
  return new ol.Coordinate(x, y);
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
    -ol.Projection.EPSG_3857_HALF_SIZE,
    -ol.Projection.EPSG_3857_HALF_SIZE,
    ol.Projection.EPSG_3857_HALF_SIZE,
    ol.Projection.EPSG_3857_HALF_SIZE);


/**
 * @private
 * @type {Array.<string>}
 */
ol.Projection.EPSG_3857_LIKE_CODES_ = [
  'EPSG:3857',
  'EPSG:102100',
  'EPSG:102113',
  'EPSG:900913'
];


/**
 * @const
 * @private
 * @type {Array.<ol.Projection>}
 */
ol.Projection.EPSG_3857_LIKE_PROJECTIONS_ = goog.array.map(
    ol.Projection.EPSG_3857_LIKE_CODES_,
    function(code) {
      return new ol.Projection(
          code,
          ol.ProjectionUnits.METERS,
          ol.Projection.EPSG_3857_EXTENT);
    });


/**
 * @const
 * @private
 * @type {ol.Extent}
 */
ol.Projection.EPSG_4326_EXTENT_ = new ol.Extent(-180, -90, 180, 90);


/**
 * @private
 * @type {Array.<string>}
 */
ol.Projection.EPSG_4326_LIKE_CODES_ = [
  'CRS:84',
  'EPSG:4326',
  'urn:ogc:def:crs:EPSG:6.6:4326'
];


/**
 * @const
 * @type {Array.<ol.Projection>}
 */
ol.Projection.EPSG_4326_LIKE_PROJECTIONS = goog.array.map(
    ol.Projection.EPSG_4326_LIKE_CODES_,
    function(code) {
      return new ol.Projection(
          code,
          ol.ProjectionUnits.DEGREES,
          ol.Projection.EPSG_4326_EXTENT_);
    });


ol.Projection.addEquivalentProjections_(
    ol.Projection.EPSG_3857_LIKE_PROJECTIONS_);
ol.Projection.addEquivalentProjections_(
    ol.Projection.EPSG_4326_LIKE_PROJECTIONS);
ol.Projection.addEquivalentTransforms_(
    ol.Projection.EPSG_4326_LIKE_PROJECTIONS,
    ol.Projection.EPSG_3857_LIKE_PROJECTIONS_,
    ol.Projection.forwardSphericalMercator,
    ol.Projection.inverseSphericalMercator);
