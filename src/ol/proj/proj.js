goog.provide('ol.proj');
goog.provide('ol.proj.METERS_PER_UNIT');
goog.provide('ol.proj.Projection');
goog.provide('ol.proj.ProjectionLike');
goog.provide('ol.proj.Units');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol');
goog.require('ol.Extent');
goog.require('ol.TransformFunction');
goog.require('ol.extent');
goog.require('ol.sphere.NORMAL');


/**
 * Have Proj4js.
 * @const
 * @type {boolean}
 */
ol.HAVE_PROJ4JS = ol.ENABLE_PROJ4JS && typeof proj4 == 'function';


/**
 * A projection as {@link ol.proj.Projection}, SRS identifier string or
 * undefined.
 * @typedef {ol.proj.Projection|string|undefined} ol.proj.ProjectionLike
 * @api
 */
ol.proj.ProjectionLike;


/**
 * Projection units: `'degrees'`, `'ft'`, `'m'` or `'pixels'`.
 * @enum {string}
 * @api
 */
ol.proj.Units = {
  DEGREES: 'degrees',
  FEET: 'ft',
  METERS: 'm',
  PIXELS: 'pixels'
};


/**
 * Meters per unit lookup table.
 * @const
 * @type {Object.<ol.proj.Units, number>}
 * @api
 */
ol.proj.METERS_PER_UNIT[ol.proj.Units.DEGREES] =
    2 * Math.PI * ol.sphere.NORMAL.radius / 360;
ol.proj.METERS_PER_UNIT[ol.proj.Units.FEET] = 0.3048;
ol.proj.METERS_PER_UNIT[ol.proj.Units.METERS] = 1;



/**
 * @classdesc
 * Class for coordinate transforms between coordinate systems. By default,
 * OpenLayers ships with the ability to transform coordinates between
 * geographic (EPSG:4326) and web or spherical mercator (EPSG:3857)
 * coordinate reference systems. Any transform functions can be added with
 * {@link ol.proj.addCoordinateTransforms}.
 *
 * Additional transforms may be added by using the {@link http://proj4js.org/}
 * library. If the proj4js library is loaded, transforms will work between any
 * coordinate reference systems with proj4js definitions. These definitions can
 * be obtained from {@link http://epsg.io/}.
 *
 * @constructor
 * @param {olx.ProjectionOptions} options Projection options.
 * @struct
 * @api
 */
ol.proj.Projection = function(options) {

  /**
   * @private
   * @type {string}
   */
  this.code_ = options.code;

  /**
   * @private
   * @type {ol.proj.Units}
   */
  this.units_ = /** @type {ol.proj.Units} */ (options.units);

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = goog.isDef(options.extent) ? options.extent : null;

  /**
   * @private
   * @type {string}
   */
  this.axisOrientation_ = goog.isDef(options.axisOrientation) ?
      options.axisOrientation : 'enu';

  /**
   * @private
   * @type {boolean}
   */
  this.global_ = goog.isDef(options.global) ? options.global : false;

  /**
   * @private
   * @type {ol.tilegrid.TileGrid}
   */
  this.defaultTileGrid_ = null;

};


/**
 * Get the code for this projection, e.g. 'EPSG:4326'.
 * @return {string} Code.
 * @api
 */
ol.proj.Projection.prototype.getCode = function() {
  return this.code_;
};


/**
 * Get the validity extent for this projection.
 * @return {ol.Extent} Extent.
 * @api
 */
ol.proj.Projection.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * Get the units of this projection.
 * @return {ol.proj.Units} Units.
 * @api
 */
ol.proj.Projection.prototype.getUnits = function() {
  return this.units_;
};


/**
 * Get the amount of meters per unit of this projection.  If the projection is
 * not configured with a units identifier, the return is `undefined`.
 * @return {number|undefined} Meters.
 */
ol.proj.Projection.prototype.getMetersPerUnit = function() {
  return ol.proj.METERS_PER_UNIT[this.units_];
};


