goog.provide('ol.format.XML');

goog.require('goog.asserts');
goog.require('goog.dom.xml');
goog.require('ol.format.Format');
goog.require('ol.format.FormatType');
goog.require('ol.proj');



/**
 * @constructor
 * @extends {ol.format.Format}
 */
ol.format.XML = function() {

  goog.base(this);

  /**
   * @type {XMLSerializer}
   * @private
   */
  this.serializer_ = null;

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
 * @return {XMLSerializer} Serializer.
 * @private
 */
ol.format.XML.prototype.getSerializer_ = function() {
  if (goog.isNull(this.serializer_)) {
    this.serializer_ = new XMLSerializer();
  }
  return this.serializer_;
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
ol.format.XML.prototype.readProjectionFromNode = function(node) {
  return ol.proj.get('EPSG:4326');
};


/**
 * @inheritDoc
 */
ol.format.XML.prototype.writeFeature = function(feature) {
  return this.writeFeatureNode(feature);
};


/**
 * @inheritDoc
 */
ol.format.XML.prototype.writeFeatureAsString = function(feature) {
  var node = this.writeFeatureNode(feature);
  return this.getSerializer_().serializeToString(node);
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
 * @inheritDoc
 */
ol.format.XML.prototype.writeFeaturesAsString = function(features) {
  var node = this.writeFeaturesNode(features);
  return this.getSerializer_().serializeToString(node);
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
 * @inheritDoc
 */
ol.format.XML.prototype.writeGeometryAsString = function(geometry) {
  var node = this.writeGeometryNode(geometry);
  return this.getSerializer_().serializeToString(node);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @protected
 * @return {Node} Node.
 */
ol.format.XML.prototype.writeGeometryNode = goog.abstractMethod;
