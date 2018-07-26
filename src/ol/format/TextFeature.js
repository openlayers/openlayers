/**
 * @module ol/format/TextFeature
 */
import FeatureFormat from '../format/Feature.js';
import FormatType from '../format/FormatType.js';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for text feature formats.
 *
 * @abstract
 */
class TextFeature extends FeatureFormat {
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getType() {
    return FormatType.TEXT;
  }

  /**
   * Read the feature from the source.
   *
   * @param {Document|Node|Object|string} source Source.
   * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
   * @return {module:ol/Feature} Feature.
   * @api
   */
  readFeature(source, opt_options) {
    return this.readFeatureFromText(getText(source), this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {string} text Text.
   * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
   * @protected
   * @return {module:ol/Feature} Feature.
   */
  readFeatureFromText(text, opt_options) {}

  /**
   * Read the features from the source.
   *
   * @param {Document|Node|Object|string} source Source.
   * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
   * @return {Array<module:ol/Feature>} Features.
   * @api
   */
  readFeatures(source, opt_options) {
    return this.readFeaturesFromText(getText(source), this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {string} text Text.
   * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
   * @protected
   * @return {Array<module:ol/Feature>} Features.
   */
  readFeaturesFromText(text, opt_options) {}

  /**
   * Read the geometry from the source.
   *
   * @param {Document|Node|Object|string} source Source.
   * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
   * @return {module:ol/geom/Geometry} Geometry.
   * @api
   */
  readGeometry(source, opt_options) {
    return this.readGeometryFromText(getText(source), this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {string} text Text.
   * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
   * @protected
   * @return {module:ol/geom/Geometry} Geometry.
   */
  readGeometryFromText(text, opt_options) {}

  /**
   * Read the projection from the source.
   *
   * @function
   * @param {Document|Node|Object|string} source Source.
   * @return {module:ol/proj/Projection} Projection.
   * @api
   */
  readProjection(source) {
    return this.readProjectionFromText(getText(source));
  }

  /**
   * @param {string} text Text.
   * @protected
   * @return {module:ol/proj/Projection} Projection.
   */
  readProjectionFromText(text) {
    return this.dataProjection;
  }

  /**
   * Encode a feature as a string.
   *
   * @function
   * @param {module:ol/Feature} feature Feature.
   * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
   * @return {string} Encoded feature.
   * @api
   */
  writeFeature(feature, opt_options) {
    return this.writeFeatureText(feature, this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {module:ol/Feature} feature Features.
   * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
   * @protected
   * @return {string} Text.
   */
  writeFeatureText(feature, opt_options) {}

  /**
   * Encode an array of features as string.
   *
   * @param {Array<module:ol/Feature>} features Features.
   * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
   * @return {string} Encoded features.
   * @api
   */
  writeFeatures(features, opt_options) {
    return this.writeFeaturesText(features, this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {Array<module:ol/Feature>} features Features.
   * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
   * @protected
   * @return {string} Text.
   */
  writeFeaturesText(features, opt_options) {}

  /**
   * Write a single geometry.
   *
   * @function
   * @param {module:ol/geom/Geometry} geometry Geometry.
   * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
   * @return {string} Geometry.
   * @api
   */
  writeGeometry(geometry, opt_options) {
    return this.writeGeometryText(geometry, this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {module:ol/geom/Geometry} geometry Geometry.
   * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
   * @protected
   * @return {string} Text.
   */
  writeGeometryText(geometry, opt_options) {}
}


/**
 * @param {Document|Node|Object|string} source Source.
 * @return {string} Text.
 */
function getText(source) {
  if (typeof source === 'string') {
    return source;
  } else {
    return '';
  }
}


export default TextFeature;
