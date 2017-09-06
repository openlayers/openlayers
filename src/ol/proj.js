import _ol_ from './index';
import _ol_Sphere_ from './sphere';
import _ol_extent_ from './extent';
import _ol_proj_EPSG3857_ from './proj/epsg3857';
import _ol_proj_EPSG4326_ from './proj/epsg4326';
import _ol_proj_Projection_ from './proj/projection';
import _ol_proj_Units_ from './proj/units';
import _ol_proj_proj4_ from './proj/proj4';
import _ol_proj_projections_ from './proj/projections';
import _ol_proj_transforms_ from './proj/transforms';
var _ol_proj_ = {};


/**
 * Meters per unit lookup table.
 * @const
 * @type {Object.<ol.proj.Units, number>}
 * @api
 */
_ol_proj_.METERS_PER_UNIT = _ol_proj_Units_.METERS_PER_UNIT;


/**
 * A place to store the mean radius of the Earth.
 * @private
 * @type {ol.Sphere}
 */
_ol_proj_.SPHERE_ = new _ol_Sphere_(_ol_Sphere_.DEFAULT_RADIUS);


if (_ol_.ENABLE_PROJ4JS) {
  /**
   * Register proj4. If not explicitly registered, it will be assumed that
   * proj4js will be loaded in the global namespace. For example in a
   * browserify ES6 environment you could use:
   *
   *     import ol from 'openlayers';
   *     import proj4 from 'proj4';
   *     ol.proj.setProj4(proj4);
   *
   * @param {Proj4} proj4 Proj4.
   * @api
   */
  _ol_proj_.setProj4 = function(proj4) {
    _ol_proj_proj4_.set(proj4);
  };
}


/**
 * Get the resolution of the point in degrees or distance units.
 * For projections with degrees as the unit this will simply return the
 * provided resolution. For other projections the point resolution is
 * by default estimated by transforming the 'point' pixel to EPSG:4326,
 * measuring its width and height on the normal sphere,
 * and taking the average of the width and height.
 * A custom function can be provided for a specific projection, either
 * by setting the `getPointResolution` option in the
 * {@link ol.proj.Projection} constructor or by using
 * {@link ol.proj.Projection#setGetPointResolution} to change an existing
 * projection object.
 * @param {ol.ProjectionLike} projection The projection.
 * @param {number} resolution Nominal resolution in projection units.
 * @param {ol.Coordinate} point Point to find adjusted resolution at.
 * @param {ol.proj.Units=} opt_units Units to get the point resolution in.
 * Default is the projection's units.
 * @return {number} Point resolution.
 * @api
 */
_ol_proj_.getPointResolution = function(projection, resolution, point, opt_units) {
  projection = _ol_proj_.get(projection);
  var pointResolution;
  var getter = projection.getPointResolutionFunc();
  if (getter) {
    pointResolution = getter(resolution, point);
  } else {
    var units = projection.getUnits();
    if (units == _ol_proj_Units_.DEGREES && !opt_units || opt_units == _ol_proj_Units_.DEGREES) {
      pointResolution = resolution;
    } else {
      // Estimate point resolution by transforming the center pixel to EPSG:4326,
      // measuring its width and height on the normal sphere, and taking the
      // average of the width and height.
      var toEPSG4326 = _ol_proj_.getTransformFromProjections(projection, _ol_proj_.get('EPSG:4326'));
      var vertices = [
        point[0] - resolution / 2, point[1],
        point[0] + resolution / 2, point[1],
        point[0], point[1] - resolution / 2,
        point[0], point[1] + resolution / 2
      ];
      vertices = toEPSG4326(vertices, vertices, 2);
      var width = _ol_proj_.SPHERE_.haversineDistance(
          vertices.slice(0, 2), vertices.slice(2, 4));
      var height = _ol_proj_.SPHERE_.haversineDistance(
          vertices.slice(4, 6), vertices.slice(6, 8));
      pointResolution = (width + height) / 2;
      var metersPerUnit = opt_units ?
        _ol_proj_Units_.METERS_PER_UNIT[opt_units] :
        projection.getMetersPerUnit();
      if (metersPerUnit !== undefined) {
        pointResolution /= metersPerUnit;
      }
    }
  }
  return pointResolution;
};


