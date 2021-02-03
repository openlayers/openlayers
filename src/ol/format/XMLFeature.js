/**
 * @module ol/format/XMLFeature
 */
import FeatureFormat from '../format/Feature.js';
import FormatType from '../format/FormatType.js';
import {abstract} from '../util.js';
import {extend} from '../array.js';
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
   * @return {import("./FormatType.js").default} Format.
   */
  getType() {
    return FormatType.XML;
  }

  /**
   * Read a single feature.
   *
   * @param {Document|Element|Object|string} source Source.
   * @param {import("./Feature.js").ReadOptions} [opt_options] Read options.
   * @return {import("../Feature.js").default} Feature.
   * @api
   */
  readFeature(source, opt_options) {
    if (!source) {
      return null;
    } else if (typeof source === 'string') {
      const doc = parse(source);
      return this.readFeatureFromDocument(doc, opt_options);
    } else if (isDocument(source)) {
      return this.readFeatureFromDocument(
        /** @type {Document} */ (source),
        opt_options
      );
    } else {
      return this.readFeatureFromNode(
        /** @type {Element} */ (source),
        opt_options
      );
    }
  }

  /**
   * @param {Document} doc Document.
   * @param {import("./Feature.js").ReadOptions} [opt_options] Options.
   * @return {import("../Feature.js").default} Feature.
   */
  readFeatureFromDocument(doc, opt_options) {
    const features = this.readFeaturesFromDocument(doc, opt_options);
    if (features.length > 0) {
      return features[0];
    } else {
      return null;
    }
  }

  /**
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [opt_options] Options.
   * @return {import("../Feature.js").default} Feature.
   */
  readFeatureFromNode(node, opt_options) {
    return null; // not implemented
  }

  /**
   * Read all features from a feature collection.
   *
   * @param {Document|Element|Object|string} source Source.
   * @param {import("./Feature.js").ReadOptions} [opt_options] Options.
   * @return {Array<import("../Feature.js").default>} Features.
   * @api
   */
  readFeatures(source, opt_options) {
    if (!source) {
      return [];
    } else if (typeof source === 'string') {
      const doc = parse(source);
      return this.readFeaturesFromDocument(doc, opt_options);
    } else if (isDocument(source)) {
      return this.readFeaturesFromDocument(
        /** @type {Document} */ (source),
        opt_options
      );
    } else {
      return this.readFeaturesFromNode(
        /** @type {Element} */ (source),
        opt_options
      );
    }
  }

  /**
   * @param {Document} doc Document.
   * @param {import("./Feature.js").ReadOptions} [opt_options] Options.
   * @protected
   * @return {Array<import("../Feature.js").default>} Features.
   */
  readFeaturesFromDocument(doc, opt_options) {
    /** @type {Array<import("../Feature.js").default>} */
    const features = [];
    for (let n = doc.firstChild; n; n = n.nextSibling) {
      if (n.nodeType == Node.ELEMENT_NODE) {
        extend(
          features,
          this.readFeaturesFromNode(/** @type {Element} */ (n), opt_options)
        );
      }
    }
    return features;
  }

  /**
   * @abstract
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [opt_options] Options.
   * @protected
   * @return {Array<import("../Feature.js").default>} Features.
   */
  readFeaturesFromNode(node, opt_options) {
    return abstract();
  }

  /**
   * Read a single geometry from a source.
   *
   * @param {Document|Element|Object|string} source Source.
   * @param {import("./Feature.js").ReadOptions} [opt_options] Read options.
   * @return {import("../geom/Geometry.js").default} Geometry.
   */
  readGeometry(source, opt_options) {
    if (!source) {
      return null;
    } else if (typeof source === 'string') {
      const doc = parse(source);
      return this.readGeometryFromDocument(doc, opt_options);
    } else if (isDocument(source)) {
      return this.readGeometryFromDocument(
        /** @type {Document} */ (source),
        opt_options
      );
    } else {
      return this.readGeometryFromNode(
        /** @type {Element} */ (source),
        opt_options
      );
    }
  }

  /**
   * @param {Document} doc Document.
   * @param {import("./Feature.js").ReadOptions} [opt_options] Options.
   * @protected
   * @return {import("../geom/Geometry.js").default} Geometry.
   */
  readGeometryFromDocument(doc, opt_options) {
    return null; // not implemented
  }

  /**
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [opt_options] Options.
   * @protected
   * @return {import("../geom/Geometry.js").default} Geometry.
   */
  readGeometryFromNode(node, opt_options) {
    return null; // not implemented
  }

  /**
   * Read the projection from the source.
   *
   * @param {Document|Element|Object|string} source Source.
   * @return {import("../proj/Projection.js").default} Projection.
   * @api
   */
  readProjection(source) {
    if (!source) {
      return null;
    } else if (typeof source === 'string') {
      const doc = parse(source);
      return this.readProjectionFromDocument(doc);
    } else if (isDocument(source)) {
      return this.readProjectionFromDocument(/** @type {Document} */ (source));
    } else {
      return this.readProjectionFromNode(/** @type {Element} */ (source));
    }
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
   * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
   * @return {string} Encoded feature.
   */
  writeFeature(feature, opt_options) {
    const node = this.writeFeatureNode(feature, opt_options);
    return this.xmlSerializer_.serializeToString(node);
  }

  /**
   * @param {import("../Feature.js").default} feature Feature.
   * @param {import("./Feature.js").WriteOptions} [opt_options] Options.
   * @protected
   * @return {Node} Node.
   */
  writeFeatureNode(feature, opt_options) {
    return null; // not implemented
  }

  /**
   * Encode an array of features as string.
   *
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
   * @return {string} Result.
   * @api
   */
  writeFeatures(features, opt_options) {
    const node = this.writeFeaturesNode(features, opt_options);
    return this.xmlSerializer_.serializeToString(node);
  }

  /**
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions} [opt_options] Options.
   * @return {Node} Node.
   */
  writeFeaturesNode(features, opt_options) {
    return null; // not implemented
  }

  /**
   * Encode a geometry as string.
   *
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
   * @return {string} Encoded geometry.
   */
  writeGeometry(geometry, opt_options) {
    const node = this.writeGeometryNode(geometry, opt_options);
    return this.xmlSerializer_.serializeToString(node);
  }

  /**
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [opt_options] Options.
   * @return {Node} Node.
   */
  writeGeometryNode(geometry, opt_options) {
    return null; // not implemented
  }
}

export default XMLFeature;
