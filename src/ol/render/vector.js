goog.provide('ol.renderer.vector');

goog.require('goog.asserts');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.render.IReplayBatchGroup');
goog.require('ol.style.Style');


/**
 * @param {ol.render.IReplayBatchGroup} batchGroup Batch group.
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
 * @param {ol.render.IReplayBatchGroup} batchGroup Batch group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @private
 */
ol.renderer.vector.renderLineStringGeometry_ =
    function(batchGroup, geometry, style) {
  if (goog.isNull(style.stroke)) {
    return;
  }
  goog.asserts.assert(geometry instanceof ol.geom.LineString);
  var lineStringGeometry = /** @type {ol.geom.LineString} */ (geometry);
  var batch = batchGroup.getBatch(
      style.zIndex, ol.render.BatchType.LINE_STRING);
  batch.setFillStrokeStyle(null, style.stroke);
  batch.drawLineStringGeometry(lineStringGeometry);
};


/**
 * @param {ol.render.IReplayBatchGroup} batchGroup Batch group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @private
 */
ol.renderer.vector.renderMultiLineStringGeometry_ =
    function(batchGroup, geometry, style) {
  if (goog.isNull(style.stroke)) {
    return;
  }
  goog.asserts.assert(geometry instanceof ol.geom.MultiLineString);
  var multiLineStringGeometry = /** @type {ol.geom.MultiLineString} */
      (geometry);
  var batch = batchGroup.getBatch(
      style.zIndex, ol.render.BatchType.LINE_STRING);
  batch.setFillStrokeStyle(null, style.stroke);
  batch.drawMultiLineStringGeometry(multiLineStringGeometry);
};


/**
 * @param {ol.render.IReplayBatchGroup} batchGroup Batch group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @private
 */
ol.renderer.vector.renderMultiPolygonGeometry_ =
    function(batchGroup, geometry, style) {
  if (goog.isNull(style.stroke) && goog.isNull(style.fill)) {
    return;
  }
  goog.asserts.assert(geometry instanceof ol.geom.MultiPolygon);
  var multiPolygonGeometry = /** @type {ol.geom.MultiPolygon} */
      (geometry);
  var batch = batchGroup.getBatch(
      style.zIndex, ol.render.BatchType.POLYGON);
  batch.setFillStrokeStyle(style.fill, style.stroke);
  batch.drawMultiPolygonGeometry(multiPolygonGeometry);
};


/**
 * @param {ol.render.IReplayBatchGroup} batchGroup Batch group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @private
 */
ol.renderer.vector.renderPointGeometry_ =
    function(batchGroup, geometry, style) {
  if (goog.isNull(style.image)) {
    return;
  }
  goog.asserts.assert(geometry instanceof ol.geom.Point);
  var pointGeometry = /** @type {ol.geom.Point} */ (geometry);
  var batch = batchGroup.getBatch(style.zIndex, ol.render.BatchType.IMAGE);
  batch.setImageStyle(style.image);
  batch.drawPointGeometry(pointGeometry);
};


/**
 * @param {ol.render.IReplayBatchGroup} batchGroup Batch group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @private
 */
ol.renderer.vector.renderMultiPointGeometry_ =
    function(batchGroup, geometry, style) {
  if (goog.isNull(style.image)) {
    return;
  }
  goog.asserts.assert(geometry instanceof ol.geom.MultiPoint);
  var multiPointGeometry = /** @type {ol.geom.MultiPoint} */ (geometry);
  var batch = batchGroup.getBatch(style.zIndex, ol.render.BatchType.IMAGE);
  batch.setImageStyle(style.image);
  batch.drawMultiPointGeometry(multiPointGeometry);
};


/**
 * @param {ol.render.IReplayBatchGroup} batchGroup Batch group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @private
 */
ol.renderer.vector.renderPolygonGeometry_ =
    function(batchGroup, geometry, style) {
  if (goog.isNull(style.fill) && goog.isNull(style.stroke)) {
    return;
  }
  goog.asserts.assert(geometry instanceof ol.geom.Polygon);
  var polygonGeometry = /** @type {ol.geom.Polygon} */ (geometry);
  var batch = batchGroup.getBatch(style.zIndex, ol.render.BatchType.POLYGON);
  batch.setFillStrokeStyle(style.fill, style.stroke);
  batch.drawPolygonGeometry(polygonGeometry);
};


/**
 * @const
 * @private
 * @type {Object.<ol.geom.GeometryType,
 *                function(ol.render.IReplayBatchGroup, ol.geom.Geometry,
 *                         ol.style.Style)>}
 */
ol.renderer.vector.GEOMETRY_RENDERERS_ = {
  'Point': ol.renderer.vector.renderPointGeometry_,
  'LineString': ol.renderer.vector.renderLineStringGeometry_,
  'Polygon': ol.renderer.vector.renderPolygonGeometry_,
  'MultiPoint': ol.renderer.vector.renderMultiPointGeometry_,
  'MultiLineString': ol.renderer.vector.renderMultiLineStringGeometry_,
  'MultiPolygon': ol.renderer.vector.renderMultiPolygonGeometry_
};
