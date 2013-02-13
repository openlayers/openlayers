goog.provide('ol.Projection');
goog.provide('ol.ProjectionUnits');

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
 * @const {boolean} Have Proj4js.
 */
ol.HAVE_PROJ4JS = ol.ENABLE_PROJ4JS && typeof Proj4js == 'object';


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
 * @param {string=} opt_axisOrientation Axis orientation.
 */
ol.Projection = function(code, units, extent, opt_axisOrientation) {

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

  /**
   * @private
   * @type {string}
   */
  this.axisOrientation_ = goog.isDef(opt_axisOrientation) ?
      opt_axisOrientation : 'enu';

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
 * @return {string} Axis orientation.
 */
ol.Projection.prototype.getAxisOrientation = function() {
  return this.axisOrientation_;
};



/**
 * @constructor
 * @extends {ol.Projection}
 * @param {string} code Code.
 * @param {Proj4js.Proj} proj4jsProj Proj4js projection.
 */
ol.Proj4jsProjection = function(code, proj4jsProj) {

  var units = /** @type {ol.ProjectionUnits} */ (proj4jsProj.units);

  goog.base(this, code, units, null, proj4jsProj.axis);

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
 * Registers transformation functions that don't alter coordinates. Those allow
 * to transform between projections with equal meaning.
 *
 * @param {Array.<ol.Projection>} projections Projections.
 */
ol.Projection.addEquivalentProjections = function(projections) {
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
 * Registers transformation functions to convert coordinates in any projection
 * in projection1 to any projection in projection2.
 *
 * @param {Array.<ol.Projection>} projections1 Projections with equal meaning.
 * @param {Array.<ol.Projection>} projections2 Projections with equal meaning.
 * @param {ol.TransformFunction} forwardTransform Transformation from any
 *   projection in projection1 to any projection in projection2.
 * @param {ol.TransformFunction} inverseTransform Transform from any projection
 *   in projection2 to any projection in projection1..
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
 * FIXME empty description for jsdoc
 */
ol.Projection.clearAllProjections = function() {
  if (ol.ENABLE_PROJ4JS) {
    ol.Projection.proj4jsProjections_ = {};
  }
  ol.Projection.projections_ = {};
  ol.Projection.transforms_ = {};
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
 * Registers a conversion function to convert coordinates from the source
 * projection to the destination projection.
 *
 * @param {ol.Projection} source Source.
 * @param {ol.Projection} destination Destination.
 * @param {ol.TransformFunction} transformFn Transform.
 */
ol.Projection.addTransform = function(source, destination, transformFn) {
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
 * Unregisters the conversion function to convert coordinates from the source
 * projection to the destination projection.  This method is used to clean up
 * cached transforms during testing.
 *
 * @param {ol.Projection} source Source projection.
 * @param {ol.Projection} destination Destination projection.
 * @return {ol.TransformFunction} transformFn The unregistered transform.
 */
ol.Projection.removeTransform = function(source, destination) {
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  var transforms = ol.Projection.transforms_;
  goog.asserts.assert(sourceCode in transforms);
  goog.asserts.assert(destinationCode in transforms[sourceCode]);
  var transform = transforms[sourceCode][destinationCode];
  delete transforms[sourceCode][destinationCode];
  var keys = goog.object.getKeys(transforms[sourceCode]);
  if (keys.length == 0) {
    delete transforms[sourceCode];
  }
  return transform;
};


/**
 * @param {string} code Code which is a combination of authority and identifier
 *   such as “EPSG:4326”.
 * @return {ol.Projection} Projection.
 */
ol.Projection.getFromCode = function(code) {
  var projection = ol.Projection.projections_[code];
  if (ol.HAVE_PROJ4JS && !goog.isDef(projection)) {
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
 * Checks if two projections are the same, that is every coordinate in one
 * projection does represent the same geographic point as the same coordinate in
 * the other projection.
 *
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
 * Searches a function that can be used to convert coordinates from the source
 * projection to the destination projection.
 *
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
  if (ol.HAVE_PROJ4JS && !goog.isDef(transform)) {
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
          ol.Projection.getProj4jsProjectionFromCode_(destination.getCode());
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
 * Given the projection codes this method searches for a transformation function
 * to convert coordinate from the source projection to the destination
 * projection.
 *
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
 * @param {ol.Coordinate} point Point.
 * @return {ol.Coordinate} Unaltered point (same reference).
 */
ol.Projection.identityTransform = function(point) {
  return point;
};


/**
 * @param {ol.Coordinate} point Point.
 * @return {ol.Coordinate} Equal point (different reference).
 */
ol.Projection.cloneTransform = function(point) {
  return new ol.Coordinate(point.x, point.y);
};


/**
 * Transforms the given point to the destination projection.
 *
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
