/**
 * @module ol/proj/proj4
 */
import Projection from './Projection.js';
import Units from './Units.js';
import {
  addCoordinateTransforms,
  addEquivalentProjections,
  addProjection,
  createSafeCoordinateTransform,
  get,
} from '../proj.js';
import {get as getTransform} from './transforms.js';

/**
 * Make projections defined in proj4 (with `proj4.defs()`) available in
 * OpenLayers.
 *
 * This function should be called whenever changes are made to the proj4
 * registry, e.g. after calling `proj4.defs()`. Existing transforms will not be
 * modified by this function.
 *
 * @param {?} proj4 Proj4.
 * @api
 */
export function register(proj4) {
  const projCodes = Object.keys(proj4.defs);
  const len = projCodes.length;
  let i, j;
  for (i = 0; i < len; ++i) {
    const code = projCodes[i];
    if (!get(code)) {
      const def = proj4.defs(code);
      let units = def.units;
      if (!units && def.projName === 'longlat') {
        units = Units.DEGREES;
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
