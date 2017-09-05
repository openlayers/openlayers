import _ol_ from '../index';
import _ol_format_Feature_ from '../format/feature';
import _ol_format_FormatType_ from '../format/formattype';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for text feature formats.
 *
 * @constructor
 * @abstract
 * @extends {ol.format.Feature}
 */
var _ol_format_TextFeature_ = function() {
  _ol_format_Feature_.call(this);
};

_ol_.inherits(_ol_format_TextFeature_, _ol_format_Feature_);


/**
 * @param {Document|Node|Object|string} source Source.
 * @private
 * @return {string} Text.
 */
_ol_format_TextFeature_.prototype.getText_ = function(source) {
  if (typeof source === 'string') {
    return source;
  } else {
    return '';
  }
};


/**
 * @inheritDoc
 */
_ol_format_TextFeature_.prototype.getType = function() {
  return _ol_format_FormatType_.TEXT;
};


/**
 * @inheritDoc
 */
_ol_format_TextFeature_.prototype.readFeature = function(source, opt_options) {
  return this.readFeatureFromText(
      this.getText_(source), this.adaptOptions(opt_options));
};


/**
 * @abstract
 * @param {string} text Text.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {ol.Feature} Feature.
 */
_ol_format_TextFeature_.prototype.readFeatureFromText = function(text, opt_options) {};


/**
 * @inheritDoc
 */
_ol_format_TextFeature_.prototype.readFeatures = function(source, opt_options) {
  return this.readFeaturesFromText(
      this.getText_(source), this.adaptOptions(opt_options));
};


/**
 * @abstract
 * @param {string} text Text.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
_ol_format_TextFeature_.prototype.readFeaturesFromText = function(text, opt_options) {};


/**
 * @inheritDoc
 */
_ol_format_TextFeature_.prototype.readGeometry = function(source, opt_options) {
  return this.readGeometryFromText(
      this.getText_(source), this.adaptOptions(opt_options));
};


/**
 * @abstract
 * @param {string} text Text.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
_ol_format_TextFeature_.prototype.readGeometryFromText = function(text, opt_options) {};


/**
 * @inheritDoc
 */
_ol_format_TextFeature_.prototype.readProjection = function(source) {
  return this.readProjectionFromText(this.getText_(source));
};


/**
 * @param {string} text Text.
 * @protected
 * @return {ol.proj.Projection} Projection.
 */
_ol_format_TextFeature_.prototype.readProjectionFromText = function(text) {
  return this.defaultDataProjection;
};


/**
 * @inheritDoc
 */
_ol_format_TextFeature_.prototype.writeFeature = function(feature, opt_options) {
  return this.writeFeatureText(feature, this.adaptOptions(opt_options));
};


/**
 * @abstract
 * @param {ol.Feature} feature Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @protected
 * @return {string} Text.
 */
_ol_format_TextFeature_.prototype.writeFeatureText = function(feature, opt_options) {};


/**
 * @inheritDoc
 */
_ol_format_TextFeature_.prototype.writeFeatures = function(
    features, opt_options) {
  return this.writeFeaturesText(features, this.adaptOptions(opt_options));
};


/**
 * @abstract
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @protected
 * @return {string} Text.
 */
_ol_format_TextFeature_.prototype.writeFeaturesText = function(features, opt_options) {};


/**
 * @inheritDoc
 */
_ol_format_TextFeature_.prototype.writeGeometry = function(
    geometry, opt_options) {
  return this.writeGeometryText(geometry, this.adaptOptions(opt_options));
};


/**
 * @abstract
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @protected
 * @return {string} Text.
 */
_ol_format_TextFeature_.prototype.writeGeometryText = function(geometry, opt_options) {};
export default _ol_format_TextFeature_;
