goog.provide('ol.format.XMLFeature');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('ol.format.Feature');
goog.require('ol.format.FormatType');
goog.require('ol.proj');
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
  goog.base(this);
};
goog.inherits(ol.format.XMLFeature, ol.format.Feature);


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
  } else if (goog.isString(source)) {
    var doc = ol.xml.load(source);
    return this.readFeatureFromDocument(doc, opt_options);
  } else {
    goog.asserts.fail();
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
 * @param {Node} node Node.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @return {ol.Feature} Feature.
 */
ol.format.XMLFeature.prototype.readFeatureFromNode = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.readFeatures = function(source, opt_options) {
  if (ol.xml.isDocument(source)) {
    return this.readFeaturesFromDocument(
        /** @type {Document} */ (source), opt_options);
  } else if (ol.xml.isNode(source)) {
    return this.readFeaturesFromNode(/** @type {Node} */ (source), opt_options);
  } else if (goog.isString(source)) {
    var doc = ol.xml.load(source);
    return this.readFeaturesFromDocument(doc, opt_options);
  } else {
    goog.asserts.fail();
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
  for (n = doc.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      goog.array.extend(features, this.readFeaturesFromNode(n, opt_options));
    }
  }
  return features;
};


/**
 * @param {Node} node Node.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.XMLFeature.prototype.readFeaturesFromNode = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.readGeometry = function(source, opt_options) {
  if (ol.xml.isDocument(source)) {
    return this.readGeometryFromDocument(
        /** @type {Document} */ (source), opt_options);
  } else if (ol.xml.isNode(source)) {
    return this.readGeometryFromNode(/** @type {Node} */ (source), opt_options);
  } else if (goog.isString(source)) {
    var doc = ol.xml.load(source);
    return this.readGeometryFromDocument(doc, opt_options);
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @param {Document} doc Document.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.XMLFeature.prototype.readGeometryFromDocument = goog.abstractMethod;


/**
 * @param {Node} node Node.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.XMLFeature.prototype.readGeometryFromNode = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.readProjection = function(source) {
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
ol.format.XMLFeature.prototype.readProjectionFromDocument = goog.abstractMethod;


/**
 * @param {Node} node Node.
 * @protected
 * @return {ol.proj.Projection} Projection.
 */
ol.format.XMLFeature.prototype.readProjectionFromNode = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.writeFeature = function(feature, opt_options) {
  return this.writeFeatureNode(feature, this.adaptOptions(opt_options));
};


/**
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @protected
 * @return {Node} Node.
 */
ol.format.XMLFeature.prototype.writeFeatureNode = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.writeFeatures = function(features, opt_options) {
  return this.writeFeaturesNode(features, this.adaptOptions(opt_options));
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @protected
 * @return {Node} Node.
 */
ol.format.XMLFeature.prototype.writeFeaturesNode = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.XMLFeature.prototype.writeGeometry = function(geometry, opt_options) {
  return this.writeGeometryNode(geometry, this.adaptOptions(opt_options));
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @protected
 * @return {Node} Node.
 */
ol.format.XMLFeature.prototype.writeGeometryNode = goog.abstractMethod;
