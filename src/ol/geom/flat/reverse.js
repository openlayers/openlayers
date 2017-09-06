var _ol_geom_flat_reverse_ = {};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 */
_ol_geom_flat_reverse_.coordinates = function(flatCoordinates, offset, end, stride) {
  while (offset < end - stride) {
    var i;
    for (i = 0; i < stride; ++i) {
      var tmp = flatCoordinates[offset + i];
      flatCoordinates[offset + i] = flatCoordinates[end - stride + i];
      flatCoordinates[end - stride + i] = tmp;
    }
    offset += stride;
    end -= stride;
  }
};
export default _ol_geom_flat_reverse_;
