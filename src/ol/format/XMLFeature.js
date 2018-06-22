/**
 * @module ol/format/XMLFeature
 */
import {inherits} from '../util.js';
import {extend} from '../array.js';
import FeatureFormat from '../format/Feature.js';
import FormatType from '../format/FormatType.js';
import {isDocument, isNode, parse} from '../xml.js';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for XML feature formats.
 *
 * @constructor
 * @abstract
 * @extends {module:ol/format/Feature}
 */
const XMLFeature = function() {

  /**
   * @type {XMLSerializer}
   * @private
   */
  this.xmlSerializer_ = new XMLSerializer();

  FeatureFormat.call(this);
};

inherits(XMLFeature, FeatureFormat);


/**
 * @inheritDoc
 */
XMLFeature.prototype.getType = function() {
  return FormatType.XML;
};


/**
 * @inheritDoc
 */
XMLFeature.prototype.readFeature = function(source, opt_options) {
  if (isDocument(source)) {
    return this.readFeatureFromDocument(/** @type {Document} */ (source), opt_options);
  } else if (isNode(source)) {
    return this.readFeatureFromNode(/** @type {Node} */ (source), opt_options);
  } else if (typeof source === 'string') {
    const doc = parse(source);
    return this.readFeatureFromDocument(doc, opt_options);
  } else {
    return null;
  }
};


/**
 * @param {Document} doc Document.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Options.
 * @return {module:ol/Feature} Feature.
 */
XMLFeature.prototype.readFeatureFromDocument = function(doc, opt_options) {
  const features = this.readFeaturesFromDocument(doc, opt_options);
  if (features.length > 0) {
    return features[0];
  } else {
    return null;
  }
};


/**
 * @param {Node} node Node.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Options.
 * @return {module:ol/Feature} Feature.
 */
XMLFeature.prototype.readFeatureFromNode = function(node, opt_options) {
  return null; // not implemented
};


/**
 * @inheritDoc
 */
XMLFeature.prototype.readFeatures = function(source, opt_options) {
  if (isDocument(source)) {
    return this.readFeaturesFromDocument(
      /** @type {Document} */ (source), opt_options);
  } else if (isNode(source)) {
    return this.readFeaturesFromNode(/** @type {Node} */ (source), opt_options);
  } else if (typeof source === 'string') {
    const doc = parse(source);
    return this.readFeaturesFromDocument(doc, opt_options);
  } else {
    return [];
  }
};


/**
 * @param {Document} doc Document.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Options.
 * @protected
 * @return {Array.<module:ol/Feature>} Features.
 */
XMLFeature.prototype.readFeaturesFromDocument = function(doc, opt_options) {
  /** @type {Array.<module:ol/Feature>} */
  const features = [];
  for (let n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      extend(features, this.readFeaturesFromNode(n, opt_options));
    }
  }
  return features;
};


/**
 * @abstract
 * @param {Node} node Node.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Options.
 * @protected
 * @return {Array.<module:ol/Feature>} Features.
 */
XMLFeature.prototype.readFeaturesFromNode = function(node, opt_options) {};


/**
 * @inheritDoc
 */
XMLFeature.prototype.readGeometry = function(source, opt_options) {
  if (isDocument(source)) {
    return this.readGeometryFromDocument(
      /** @type {Document} */ (source), opt_options);
  } else if (isNode(source)) {
    return this.readGeometryFromNode(/** @type {Node} */ (source), opt_options);
  } else if (typeof source === 'string') {
    const doc = parse(source);
    return this.readGeometryFromDocument(doc, opt_options);
  } else {
    return null;
  }
};


/**
 * @param {Document} doc Document.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Options.
 * @protected
 * @return {module:ol/geom/Geometry} Geometry.
 */
XMLFeature.prototype.readGeometryFromDocument = function(doc, opt_options) {
  return null; // not implemented
};


/**
 * @param {Node} node Node.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Options.
 * @protected
 * @return {module:ol/geom/Geometry} Geometry.
 */
XMLFeature.prototype.readGeometryFromNode = function(node, opt_options) {
  return null; // not implemented
};


/**
 * @inheritDoc
 */
XMLFeature.prototype.readProjection = function(source) {
  if (isDocument(source)) {
    return this.readProjectionFromDocument(/** @type {Document} */ (source));
  } else if (isNode(source)) {
    return this.readProjectionFromNode(/** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    const doc = parse(source);
    return this.readProjectionFromDocument(doc);
  } else {
    return null;
  }
};


/**
 * @param {Document} doc Document.
 * @protected
 * @return {module:ol/proj/Projection} Projection.
 */
XMLFeature.prototype.readProjectionFromDocument = function(doc) {
  return this.dataProjection;
};


/**
 * @param {Node} node Node.
 * @protected
 * @return {module:ol/proj/Projection} Projection.
 */
XMLFeature.prototype.readProjectionFromNode = function(node) {
  return this.dataProjection;
};


/**
 * @inheritDoc
 */
XMLFeature.prototype.writeFeature = function(feature, opt_options) {
  const node = this.writeFeatureNode(feature, opt_options);
  return this.xmlSerializer_.serializeToString(node);
};


/**
 * @param {module:ol/Feature} feature Feature.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Options.
 * @protected
 * @return {Node} Node.
 */
XMLFeature.prototype.writeFeatureNode = function(feature, opt_options) {
  return null; // not implemented
};


/**
 * @inheritDoc
 */
XMLFeature.prototype.writeFeatures = function(features, opt_options) {
  const node = this.writeFeaturesNode(features, opt_options);
  return this.xmlSerializer_.serializeToString(node);
};


/**
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Options.
 * @return {Node} Node.
 */
XMLFeature.prototype.writeFeaturesNode = function(features, opt_options) {
  return null; // not implemented
};


/**
 * @inheritDoc
 */
XMLFeature.prototype.writeGeometry = function(geometry, opt_options) {
  const node = this.writeGeometryNode(geometry, opt_options);
  return this.xmlSerializer_.serializeToString(node);
};


/**
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Options.
 * @return {Node} Node.
 */
XMLFeature.prototype.writeGeometryNode = function(geometry, opt_options) {
  return null; // not implemented
};
export default XMLFeature;
