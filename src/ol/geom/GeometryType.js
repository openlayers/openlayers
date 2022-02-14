/**
 * @module ol/geom/GeometryType
 */

/**
 * The geometry type. One of `'Point'`, `'LineString'`, `'LinearRing'`,
 * `'Polygon'`, `'MultiPoint'`, `'MultiLineString'`, `'MultiPolygon'`,
 * `'GeometryCollection'`, `'Circle'`, `'CircularString', `'CompoundCurve'`,
 * `'CurvePolygon'`.
 * @enum {string}
 */
export default {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  LINEAR_RING: 'LinearRing',
  POLYGON: 'Polygon',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon',
  MULTI_CURVE: 'MultiCurve',
  GEOMETRY_COLLECTION: 'GeometryCollection',
  CIRCLE: 'Circle',
  CIRCULAR_STRING: 'CircularString',
  COMPOUND_CURVE: 'CompoundCurve',
  CURVE_POLYGON: 'CurvePolygon',
};
