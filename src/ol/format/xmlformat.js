goog.provide('ol.format.XML');

goog.require('goog.asserts');
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
 * @param {Document|Node|Object|string} source Source.
 * @private
 * @return {Document} Document.
 */
ol.format.XML.prototype.getDocument_ = function(source) {
  if (source instanceof Document) {
    return source;
  } else if (goog.isString(source)) {
    return goog.dom.xml.loadXml(source);
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @param {Document|Node|Object|string} source Source.
 * @private
 * @return {Document|Node} Document.
 */
ol.format.XML.prototype.getDocumentOrNode_ = function(source) {
  if (source instanceof Document) {
    return source;
  } else if (source instanceof Node) {
    return source;
  } else if (goog.isString(source)) {
    return goog.dom.xml.loadXml(source);
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @param {Document|Node|Object|string} source Source.
 * @private
 * @return {Node} Node.
 */
ol.format.XML.prototype.getNode_ = function(source) {
  if (source instanceof Node) {
    return source;
  } else {
    goog.asserts.fail();
    return null;
  }
};


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
  return this.readFeatureFromNode(this.getNode_(source));
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
  var documentOrNode = this.getDocumentOrNode_(source);
  if (documentOrNode instanceof Document) {
    return this.readFeaturesFromDocument(documentOrNode);
  } else if (documentOrNode instanceof Node) {
    return this.readFeaturesFromNode(documentOrNode);
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @param {Document} doc Document.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.XML.prototype.readFeaturesFromDocument = function(doc) {
  goog.asserts.assert(doc.childNodes.length == 1);
  return this.readFeaturesFromNode(doc.firstChild);
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
  return this.readGeometryFromNode(this.getNode_(source));
};


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
  return this.readProjectionFromNode(this.getNode_(source));
};


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
