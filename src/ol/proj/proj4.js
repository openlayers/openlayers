/**
 * @module ol/proj/proj4
 */
import {addCoordinateTransforms, addProjection, addEquivalentProjections, get} from '../proj.js';
import {get as getTransform} from './transforms.js';
import Projection from './Projection.js';

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
  var projCodes = Object.keys(proj4.defs);
  var len = projCodes.length;
  var i, j;
  for (i = 0; i < len; ++i) {
    var code = projCodes[i];
    if (!get(code)) {
      var def = proj4.defs(code);
      addProjection(new Projection({
        code: code,
        axisOrientation: def.axis,
        metersPerUnit: def.to_meter,
        units: def.units
      }));
    }
  }
  for (i = 0; i < len; ++i) {
    var code1 = projCodes[i];
    var proj1 = get(code1);
    for (j = 0; j < len; ++j) {
      var code2 = projCodes[j];
      var proj2 = get(code2);
      if (!getTransform(code1, code2)) {
        if (proj4.defs[code1] === proj4.defs[code2]) {
          addEquivalentProjections([proj1, proj2]);
        } else {
          var transform = proj4(code1, code2);
          addCoordinateTransforms(proj1, proj2, transform.forward, transform.inverse);
        }
      }
    }
  }
}
