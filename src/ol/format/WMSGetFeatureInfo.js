/**
 * @module ol/format/WMSGetFeatureInfo
 */
import GML2 from './GML2.js';
import XMLFeature from './XMLFeature.js';
import {assign} from '../obj.js';
import {extend, includes} from '../array.js';
import {makeArrayPusher, makeStructureNS, pushParseAndPop} from '../xml.js';

/**
 * @typedef {Object} Options
 * @property {Array<string>} [layers] If set, only features of the given layers will be returned by the format when read.
 */

/**
 * @const
 * @type {string}
 */
const featureIdentifier = '_feature';

/**
 * @const
 * @type {string}
 */
const layerIdentifier = '_layer';

/**
 * @classdesc
 * Format for reading WMSGetFeatureInfo format. It uses
 * {@link module:ol/format/GML2~GML2} to read features.
 *
 * @api
 */
class WMSGetFeatureInfo extends XMLFeature {
  /**
   * @param {Options} [opt_options] Options.
   */
  constructor(opt_options) {
    super();

    const options = opt_options ? opt_options : {};

    /**
     * @private
     * @type {string}
     */
    this.featureNS_ = 'http://mapserver.gis.umn.edu/mapserver';

    /**
     * @private
     * @type {GML2}
     */
    this.gmlFormat_ = new GML2();

    /**
     * @private
     * @type {Array<string>|null}
     */
    this.layers_ = options.layers ? options.layers : null;
  }

  /**
   * @return {Array<string>|null} layers
   */
  getLayers() {
    return this.layers_;
  }

  /**
   * @param {Array<string>|null} layers Layers to parse.
   */
  setLayers(layers) {
    this.layers_ = layers;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<import("../Feature.js").default>} Features.
   * @private
   */
  readFeatures_(node, objectStack) {
    node.setAttribute('namespaceURI', this.featureNS_);
    const localName = node.localName;
    /** @type {Array<import("../Feature.js").default>} */
    let features = [];
    if (node.childNodes.length === 0) {
      return features;
    }
    if (localName == 'msGMLOutput') {
      for (let i = 0, ii = node.childNodes.length; i < ii; i++) {
        const layer = node.childNodes[i];
        if (layer.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }

        const layerElement = /** @type {Element} */ (layer);
        const context = objectStack[0];

        const toRemove = layerIdentifier;
        const layerName = layerElement.localName.replace(toRemove, '');

        if (this.layers_ && !includes(this.layers_, layerName)) {
          continue;
        }

        const featureType = layerName + featureIdentifier;

        context['featureType'] = featureType;
        context['featureNS'] = this.featureNS_;

        /** @type {Object<string, import("../xml.js").Parser>} */
        const parsers = {};
        parsers[featureType] = makeArrayPusher(
          this.gmlFormat_.readFeatureElement,
          this.gmlFormat_
        );
        const parsersNS = makeStructureNS(
          [context['featureNS'], null],
          parsers
        );
        layerElement.setAttribute('namespaceURI', this.featureNS_);
        const layerFeatures = pushParseAndPop(
          [],
          // @ts-ignore
          parsersNS,
          layerElement,
          objectStack,
          this.gmlFormat_
        );
        if (layerFeatures) {
          extend(features, layerFeatures);
        }
      }
    }
    if (localName == 'FeatureCollection') {
      const gmlFeatures = pushParseAndPop(
        [],
        this.gmlFormat_.FEATURE_COLLECTION_PARSERS,
        node,
        [{}],
        this.gmlFormat_
      );
      if (gmlFeatures) {
        features = gmlFeatures;
      }
    }
    return features;
  }

  /**
   * @protected
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [opt_options] Options.
   * @return {Array<import("../Feature.js").default>} Features.
   */
  readFeaturesFromNode(node, opt_options) {
    const options = {};
    if (opt_options) {
      assign(options, this.getReadOptions(node, opt_options));
    }
    return this.readFeatures_(node, [options]);
  }
}

export default WMSGetFeatureInfo;