/**
 * Get the axis orientation of this projection.
 * Example values are:
 * enu - the default easting, northing, elevation.
 * neu - northing, easting, up - useful for "lat/long" geographic coordinates,
 *     or south orientated transverse mercator.
 * wnu - westing, northing, up - some planetary coordinate systems have
 *     "west positive" coordinate systems
 * @return {string} Axis orientation.
 */
ol.proj.Projection.prototype.getAxisOrientation = function() {
  return this.axisOrientation_;
};


/**
 * Is this projection a global projection which spans the whole world?
 * @return {boolean} Wether the projection is global.
 */
ol.proj.Projection.prototype.isGlobal = function() {
  return this.global_;
};


/**
 * @return {ol.tilegrid.TileGrid} The default tile grid.
 */
ol.proj.Projection.prototype.getDefaultTileGrid = function() {
  return this.defaultTileGrid_;
};


/**
 * @param {ol.tilegrid.TileGrid} tileGrid The default tile grid.
 */
ol.proj.Projection.prototype.setDefaultTileGrid = function(tileGrid) {
  this.defaultTileGrid_ = tileGrid;
};


/**
 * Set the validity extent for this projection.
 * @param {ol.Extent} extent Extent.
 * @api
 */
ol.proj.Projection.prototype.setExtent = function(extent) {
  this.extent_ = extent;
};


/**
 * Get the resolution of the point in degrees. For projections with degrees as
 * the unit this will simply return the provided resolution. For other
 * projections the point resolution is estimated by transforming the center
 * pixel to EPSG:4326, measuring its width and height on the normal sphere,
 * and taking the average of the width and height.
 * @param {number} resolution Resolution.
 * @param {ol.Coordinate} point Point.
 * @return {number} Point resolution.
 */
ol.proj.Projection.prototype.getPointResolution = function(resolution, point) {
  if (this.getUnits() == ol.proj.Units.DEGREES) {
    return resolution;
  } else {
    // Estimate point resolution by transforming the center pixel to EPSG:4326,
    // measuring its width and height on the normal sphere, and taking the
    // average of the width and height.
    var toEPSG4326 = ol.proj.getTransformFromProjections(
        this, ol.proj.get('EPSG:4326'));
    var vertices = [
      point[0] - resolution / 2, point[1],
      point[0] + resolution / 2, point[1],
      point[0], point[1] - resolution / 2,
      point[0], point[1] + resolution / 2
    ];
    vertices = toEPSG4326(vertices, vertices, 2);
    var width = ol.sphere.NORMAL.haversineDistance(
        vertices.slice(0, 2), vertices.slice(2, 4));
    var height = ol.sphere.NORMAL.haversineDistance(
        vertices.slice(4, 6), vertices.slice(6, 8));
    var pointResolution = (width + height) / 2;
    if (this.getUnits() == ol.proj.Units.FEET) {
      // The radius of the normal sphere is defined in meters, so we must
      // convert back to feet.
      pointResolution /= 0.3048;
    }
    return pointResolution;
  }
};


/**
 * @private
 * @type {Object.<string, ol.proj.Projection>}
 */
ol.proj.projections_ = {};


/**
 * @private
 * @type {Object.<string, Object.<string, ol.TransformFunction>>}
 */
ol.proj.transforms_ = {};


/**
 * Registers transformation functions that don't alter coordinates. Those allow
 * to transform between projections with equal meaning.
 *
 * @param {Array.<ol.proj.Projection|olx.ProjectionOptions>} projections
 *     Projections.
 * @return {Array.<ol.proj.Projection>} The added equivalent projections.
 * @api
 */
ol.proj.addEquivalentProjections = function(projections) {
  var addedProjections = ol.proj.addProjections(projections);
  goog.array.forEach(addedProjections, function(source) {
    goog.array.forEach(addedProjections, function(destination) {
      if (source !== destination) {
        ol.proj.addTransform(source, destination, ol.proj.cloneTransform);
      }
    });
  });
  return addedProjections;
};


