/**
 * @module ol/proj
 */

/**
 * The ol/proj module stores:
 * * a list of {@link module:ol/proj/Projection}
 * objects, one for each projection supported by the application
 * * a list of transform functions needed to convert coordinates in one projection
 * into another.
 *
 * The static functions are the methods used to maintain these.
 * Each transform function can handle not only simple coordinate pairs, but also
 * large arrays of coordinates such as vector geometries.
 *
 * When loaded, the library adds projection objects for EPSG:4326 (WGS84
 * geographic coordinates) and EPSG:3857 (Web or Spherical Mercator, as used
 * for example by Bing Maps or OpenStreetMap), together with the relevant
 * transform functions.
 *
 * Additional transforms may be added by using the {@link http://proj4js.org/}
 * library (version 2.2 or later). You can use the full build supplied by
 * Proj4js, or create a custom build to support those projections you need; see
 * the Proj4js website for how to do this. You also need the Proj4js definitions
 * for the required projections. These definitions can be obtained from
 * {@link https://epsg.io/}, and are a JS function, so can be loaded in a script
 * tag (as in the examples) or pasted into your application.
 *
 * After all required projection definitions are added to proj4's registry (by
 * using `proj4.defs()`), simply call `register(proj4)` from the `ol/proj/proj4`
 * package. Existing transforms are not changed by this function. See
 * examples/wms-image-custom-proj for an example of this.
 *
 * Additional projection definitions can be registered with `proj4.defs()` any
 * time. Just make sure to call `register(proj4)` again; for example, with user-supplied data where you don't
 * know in advance what projections are needed, you can initially load minimal
 * support and then load whichever are requested.
 *
 * Note that Proj4js does not support projection extents. If you want to add
 * one for creating default tile grids, you can add it after the Projection
 * object has been created with `setExtent`, for example,
 * `get('EPSG:1234').setExtent(extent)`.
 *
 * In addition to Proj4js support, any transform functions can be added with
 * {@link module:ol/proj~addCoordinateTransforms}. To use this, you must first create
 * a {@link module:ol/proj/Projection} object for the new projection and add it with
 * {@link module:ol/proj~addProjection}. You can then add the forward and inverse
 * functions with {@link module:ol/proj~addCoordinateTransforms}. See
 * examples/wms-custom-proj for an example of this.
 *
 * Note that if no transforms are needed and you only need to define the
 * projection, just add a {@link module:ol/proj/Projection} with
 * {@link module:ol/proj~addProjection}. See examples/wms-no-proj for an example of
 * this.
 */
import {getDistance} from './sphere.js';
import {applyTransform} from './extent.js';
import {modulo} from './math.js';
import {toEPSG4326, fromEPSG4326, PROJECTIONS as EPSG3857_PROJECTIONS} from './proj/epsg3857.js';
import {PROJECTIONS as EPSG4326_PROJECTIONS} from './proj/epsg4326.js';
import Projection from './proj/Projection.js';
import Units, {METERS_PER_UNIT} from './proj/Units.js';
import * as projections from './proj/projections.js';
import {add as addTransformFunc, clear as clearTransformFuncs, get as getTransformFunc} from './proj/transforms.js';


/**
 * A projection as {@link module:ol/proj/Projection}, SRS identifier
 * string or undefined.
 * @typedef {module:ol/proj/Projection|string|undefined} ProjectionLike
 * @api
 */


/**
 * A transform function accepts an array of input coordinate values, an optional
 * output array, and an optional dimension (default should be 2).  The function
 * transforms the input coordinate values, populates the output array, and
 * returns the output array.
 *
 * @typedef {function(Array.<number>, Array.<number>=, number=): Array.<number>} TransformFunction
 * @api
 */


export {METERS_PER_UNIT};


/**
 * @param {Array.<number>} input Input coordinate array.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension.
 * @return {Array.<number>} Output coordinate array (new array, same coordinate
 *     values).
 */
export function cloneTransform(input, opt_output, opt_dimension) {
  let output;
  if (opt_output !== undefined) {
    for (let i = 0, ii = input.length; i < ii; ++i) {
      opt_output[i] = input[i];
    }
    output = opt_output;
  } else {
    output = input.slice();
  }
  return output;
}


/**
 * @param {Array.<number>} input Input coordinate array.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension.
 * @return {Array.<number>} Input coordinate array (same array as input).
 */
export function identityTransform(input, opt_output, opt_dimension) {
  if (opt_output !== undefined && input !== opt_output) {
    for (let i = 0, ii = input.length; i < ii; ++i) {
      opt_output[i] = input[i];
    }
    input = opt_output;
  }
  return input;
}


