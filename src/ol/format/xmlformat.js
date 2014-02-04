goog.provide('ol.format.XML');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('ol.format.Format');
goog.require('ol.format.FormatType');
goog.require('ol.xml');



/**
 * @constructor
 * @extends {ol.format.Format}
 */
ol.format.XML = function() {
  goog.base(this);
};
goog.inherits(ol.format.XML, ol.format.Format);


/**
 * @inheritDoc
 */
ol.format.XML.prototype.getType = function() {
  return ol.format.FormatType.XML;
};


/**
 * @inheritDoc
 */
ol.format.XML.prototype.readFeature = function(source) {
  if (ol.xml.isDocument(source)) {
    return this.readFeatureFromDocument(/** @type {Document} */ (source));
  } else if (ol.xml.isNode(source)) {
    return this.readFeatureFromNode(/** @type {Node} */ (source));
  } else if (goog.isString(source)) {
    var doc = ol.xml.load(source);
    return this.readFeatureFromDocument(doc);
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @param {Document} doc Document.
 * @return {ol.Feature} Feature.
 */
ol.format.XML.prototype.readFeatureFromDocument = function(doc) {
  var features = this.readFeaturesFromDocument(doc);
  if (features.length > 0) {
    return features[0];
  } else {
    return null;
  }
};


/**
 * @param {Node} node Node.
 * @return {ol.Feature} Feature.
 */
ol.format.XML.prototype.readFeatureFromNode = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.XML.prototype.readFeatures = function(source) {
  if (ol.xml.isDocument(source)) {
    return this.readFeaturesFromDocument(/** @type {Document} */ (source));
  } else if (ol.xml.isNode(source)) {
    return this.readFeaturesFromNode(/** @type {Node} */ (source));
  } else if (goog.isString(source)) {
    var doc = ol.xml.load(source);
    return this.readFeaturesFromDocument(doc);
  } else {
    goog.asserts.fail();
    return [];
  }
};


/**
 * @param {Document} doc Document.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.XML.prototype.readFeaturesFromDocument = function(doc) {
  /** @type {Array.<ol.Feature>} */
  var features = [];
  var n;
  for (n = doc.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      goog.array.extend(features, this.readFeaturesFromNode(n));
    }
  }
  return features;
};


/**
 * @param {Node} node Node.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.XML.prototype.readFeaturesFromNode = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.XML.prototype.readGeometry = function(source) {
  if (ol.xml.isDocument(source)) {
    return this.readGeometryFromDocument(/** @type {Document} */ (source));
  } else if (ol.xml.isNode(source)) {
    return this.readGeometryFromNode(/** @type {Node} */ (source));
  } else if (goog.isString(source)) {
    var doc = ol.xml.load(source);
    return this.readGeometryFromDocument(doc);
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @param {Document} doc Document.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.XML.prototype.readGeometryFromDocument = goog.abstractMethod;


/**
 * @param {Node} node Node.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.XML.prototype.readGeometryFromNode = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.XML.prototype.readProjection = function(source) {
  if (ol.xml.isDocument(source)) {
    return this.readProjectionFromDocument(/** @type {Document} */ (source));
  } else if (ol.xml.isNode(source)) {
    return this.readProjectionFromNode(/** @type {Node} */ (source));
  } else if (goog.isString(source)) {
    var doc = ol.xml.load(source);
    return this.readProjectionFromDocument(doc);
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @param {Document} doc Document.
 * @protected
 * @return {ol.proj.Projection} Projection.
 */
ol.format.XML.prototype.readProjectionFromDocument = goog.abstractMethod;


/**
 * @param {Node} node Node.
 * @protected
 * @return {ol.proj.Projection} Projection.
 */
ol.format.XML.prototype.readProjectionFromNode = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.XML.prototype.writeFeature = function(feature) {
  return this.writeFeatureNode(feature);
};


/**
 * @param {ol.Feature} feature Feature.
 * @protected
 * @return {Node} Node.
 */
ol.format.XML.prototype.writeFeatureNode = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.XML.prototype.writeFeatures = function(features) {
  return this.writeFeaturesNode(features);
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @protected
 * @return {Node} Node.
 */
ol.format.XML.prototype.writeFeaturesNode = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.XML.prototype.writeGeometry = function(geometry) {
  return this.writeGeometryNode(geometry);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @protected
 * @return {Node} Node.
 */
ol.format.XML.prototype.writeGeometryNode = goog.abstractMethod;