/**
 * Registers transformation functions to convert coordinates in any projection
 * in projection1 to any projection in projection2.
 *
 * @param {Array.<ol.proj.Projection>} projections1 Projections with equal
 *     meaning.
 * @param {Array.<ol.proj.Projection>} projections2 Projections with equal
 *     meaning.
 * @param {ol.TransformFunction} forwardTransform Transformation from any
 *   projection in projection1 to any projection in projection2.
 * @param {ol.TransformFunction} inverseTransform Transform from any projection
 *   in projection2 to any projection in projection1..
 */
ol.proj.addEquivalentTransforms =
    function(projections1, projections2, forwardTransform, inverseTransform) {
  goog.array.forEach(projections1, function(projection1) {
    goog.array.forEach(projections2, function(projection2) {
      ol.proj.addTransform(projection1, projection2, forwardTransform);
      ol.proj.addTransform(projection2, projection1, inverseTransform);
    });
  });
};


/**
 * Add a Projection object to the list of supported projections.
 *
 * @param {ol.proj.Projection|olx.ProjectionOptions} projection Projection
 *     instance or configuration.
 * @return {ol.proj.Projection} The added projection.
 * @api
 */
ol.proj.addProjection = function(projection) {
  var projections = ol.proj.projections_;
  var proj = projection instanceof ol.proj.Projection ?
      projection :
      new ol.proj.Projection(/** @type {olx.ProjectionOptions} */ (projection));
  var code = proj.getCode();
  projections[code] = proj;
  ol.proj.addTransform(proj, proj, ol.proj.cloneTransform);
  return proj;
};


/**
 * @param {Array.<ol.proj.Projection|olx.ProjectionOptions>} projections
 *     Projections.
 * @return {Array.<ol.proj.Projection>} The added projections.
 */
ol.proj.addProjections = function(projections) {
  var addedProjections = [];
  goog.array.forEach(projections, function(projection) {
    addedProjections.push(ol.proj.addProjection(projection));
  });
  return addedProjections;
};


/**
 * FIXME empty description for jsdoc
 */
ol.proj.clearAllProjections = function() {
  ol.proj.projections_ = {};
  ol.proj.transforms_ = {};
};


/**
 * @param {ol.proj.Projection|string|undefined} projection Projection.
 * @param {string} defaultCode Default code.
 * @return {ol.proj.Projection} Projection.
 */
ol.proj.createProjection = function(projection, defaultCode) {
  if (!goog.isDefAndNotNull(projection)) {
    return ol.proj.get(defaultCode);
  } else if (goog.isString(projection)) {
    return ol.proj.get(projection);
  } else {
    goog.asserts.assertInstanceof(projection, ol.proj.Projection);
    return projection;
  }
};


/**
 * Registers a conversion function to convert coordinates from the source
 * projection to the destination projection.
 *
 * @param {ol.proj.Projection} source Source.
 * @param {ol.proj.Projection} destination Destination.
 * @param {ol.TransformFunction} transformFn Transform.
 */
ol.proj.addTransform = function(source, destination, transformFn) {
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  var transforms = ol.proj.transforms_;
  if (!goog.object.containsKey(transforms, sourceCode)) {
    transforms[sourceCode] = {};
  }
  transforms[sourceCode][destinationCode] = transformFn;
};


/**
 * Registers coordinate transform functions to convert coordinates between the
 * source projection and the destination projection.
 *
 * @param {ol.proj.ProjectionLike} source Source projection.
 * @param {ol.proj.ProjectionLike} destination Destination projection.
 * @param {olx.CoordinateTransforms} transforms Forward and inverse transform
 *     functions.
 * @api
 */
ol.proj.addCoordinateTransforms = function(source, destination, transforms) {
  var sourceProj = ol.proj.get(source);
  var destProj = ol.proj.get(destination);
  var forward, inverse;
  if (sourceProj === destProj) {
    forward = ol.proj.cloneTransform;
    inverse = ol.proj.cloneTransform;
  } else {
    forward =
        ol.proj.createTransformFromCoordinateTransform(transforms.forward);
    inverse =
        ol.proj.createTransformFromCoordinateTransform(transforms.inverse);
  }
  ol.proj.addTransform(sourceProj, destProj, forward);
  ol.proj.addTransform(destProj, sourceProj, inverse);
};


