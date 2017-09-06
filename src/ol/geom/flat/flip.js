var _ol_geom_flat_flip_ = {};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {Array.<number>=} opt_dest Destination.
 * @param {number=} opt_destOffset Destination offset.
 * @return {Array.<number>} Flat coordinates.
 */
_ol_geom_flat_flip_.flipXY = function(flatCoordinates, offset, end, stride, opt_dest, opt_destOffset) {
  var dest, destOffset;
  if (opt_dest !== undefined) {
    dest = opt_dest;
    destOffset = opt_destOffset !== undefined ? opt_destOffset : 0;
  } else {
    dest = [];
    destOffset = 0;
  }
  var j = offset;
  while (j < end) {
    var x = flatCoordinates[j++];
    dest[destOffset++] = flatCoordinates[j++];
    dest[destOffset++] = x;
    for (var k = 2; k < stride; ++k) {
      dest[destOffset++] = flatCoordinates[j++];
    }
  }
  dest.length = destOffset;
  return dest;
};
export default _ol_geom_flat_flip_;
