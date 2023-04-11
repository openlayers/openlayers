/**
 * @module ol/proj/proj4
 */
import Projection from './Projection.js';
import {
  addCoordinateTransforms,
  addEquivalentProjections,
  addProjection,
  createSafeCoordinateTransform,
  get,
} from '../proj.js';
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
 * Unsets the shared proj4 previsouly set with register.
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
    if (!get(code)) {
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
        })
      );
    }
  }
  for (i = 0; i < len; ++i) {
    const code1 = projCodes[i];
    const proj1 = get(code1);
    for (j = 0; j < len; ++j) {
      const code2 = projCodes[j];
      const proj2 = get(code2);
      if (!getTransform(code1, code2)) {
        if (proj4.defs[code1] === proj4.defs[code2]) {
          addEquivalentProjections([proj1, proj2]);
        } else {
          const transform = proj4(code1, code2);
          addCoordinateTransforms(
            proj1,
            proj2,
            createSafeCoordinateTransform(proj1, proj2, transform.forward),
            createSafeCoordinateTransform(proj2, proj1, transform.inverse)
          );
        }
      }
    }
  }
}

/**
 * @param {number} code The EPSG code.
 * @return {Promise<string>} The proj4 definition.
 */
let epsgLookup = async function (code) {
  const response = await fetch(`https://epsg.io/${code}.proj4`);
  if (!response.ok) {
    throw new Error(`Unexpected response from epsg.io: ${response.status}`);
  }
  return response.text();
};

/**
 * Set the lookup function for getting proj4 definitions given an EPSG code.
 * By default, the {@link module:ol/proj/proj4.fromEPSGCode} function uses the
 * epsg.io website for proj4 definitions.  This can be changed by providing a
 * different lookup function.
 *
 * @param {function(number):Promise<string>} func The lookup function.
 * @api
 */
export function setEPSGLookup(func) {
  epsgLookup = func;
}

/**
 * Get the current EPSG lookup function.
 *
 * @return {function(number):Promise<string>} The EPSG lookup function.
 */
export function getEPSGLookup() {
  return epsgLookup;
}

/**
 * Get a projection from an EPSG code.  This function fetches the projection
 * definition from the epsg.io website, registers this definition for use with
 * proj4, and returns a configured projection.  You must call import proj4 and
 * call {@link module:ol/proj/proj4.register} before using this function.
 *
 * If the projection definition is already registered with proj4, it will not
 * be fetched again (so it is ok to call this function multiple times with the
 * same code).
 *
 * @param {number|string} code The EPSG code (e.g. 4326 or 'EPSG:4326').
 * @return {Promise<Projection>} The projection.
 * @api
 */
export async function fromEPSGCode(code) {
  if (typeof code === 'string') {
    code = parseInt(code.split(':').pop(), 10);
  }

  const proj4 = registered;
  if (!proj4) {
    throw new Error('Proj4 must be registered first with register(proj4)');
  }

  const epsgCode = 'EPSG:' + code;
  if (proj4.defs(epsgCode)) {
    return get(epsgCode);
  }

  proj4.defs(epsgCode, await epsgLookup(code));
  register(proj4);

  return get(epsgCode);
}
