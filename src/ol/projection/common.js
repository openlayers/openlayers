goog.provide('ol.projection.common');

goog.require('ol.projection');
goog.require('ol.projection.EPSG3857');
goog.require('ol.projection.EPSG4326');


/**
 * FIXME empty description for jsdoc
 */
ol.projection.common.addProjections = function() {
  // Add transformations that don't alter coordinates to convert within set of
  // projections with equal meaning.
  ol.projection.addEquivalentProjections(ol.projection.EPSG3857.PROJECTIONS);
  ol.projection.addEquivalentProjections(ol.projection.EPSG4326.PROJECTIONS);
  // Add transformations to convert EPSG:4326 like coordinates to EPSG:3857 like
  // coordinates and back.
  ol.projection.addEquivalentTransforms(
      ol.projection.EPSG4326.PROJECTIONS,
      ol.projection.EPSG3857.PROJECTIONS,
      ol.projection.EPSG3857.fromEPSG4326,
      ol.projection.EPSG3857.toEPSG4326);
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {ol.ProjectionLike=} opt_mapProjection Map projection.
 * @param {ol.ProjectionLike=} opt_userProjection User projection.
 * @return {ol.Coordinate} Coordinate.
 */
ol.toMap = function(coordinate, opt_mapProjection, opt_userProjection) {
  var mapProjection = goog.isDef(opt_mapProjection) ?
      opt_mapProjection : ol.projection.get(ol.DEFAULT_MAP_PROJECTION);
  var userProjection = goog.isDef(opt_userProjection) ?
      opt_userProjection : ol.projection.get(ol.DEFAULT_USER_PROJECTION);
  if (userProjection.getAxisOrientation() !=
      mapProjection.getAxisOrientation()) {
    coordinate = [coordinate[1], coordinate[0]];
  }
  return ol.projection.transform(coordinate, userProjection, mapProjection);
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {ol.ProjectionLike=} opt_mapProjection Map projection.
 * @param {ol.ProjectionLike=} opt_userProjection User projection.
 * @return {ol.Coordinate} Coordinate.
 */
ol.toUser = function(coordinate, opt_mapProjection, opt_userProjection) {
  var mapProjection = goog.isDef(opt_mapProjection) ?
      opt_mapProjection : ol.projection.get(ol.DEFAULT_MAP_PROJECTION);
  var userProjection = goog.isDef(opt_userProjection) ?
      opt_userProjection : ol.projection.get(ol.DEFAULT_USER_PROJECTION);
  if (userProjection.getAxisOrientation() !=
      mapProjection.getAxisOrientation()) {
    coordinate = [coordinate[1], coordinate[0]];
  }
  return ol.projection.transform(coordinate, mapProjection, userProjection);
};
