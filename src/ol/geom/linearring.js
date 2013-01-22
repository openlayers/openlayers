goog.provide('ol.geom.LinearRing');

goog.require('ol.geom.CoordinateArray');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');



/**
 * @constructor
 * @extends {ol.geom.LineString}
 * @param {ol.geom.CoordinateArray} coordinates Coordinates array (e.g.
 *    [[x0, y0], [x1, y1], [x0, y0]]).
 */
ol.geom.LinearRing = function(coordinates) {

  goog.base(this, coordinates);

  /**
   * We're intentionally not enforcing that rings be closed right now.  This
   * will allow proper rendering of data from tiled vector sources that leave
   * open rings.
   */

};
goog.inherits(ol.geom.LinearRing, ol.geom.LineString);


/**
 * @inheritDoc
 */
ol.geom.LinearRing.prototype.getType = function() {
  return ol.geom.GeometryType.GEOMETRYCOLLECTION;
};