/**
 * Add a Projection object to the list of supported projections that can be
 * looked up by their code.
 *
 * @param {module:ol/proj/Projection} projection Projection instance.
 * @api
 */
export function addProjection(projection) {
  projections.add(projection.getCode(), projection);
  addTransformFunc(projection, projection, cloneTransform);
}


/**
 * @param {Array.<module:ol/proj/Projection>} projections Projections.
 */
export function addProjections(projections) {
  projections.forEach(addProjection);
}


/**
 * Fetches a Projection object for the code specified.
 *
 * @param {module:ol/proj~ProjectionLike} projectionLike Either a code string which is
 *     a combination of authority and identifier such as "EPSG:4326", or an
 *     existing projection object, or undefined.
 * @return {module:ol/proj/Projection} Projection object, or null if not in list.
 * @api
 */
export function get(projectionLike) {
  let projection = null;
  if (projectionLike instanceof Projection) {
    projection = projectionLike;
  } else if (typeof projectionLike === 'string') {
    const code = projectionLike;
    projection = projections.get(code);
  }
  return projection;
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
 * {@link module:ol/proj/Projection~Projection} constructor or by using
 * {@link module:ol/proj/Projection~Projection#setGetPointResolution} to change an existing
 * projection object.
 * @param {module:ol/proj~ProjectionLike} projection The projection.
 * @param {number} resolution Nominal resolution in projection units.
 * @param {module:ol/coordinate~Coordinate} point Point to find adjusted resolution at.
 * @param {module:ol/proj/Units=} opt_units Units to get the point resolution in.
 * Default is the projection's units.
 * @return {number} Point resolution.
 * @api
 */
export function getPointResolution(projection, resolution, point, opt_units) {
  projection = get(projection);
  let pointResolution;
  const getter = projection.getPointResolutionFunc();
  if (getter) {
    pointResolution = getter(resolution, point);
  } else {
    const units = projection.getUnits();
    if (units == Units.DEGREES && !opt_units || opt_units == Units.DEGREES) {
      pointResolution = resolution;
    } else {
      // Estimate point resolution by transforming the center pixel to EPSG:4326,
      // measuring its width and height on the normal sphere, and taking the
      // average of the width and height.
      const toEPSG4326 = getTransformFromProjections(projection, get('EPSG:4326'));
      let vertices = [
        point[0] - resolution / 2, point[1],
        point[0] + resolution / 2, point[1],
        point[0], point[1] - resolution / 2,
        point[0], point[1] + resolution / 2
      ];
      vertices = toEPSG4326(vertices, vertices, 2);
      const width = getDistance(vertices.slice(0, 2), vertices.slice(2, 4));
      const height = getDistance(vertices.slice(4, 6), vertices.slice(6, 8));
      pointResolution = (width + height) / 2;
      const metersPerUnit = opt_units ?
        METERS_PER_UNIT[opt_units] :
        projection.getMetersPerUnit();
      if (metersPerUnit !== undefined) {
        pointResolution /= metersPerUnit;
      }
    }
  }
  return pointResolution;
}


/**
 * Registers transformation functions that don't alter coordinates. Those allow
 * to transform between projections with equal meaning.
 *
 * @param {Array.<module:ol/proj/Projection>} projections Projections.
 * @api
 */
export function addEquivalentProjections(projections) {
  addProjections(projections);
  projections.forEach(function(source) {
    projections.forEach(function(destination) {
      if (source !== destination) {
        addTransformFunc(source, destination, cloneTransform);
      }
    });
  });
}


/**
 * Registers transformation functions to convert coordinates in any projection
 * in projection1 to any projection in projection2.
 *
 * @param {Array.<module:ol/proj/Projection>} projections1 Projections with equal
 *     meaning.
 * @param {Array.<module:ol/proj/Projection>} projections2 Projections with equal
 *     meaning.
 * @param {module:ol/proj~TransformFunction} forwardTransform Transformation from any
 *   projection in projection1 to any projection in projection2.
 * @param {module:ol/proj~TransformFunction} inverseTransform Transform from any projection
 *   in projection2 to any projection in projection1..
 */
export function addEquivalentTransforms(projections1, projections2, forwardTransform, inverseTransform) {
  projections1.forEach(function(projection1) {
    projections2.forEach(function(projection2) {
      addTransformFunc(projection1, projection2, forwardTransform);
      addTransformFunc(projection2, projection1, inverseTransform);
    });
  });
}


/**
 * Clear all cached projections and transforms.
 */
export function clearAllProjections() {
  projections.clear();
  clearTransformFuncs();
}


/**
 * @param {module:ol/proj/Projection|string|undefined} projection Projection.
 * @param {string} defaultCode Default code.
 * @return {module:ol/proj/Projection} Projection.
 */
export function createProjection(projection, defaultCode) {
  if (!projection) {
    return get(defaultCode);
  } else if (typeof projection === 'string') {
    return get(projection);
  } else {
    return (
      /** @type {module:ol/proj/Projection} */ (projection)
    );
  }
}


/**
 * Creates a {@link module:ol/proj~TransformFunction} from a simple 2D coordinate transform
 * function.
 * @param {function(module:ol/coordinate~Coordinate): module:ol/coordinate~Coordinate} coordTransform Coordinate
 *     transform.
 * @return {module:ol/proj~TransformFunction} Transform function.
 */
export function createTransformFromCoordinateTransform(coordTransform) {
  return (
    /**
     * @param {Array.<number>} input Input.
     * @param {Array.<number>=} opt_output Output.
     * @param {number=} opt_dimension Dimension.
     * @return {Array.<number>} Output.
     */
    function(input, opt_output, opt_dimension) {
      const length = input.length;
      const dimension = opt_dimension !== undefined ? opt_dimension : 2;
      const output = opt_output !== undefined ? opt_output : new Array(length);
      for (let i = 0; i < length; i += dimension) {
        const point = coordTransform([input[i], input[i + 1]]);
        output[i] = point[0];
        output[i + 1] = point[1];
        for (let j = dimension - 1; j >= 2; --j) {
          output[i + j] = input[i + j];
        }
      }
      return output;
    });
}


/**
 * Registers coordinate transform functions to convert coordinates between the
 * source projection and the destination projection.
 * The forward and inverse functions convert coordinate pairs; this function
 * converts these into the functions used internally which also handle
 * extents and coordinate arrays.
 *
 * @param {module:ol/proj~ProjectionLike} source Source projection.
 * @param {module:ol/proj~ProjectionLike} destination Destination projection.
 * @param {function(module:ol/coordinate~Coordinate): module:ol/coordinate~Coordinate} forward The forward transform
 *     function (that is, from the source projection to the destination
 *     projection) that takes a {@link module:ol/coordinate~Coordinate} as argument and returns
 *     the transformed {@link module:ol/coordinate~Coordinate}.
 * @param {function(module:ol/coordinate~Coordinate): module:ol/coordinate~Coordinate} inverse The inverse transform
 *     function (that is, from the destination projection to the source
 *     projection) that takes a {@link module:ol/coordinate~Coordinate} as argument and returns
 *     the transformed {@link module:ol/coordinate~Coordinate}.
 * @api
 */
export function addCoordinateTransforms(source, destination, forward, inverse) {
  const sourceProj = get(source);
  const destProj = get(destination);
  addTransformFunc(sourceProj, destProj, createTransformFromCoordinateTransform(forward));
  addTransformFunc(destProj, sourceProj, createTransformFromCoordinateTransform(inverse));
}


/**
 * Transforms a coordinate from longitude/latitude to a different projection.
 * @param {module:ol/coordinate~Coordinate} coordinate Coordinate as longitude and latitude, i.e.
 *     an array with longitude as 1st and latitude as 2nd element.
 * @param {module:ol/proj~ProjectionLike=} opt_projection Target projection. The
 *     default is Web Mercator, i.e. 'EPSG:3857'.
 * @return {module:ol/coordinate~Coordinate} Coordinate projected to the target projection.
 * @api
 */
export function fromLonLat(coordinate, opt_projection) {
  return transform(coordinate, 'EPSG:4326',
    opt_projection !== undefined ? opt_projection : 'EPSG:3857');
}


/**
 * Transforms a coordinate to longitude/latitude.
 * @param {module:ol/coordinate~Coordinate} coordinate Projected coordinate.
 * @param {module:ol/proj~ProjectionLike=} opt_projection Projection of the coordinate.
 *     The default is Web Mercator, i.e. 'EPSG:3857'.
 * @return {module:ol/coordinate~Coordinate} Coordinate as longitude and latitude, i.e. an array
 *     with longitude as 1st and latitude as 2nd element.
 * @api
 */
export function toLonLat(coordinate, opt_projection) {
  const lonLat = transform(coordinate,
    opt_projection !== undefined ? opt_projection : 'EPSG:3857', 'EPSG:4326');
  const lon = lonLat[0];
  if (lon < -180 || lon > 180) {
    lonLat[0] = modulo(lon + 180, 360) - 180;
  }
  return lonLat;
}


/**
 * Checks if two projections are the same, that is every coordinate in one
 * projection does represent the same geographic point as the same coordinate in
 * the other projection.
 *
 * @param {module:ol/proj/Projection} projection1 Projection 1.
 * @param {module:ol/proj/Projection} projection2 Projection 2.
 * @return {boolean} Equivalent.
 * @api
 */
export function equivalent(projection1, projection2) {
  if (projection1 === projection2) {
    return true;
  }
  const equalUnits = projection1.getUnits() === projection2.getUnits();
  if (projection1.getCode() === projection2.getCode()) {
    return equalUnits;
  } else {
    const transformFunc = getTransformFromProjections(projection1, projection2);
    return transformFunc === cloneTransform && equalUnits;
  }
}


/**
 * Searches in the list of transform functions for the function for converting
 * coordinates from the source projection to the destination projection.
 *
 * @param {module:ol/proj/Projection} sourceProjection Source Projection object.
 * @param {module:ol/proj/Projection} destinationProjection Destination Projection
 *     object.
 * @return {module:ol/proj~TransformFunction} Transform function.
 */
export function getTransformFromProjections(sourceProjection, destinationProjection) {
  const sourceCode = sourceProjection.getCode();
  const destinationCode = destinationProjection.getCode();
  let transformFunc = getTransformFunc(sourceCode, destinationCode);
  if (!transformFunc) {
    transformFunc = identityTransform;
  }
  return transformFunc;
}


/**
 * Given the projection-like objects, searches for a transformation
 * function to convert a coordinates array from the source projection to the
 * destination projection.
 *
 * @param {module:ol/proj~ProjectionLike} source Source.
 * @param {module:ol/proj~ProjectionLike} destination Destination.
 * @return {module:ol/proj~TransformFunction} Transform function.
 * @api
 */
export function getTransform(source, destination) {
  const sourceProjection = get(source);
  const destinationProjection = get(destination);
  return getTransformFromProjections(sourceProjection, destinationProjection);
}


/**
 * Transforms a coordinate from source projection to destination projection.
 * This returns a new coordinate (and does not modify the original).
 *
 * See {@link module:ol/proj~transformExtent} for extent transformation.
 * See the transform method of {@link module:ol/geom/Geometry~Geometry} and its
 * subclasses for geometry transforms.
 *
 * @param {module:ol/coordinate~Coordinate} coordinate Coordinate.
 * @param {module:ol/proj~ProjectionLike} source Source projection-like.
 * @param {module:ol/proj~ProjectionLike} destination Destination projection-like.
 * @return {module:ol/coordinate~Coordinate} Coordinate.
 * @api
 */
export function transform(coordinate, source, destination) {
  const transformFunc = getTransform(source, destination);
  return transformFunc(coordinate, undefined, coordinate.length);
}


/**
 * Transforms an extent from source projection to destination projection.  This
 * returns a new extent (and does not modify the original).
 *
 * @param {module:ol/extent~Extent} extent The extent to transform.
 * @param {module:ol/proj~ProjectionLike} source Source projection-like.
 * @param {module:ol/proj~ProjectionLike} destination Destination projection-like.
 * @return {module:ol/extent~Extent} The transformed extent.
 * @api
 */
export function transformExtent(extent, source, destination) {
  const transformFunc = getTransform(source, destination);
  return applyTransform(extent, transformFunc);
}


/**
 * Transforms the given point to the destination projection.
 *
 * @param {module:ol/coordinate~Coordinate} point Point.
 * @param {module:ol/proj/Projection} sourceProjection Source projection.
 * @param {module:ol/proj/Projection} destinationProjection Destination projection.
 * @return {module:ol/coordinate~Coordinate} Point.
 */
export function transformWithProjections(point, sourceProjection, destinationProjection) {
  const transformFunc = getTransformFromProjections(sourceProjection, destinationProjection);
  return transformFunc(point);
}

/**
 * Add transforms to and from EPSG:4326 and EPSG:3857.  This function is called
 * by when this module is executed and should only need to be called again after
 * `clearAllProjections()` is called (e.g. in tests).
 */
export function addCommon() {
  // Add transformations that don't alter coordinates to convert within set of
  // projections with equal meaning.
  addEquivalentProjections(EPSG3857_PROJECTIONS);
  addEquivalentProjections(EPSG4326_PROJECTIONS);
  // Add transformations to convert EPSG:4326 like coordinates to EPSG:3857 like
  // coordinates and back.
  addEquivalentTransforms(EPSG4326_PROJECTIONS, EPSG3857_PROJECTIONS, fromEPSG4326, toEPSG4326);
}

addCommon();
