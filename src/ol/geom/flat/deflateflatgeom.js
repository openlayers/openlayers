goog.provide('ol.geom.flat.deflate');


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} stride Stride.
 * @return {number} offset Offset.
 */
ol.geom.flat.deflate.coordinate = function(flatCoordinates, offset, coordinate, stride) {
  goog.DEBUG && console.assert(coordinate.length == stride,
      'length of the coordinate array should match stride');
  var i, ii;
  for (i = 0, ii = coordinate.length; i < ii; ++i) {
    flatCoordinates[offset++] = coordinate[i];
  }
  return offset;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {number} stride Stride.
 * @return {number} offset Offset.
 */
ol.geom.flat.deflate.coordinates = function(flatCoordinates, offset, coordinates, stride) {
  var i, ii;
  for (i = 0, ii = coordinates.length; i < ii; ++i) {
    var coordinate = coordinates[i];
    goog.DEBUG && console.assert(coordinate.length == stride,
        'length of coordinate array should match stride');
    var j;
    for (j = 0; j < stride; ++j) {
      flatCoordinates[offset++] = coordinate[j];
    }
  }
  return offset;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<ol.Coordinate>>} coordinatess Coordinatess.
 * @param {number} stride Stride.
 * @param {Array.<number>=} opt_ends Ends.
 * @return {Array.<number>} Ends.
 */
ol.geom.flat.deflate.coordinatess = function(flatCoordinates, offset, coordinatess, stride, opt_ends) {
  var ends = opt_ends ? opt_ends : [];
  var i = 0;
  var j, jj;
  for (j = 0, jj = coordinatess.length; j < jj; ++j) {
    var end = ol.geom.flat.deflate.coordinates(
        flatCoordinates, offset, coordinatess[j], stride);
    ends[i++] = end;
    offset = end;
  }
  ends.length = i;
  return ends;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<Array.<ol.Coordinate>>>} coordinatesss Coordinatesss.
 * @param {number} stride Stride.
 * @param {Array.<Array.<number>>=} opt_endss Endss.
 * @return {Array.<Array.<number>>} Endss.
 */
ol.geom.flat.deflate.coordinatesss = function(flatCoordinates, offset, coordinatesss, stride, opt_endss) {
  var endss = opt_endss ? opt_endss : [];
  var i = 0;
  var j, jj;
  for (j = 0, jj = coordinatesss.length; j < jj; ++j) {
    var ends = ol.geom.flat.deflate.coordinatess(
        flatCoordinates, offset, coordinatesss[j], stride, endss[i]);
    endss[i++] = ends;
    offset = ends[ends.length - 1];
  }
  endss.length = i;
  return endss;
};
