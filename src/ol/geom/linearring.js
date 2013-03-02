goog.provide('ol.geom.LinearRing');

goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.SharedVertices');
goog.require('ol.geom.VertexArray');



/**
 * @constructor
 * @extends {ol.geom.LineString}
 * @param {ol.geom.VertexArray} coordinates Vertex array (e.g.
 *    [[x0, y0], [x1, y1]]).
 * @param {ol.geom.SharedVertices=} opt_shared Shared vertices.
 */
ol.geom.LinearRing = function(coordinates, opt_shared) {
  goog.base(this, coordinates, opt_shared);

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
  return ol.geom.GeometryType.LINEARRING;
};
