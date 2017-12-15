/**
 * @module ol/style/TextPlacement
 */

/**
 * Text placement. One of `'point'`, `'line'`. Default is `'point'`. Note that
 * `'line'` requires the underlying geometry to be a {@link ol.geom.LineString},
 * {@link ol.geom.Polygon}, {@link ol.geom.MultiLineString} or
 * {@link ol.geom.MultiPolygon}.
 * @enum {string}
 */
export default {
  POINT: 'point',
  LINE: 'line'
};
