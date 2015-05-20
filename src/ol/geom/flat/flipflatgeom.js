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
  if (goog.isDef(opt_dest)) {
    dest = opt_dest;
    destOffset = goog.isDef(opt_destOffset) ? opt_destOffset : 0;
  } else {
    goog.asserts.assert(!goog.isDef(opt_destOffset));
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
