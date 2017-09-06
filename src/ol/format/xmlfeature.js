import _ol_ from '../index';
import _ol_array_ from '../array';
import _ol_format_Feature_ from '../format/feature';
import _ol_format_FormatType_ from '../format/formattype';
import _ol_xml_ from '../xml';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for XML feature formats.
 *
 * @constructor
 * @abstract
 * @extends {ol.format.Feature}
 */
var _ol_format_XMLFeature_ = function() {

  /**
   * @type {XMLSerializer}
   * @private
   */
  this.xmlSerializer_ = new XMLSerializer();

  _ol_format_Feature_.call(this);
};

_ol_.inherits(_ol_format_XMLFeature_, _ol_format_Feature_);


/**
 * @inheritDoc
 */
_ol_format_XMLFeature_.prototype.getType = function() {
  return _ol_format_FormatType_.XML;
};


/**
 * @inheritDoc
 */
_ol_format_XMLFeature_.prototype.readFeature = function(source, opt_options) {
  if (_ol_xml_.isDocument(source)) {
    return this.readFeatureFromDocument(
        /** @type {Document} */ (source), opt_options);
  } else if (_ol_xml_.isNode(source)) {
    return this.readFeatureFromNode(/** @type {Node} */ (source), opt_options);
  } else if (typeof source === 'string') {
    var doc = _ol_xml_.parse(source);
    return this.readFeatureFromDocument(doc, opt_options);
  } else {
    return null;
  }
};


/**
 * @param {Document} doc Document.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @return {ol.Feature} Feature.
 */
_ol_format_XMLFeature_.prototype.readFeatureFromDocument = function(
    doc, opt_options) {
  var features = this.readFeaturesFromDocument(doc, opt_options);
  if (features.length > 0) {
    return features[0];
  } else {
    return null;
  }
};


/**
 * @param {Node} node Node.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @return {ol.Feature} Feature.
 */
_ol_format_XMLFeature_.prototype.readFeatureFromNode = function(node, opt_options) {
  return null; // not implemented
};


/**
 * @inheritDoc
 */
_ol_format_XMLFeature_.prototype.readFeatures = function(source, opt_options) {
  if (_ol_xml_.isDocument(source)) {
    return this.readFeaturesFromDocument(
        /** @type {Document} */ (source), opt_options);
  } else if (_ol_xml_.isNode(source)) {
    return this.readFeaturesFromNode(/** @type {Node} */ (source), opt_options);
  } else if (typeof source === 'string') {
    var doc = _ol_xml_.parse(source);
    return this.readFeaturesFromDocument(doc, opt_options);
  } else {
    return [];
  }
};


/**
 * @param {Document} doc Document.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
_ol_format_XMLFeature_.prototype.readFeaturesFromDocument = function(
    doc, opt_options) {
  /** @type {Array.<ol.Feature>} */
  var features = [];
  var n;
  for (n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      _ol_array_.extend(features, this.readFeaturesFromNode(n, opt_options));
    }
  }
  return features;
};


/**
 * @abstract
 * @param {Node} node Node.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
_ol_format_XMLFeature_.prototype.readFeaturesFromNode = function(node, opt_options) {};


/**
 * @inheritDoc
 */
_ol_format_XMLFeature_.prototype.readGeometry = function(source, opt_options) {
  if (_ol_xml_.isDocument(source)) {
    return this.readGeometryFromDocument(
        /** @type {Document} */ (source), opt_options);
  } else if (_ol_xml_.isNode(source)) {
    return this.readGeometryFromNode(/** @type {Node} */ (source), opt_options);
  } else if (typeof source === 'string') {
    var doc = _ol_xml_.parse(source);
    return this.readGeometryFromDocument(doc, opt_options);
  } else {
    return null;
  }
};


/**
 * @param {Document} doc Document.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
_ol_format_XMLFeature_.prototype.readGeometryFromDocument = function(doc, opt_options) {
  return null; // not implemented
};


/**
 * @param {Node} node Node.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
_ol_format_XMLFeature_.prototype.readGeometryFromNode = function(node, opt_options) {
  return null; // not implemented
};


/**
 * @inheritDoc
 */
_ol_format_XMLFeature_.prototype.readProjection = function(source) {
  if (_ol_xml_.isDocument(source)) {
    return this.readProjectionFromDocument(/** @type {Document} */ (source));
  } else if (_ol_xml_.isNode(source)) {
    return this.readProjectionFromNode(/** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    var doc = _ol_xml_.parse(source);
    return this.readProjectionFromDocument(doc);
  } else {
    return null;
  }
};


/**
 * @param {Document} doc Document.
 * @protected
 * @return {ol.proj.Projection} Projection.
 */
_ol_format_XMLFeature_.prototype.readProjectionFromDocument = function(doc) {
  return this.defaultDataProjection;
};


/**
 * @param {Node} node Node.
 * @protected
 * @return {ol.proj.Projection} Projection.
 */
_ol_format_XMLFeature_.prototype.readProjectionFromNode = function(node) {
  return this.defaultDataProjection;
};


/**
 * @inheritDoc
 */
_ol_format_XMLFeature_.prototype.writeFeature = function(feature, opt_options) {
  var node = this.writeFeatureNode(feature, opt_options);
  return this.xmlSerializer_.serializeToString(node);
};


/**
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @protected
 * @return {Node} Node.
 */
_ol_format_XMLFeature_.prototype.writeFeatureNode = function(feature, opt_options) {
  return null; // not implemented
};


/**
 * @inheritDoc
 */
_ol_format_XMLFeature_.prototype.writeFeatures = function(features, opt_options) {
  var node = this.writeFeaturesNode(features, opt_options);
  return this.xmlSerializer_.serializeToString(node);
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {Node} Node.
 */
_ol_format_XMLFeature_.prototype.writeFeaturesNode = function(features, opt_options) {
  return null; // not implemented
};


/**
 * @inheritDoc
 */
_ol_format_XMLFeature_.prototype.writeGeometry = function(geometry, opt_options) {
  var node = this.writeGeometryNode(geometry, opt_options);
  return this.xmlSerializer_.serializeToString(node);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {Node} Node.
 */
_ol_format_XMLFeature_.prototype.writeGeometryNode = function(geometry, opt_options) {
  return null; // not implemented
};
export default _ol_format_XMLFeature_;
