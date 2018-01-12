/**
 * @module ol/geom/flat/center
 */
import {createEmpty, createOrUpdateFromFlatCoordinates} from '../../extent.js';
const _ol_geom_flat_center_ = {};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<number>>} endss Endss.
 * @param {number} stride Stride.
 * @return {Array.<number>} Flat centers.
 */
_ol_geom_flat_center_.linearRingss = function(flatCoordinates, offset, endss, stride) {
  const flatCenters = [];
  let i, ii;
  let extent = createEmpty();
  for (i = 0, ii = endss.length; i < ii; ++i) {
    const ends = endss[i];
    extent = createOrUpdateFromFlatCoordinates(flatCoordinates, offset, ends[0], stride);
    flatCenters.push((extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2);
    offset = ends[ends.length - 1];
  }
  return flatCenters;
};
export default _ol_geom_flat_center_;
