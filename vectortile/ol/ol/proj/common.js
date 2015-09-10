goog.provide('ol.proj.common');

goog.require('ol.proj');
goog.require('ol.proj.EPSG3857');
goog.require('ol.proj.EPSG4326');


/**
 * FIXME empty description for jsdoc
 * @api
 */
ol.proj.common.add = function() {
  // Add transformations that don't alter coordinates to convert within set of
  // projections with equal meaning.
  ol.proj.addEquivalentProjections(ol.proj.EPSG3857.PROJECTIONS);
  ol.proj.addEquivalentProjections(ol.proj.EPSG4326.PROJECTIONS);
  // Add transformations to convert EPSG:4326 like coordinates to EPSG:3857 like
  // coordinates and back.
  ol.proj.addEquivalentTransforms(
      ol.proj.EPSG4326.PROJECTIONS,
      ol.proj.EPSG3857.PROJECTIONS,
      ol.proj.EPSG3857.fromEPSG4326,
      ol.proj.EPSG3857.toEPSG4326);
};
