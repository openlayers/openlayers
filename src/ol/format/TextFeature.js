/**
 * @module ol/format/TextFeature
 */
import {abstract} from '../util.js';
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
   * @param {import("./Feature.js").ReadOptions=} opt_options Read options.
   * @return {import("../Feature.js").default} Feature.
   * @api
   */
  readFeature(source, opt_options) {
    return this.readFeatureFromText(getText(source), this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {string} text Text.
   * @param {import("./Feature.js").ReadOptions=} opt_options Read options.
   * @protected
   * @return {import("../Feature.js").default} Feature.
   */
  readFeatureFromText(text, opt_options) {
    return abstract();
  }

  /**
   * Read the features from the source.
   *
   * @param {Document|Node|Object|string} source Source.
   * @param {import("./Feature.js").ReadOptions=} opt_options Read options.
   * @return {Array<import("../Feature.js").default>} Features.
   * @api
   */
  readFeatures(source, opt_options) {
    return this.readFeaturesFromText(getText(source), this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {string} text Text.
   * @param {import("./Feature.js").ReadOptions=} opt_options Read options.
   * @protected
   * @return {Array<import("../Feature.js").default>} Features.
   */
  readFeaturesFromText(text, opt_options) {
    return abstract();
  }

  /**
   * Read the geometry from the source.
   *
   * @param {Document|Node|Object|string} source Source.
   * @param {import("./Feature.js").ReadOptions=} opt_options Read options.
   * @return {import("../geom/Geometry.js").default} Geometry.
   * @api
   */
  readGeometry(source, opt_options) {
    return this.readGeometryFromText(getText(source), this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {string} text Text.
   * @param {import("./Feature.js").ReadOptions=} opt_options Read options.
   * @protected
   * @return {import("../geom/Geometry.js").default} Geometry.
   */
  readGeometryFromText(text, opt_options) {
    return abstract();
  }

  /**
   * Read the projection from the source.
   *
   * @param {Document|Node|Object|string} source Source.
   * @return {import("../proj/Projection.js").default} Projection.
   * @api
   */
  readProjection(source) {
    return this.readProjectionFromText(getText(source));
  }

  /**
   * @param {string} text Text.
   * @protected
   * @return {import("../proj/Projection.js").default} Projection.
   */
  readProjectionFromText(text) {
    return this.dataProjection;
  }

  /**
   * Encode a feature as a string.
   *
   * @param {import("../Feature.js").default} feature Feature.
   * @param {import("./Feature.js").WriteOptions=} opt_options Write options.
   * @return {string} Encoded feature.
   * @api
   */
  writeFeature(feature, opt_options) {
    return this.writeFeatureText(feature, this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {import("../Feature.js").default} feature Features.
   * @param {import("./Feature.js").WriteOptions=} opt_options Write options.
   * @protected
   * @return {string} Text.
   */
  writeFeatureText(feature, opt_options) {
    return abstract();
  }

  /**
   * Encode an array of features as string.
   *
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions=} opt_options Write options.
   * @return {string} Encoded features.
   * @api
   */
  writeFeatures(features, opt_options) {
    return this.writeFeaturesText(features, this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions=} opt_options Write options.
   * @protected
   * @return {string} Text.
   */
  writeFeaturesText(features, opt_options) {
    return abstract();
  }

  /**
   * Write a single geometry.
   *
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions=} opt_options Write options.
   * @return {string} Geometry.
   * @api
   */
  writeGeometry(geometry, opt_options) {
    return this.writeGeometryText(geometry, this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions=} opt_options Write options.
   * @protected
   * @return {string} Text.
   */
  writeGeometryText(geometry, opt_options) {
    return abstract();
  }
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
