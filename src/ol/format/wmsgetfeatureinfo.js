goog.provide('ol.format.WMSGetFeatureInfo');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.format.GML2');
goog.require('ol.format.XMLFeature');
goog.require('ol.obj');
goog.require('ol.xml');


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
ol.format.WMSGetFeatureInfo = function(opt_options) {

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
  this.gmlFormat_ = new ol.format.GML2();


  /**
   * @private
   * @type {Array.<string>}
   */
  this.layers_ = options.layers ? options.layers : null;

  ol.format.XMLFeature.call(this);
};
ol.inherits(ol.format.WMSGetFeatureInfo, ol.format.XMLFeature);


/**
 * @const
 * @type {string}
 * @private
 */
ol.format.WMSGetFeatureInfo.featureIdentifier_ = '_feature';


/**
 * @const
 * @type {string}
 * @private
 */
ol.format.WMSGetFeatureInfo.layerIdentifier_ = '_layer';


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<ol.Feature>} Features.
 * @private
 */
ol.format.WMSGetFeatureInfo.prototype.readFeatures_ = function(node, objectStack) {

  node.setAttribute('namespaceURI', this.featureNS_);
  goog.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
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

      goog.DEBUG && console.assert(layer.localName.indexOf(
          ol.format.WMSGetFeatureInfo.layerIdentifier_) >= 0,
          'localName of layer node should match layerIdentifier');

      var toRemove = ol.format.WMSGetFeatureInfo.layerIdentifier_;
      var layerName = layer.localName.replace(toRemove, '');

      if (this.layers_ && !ol.array.includes(this.layers_, layerName)) {
        continue;
      }

      var featureType = layerName +
          ol.format.WMSGetFeatureInfo.featureIdentifier_;

      context['featureType'] = featureType;
      context['featureNS'] = this.featureNS_;

      var parsers = {};
      parsers[featureType] = ol.xml.makeArrayPusher(
          this.gmlFormat_.readFeatureElement, this.gmlFormat_);
      var parsersNS = ol.xml.makeStructureNS(
          [context['featureNS'], null], parsers);
      layer.setAttribute('namespaceURI', this.featureNS_);
      var layerFeatures = ol.xml.pushParseAndPop(
          [], parsersNS, layer, objectStack, this.gmlFormat_);
      if (layerFeatures) {
        ol.array.extend(features, layerFeatures);
      }
    }
  }
  if (localName == 'FeatureCollection') {
    var gmlFeatures = ol.xml.pushParseAndPop([],
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
 * @api stable
 */
ol.format.WMSGetFeatureInfo.prototype.readFeatures;


/**
 * @inheritDoc
 */
ol.format.WMSGetFeatureInfo.prototype.readFeaturesFromNode = function(node, opt_options) {
  var options = {};
  if (opt_options) {
    ol.obj.assign(options, this.getReadOptions(node, opt_options));
  }
  return this.readFeatures_(node, [options]);
};