/**
 * Creates a {@link ol.TransformFunction} from a simple 2D coordinate transform
 * function.
 * @param {function(ol.Coordinate): ol.Coordinate} transform Coordinate
 *     transform.
 * @return {ol.TransformFunction} Transform function.
 */
ol.proj.createTransformFromCoordinateTransform = function(transform) {
  return /** @type {ol.TransformFunction} */ (
      function(input, opt_output, opt_dimension) {
        var length = input.length;
        var dimension = goog.isDef(opt_dimension) ? opt_dimension : 2;
        var output = goog.isDef(opt_output) ? opt_output : new Array(length);
        var point, i, j;
        for (i = 0; i < length; i += dimension) {
          point = transform([input[i], input[i + 1]]);
          output[i] = point[0];
          output[i + 1] = point[1];
          for (j = dimension - 1; j >= 2; --j) {
            output[i + j] = input[i + j];
          }
        }
        return output;
      }
  );
};


/**
 * Unregisters the conversion function to convert coordinates from the source
 * projection to the destination projection.  This method is used to clean up
 * cached transforms during testing.
 *
 * @param {ol.proj.Projection} source Source projection.
 * @param {ol.proj.Projection} destination Destination projection.
 * @return {ol.TransformFunction} transformFn The unregistered transform.
 */
ol.proj.removeTransform = function(source, destination) {
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  var transforms = ol.proj.transforms_;
  goog.asserts.assert(sourceCode in transforms);
  goog.asserts.assert(destinationCode in transforms[sourceCode]);
  var transform = transforms[sourceCode][destinationCode];
  delete transforms[sourceCode][destinationCode];
  var keys = goog.object.getKeys(transforms[sourceCode]);
  if (keys.length === 0) {
    delete transforms[sourceCode];
  }
  return transform;
};


/**
 * Fetches a Projection object for the code specified.
 *
 * @param {ol.proj.ProjectionLike} projectionLike Either a code string which is
 *     a combination of authority and identifier such as "EPSG:4326", or an
 *     existing projection object, or undefined.
 * @return {ol.proj.Projection} Projection object, or null if not in list.
 * @api
 */
ol.proj.get = function(projectionLike) {
  var projection;
  if (projectionLike instanceof ol.proj.Projection) {
    projection = projectionLike;
  } else if (goog.isString(projectionLike)) {
    var code = projectionLike;
    var projections = ol.proj.projections_;
    projection = projections[code];
    if (ol.HAVE_PROJ4JS && !goog.isDef(projection)) {
      var def = proj4.defs[code];
      if (goog.isDef(def)) {
        var units = def.units;
        if (!goog.isDef(units)) {
          if (goog.isDef(def.to_meter)) {
            units = def.to_meter.toString();
            ol.proj.METERS_PER_UNIT[units] = def.to_meter;
          }
        }
        projection = new ol.proj.Projection({
          code: code,
          units: units,
          axisOrientation: def.axis
        });
        ol.proj.addProjection(projection);
        var currentCode, currentDef, currentProj;
        for (currentCode in projections) {
          currentDef = proj4.defs[currentCode];
          if (goog.isDef(currentDef)) {
            currentProj = ol.proj.get(currentCode);
            if (currentDef === def) {
              ol.proj.addEquivalentProjections([currentProj, projection]);
            } else {
              ol.proj.addCoordinateTransforms(currentProj, projection,
                  proj4(currentCode, code));
            }
          }
        }
      } else {
        goog.asserts.assert(goog.isDef(projection));
        projection = null;
      }
    }
  } else {
    projection = null;
  }
  return projection;
};


/**
 * Checks if two projections are the same, that is every coordinate in one
 * projection does represent the same geographic point as the same coordinate in
 * the other projection.
 *
 * @param {ol.proj.Projection} projection1 Projection 1.
 * @param {ol.proj.Projection} projection2 Projection 2.
 * @return {boolean} Equivalent.
 */
