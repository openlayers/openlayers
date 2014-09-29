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
 * A projection as {@link ol.proj.Projection}, SRS identifier string or
 * undefined.
 * @typedef {ol.proj.Projection|string|undefined} ol.proj.ProjectionLike
 * @api stable
 */
ol.proj.ProjectionLike;


/**
 * Projection units: `'degrees'`, `'ft'`, `'m'` or `'pixels'`.
 * @enum {string}
 * @api stable
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
 * @api stable
 */
ol.proj.METERS_PER_UNIT = {};
ol.proj.METERS_PER_UNIT[ol.proj.Units.DEGREES] =
    2 * Math.PI * ol.sphere.NORMAL.radius / 360;
ol.proj.METERS_PER_UNIT[ol.proj.Units.FEET] = 0.3048;
ol.proj.METERS_PER_UNIT[ol.proj.Units.METERS] = 1;



/**
 * @classdesc
 * Projection definition class. One of these is created for each projection
 * supported in the application and stored in the {@link ol.proj} namespace.
 * You can use these in applications, but this is not required, as API params
 * and options use {@link ol.proj.ProjectionLike} which means the simple string
 * code will suffice.
 *
 * You can use {@link ol.proj.get} to retrieve the object for a particular
 * projection.
 *
 * The library includes definitions for `EPSG:4326` and `EPSG:3857`, together
 * with the following aliases:
 * * `EPSG:4326`: CRS:84, urn:ogc:def:crs:EPSG:6.6:4326,
 *     urn:ogc:def:crs:OGC:1.3:CRS84, urn:ogc:def:crs:OGC:2:84,
 *     http://www.opengis.net/gml/srs/epsg.xml#4326,
 *     urn:x-ogc:def:crs:EPSG:4326
 * * `EPSG:3857`: EPSG:102100, EPSG:102113, EPSG:900913,
 *     urn:ogc:def:crs:EPSG:6.18:3:3857,
 *     http://www.opengis.net/gml/srs/epsg.xml#3857
 *
 * If you use proj4js, aliases can be added using `proj4.defs()`; see
 * [documentation](https://github.com/proj4js/proj4js).
 *
 * @constructor
 * @param {olx.ProjectionOptions} options Projection options.
 * @struct
 * @api stable
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
   * @type {ol.Extent}
   */
  this.worldExtent_ = goog.isDef(options.worldExtent) ?
      options.worldExtent : null;

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
 * @api stable
 */
ol.proj.Projection.prototype.getCode = function() {
  return this.code_;
};


/**
 * Get the validity extent for this projection.
 * @return {ol.Extent} Extent.
 * @api stable
 */
ol.proj.Projection.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * Get the units of this projection.
 * @return {ol.proj.Units} Units.
 * @api stable
 */
ol.proj.Projection.prototype.getUnits = function() {
  return this.units_;
};


/**
 * Get the amount of meters per unit of this projection.  If the projection is
 * not configured with a units identifier, the return is `undefined`.
 * @return {number|undefined} Meters.
 * @api stable
 */
ol.proj.Projection.prototype.getMetersPerUnit = function() {
  return ol.proj.METERS_PER_UNIT[this.units_];
};


/**
 * Get the world extent for this projection.
 * @return {ol.Extent} Extent.
 * @api
 */
ol.proj.Projection.prototype.getWorldExtent = function() {
  return this.worldExtent_;
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
 * @api stable
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
 * @api stable
 */
ol.proj.Projection.prototype.setExtent = function(extent) {
  this.extent_ = extent;
};


/**
 * Set the world extent for this projection.
 * @param {ol.Extent} worldExtent World extent
 *     [minlon, minlat, maxlon, maxlat].
 * @api
 */
ol.proj.Projection.prototype.setWorldExtent = function(worldExtent) {
  this.worldExtent_ = worldExtent;
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
 * @param {Array.<ol.proj.Projection>} projections Projections.
 * @api
 */
ol.proj.addEquivalentProjections = function(projections) {
  ol.proj.addProjections(projections);
  goog.array.forEach(projections, function(source) {
    goog.array.forEach(projections, function(destination) {
      if (source !== destination) {
        ol.proj.addTransform(source, destination, ol.proj.cloneTransform);
      }
    });
  });
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
 * @param {ol.proj.Projection} projection Projection instance.
 * @api stable
 */
ol.proj.addProjection = function(projection) {
  ol.proj.projections_[projection.getCode()] = projection;
  ol.proj.addTransform(projection, projection, ol.proj.cloneTransform);
};


/**
 * @param {Array.<ol.proj.Projection>} projections Projections.
 */
ol.proj.addProjections = function(projections) {
  var addedProjections = [];
  goog.array.forEach(projections, function(projection) {
    addedProjections.push(ol.proj.addProjection(projection));
  });
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
 * The forward and inverse functions convert coordinate pairs; this function
 * converts these into the functions used internally which also handle
 * extents and coordinate arrays.
 *
 * @param {ol.proj.ProjectionLike} source Source projection.
 * @param {ol.proj.ProjectionLike} destination Destination projection.
 * @param {function(ol.Coordinate): ol.Coordinate} forward The forward transform
 *     function (that is, from the source projection to the destination
 *     projection) that takes a {@link ol.Coordinate} as argument and returns
 *     the transformed {@link ol.Coordinate}.
 * @param {function(ol.Coordinate): ol.Coordinate} inverse The inverse transform
 *     function (that is, from the destination projection to the source
 *     projection) that takes a {@link ol.Coordinate} as argument and returns
 *     the transformed {@link ol.Coordinate}.
 * @api stable
 */
ol.proj.addCoordinateTransforms =
    function(source, destination, forward, inverse) {
  var sourceProj = ol.proj.get(source);
  var destProj = ol.proj.get(destination);
  ol.proj.addTransform(sourceProj, destProj,
      ol.proj.createTransformFromCoordinateTransform(forward));
  ol.proj.addTransform(destProj, sourceProj,
      ol.proj.createTransformFromCoordinateTransform(inverse));
};


/**
 * Creates a {@link ol.TransformFunction} from a simple 2D coordinate transform
 * function.
 * @param {function(ol.Coordinate): ol.Coordinate} transform Coordinate
 *     transform.
 * @return {ol.TransformFunction} Transform function.
 */
ol.proj.createTransformFromCoordinateTransform = function(transform) {
  return (
      /**
       * @param {Array.<number>} input Input.
       * @param {Array.<number>=} opt_output Output.
       * @param {number=} opt_dimension Dimension.
       * @return {Array.<number>} Output.
       */
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
      });
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
 * @api stable
 */
ol.proj.get = function(projectionLike) {
  var projection;
  if (projectionLike instanceof ol.proj.Projection) {
    projection = projectionLike;
  } else if (goog.isString(projectionLike)) {
    var code = projectionLike;
    var projections = ol.proj.projections_;
    projection = projections[code];
    if (ol.ENABLE_PROJ4JS && !goog.isDef(projection) &&
        typeof proj4 == 'function') {
      var def = proj4.defs(code);
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
        var currentCode, currentDef, currentProj, proj4Transform;
        for (currentCode in projections) {
          currentDef = proj4.defs(currentCode);
          if (goog.isDef(currentDef)) {
            currentProj = ol.proj.get(currentCode);
            if (currentDef === def) {
              ol.proj.addEquivalentProjections([currentProj, projection]);
            } else {
              proj4Transform = proj4(currentCode, code);
              ol.proj.addCoordinateTransforms(currentProj, projection,
                  proj4Transform.forward, proj4Transform.inverse);
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
 * @api stable
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
 * @api stable
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
 * @api stable
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
