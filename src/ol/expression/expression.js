goog.provide('ol.expression');

goog.require('ol.Extent');
goog.require('ol.Feature');
goog.require('ol.expression.Parser');
goog.require('ol.extent');
goog.require('ol.geom.GeometryType');


/**
 * Parse an expression
 * @param {string} source The expression source (e.g. `'foo + 2'`).
 * @return {ol.expression.Expression} An expression instance that can be
 *     evaluated within some scope to provide a value.
 */
ol.expression.parse = function(source) {
  var parser = new ol.expression.Parser();
  return parser.parse(source);
};


/**
 * Library of well-known functions.  These are available to expressions parsed
 * with `ol.expression.parse`.
 *
 * @type {Object}
 */
ol.expression.lib = {

  /**
   * Determine if a feature's extent intersects the provided extent.
   * @param {number} minX Minimum x-coordinate value.
   * @param {number} maxX Maximum x-coordinate value.
   * @param {number} minY Minimum y-coordinate value.
   * @param {number} maxY Maximum y-coordinate value.
   * @return {boolean} The provided extent intersects the feature's extent.
   * @this {ol.Feature}
   */
  'extent': function(minX, maxX, minY, maxY) {
    var intersects = false;
    var geometry = this.getGeometry();
    if (geometry) {
      intersects = ol.extent.intersects(geometry.getBounds(),
          [minX, maxX, minY, maxY]);
    }
    return intersects;
  },


  /**
   * Determine if a feature's default geometry is of the given type.
   * @param {ol.geom.GeometryType} type Geometry type.
   * @return {boolean} The feature's default geometry is of the given type.
   * @this {ol.Feature}
   */
  'geometryType': function(type) {
    var same = false;
    var geometry = this.getGeometry();
    if (geometry) {
      same = geometry.getType() === type;
    }
    return same;
  }

};
