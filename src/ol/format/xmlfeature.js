goog.provide('ol.format.XMLFeature');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.format.Feature');
goog.require('ol.format.FormatType');
goog.require('ol.xml');


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for XML feature formats.
 *
 * @constructor
 * @extends {ol.format.Feature}
 */
ol.format.XMLFeature = function() {

  /**
   * @type {XMLSerializer}
   * @private
   */
  this.xmlSerializer_ = new XMLSerializer();

  ol.format.Feature.call(this);
};
ol.inherits(ol.format.XMLFeature, ol.format.Feature);


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.getType = function() {
  return ol.format.FormatType.XML;
};


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.readFeature = function(source, opt_options) {
  if (ol.xml.isDocument(source)) {
    return this.readFeatureFromDocument(
        /** @type {Document} */ (source), opt_options);
  } else if (ol.xml.isNode(source)) {
    return this.readFeatureFromNode(/** @type {Node} */ (source), opt_options);
  } else if (typeof source === 'string') {
    var doc = ol.xml.parse(source);
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
ol.format.XMLFeature.prototype.readFeatureFromDocument = function(
    doc, opt_options) {
  var features = this.readFeaturesFromDocument(doc, opt_options);
  if (features.length > 0) {
    return features[0];
  } else {
    return null;
  }
};


/**
 * @abstract
 * @param {Node} node Node.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @return {ol.Feature} Feature.
 */
ol.format.XMLFeature.prototype.readFeatureFromNode = function(node, opt_options) {};


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.readFeatures = function(source, opt_options) {
  if (ol.xml.isDocument(source)) {
    return this.readFeaturesFromDocument(
        /** @type {Document} */ (source), opt_options);
  } else if (ol.xml.isNode(source)) {
    return this.readFeaturesFromNode(/** @type {Node} */ (source), opt_options);
  } else if (typeof source === 'string') {
    var doc = ol.xml.parse(source);
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
ol.format.XMLFeature.prototype.readFeaturesFromDocument = function(
    doc, opt_options) {
  /** @type {Array.<ol.Feature>} */
  var features = [];
  var n;
  for (n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      ol.array.extend(features, this.readFeaturesFromNode(n, opt_options));
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
ol.format.XMLFeature.prototype.readFeaturesFromNode = function(node, opt_options) {};


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.readGeometry = function(source, opt_options) {
  if (ol.xml.isDocument(source)) {
    return this.readGeometryFromDocument(
        /** @type {Document} */ (source), opt_options);
  } else if (ol.xml.isNode(source)) {
    return this.readGeometryFromNode(/** @type {Node} */ (source), opt_options);
  } else if (typeof source === 'string') {
    var doc = ol.xml.parse(source);
    return this.readGeometryFromDocument(doc, opt_options);
  } else {
    return null;
  }
};


/**
 * @abstract
 * @param {Document} doc Document.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.XMLFeature.prototype.readGeometryFromDocument = function(doc, opt_options) {};


/**
 * @abstract
 * @param {Node} node Node.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.XMLFeature.prototype.readGeometryFromNode = function(node, opt_options) {};


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.readProjection = function(source) {
  if (ol.xml.isDocument(source)) {
    return this.readProjectionFromDocument(/** @type {Document} */ (source));
  } else if (ol.xml.isNode(source)) {
    return this.readProjectionFromNode(/** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    var doc = ol.xml.parse(source);
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
ol.format.XMLFeature.prototype.readProjectionFromDocument = function(doc) {
  return this.defaultDataProjection;
};


/**
 * @param {Node} node Node.
 * @protected
 * @return {ol.proj.Projection} Projection.
 */
ol.format.XMLFeature.prototype.readProjectionFromNode = function(node) {
  return this.defaultDataProjection;
};


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.writeFeature = function(feature, opt_options) {
  var node = this.writeFeatureNode(feature, opt_options);
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  return this.xmlSerializer_.serializeToString(node);
};


/**
 * @abstract
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @protected
 * @return {Node} Node.
 */
ol.format.XMLFeature.prototype.writeFeatureNode = function(feature, opt_options) {};


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.writeFeatures = function(features, opt_options) {
  var node = this.writeFeaturesNode(features, opt_options);
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  return this.xmlSerializer_.serializeToString(node);
};


/**
 * @abstract
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {Node} Node.
 */
ol.format.XMLFeature.prototype.writeFeaturesNode = function(features, opt_options) {};


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.writeGeometry = function(geometry, opt_options) {
  var node = this.writeGeometryNode(geometry, opt_options);
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  return this.xmlSerializer_.serializeToString(node);
};


/**
 * @abstract
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {Node} Node.
 */
ol.format.XMLFeature.prototype.writeGeometryNode = function(geometry, opt_options) {};
