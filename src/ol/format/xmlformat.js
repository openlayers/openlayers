goog.provide('ol.format.XML');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('goog.dom.xml');
goog.require('ol.format.Format');
goog.require('ol.format.FormatType');



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
  if (source instanceof Document) {
    return this.readFeatureFromDocument(source);
  } else if (source instanceof Node) {
    return this.readFeatureFromNode(source);
  } else if (goog.isString(source)) {
    var doc = goog.dom.xml.loadXml(source);
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
  if (source instanceof Document) {
    return this.readFeaturesFromDocument(source);
  } else if (source instanceof Node) {
    return this.readFeaturesFromNode(source);
  } else if (goog.isString(source)) {
    var doc = goog.dom.xml.loadXml(source);
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
  if (source instanceof Document) {
    return this.readGeometryFromDocument(source);
  } else if (source instanceof Node) {
    return this.readGeometryFromNode(source);
  } else if (goog.isString(source)) {
    var doc = goog.dom.xml.loadXml(source);
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
  if (source instanceof Document) {
    return this.readProjectionFromDocument(source);
  } else if (source instanceof Node) {
    return this.readProjectionFromNode(source);
  } else if (goog.isString(source)) {
    var doc = goog.dom.xml.loadXml(source);
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
