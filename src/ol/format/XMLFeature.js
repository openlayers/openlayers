/**
 * @module ol/format/XMLFeature
 */
import {extend} from '../array.js';
import FeatureFormat from '../format/Feature.js';
import {abstract} from '../util.js';
import {getXMLSerializer, isDocument, parse} from '../xml.js';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for XML feature formats.
 *
 * @abstract
 */
class XMLFeature extends FeatureFormat {
  constructor() {
    super();

    /**
     * @type {XMLSerializer}
     * @private
     */
    this.xmlSerializer_ = getXMLSerializer();
  }

  /**
   * @return {import("./Feature.js").Type} Format.
   * @override
   */
  getType() {
    return 'xml';
  }

  /**
   * Read a single feature.
   *
   * @param {Document|Element|Object|string} source Source.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @return {import("../Feature.js").default} Feature.
   * @api
   * @override
   */
  readFeature(source, options) {
    if (!source) {
      return null;
    }
    if (typeof source === 'string') {
      const doc = parse(source);
      return this.readFeatureFromDocument(doc, options);
    }
    if (isDocument(source)) {
      return this.readFeatureFromDocument(
        /** @type {Document} */ (source),
        options,
      );
    }
    return this.readFeatureFromNode(/** @type {Element} */ (source), options);
  }

  /**
   * @param {Document} doc Document.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @return {import("../Feature.js").default} Feature.
   */
  readFeatureFromDocument(doc, options) {
    const features = this.readFeaturesFromDocument(doc, options);
    if (features.length > 0) {
      return features[0];
    }
    return null;
  }

  /**
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @return {import("../Feature.js").default} Feature.
   */
  readFeatureFromNode(node, options) {
    return null; // not implemented
  }

  /**
   * Read all features from a feature collection.
   *
   * @param {Document|Element|Object|string} source Source.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @return {Array<import("../Feature.js").default>} Features.
   * @api
   * @override
   */
  readFeatures(source, options) {
    if (!source) {
      return [];
    }
    if (typeof source === 'string') {
      const doc = parse(source);
      return this.readFeaturesFromDocument(doc, options);
    }
    if (isDocument(source)) {
      return this.readFeaturesFromDocument(
        /** @type {Document} */ (source),
        options,
      );
    }
    return this.readFeaturesFromNode(/** @type {Element} */ (source), options);
  }

  /**
   * @param {Document} doc Document.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @protected
   * @return {Array<import("../Feature.js").default>} Features.
   */
  readFeaturesFromDocument(doc, options) {
    /** @type {Array<import("../Feature.js").default>} */
    const features = [];
    for (let n = doc.firstChild; n; n = n.nextSibling) {
      if (n.nodeType == Node.ELEMENT_NODE) {
        extend(
          features,
          this.readFeaturesFromNode(/** @type {Element} */ (n), options),
        );
      }
    }
    return features;
  }

  /**
   * @abstract
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @protected
   * @return {Array<import("../Feature.js").default>} Features.
   */
  readFeaturesFromNode(node, options) {
    return abstract();
  }

  /**
   * Read a single geometry from a source.
   *
   * @param {Document|Element|Object|string} source Source.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @return {import("../geom/Geometry.js").default} Geometry.
   * @override
   */
  readGeometry(source, options) {
    if (!source) {
      return null;
    }
    if (typeof source === 'string') {
      const doc = parse(source);
      return this.readGeometryFromDocument(doc, options);
    }
    if (isDocument(source)) {
      return this.readGeometryFromDocument(
        /** @type {Document} */ (source),
        options,
      );
    }
    return this.readGeometryFromNode(/** @type {Element} */ (source), options);
  }

  /**
   * @param {Document} doc Document.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @protected
   * @return {import("../geom/Geometry.js").default} Geometry.
   */
  readGeometryFromDocument(doc, options) {
    return null; // not implemented
  }

  /**
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @protected
   * @return {import("../geom/Geometry.js").default} Geometry.
   */
  readGeometryFromNode(node, options) {
    return null; // not implemented
  }

  /**
   * Read the projection from the source.
   *
   * @param {Document|Element|Object|string} source Source.
   * @return {import("../proj/Projection.js").default} Projection.
   * @api
   * @override
   */
  readProjection(source) {
    if (!source) {
      return null;
    }
    if (typeof source === 'string') {
      const doc = parse(source);
      return this.readProjectionFromDocument(doc);
    }
    if (isDocument(source)) {
      return this.readProjectionFromDocument(/** @type {Document} */ (source));
    }
    return this.readProjectionFromNode(/** @type {Element} */ (source));
  }

  /**
   * @param {Document} doc Document.
   * @protected
   * @return {import("../proj/Projection.js").default} Projection.
   */
  readProjectionFromDocument(doc) {
    return this.dataProjection;
  }

  /**
   * @param {Element} node Node.
   * @protected
   * @return {import("../proj/Projection.js").default} Projection.
   */
  readProjectionFromNode(node) {
    return this.dataProjection;
  }

  /**
   * Encode a feature as string.
   *
   * @param {import("../Feature.js").default} feature Feature.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {string} Encoded feature.
   * @override
   */
  writeFeature(feature, options) {
    const node = this.writeFeatureNode(feature, options);
    return this.xmlSerializer_.serializeToString(node);
  }

  /**
   * @param {import("../Feature.js").default} feature Feature.
   * @param {import("./Feature.js").WriteOptions} [options] Options.
   * @protected
   * @return {Node} Node.
   */
  writeFeatureNode(feature, options) {
    return null; // not implemented
  }

  /**
   * Encode an array of features as string.
   *
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {string} Result.
   * @api
   * @override
   */
  writeFeatures(features, options) {
    const node = this.writeFeaturesNode(features, options);
    return this.xmlSerializer_.serializeToString(node);
  }

  /**
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions} [options] Options.
   * @return {Node} Node.
   */
  writeFeaturesNode(features, options) {
    return null; // not implemented
  }

  /**
   * Encode a geometry as string.
   *
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {string} Encoded geometry.
   * @override
   */
  writeGeometry(geometry, options) {
    const node = this.writeGeometryNode(geometry, options);
    return this.xmlSerializer_.serializeToString(node);
  }

  /**
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [options] Options.
   * @return {Node} Node.
   */
  writeGeometryNode(geometry, options) {
    return null; // not implemented
  }
}

export default XMLFeature;
