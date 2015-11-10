goog.provide('ol.format.Feature');

goog.require('ol.geom.Geometry');
goog.require('ol.proj');



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for feature formats.
 * {ol.format.Feature} subclasses provide the ability to decode and encode
 * {@link ol.Feature} objects from a variety of commonly used geospatial
 * file formats.  See the documentation for each format for more details.
 *
 * @constructor
 * @api stable
 */
ol.format.Feature = function() {

  /**
   * @protected
   * @type {ol.proj.Projection}
   */
  this.defaultDataProjection = null;

};


/**
 * @return {Array.<string>} Extensions.
 */
ol.format.Feature.prototype.getExtensions = goog.abstractMethod;


/**
 * Adds the data projection to the read options.
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @return {olx.format.ReadOptions|undefined} Options.
 * @protected
 */
ol.format.Feature.prototype.getReadOptions = function(source, opt_options) {
  var options;
  if (opt_options) {
    options = {
      dataProjection: opt_options.dataProjection ?
          opt_options.dataProjection : this.readProjection(source),
      featureProjection: opt_options.featureProjection
    };
  }
  return this.adaptOptions(options);
};


/**
 * Sets the `defaultDataProjection` on the options, if no `dataProjection`
 * is set.
 * @param {olx.format.WriteOptions|olx.format.ReadOptions|undefined} options
 *     Options.
 * @protected
 * @return {olx.format.WriteOptions|olx.format.ReadOptions|undefined}
 *     Updated options.
 */
ol.format.Feature.prototype.adaptOptions = function(options) {
  var updatedOptions;
  if (options) {
    updatedOptions = {
      featureProjection: options.featureProjection,
      dataProjection: options.dataProjection ?
          options.dataProjection : this.defaultDataProjection,
      rightHanded: options.rightHanded
    };
  }
  return updatedOptions;
};


/**
 * @return {ol.format.FormatType} Format.
 */
ol.format.Feature.prototype.getType = goog.abstractMethod;


/**
 * Read a single feature from a source.
 *
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 */
ol.format.Feature.prototype.readFeature = goog.abstractMethod;


/**
 * Read all features from a source.
 *
 * @param {Document|Node|ArrayBuffer|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.Feature.prototype.readFeatures = goog.abstractMethod;


/**
 * Read a single geometry from a source.
 *
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.Feature.prototype.readGeometry = goog.abstractMethod;


/**
 * Read the projection from a source.
 *
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 */
ol.format.Feature.prototype.readProjection = goog.abstractMethod;


/**
 * Encode a feature in this format.
 *
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} Result.
 */
ol.format.Feature.prototype.writeFeature = goog.abstractMethod;


/**
 * Encode an array of features in this format.
 *
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} Result.
 */
ol.format.Feature.prototype.writeFeatures = goog.abstractMethod;


/**
 * Write a single geometry in this format.
 *
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} Result.
 */
ol.format.Feature.prototype.writeGeometry = goog.abstractMethod;


/**
 * @param {ol.geom.Geometry|ol.Extent} geometry Geometry.
 * @param {boolean} write Set to true for writing, false for reading.
 * @param {(olx.format.WriteOptions|olx.format.ReadOptions)=} opt_options
 *     Options.
 * @return {ol.geom.Geometry|ol.Extent} Transformed geometry.
 * @protected
 */
ol.format.Feature.transformWithOptions = function(
    geometry, write, opt_options) {
  var featureProjection = opt_options ?
      ol.proj.get(opt_options.featureProjection) : null;
  var dataProjection = opt_options ?
      ol.proj.get(opt_options.dataProjection) : null;
  if (featureProjection && dataProjection &&
      !ol.proj.equivalent(featureProjection, dataProjection)) {
    if (geometry instanceof ol.geom.Geometry) {
      return (write ? geometry.clone() : geometry).transform(
          write ? featureProjection : dataProjection,
          write ? dataProjection : featureProjection);
    } else {
      // FIXME this is necessary because ol.format.GML treats extents
      // as geometries
      return ol.proj.transformExtent(
          write ? geometry.slice() : geometry,
          write ? featureProjection : dataProjection,
          write ? dataProjection : featureProjection);
    }
  } else {
    return geometry;
  }
};
