/**
 * @module ol/style/TextPlacement
 */

/**
 * Text placement. One of `'point'`, `'line'`. Default is `'point'`. Note that
 * `'line'` requires the underlying geometry to be a {@link module:ol/geom/LineString~LineString},
 * {@link module:ol/geom/Polygon~Polygon}, {@link module:ol/geom/MultiLineString~MultiLineString} or
 * {@link module:ol/geom/MultiPolygon~MultiPolygon}.
 * @enum {string}
 */
export default {
  POINT: 'point',
  LINE: 'line',
};
