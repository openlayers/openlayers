/**
 * @module ol/proj/proj4
 */
import {
  addCoordinateTransforms,
  addEquivalentProjections,
  addProjection,
  createSafeCoordinateTransform,
} from '../proj.js';
import Projection from './Projection.js';
import {get as getCachedProjection} from './projections.js';
import {get as getTransform} from './transforms.js';

/**
 * @type {import("proj4")|null}
 */
let registered = null;

/**
 * @return {boolean} Proj4 has been registered.
 */
export function isRegistered() {
  return !!registered;
}

/**
 * Unsets the shared proj4 previously set with register.
 */
export function unregister() {
  registered = null;
}

/**
 * Make projections defined in proj4 (with `proj4.defs()`) available in
 * OpenLayers. Requires proj4 >= 2.8.0.
 *
 * This function should be called whenever changes are made to the proj4
 * registry, e.g. after calling `proj4.defs()`. Existing transforms will not be
 * modified by this function.
 *
 * @param {import("proj4")} proj4 Proj4.
 * @api
 */
export function register(proj4) {
  registered = proj4;

  const projCodes = Object.keys(proj4.defs);
  const len = projCodes.length;
  let i, j;
  for (i = 0; i < len; ++i) {
    const code = projCodes[i];
    if (!getCachedProjection(code)) {
      const def = proj4.defs(code);
      let units = /** @type {import("./Units.js").Units} */ (def.units);
      if (!units && def.projName === 'longlat') {
        units = 'degrees';
      }
      addProjection(
        new Projection({
          code: code,
          axisOrientation: def.axis,
          metersPerUnit: def.to_meter,
          units,
        }),
      );
    }
  }
  for (i = 0; i < len; ++i) {
    const code1 = projCodes[i];
    const proj1 = getCachedProjection(code1);
    for (j = 0; j < len; ++j) {
      const code2 = projCodes[j];
      const proj2 = getCachedProjection(code2);
      if (!getTransform(code1, code2)) {
        if (proj4.defs[code1] === proj4.defs[code2]) {
          addEquivalentProjections([proj1, proj2]);
        } else {
          const transform = proj4(code1, code2);
          addCoordinateTransforms(
            proj1,
            proj2,
            createSafeCoordinateTransform(proj1, proj2, transform.forward),
            createSafeCoordinateTransform(proj2, proj1, transform.inverse),
          );
        }
      }
    }
  }
}

/**
 * @param {string} code The projection code.
 * @return {Promise<string>} The WKT definition.
 */
let projLookup = async function (code) {
  if (typeof code !== 'string' || !code.includes(':')) {
    throw new Error('Invalid code');
  }
  const [authority, num] = code.toLowerCase().split(':', 2);
  const response = await fetch(
    `https://spatialreference.org/ref/${authority}/${num}/ogcwkt/`,
  );
  if (!response.ok) {
    throw new Error(
      `Unexpected response from spatialreference.org: ${response.status}`,
    );
  }
  return response.text();
};

/**
 * Set the lookup function for getting proj4 or WKT definitions given an
 * projection code. By default, the {@link module:ol/proj/proj4.fromProjectionCode}
 * function uses the spatialreference.org website for WKT definitions.
 * This can be changed by providing a different lookup function.
 *
 * @param {function(string):Promise<string>} func The lookup function.
 * @api
 */
export function setProjectionCodeLookup(func) {
  projLookup = func;
}

/**
 * Get the current projection code lookup function.
 *
 * @return {function(string):Promise<string>} The projection lookup function.
 */
export function getProjectionCodeLookup() {
  return projLookup;
}

/**
 * Get a projection from a projection code (i.e., authority:number).
 * This function fetches the projection definition from the
 * https://spatialreference.org website, registers this definition for use with
 * proj4, and returns a configured projection.  You must call import proj4 and
 * call {@link module:ol/proj/proj4.register} before using this function.
 *
 * If the projection definition is already registered with proj4, it will not
 * be fetched again (so it is ok to call this function multiple times with the
 * same code).
 *
 * @param {string} code The projection code (e.g., 'EPSG:4326' or 'OGC:CRS84').
 * @return {Promise<Projection>} The projection.
 * @api
 */
export async function fromProjectionCode(code) {
  const proj4 = registered;
  if (!proj4) {
    throw new Error('Proj4 must be registered first with register(proj4)');
  }

  if (proj4.defs(code)) {
    return getCachedProjection(code);
  }

  proj4.defs(code, await projLookup(code));
  register(proj4);

  return getCachedProjection(code);
}

