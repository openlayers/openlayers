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
 * @constructor
 * @abstract
 * @extends {module:ol/format/Feature}
 */
const TextFeature = function() {
  FeatureFormat.call(this);
};

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


/**
 * @inheritDoc
 */
TextFeature.prototype.getType = function() {
  return FormatType.TEXT;
};


/**
 * @inheritDoc
 */
TextFeature.prototype.readFeature = function(source, opt_options) {
  return this.readFeatureFromText(getText(source), this.adaptOptions(opt_options));
};


/**
 * @abstract
 * @param {string} text Text.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @protected
 * @return {module:ol/Feature} Feature.
 */
TextFeature.prototype.readFeatureFromText = function(text, opt_options) {};


/**
 * @inheritDoc
 */
TextFeature.prototype.readFeatures = function(source, opt_options) {
  return this.readFeaturesFromText(getText(source), this.adaptOptions(opt_options));
};


/**
 * @abstract
 * @param {string} text Text.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @protected
 * @return {Array.<module:ol/Feature>} Features.
 */
TextFeature.prototype.readFeaturesFromText = function(text, opt_options) {};


/**
 * @inheritDoc
 */
TextFeature.prototype.readGeometry = function(source, opt_options) {
  return this.readGeometryFromText(getText(source), this.adaptOptions(opt_options));
};


/**
 * @abstract
 * @param {string} text Text.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @protected
 * @return {module:ol/geom/Geometry} Geometry.
 */
TextFeature.prototype.readGeometryFromText = function(text, opt_options) {};


/**
 * @inheritDoc
 */
TextFeature.prototype.readProjection = function(source) {
  return this.readProjectionFromText(getText(source));
};


/**
 * @param {string} text Text.
 * @protected
 * @return {module:ol/proj/Projection} Projection.
 */
TextFeature.prototype.readProjectionFromText = function(text) {
  return this.dataProjection;
};


/**
 * @inheritDoc
 */
TextFeature.prototype.writeFeature = function(feature, opt_options) {
  return this.writeFeatureText(feature, this.adaptOptions(opt_options));
};


/**
 * @abstract
 * @param {module:ol/Feature} feature Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @protected
 * @return {string} Text.
 */
TextFeature.prototype.writeFeatureText = function(feature, opt_options) {};


/**
 * @inheritDoc
 */
TextFeature.prototype.writeFeatures = function(features, opt_options) {
  return this.writeFeaturesText(features, this.adaptOptions(opt_options));
};


/**
 * @abstract
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @protected
 * @return {string} Text.
 */
TextFeature.prototype.writeFeaturesText = function(features, opt_options) {};


/**
 * @inheritDoc
 */
TextFeature.prototype.writeGeometry = function(geometry, opt_options) {
  return this.writeGeometryText(geometry, this.adaptOptions(opt_options));
};


/**
 * @abstract
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @protected
 * @return {string} Text.
 */
TextFeature.prototype.writeGeometryText = function(geometry, opt_options) {};
export default TextFeature;
