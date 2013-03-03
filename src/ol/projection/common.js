goog.provide('ol.projection.addCommonProjections');

goog.require('ol.projection');
goog.require('ol.projection.EPSG3857');
goog.require('ol.projection.EPSG4326');


/**
 * FIXME empty description for jsdoc
 */
ol.projection.addCommonProjections = function() {
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
