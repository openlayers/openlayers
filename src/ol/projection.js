goog.provide('ol.Projection');
goog.provide('ol.ProjectionUnits');
goog.provide('ol.projection');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.TransformFunction');
goog.require('ol.sphere.NORMAL');


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
  FEET: 'ft',
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

  /**
   * @private
   * @type {ol.tilegrid.TileGrid}
   */
  this.defaultTileGrid_ = null;

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
 * @param {number} resolution Resolution.
 * @param {ol.Coordinate} point Point.
 * @return {number} Point resolution.
 */
ol.Projection.prototype.getPointResolution = goog.abstractMethod;


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
 * @return {ol.tilegrid.TileGrid} The default tile grid.
 */
ol.Projection.prototype.getDefaultTileGrid = function() {
  return this.defaultTileGrid_;
};


/**
 * @param {ol.tilegrid.TileGrid} tileGrid The default tile grid.
 */
ol.Projection.prototype.setDefaultTileGrid = function(tileGrid) {
  this.defaultTileGrid_ = tileGrid;
};



/**
 * @constructor
 * @extends {ol.Projection}
 * @param {string} code Code.
 * @param {Proj4js.Proj} proj4jsProj Proj4js projection.
 * @private
 */
ol.Proj4jsProjection_ = function(code, proj4jsProj) {

  var units = /** @type {ol.ProjectionUnits} */ (proj4jsProj.units);

  goog.base(this, code, units, null, proj4jsProj.axis);

  /**
   * @private
   * @type {Proj4js.Proj}
   */
  this.proj4jsProj_ = proj4jsProj;

  /**
   * @private
   * @type {?ol.TransformFunction}
   */
  this.toEPSG4326_ = null;

};
goog.inherits(ol.Proj4jsProjection_, ol.Projection);


/**
 * @inheritDoc
 */
ol.Proj4jsProjection_.prototype.getPointResolution =
    function(resolution, point) {
  if (this.getUnits() == ol.ProjectionUnits.DEGREES) {
    return resolution;
  } else {
    // Estimate point resolution by transforming the center pixel to EPSG:4326,
    // measuring its width and height on the normal sphere, and taking the
    // average of the width and height.
    if (goog.isNull(this.toEPSG4326_)) {
      this.toEPSG4326_ = ol.projection.getTransform(
          this, ol.projection.getProj4jsProjectionFromCode_('EPSG:4326'));
    }
    var vertices = [
      point.x - resolution / 2, point.y,
      point.x + resolution / 2, point.y,
      point.x, point.y - resolution / 2,
      point.x, point.y + resolution / 2
    ];
    vertices = this.toEPSG4326_(vertices, vertices, 2);
    var width = ol.sphere.NORMAL.haversineDistance(
        new ol.Coordinate(vertices[0], vertices[1]),
        new ol.Coordinate(vertices[2], vertices[3]));
    var height = ol.sphere.NORMAL.haversineDistance(
        new ol.Coordinate(vertices[4], vertices[5]),
        new ol.Coordinate(vertices[6], vertices[7]));
    var pointResolution = (width + height) / 2;
    if (this.getUnits() == ol.ProjectionUnits.FEET) {
      // The radius of the normal sphere is defined in meters, so we must
      // convert back to feet.
      pointResolution /= 0.3048;
    }
    return pointResolution;
  }
};


/**
 * @return {Proj4js.Proj} Proj4js projection.
 */
ol.Proj4jsProjection_.prototype.getProj4jsProj = function() {
  return this.proj4jsProj_;
};


/**
 * @private
 * @type {Object.<string, ol.Proj4jsProjection_>}
 */
ol.projection.proj4jsProjections_ = {};


/**
 * @private
 * @type {Object.<string, ol.Projection>}
 */
ol.projection.projections_ = {};


/**
 * @private
 * @type {Object.<string, Object.<string, ol.TransformFunction>>}
 */
ol.projection.transforms_ = {};


/**
 * Registers transformation functions that don't alter coordinates. Those allow
 * to transform between projections with equal meaning.
 *
 * @param {Array.<ol.Projection>} projections Projections.
 */