/**
 * @param {number} code The EPSG code.
 * @return {Promise<string>} The proj4 or WKT definition.
 * @deprecated Use {@link module:ol/proj/proj4.projLookup} instead.
 */
let epsgLookup = async function (code) {
  return await projLookup('EPSG:' + code);
};

/**
 * Set the lookup function for getting proj4 or WKT definitions given an EPSG code.
 * By default, the {@link module:ol/proj/proj4.fromEPSGCode} function uses the
 * spatialreference.org website for WKT definitions.
 * This can be changed by providing a different lookup function.
 *
 * @param {function(number):Promise<string>} func The lookup function.
 * @api
 * @deprecated Use {@link module:ol/proj/proj4.setProjectionCodeLookup} instead.
 */
export function setEPSGLookup(func) {
  epsgLookup = func;
}

/**
 * Get the current EPSG lookup function.
 *
 * @return {function(number):Promise<string>} The EPSG lookup function.
 * @deprecated Use {@link module:ol/proj/proj4.getProjectionCodeLookup} instead.
 */
export function getEPSGLookup() {
  return epsgLookup;
}

/**
 * Get a projection from an EPSG code.  This function fetches the projection
 * definition from the spatialreference.org website, registers this definition
 * for use with proj4, and returns a configured projection.  You must call
 * import proj4 and call {@link module:ol/proj/proj4.register} before using this
 * function.
 *
 * If the projection definition is already registered with proj4, it will not
 * be fetched again (so it is ok to call this function multiple times with the
 * same code).
 *
 * @param {number|string} code The EPSG code (e.g. 4326 or 'EPSG:4326').
 * @return {Promise<Projection>} The projection.
 * @api
 * @deprecated Use {@link module:ol/proj/proj4.fromProjectionCode} instead.
 */
export async function fromEPSGCode(code) {
  if (typeof code === 'number') {
    code = 'EPSG:' + code;
  }
  return await fromProjectionCode(code);
}

/**
 * Generate an EPSG lookup function which uses the MapTiler Coordinates API to find projection
 * definitions which do not require proj4 to be configured to handle `+nadgrids` parameters.
 * Call {@link module:ol/proj/proj4.setEPSGLookup} use the function for lookups
 * `setEPSGLookup(epsgLookupMapTiler('{YOUR_MAPTILER_API_KEY_HERE}'))`.
 *
 * @param {string} key MapTiler API key.  Get your own API key at https://www.maptiler.com/cloud/.
 * @return {function(number):Promise<string>} The EPSG lookup function.
 * @api
 * @deprecated Not needed any more, the default lookup provides this functionality now.
 */
export function epsgLookupMapTiler(key) {
  return async function (code) {
    const response = await fetch(
      `https://api.maptiler.com/coordinates/search/code:${code}.json?transformations=true&exports=true&key=${key}`,
    );
    if (!response.ok) {
      throw new Error(
        `Unexpected response from maptiler.com: ${response.status}`,
      );
    }
    return response.json().then((json) => {
      const results = json['results'];
      if (results?.length > 0) {
        const result = results.filter(
          (r) =>
            r['id']?.['authority'] === 'EPSG' && r['id']?.['code'] === code,
        )[0];
        if (result) {
          const transforms = result['transformations'];
          if (transforms?.length > 0) {
            // use default transform if it does not require grids
            const defaultTransform = result['default_transformation'];
            if (
              transforms.filter(
                (t) =>
                  t['id']?.['authority'] === defaultTransform?.['authority'] &&
                  t['id']?.['code'] === defaultTransform?.['code'] &&
                  t['grids']?.length === 0,
              ).length > 0
            ) {
              return result['exports']?.['proj4'];
            }
            // otherwise use most accurate alternative without grids
            const transform = transforms
              .filter(
                (t) =>
                  t['grids']?.length === 0 &&
                  t['target_crs']?.['authority'] === 'EPSG' &&
                  t['target_crs']?.['code'] === 4326 &&
                  t['deprecated'] === false &&
                  t['usable'] === true,
              )
              .sort((t1, t2) => t1['accuracy'] - t2['accuracy'])[0]?.[
              'exports'
            ]?.['proj4'];
            if (transform) {
              return transform;
            }
          }
          // fallback to default
          return result['exports']?.['proj4'];
        }
      }
    });
  };
}