/**
 * Registers transformation functions that don't alter coordinates. Those allow
 * to transform between projections with equal meaning.
 *
 * @param {Array.<ol.proj.Projection>} projections Projections.
 * @api
 */
_ol_proj_.addEquivalentProjections = function(projections) {
  _ol_proj_.addProjections(projections);
  projections.forEach(function(source) {
    projections.forEach(function(destination) {
      if (source !== destination) {
        _ol_proj_transforms_.add(source, destination, _ol_proj_.cloneTransform);
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
_ol_proj_.addEquivalentTransforms = function(projections1, projections2, forwardTransform, inverseTransform) {
  projections1.forEach(function(projection1) {
    projections2.forEach(function(projection2) {
      _ol_proj_transforms_.add(projection1, projection2, forwardTransform);
      _ol_proj_transforms_.add(projection2, projection1, inverseTransform);
    });
  });
};


/**
 * Add a Projection object to the list of supported projections that can be
 * looked up by their code.
 *
 * @param {ol.proj.Projection} projection Projection instance.
 * @api
 */
_ol_proj_.addProjection = function(projection) {
  _ol_proj_projections_.add(projection.getCode(), projection);
  _ol_proj_transforms_.add(projection, projection, _ol_proj_.cloneTransform);
};


/**
 * @param {Array.<ol.proj.Projection>} projections Projections.
 */
_ol_proj_.addProjections = function(projections) {
  projections.forEach(_ol_proj_.addProjection);
};


/**
 * Clear all cached projections and transforms.
 */
_ol_proj_.clearAllProjections = function() {
  _ol_proj_projections_.clear();
  _ol_proj_transforms_.clear();
};


/**
 * @param {ol.proj.Projection|string|undefined} projection Projection.
 * @param {string} defaultCode Default code.
 * @return {ol.proj.Projection} Projection.
 */
_ol_proj_.createProjection = function(projection, defaultCode) {
  if (!projection) {
    return _ol_proj_.get(defaultCode);
  } else if (typeof projection === 'string') {
    return _ol_proj_.get(projection);
  } else {
    return /** @type {ol.proj.Projection} */ (projection);
  }
};


/**
 * Registers coordinate transform functions to convert coordinates between the
 * source projection and the destination projection.
 * The forward and inverse functions convert coordinate pairs; this function
 * converts these into the functions used internally which also handle
 * extents and coordinate arrays.
 *
 * @param {ol.ProjectionLike} source Source projection.
 * @param {ol.ProjectionLike} destination Destination projection.
 * @param {function(ol.Coordinate): ol.Coordinate} forward The forward transform
 *     function (that is, from the source projection to the destination
 *     projection) that takes a {@link ol.Coordinate} as argument and returns
 *     the transformed {@link ol.Coordinate}.
 * @param {function(ol.Coordinate): ol.Coordinate} inverse The inverse transform
 *     function (that is, from the destination projection to the source
 *     projection) that takes a {@link ol.Coordinate} as argument and returns
 *     the transformed {@link ol.Coordinate}.
 * @api
 */
_ol_proj_.addCoordinateTransforms = function(source, destination, forward, inverse) {
  var sourceProj = _ol_proj_.get(source);
  var destProj = _ol_proj_.get(destination);
  _ol_proj_transforms_.add(sourceProj, destProj,
      _ol_proj_.createTransformFromCoordinateTransform(forward));
  _ol_proj_transforms_.add(destProj, sourceProj,
      _ol_proj_.createTransformFromCoordinateTransform(inverse));
};


/**
 * Creates a {@link ol.TransformFunction} from a simple 2D coordinate transform
 * function.
 * @param {function(ol.Coordinate): ol.Coordinate} transform Coordinate
 *     transform.
 * @return {ol.TransformFunction} Transform function.
 */
_ol_proj_.createTransformFromCoordinateTransform = function(transform) {
  return (
    /**
     * @param {Array.<number>} input Input.
     * @param {Array.<number>=} opt_output Output.
     * @param {number=} opt_dimension Dimension.
     * @return {Array.<number>} Output.
     */
    function(input, opt_output, opt_dimension) {
      var length = input.length;
      var dimension = opt_dimension !== undefined ? opt_dimension : 2;
      var output = opt_output !== undefined ? opt_output : new Array(length);
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
 * Transforms a coordinate from longitude/latitude to a different projection.
 * @param {ol.Coordinate} coordinate Coordinate as longitude and latitude, i.e.
 *     an array with longitude as 1st and latitude as 2nd element.
 * @param {ol.ProjectionLike=} opt_projection Target projection. The
 *     default is Web Mercator, i.e. 'EPSG:3857'.
 * @return {ol.Coordinate} Coordinate projected to the target projection.
 * @api
 */
_ol_proj_.fromLonLat = function(coordinate, opt_projection) {
  return _ol_proj_.transform(coordinate, 'EPSG:4326',
      opt_projection !== undefined ? opt_projection : 'EPSG:3857');
};


/**
 * Transforms a coordinate to longitude/latitude.
 * @param {ol.Coordinate} coordinate Projected coordinate.
 * @param {ol.ProjectionLike=} opt_projection Projection of the coordinate.
 *     The default is Web Mercator, i.e. 'EPSG:3857'.
 * @return {ol.Coordinate} Coordinate as longitude and latitude, i.e. an array
 *     with longitude as 1st and latitude as 2nd element.
 * @api
 */
_ol_proj_.toLonLat = function(coordinate, opt_projection) {
  return _ol_proj_.transform(coordinate,
      opt_projection !== undefined ? opt_projection : 'EPSG:3857', 'EPSG:4326');
};


/**
 * Fetches a Projection object for the code specified.
 *
 * @param {ol.ProjectionLike} projectionLike Either a code string which is
 *     a combination of authority and identifier such as "EPSG:4326", or an
 *     existing projection object, or undefined.
 * @return {ol.proj.Projection} Projection object, or null if not in list.
 * @api
 */
_ol_proj_.get = function(projectionLike) {
  var projection = null;
  if (projectionLike instanceof _ol_proj_Projection_) {
    projection = projectionLike;
  } else if (typeof projectionLike === 'string') {
    var code = projectionLike;
    projection = _ol_proj_projections_.get(code);
    if (_ol_.ENABLE_PROJ4JS && !projection) {
      var proj4js = _ol_proj_proj4_.get();
      if (typeof proj4js == 'function' &&
          proj4js.defs(code) !== undefined) {
        projection = new _ol_proj_Projection_({code: code});
        _ol_proj_.addProjection(projection);
      }
    }
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
 * @api
 */
_ol_proj_.equivalent = function(projection1, projection2) {
  if (projection1 === projection2) {
    return true;
  }
  var equalUnits = projection1.getUnits() === projection2.getUnits();
  if (projection1.getCode() === projection2.getCode()) {
    return equalUnits;
  } else {
    var transformFn = _ol_proj_.getTransformFromProjections(
        projection1, projection2);
    return transformFn === _ol_proj_.cloneTransform && equalUnits;
  }
};


/**
 * Given the projection-like objects, searches for a transformation
 * function to convert a coordinates array from the source projection to the
 * destination projection.
 *
 * @param {ol.ProjectionLike} source Source.
 * @param {ol.ProjectionLike} destination Destination.
 * @return {ol.TransformFunction} Transform function.
 * @api
 */
_ol_proj_.getTransform = function(source, destination) {
  var sourceProjection = _ol_proj_.get(source);
  var destinationProjection = _ol_proj_.get(destination);
  return _ol_proj_.getTransformFromProjections(
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
_ol_proj_.getTransformFromProjections = function(sourceProjection, destinationProjection) {
  var sourceCode = sourceProjection.getCode();
  var destinationCode = destinationProjection.getCode();
  var transform = _ol_proj_transforms_.get(sourceCode, destinationCode);
  if (_ol_.ENABLE_PROJ4JS && !transform) {
    var proj4js = _ol_proj_proj4_.get();
    if (typeof proj4js == 'function') {
      var sourceDef = proj4js.defs(sourceCode);
      var destinationDef = proj4js.defs(destinationCode);

      if (sourceDef !== undefined && destinationDef !== undefined) {
        if (sourceDef === destinationDef) {
          _ol_proj_.addEquivalentProjections([destinationProjection, sourceProjection]);
        } else {
          var proj4Transform = proj4js(destinationCode, sourceCode);
          _ol_proj_.addCoordinateTransforms(destinationProjection, sourceProjection,
              proj4Transform.forward, proj4Transform.inverse);
        }
        transform = _ol_proj_transforms_.get(sourceCode, destinationCode);
      }
    }
  }
  if (!transform) {
    transform = _ol_proj_.identityTransform;
  }
  return transform;
};


/**
 * @param {Array.<number>} input Input coordinate array.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension.
 * @return {Array.<number>} Input coordinate array (same array as input).
 */
_ol_proj_.identityTransform = function(input, opt_output, opt_dimension) {
  if (opt_output !== undefined && input !== opt_output) {
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
_ol_proj_.cloneTransform = function(input, opt_output, opt_dimension) {
  var output;
  if (opt_output !== undefined) {
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
 * @param {ol.ProjectionLike} source Source projection-like.
 * @param {ol.ProjectionLike} destination Destination projection-like.
 * @return {ol.Coordinate} Coordinate.
 * @api
 */
_ol_proj_.transform = function(coordinate, source, destination) {
  var transformFn = _ol_proj_.getTransform(source, destination);
  return transformFn(coordinate, undefined, coordinate.length);
};


/**
 * Transforms an extent from source projection to destination projection.  This
 * returns a new extent (and does not modify the original).
 *
 * @param {ol.Extent} extent The extent to transform.
 * @param {ol.ProjectionLike} source Source projection-like.
 * @param {ol.ProjectionLike} destination Destination projection-like.
 * @return {ol.Extent} The transformed extent.
 * @api
 */
_ol_proj_.transformExtent = function(extent, source, destination) {
  var transformFn = _ol_proj_.getTransform(source, destination);
  return _ol_extent_.applyTransform(extent, transformFn);
};


/**
 * Transforms the given point to the destination projection.
 *
 * @param {ol.Coordinate} point Point.
 * @param {ol.proj.Projection} sourceProjection Source projection.
 * @param {ol.proj.Projection} destinationProjection Destination projection.
 * @return {ol.Coordinate} Point.
 */
_ol_proj_.transformWithProjections = function(point, sourceProjection, destinationProjection) {
  var transformFn = _ol_proj_.getTransformFromProjections(
      sourceProjection, destinationProjection);
  return transformFn(point);
};

/**
 * Add transforms to and from EPSG:4326 and EPSG:3857.  This function is called
 * by when this module is executed and should only need to be called again after
 * `ol.proj.clearAllProjections()` is called (e.g. in tests).
 */
_ol_proj_.addCommon = function() {
  // Add transformations that don't alter coordinates to convert within set of
  // projections with equal meaning.
  _ol_proj_.addEquivalentProjections(_ol_proj_EPSG3857_.PROJECTIONS);
  _ol_proj_.addEquivalentProjections(_ol_proj_EPSG4326_.PROJECTIONS);
  // Add transformations to convert EPSG:4326 like coordinates to EPSG:3857 like
  // coordinates and back.
  _ol_proj_.addEquivalentTransforms(
      _ol_proj_EPSG4326_.PROJECTIONS,
      _ol_proj_EPSG3857_.PROJECTIONS,
      _ol_proj_EPSG3857_.fromEPSG4326,
      _ol_proj_EPSG3857_.toEPSG4326);
};

_ol_proj_.addCommon();
export default _ol_proj_;
