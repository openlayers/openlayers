/**
 * @module ol/format/TextFeature
 */
import {inherits} from '../util.js';
import FeatureFormat from '../format/Feature.js';
import FormatType from '../format/FormatType.js';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for text feature formats.
 *
 * @abstract
 * @extends {module:ol/format/Feature}
 */
class TextFeature {
  constructor() {
    FeatureFormat.call(this);
  }

  /**
   * @inheritDoc
   */
  getType() {
    return FormatType.TEXT;
  }

  /**
   * @inheritDoc
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
   * @inheritDoc
   */
  readFeatures(source, opt_options) {
    return this.readFeaturesFromText(getText(source), this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {string} text Text.
   * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
   * @protected
   * @return {Array.<module:ol/Feature>} Features.
   */
  readFeaturesFromText(text, opt_options) {}

  /**
   * @inheritDoc
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
   * @inheritDoc
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
   * @inheritDoc
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
   * @inheritDoc
   */
  writeFeatures(features, opt_options) {
    return this.writeFeaturesText(features, this.adaptOptions(opt_options));
  }

  /**
   * @abstract
   * @param {Array.<module:ol/Feature>} features Features.
   * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
   * @protected
   * @return {string} Text.
   */
  writeFeaturesText(features, opt_options) {}

  /**
   * @inheritDoc
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

inherits(TextFeature, FeatureFormat);


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
