goog.provide('ol.renderer.vector');

goog.require('goog.asserts');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.render.IReplayGroup');
goog.require('ol.style.Style');


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Object} data Opaque data object.
 */
ol.renderer.vector.renderFeature = function(
    replayGroup, feature, style, squaredTolerance, data) {
  var geometry = feature.getGeometry();
  if (goog.isNull(geometry)) {
    return;
  }
  var simplifiedGeometry = geometry.getSimplifiedGeometry(squaredTolerance);
  var geometryRenderer =
      ol.renderer.vector.GEOMETRY_RENDERERS_[simplifiedGeometry.getType()];
  goog.asserts.assert(goog.isDef(geometryRenderer));
  geometryRenderer(replayGroup, simplifiedGeometry, style, data);
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderGeometryCollectionGeometry_ =
    function(replayGroup, geometry, style, data) {
  goog.asserts.assertInstanceof(geometry, ol.geom.GeometryCollection);
  var geometries = geometry.getGeometriesArray();
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    var geometryRenderer =
        ol.renderer.vector.GEOMETRY_RENDERERS_[geometries[i].getType()];
    goog.asserts.assert(goog.isDef(geometryRenderer));
    geometryRenderer(replayGroup, geometries[i], style, data);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderLineStringGeometry_ =
    function(replayGroup, geometry, style, data) {
  var strokeStyle = style.getStroke();
  if (goog.isNull(strokeStyle)) {
    return;
  }
  goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
  var replay = replayGroup.getReplay(
      style.getZIndex(), ol.render.ReplayType.LINE_STRING);
  replay.setFillStrokeStyle(null, strokeStyle);
  replay.drawLineStringGeometry(geometry, data);
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderMultiLineStringGeometry_ =
    function(replayGroup, geometry, style, data) {
  var strokeStyle = style.getStroke();
  if (goog.isNull(strokeStyle)) {
    return;
  }
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiLineString);
  var replay = replayGroup.getReplay(
      style.getZIndex(), ol.render.ReplayType.LINE_STRING);
  replay.setFillStrokeStyle(null, strokeStyle);
  replay.drawMultiLineStringGeometry(geometry, data);
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderMultiPolygonGeometry_ =
    function(replayGroup, geometry, style, data) {
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (goog.isNull(strokeStyle) && goog.isNull(fillStyle)) {
    return;
  }
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiPolygon);
  var replay = replayGroup.getReplay(
      style.getZIndex(), ol.render.ReplayType.POLYGON);
  replay.setFillStrokeStyle(fillStyle, strokeStyle);
  replay.drawMultiPolygonGeometry(geometry, data);
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderPointGeometry_ =
    function(replayGroup, geometry, style, data) {
  var imageStyle = style.getImage();
  if (goog.isNull(imageStyle)) {
    return;
  }
  goog.asserts.assertInstanceof(geometry, ol.geom.Point);
  var replay = replayGroup.getReplay(
      style.getZIndex(), ol.render.ReplayType.IMAGE);
  replay.setImageStyle(imageStyle);
  replay.drawPointGeometry(geometry, data);
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderMultiPointGeometry_ =
    function(replayGroup, geometry, style, data) {
  var imageStyle = style.getImage();
  if (goog.isNull(imageStyle)) {
    return;
  }
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiPoint);
  var replay = replayGroup.getReplay(
      style.getZIndex(), ol.render.ReplayType.IMAGE);
  replay.setImageStyle(imageStyle);
  replay.drawMultiPointGeometry(geometry, data);
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderPolygonGeometry_ =
    function(replayGroup, geometry, style, data) {
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (goog.isNull(fillStyle) && goog.isNull(strokeStyle)) {
    return;
  }
  goog.asserts.assertInstanceof(geometry, ol.geom.Polygon);
  var replay = replayGroup.getReplay(
      style.getZIndex(), ol.render.ReplayType.POLYGON);
  replay.setFillStrokeStyle(fillStyle, strokeStyle);
  replay.drawPolygonGeometry(geometry, data);
};


/**
 * @const
 * @private
 * @type {Object.<ol.geom.GeometryType,
 *                function(ol.render.IReplayGroup, ol.geom.Geometry,
 *                         ol.style.Style, Object)>}
 */
ol.renderer.vector.GEOMETRY_RENDERERS_ = {
  'Point': ol.renderer.vector.renderPointGeometry_,
  'LineString': ol.renderer.vector.renderLineStringGeometry_,
  'Polygon': ol.renderer.vector.renderPolygonGeometry_,
  'MultiPoint': ol.renderer.vector.renderMultiPointGeometry_,
  'MultiLineString': ol.renderer.vector.renderMultiLineStringGeometry_,
  'MultiPolygon': ol.renderer.vector.renderMultiPolygonGeometry_,
  'GeometryCollection': ol.renderer.vector.renderGeometryCollectionGeometry_
};
