goog.provide('ol.geom.flat.flip');

goog.require('goog.asserts');


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {Array.<number>=} opt_dest Destination.
 * @param {number=} opt_destOffset Destination offset.
 * @return {Array.<number>} Flat coordinates.
 */
ol.geom.flat.flip.flipXY =
    function(flatCoordinates, offset, end, stride, opt_dest, opt_destOffset) {
  var dest, destOffset;
  if (opt_dest !== undefined) {
    dest = opt_dest;
    destOffset = opt_destOffset !== undefined ? opt_destOffset : 0;
  } else {
    goog.asserts.assert(opt_destOffset === undefined,
        'opt_destOffSet should be defined');
    dest = [];
    destOffset = 0;
  }
  var j, k;
  for (j = offset; j < end; ) {
    var x = flatCoordinates[j++];
    dest[destOffset++] = flatCoordinates[j++];
    dest[destOffset++] = x;
    for (k = 2; k < stride; ++k) {
      dest[destOffset++] = flatCoordinates[j++];
    }
  }
  dest.length = destOffset;
  return dest;
};