ol.proj.equivalent = function(projection1, projection2) {
  if (projection1 === projection2) {
    return true;
  } else if (projection1.getUnits() != projection2.getUnits()) {
    return false;
  } else {
    var transformFn = ol.proj.getTransformFromProjections(
        projection1, projection2);
    return transformFn === ol.proj.cloneTransform;
  }
};


/**
 * Given the projection-like objects, searches for a transformation
 * function to convert a coordinates array from the source projection to the
 * destination projection.
 *
 * @param {ol.proj.ProjectionLike} source Source.
 * @param {ol.proj.ProjectionLike} destination Destination.
 * @return {ol.TransformFunction} Transform function.
 * @api
 */
ol.proj.getTransform = function(source, destination) {
  var sourceProjection = ol.proj.get(source);
  var destinationProjection = ol.proj.get(destination);
  return ol.proj.getTransformFromProjections(
      sourceProjection, destinationProjection);
};


/**
 * Searches in the list of transform functions for the function for converting
 * coordinates from the source projection to the destination projection.
 *
 * @param {ol.proj.Projection} sourceProjection Source Projection object.
 * @param {ol.proj.Projection} destinationProjection Destination Projection
 *     object.
 * @return {ol.TransformFunction} Transform function.
 */
ol.proj.getTransformFromProjections =
    function(sourceProjection, destinationProjection) {
  var transforms = ol.proj.transforms_;
  var sourceCode = sourceProjection.getCode();
  var destinationCode = destinationProjection.getCode();
  var transform;
  if (goog.object.containsKey(transforms, sourceCode) &&
      goog.object.containsKey(transforms[sourceCode], destinationCode)) {
    transform = transforms[sourceCode][destinationCode];
  }
  if (!goog.isDef(transform)) {
    goog.asserts.assert(goog.isDef(transform));
    transform = ol.proj.identityTransform;
  }
  return transform;
};


/**
 * @param {Array.<number>} input Input coordinate array.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension.
 * @return {Array.<number>} Input coordinate array (same array as input).
 */
ol.proj.identityTransform = function(input, opt_output, opt_dimension) {
  if (goog.isDef(opt_output) && input !== opt_output) {
    // TODO: consider making this a warning instead
    goog.asserts.fail('This should not be used internally.');
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
ol.proj.cloneTransform = function(input, opt_output, opt_dimension) {
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
 * Transforms a coordinate from source projection to destination projection.
 * This returns a new coordinate (and does not modify the original).
 *
 * See {@link ol.proj.transformExtent} for extent transformation.
 * See the transform method of {@link ol.geom.Geometry} and its subclasses for
 * geometry transforms.
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {ol.proj.ProjectionLike} source Source projection-like.
 * @param {ol.proj.ProjectionLike} destination Destination projection-like.
 * @return {ol.Coordinate} Coordinate.
 * @api
 */
ol.proj.transform = function(coordinate, source, destination) {
  var transformFn = ol.proj.getTransform(source, destination);
  return transformFn(coordinate);
};


/**
 * Transforms an extent from source projection to destination projection.  This
 * returns a new extent (and does not modify the original).
 *
 * @param {ol.Extent} extent The extent to transform.
 * @param {ol.proj.ProjectionLike} source Source projection-like.
 * @param {ol.proj.ProjectionLike} destination Destination projection-like.
 * @return {ol.Extent} The transformed extent.
 * @api
 */
ol.proj.transformExtent = function(extent, source, destination) {
  var transformFn = ol.proj.getTransform(source, destination);
  return ol.extent.applyTransform(extent, transformFn);
};


/**
 * Transforms the given point to the destination projection.
 *
 * @param {ol.Coordinate} point Point.
 * @param {ol.proj.Projection} sourceProjection Source projection.
 * @param {ol.proj.Projection} destinationProjection Destination projection.
 * @return {ol.Coordinate} Point.
 */
ol.proj.transformWithProjections =
    function(point, sourceProjection, destinationProjection) {
  var transformFn = ol.proj.getTransformFromProjections(
      sourceProjection, destinationProjection);
  return transformFn(point);
};