ol.projection.addEquivalentProjections = function(projections) {
  ol.projection.addProjections(projections);
  goog.array.forEach(projections, function(source) {
    goog.array.forEach(projections, function(destination) {
      if (source !== destination) {
        ol.projection.addTransform(
            source, destination, ol.projection.cloneTransform);
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
ol.projection.addEquivalentTransforms =
    function(projections1, projections2, forwardTransform, inverseTransform) {
  goog.array.forEach(projections1, function(projection1) {
    goog.array.forEach(projections2, function(projection2) {
      ol.projection.addTransform(projection1, projection2, forwardTransform);
      ol.projection.addTransform(projection2, projection1, inverseTransform);
    });
  });
};


/**
 * @param {ol.Proj4jsProjection_} proj4jsProjection Proj4js projection.
 * @private
 */
ol.projection.addProj4jsProjection_ = function(proj4jsProjection) {
  var proj4jsProjections = ol.projection.proj4jsProjections_;
  var code = proj4jsProjection.getCode();
  goog.asserts.assert(!goog.object.containsKey(proj4jsProjections, code));
  proj4jsProjections[code] = proj4jsProjection;
};


/**
 * @param {ol.Projection} projection Projection.
 */
ol.projection.addProjection = function(projection) {
  var projections = ol.projection.projections_;
  var code = projection.getCode();
  goog.asserts.assert(!goog.object.containsKey(projections, code));
  projections[code] = projection;
  ol.projection.addTransform(
      projection, projection, ol.projection.cloneTransform);
};


/**
 * @param {Array.<ol.Projection>} projections Projections.
 */
ol.projection.addProjections = function(projections) {
  goog.array.forEach(projections, function(projection) {
    ol.projection.addProjection(projection);
  });
};


/**
 * FIXME empty description for jsdoc
 */
ol.projection.clearAllProjections = function() {
  if (ol.ENABLE_PROJ4JS) {
    ol.projection.proj4jsProjections_ = {};
  }
  ol.projection.projections_ = {};
  ol.projection.transforms_ = {};
};


/**
 * @param {ol.Projection|string|undefined} projection Projection.
 * @param {string} defaultCode Default code.
 * @return {ol.Projection} Projection.
 */
ol.projection.createProjection = function(projection, defaultCode) {
  if (!goog.isDefAndNotNull(projection)) {
    return ol.projection.getFromCode(defaultCode);
  } else if (goog.isString(projection)) {
    return ol.projection.getFromCode(projection);
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
ol.projection.addTransform = function(source, destination, transformFn) {
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  var transforms = ol.projection.transforms_;
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
ol.projection.removeTransform = function(source, destination) {
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  var transforms = ol.projection.transforms_;
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
ol.projection.getFromCode = function(code) {
  var projection = ol.projection.projections_[code];
  if (ol.HAVE_PROJ4JS && !goog.isDef(projection)) {
    projection = ol.projection.getProj4jsProjectionFromCode_(code);
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
 * @return {ol.Proj4jsProjection_} Proj4js projection.
 */
ol.projection.getProj4jsProjectionFromCode_ = function(code) {
  var proj4jsProjections = ol.projection.proj4jsProjections_;
  var proj4jsProjection = proj4jsProjections[code];
  if (!goog.isDef(proj4jsProjection)) {
    var proj4jsProj = new Proj4js.Proj(code);
    var srsCode = proj4jsProj.srsCode;
    proj4jsProjection = proj4jsProjections[srsCode];
    if (!goog.isDef(proj4jsProjection)) {
      proj4jsProjection = new ol.Proj4jsProjection_(srsCode, proj4jsProj);
      proj4jsProjections[srsCode] = proj4jsProjection;
    }
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
ol.projection.equivalent = function(projection1, projection2) {
  if (projection1 === projection2) {
    return true;
  } else if (projection1.getUnits() != projection2.getUnits()) {
    return false;
  } else {
    var transformFn = ol.projection.getTransform(projection1, projection2);
    return transformFn === ol.projection.cloneTransform;
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
ol.projection.getTransform = function(source, destination) {
  var transforms = ol.projection.transforms_;
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  var transform;
  if (goog.object.containsKey(transforms, sourceCode) &&
      goog.object.containsKey(transforms[sourceCode], destinationCode)) {
    transform = transforms[sourceCode][destinationCode];
  }
  if (ol.HAVE_PROJ4JS && !goog.isDef(transform)) {
    var proj4jsSource;
    if (source instanceof ol.Proj4jsProjection_) {
      proj4jsSource = source;
    } else {
      proj4jsSource =
          ol.projection.getProj4jsProjectionFromCode_(source.getCode());
    }
    var sourceProj4jsProj = proj4jsSource.getProj4jsProj();
    var proj4jsDestination;
    if (destination instanceof ol.Proj4jsProjection_) {
      proj4jsDestination = destination;
    } else {
      proj4jsDestination =
          ol.projection.getProj4jsProjectionFromCode_(destination.getCode());
    }
    var destinationProj4jsProj = proj4jsDestination.getProj4jsProj();
    transform =
        /**
         * @param {Array.<number>} input Input coordinate values.
         * @param {Array.<number>=} opt_output Output array of coordinates.
         * @param {number=} opt_dimension Dimension.
         * @return {Array.<number>} Output coordinate values.
         */
        function(input, opt_output, opt_dimension) {
      var length = input.length,
          dimension = opt_dimension > 1 ? opt_dimension : 2,
          output = opt_output;
      if (!goog.isDef(output)) {
        if (dimension > 2) {
          // preserve values beyond second dimension
          output = input.slice();
        } else {
          output = new Array(length);
        }
      }
      goog.asserts.assert(output.length % dimension === 0);
      var proj4jsPoint;
      for (var i = 0; i < length; i += dimension) {
        proj4jsPoint = new Proj4js.Point(input[i], input[i + 1]);
        proj4jsPoint = Proj4js.transform(
            sourceProj4jsProj, destinationProj4jsProj, proj4jsPoint);
        output[i] = proj4jsPoint.x;
        output[i + 1] = proj4jsPoint.y;
      }
      return output;
    };
    ol.projection.addTransform(source, destination, transform);
  }
  if (!goog.isDef(transform)) {
    goog.asserts.assert(goog.isDef(transform));
    transform = ol.projection.identityTransform;
  }
  return transform;
};


/**
 * Given the projection codes this method searches for a transformation function
 * to convert a coordinates array from the source projection to the destination
 * projection.
 *
 * @param {string} sourceCode Source code.
 * @param {string} destinationCode Destination code.
 * @return {ol.TransformFunction} Transform.
 */
ol.projection.getTransformFromCodes = function(sourceCode, destinationCode) {
  var source = ol.projection.getFromCode(sourceCode);
  var destination = ol.projection.getFromCode(destinationCode);
  return ol.projection.getTransform(source, destination);
};


/**
 * @param {Array.<number>} input Input coordinate array.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension.
 * @return {Array.<number>} Input coordinate array (same array as input).
 */
ol.projection.identityTransform = function(input, opt_output, opt_dimension) {
  if (goog.isDef(opt_output) && input !== opt_output) {
    // TODO: consider making this a warning instead
    goog.asserts.assert(false, 'This should not be used internally.');
    for (var i = 0, ii = input.length; i < ii; ++i) {
      opt_output[i] = input[i];
    }
    input = opt_output;
  }
  return input;
};


/**
 * @param {Array.<number>} input Input coordinate array.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension.
 * @return {Array.<number>} Output coordinate array (new array, same coordinate
 *     values).
 */
ol.projection.cloneTransform = function(input, opt_output, opt_dimension) {
  var output;
  if (goog.isDef(opt_output)) {
    for (var i = 0, ii = input.length; i < ii; ++i) {
      opt_output[i] = input[i];
    }
    output = opt_output;
  } else {
    output = input.slice();
  }
  return output;
};


/**
 * Transforms the given point to the destination projection.
 *
 * @param {ol.Coordinate} point Point.
 * @param {ol.Projection} source Source.
 * @param {ol.Projection} destination Destination.
 * @return {ol.Coordinate} Point.
 */
ol.projection.transform = function(point, source, destination) {
  var transformFn = ol.projection.getTransform(source, destination);
  var vertex = [point.x, point.y];
  vertex = transformFn(vertex, vertex, 2);
  return new ol.Coordinate(vertex[0], vertex[1]);
};


/**
 * @param {ol.Coordinate} point Point.
 * @param {string} sourceCode Source code.
 * @param {string} destinationCode Destination code.
 * @return {ol.Coordinate} Point.
 */
ol.projection.transformWithCodes =
    function(point, sourceCode, destinationCode) {
  var transformFn = ol.projection.getTransformFromCodes(
      sourceCode, destinationCode);
  var vertex = [point.x, point.y];
  vertex = transformFn(vertex, vertex, 2);
  return new ol.Coordinate(vertex[0], vertex[1]);
};
