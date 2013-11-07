goog.provide('ol.renderer.vector');

goog.require('goog.asserts');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.replay.IBatchGroup');
goog.require('ol.style.Style');


/**
 * @param {ol.replay.IBatchGroup} batchGroup Batch group.
 * @param {ol.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 */
ol.renderer.vector.renderFeature = function(batchGroup, feature, style) {
  var geometry = feature.getGeometry();
  var geometryRenderer =
      ol.renderer.vector.GEOMETRY_RENDERERS_[geometry.getType()];
  goog.asserts.assert(goog.isDef(geometryRenderer));
  geometryRenderer(batchGroup, geometry, style);
};


/**
 * @param {ol.replay.IBatchGroup} batchGroup Batch group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @private
 */
ol.renderer.vector.renderLineStringGeometry_ =
    function(batchGroup, geometry, style) {
  goog.asserts.assert(geometry instanceof ol.geom.LineString);
  var lineStringGeometry = /** @type {ol.geom.LineString} */ (geometry);
  window.console.log({batchingLineString: lineStringGeometry}); // FIXME
  var batch = batchGroup.getBatch(
      style.zIndex, ol.replay.BatchType.STROKE_LINE);
  batch.setStrokeStyle(style.stroke);
  batch.drawLineStringGeometry(lineStringGeometry);
};


/**
 * @param {ol.replay.IBatchGroup} batchGroup Batch group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @private
 */
ol.renderer.vector.renderPointGeometry_ =
    function(batchGroup, geometry, style) {
  goog.asserts.assert(geometry instanceof ol.geom.Point);
  var pointGeometry = /** @type {ol.geom.Point} */ (geometry);
  window.console.log({batchingPoint: pointGeometry}); // FIXME
};


/**
 * @param {ol.replay.IBatchGroup} batchGroup Batch group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @private
 */
ol.renderer.vector.renderPolygonGeometry_ =
    function(batchGroup, geometry, style) {
  goog.asserts.assert(geometry instanceof ol.geom.Polygon);
  var polygonGeometry = /** @type {ol.geom.Polygon} */ (geometry);
  window.console.log({batchingPolygon: polygonGeometry}); // FIXME
};


/**
 * @const
 * @private
 * @type {Object.<ol.geom.GeometryType,
 *                function(
 *                    ol.replay.IBatchGroup, ol.geom.Geometry, ol.style.Style)>}
 */
ol.renderer.vector.GEOMETRY_RENDERERS_ = {
  'Point': ol.renderer.vector.renderPointGeometry_,
  'LineString': ol.renderer.vector.renderLineStringGeometry_,
  'Polygon': ol.renderer.vector.renderPolygonGeometry_
};
