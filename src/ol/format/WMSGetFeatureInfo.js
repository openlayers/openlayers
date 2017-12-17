/**
 * @module ol/format/WMSGetFeatureInfo
 */
import {inherits} from '../index.js';
import _ol_array_ from '../array.js';
import GML2 from '../format/GML2.js';
import XMLFeature from '../format/XMLFeature.js';
import _ol_obj_ from '../obj.js';
import _ol_xml_ from '../xml.js';

/**
 * @classdesc
 * Format for reading WMSGetFeatureInfo format. It uses
 * {@link ol.format.GML2} to read features.
 *
 * @constructor
 * @extends {ol.format.XMLFeature}
 * @param {olx.format.WMSGetFeatureInfoOptions=} opt_options Options.
 * @api
 */
var WMSGetFeatureInfo = function(opt_options) {

  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {string}
   */
  this.featureNS_ = 'http://mapserver.gis.umn.edu/mapserver';


  /**
   * @private
   * @type {ol.format.GML2}
   */
  this.gmlFormat_ = new GML2();


  /**
   * @private
   * @type {Array.<string>}
   */
  this.layers_ = options.layers ? options.layers : null;

  XMLFeature.call(this);
};

inherits(WMSGetFeatureInfo, XMLFeature);


/**
 * @const
 * @type {string}
 * @private
 */
WMSGetFeatureInfo.featureIdentifier_ = '_feature';


/**
 * @const
 * @type {string}
 * @private
 */
WMSGetFeatureInfo.layerIdentifier_ = '_layer';


/**
 * @return {Array.<string>} layers
 */
WMSGetFeatureInfo.prototype.getLayers = function() {
  return this.layers_;
};


/**
 * @param {Array.<string>} layers Layers to parse.
 */
WMSGetFeatureInfo.prototype.setLayers = function(layers) {
  this.layers_ = layers;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<ol.Feature>} Features.
 * @private
 */
WMSGetFeatureInfo.prototype.readFeatures_ = function(node, objectStack) {
  node.setAttribute('namespaceURI', this.featureNS_);
  var localName = node.localName;
  /** @type {Array.<ol.Feature>} */
  var features = [];
  if (node.childNodes.length === 0) {
    return features;
  }
  if (localName == 'msGMLOutput') {
    for (var i = 0, ii = node.childNodes.length; i < ii; i++) {
      var layer = node.childNodes[i];
      if (layer.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      var context = objectStack[0];

      var toRemove = WMSGetFeatureInfo.layerIdentifier_;
      var layerName = layer.localName.replace(toRemove, '');

      if (this.layers_ && !_ol_array_.includes(this.layers_, layerName)) {
        continue;
      }

      var featureType = layerName +
          WMSGetFeatureInfo.featureIdentifier_;

      context['featureType'] = featureType;
      context['featureNS'] = this.featureNS_;

      var parsers = {};
      parsers[featureType] = _ol_xml_.makeArrayPusher(
          this.gmlFormat_.readFeatureElement, this.gmlFormat_);
      var parsersNS = _ol_xml_.makeStructureNS(
          [context['featureNS'], null], parsers);
      layer.setAttribute('namespaceURI', this.featureNS_);
      var layerFeatures = _ol_xml_.pushParseAndPop(
          [], parsersNS, layer, objectStack, this.gmlFormat_);
      if (layerFeatures) {
        _ol_array_.extend(features, layerFeatures);
      }
    }
  }
  if (localName == 'FeatureCollection') {
    var gmlFeatures = _ol_xml_.pushParseAndPop([],
        this.gmlFormat_.FEATURE_COLLECTION_PARSERS, node,
        [{}], this.gmlFormat_);
    if (gmlFeatures) {
      features = gmlFeatures;
    }
  }
  return features;
};


/**
 * Read all features from a WMSGetFeatureInfo response.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
WMSGetFeatureInfo.prototype.readFeatures;


/**
 * @inheritDoc
 */
WMSGetFeatureInfo.prototype.readFeaturesFromNode = function(node, opt_options) {
  var options = {};
  if (opt_options) {
    _ol_obj_.assign(options, this.getReadOptions(node, opt_options));
  }
  return this.readFeatures_(node, [options]);
};


/**
 * Not implemented.
 * @inheritDoc
 */
WMSGetFeatureInfo.prototype.writeFeatureNode = function(feature, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
WMSGetFeatureInfo.prototype.writeFeaturesNode = function(features, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
WMSGetFeatureInfo.prototype.writeGeometryNode = function(geometry, opt_options) {};
export default WMSGetFeatureInfo;
