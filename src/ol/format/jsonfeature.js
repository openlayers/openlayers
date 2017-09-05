import _ol_ from '../index';
import _ol_format_Feature_ from '../format/feature';
import _ol_format_FormatType_ from '../format/formattype';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for JSON feature formats.
 *
 * @constructor
 * @abstract
 * @extends {ol.format.Feature}
 */
var _ol_format_JSONFeature_ = function() {
  _ol_format_Feature_.call(this);
};

_ol_.inherits(_ol_format_JSONFeature_, _ol_format_Feature_);


/**
 * @param {Document|Node|Object|string} source Source.
 * @private
 * @return {Object} Object.
 */
_ol_format_JSONFeature_.prototype.getObject_ = function(source) {
  if (typeof source === 'string') {
    var object = JSON.parse(source);
    return object ? /** @type {Object} */ (object) : null;
  } else if (source !== null) {
    return source;
  } else {
    return null;
  }
};


/**
 * @inheritDoc
 */
_ol_format_JSONFeature_.prototype.getType = function() {
  return _ol_format_FormatType_.JSON;
};


/**
 * @inheritDoc
 */
_ol_format_JSONFeature_.prototype.readFeature = function(source, opt_options) {
  return this.readFeatureFromObject(
      this.getObject_(source), this.getReadOptions(source, opt_options));
};


/**
 * @inheritDoc
 */
_ol_format_JSONFeature_.prototype.readFeatures = function(source, opt_options) {
  return this.readFeaturesFromObject(
      this.getObject_(source), this.getReadOptions(source, opt_options));
};


/**
 * @abstract
 * @param {Object} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {ol.Feature} Feature.
 */
_ol_format_JSONFeature_.prototype.readFeatureFromObject = function(object, opt_options) {};


/**
 * @abstract
 * @param {Object} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
_ol_format_JSONFeature_.prototype.readFeaturesFromObject = function(object, opt_options) {};


/**
 * @inheritDoc
 */
_ol_format_JSONFeature_.prototype.readGeometry = function(source, opt_options) {
  return this.readGeometryFromObject(
      this.getObject_(source), this.getReadOptions(source, opt_options));
};


/**
 * @abstract
 * @param {Object} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
_ol_format_JSONFeature_.prototype.readGeometryFromObject = function(object, opt_options) {};


/**
 * @inheritDoc
 */
_ol_format_JSONFeature_.prototype.readProjection = function(source) {
  return this.readProjectionFromObject(this.getObject_(source));
};


/**
 * @abstract
 * @param {Object} object Object.
 * @protected
 * @return {ol.proj.Projection} Projection.
 */
_ol_format_JSONFeature_.prototype.readProjectionFromObject = function(object) {};


/**
 * @inheritDoc
 */
_ol_format_JSONFeature_.prototype.writeFeature = function(feature, opt_options) {
  return JSON.stringify(this.writeFeatureObject(feature, opt_options));
};


/**
 * @abstract
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 */
_ol_format_JSONFeature_.prototype.writeFeatureObject = function(feature, opt_options) {};


/**
 * @inheritDoc
 */
_ol_format_JSONFeature_.prototype.writeFeatures = function(features, opt_options) {
  return JSON.stringify(this.writeFeaturesObject(features, opt_options));
};


/**
 * @abstract
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 */
_ol_format_JSONFeature_.prototype.writeFeaturesObject = function(features, opt_options) {};


/**
 * @inheritDoc
 */
_ol_format_JSONFeature_.prototype.writeGeometry = function(geometry, opt_options) {
  return JSON.stringify(this.writeGeometryObject(geometry, opt_options));
};


/**
 * @abstract
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 */
_ol_format_JSONFeature_.prototype.writeGeometryObject = function(geometry, opt_options) {};
export default _ol_format_JSONFeature_;
