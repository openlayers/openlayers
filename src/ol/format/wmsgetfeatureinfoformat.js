goog.provide('ol.format.WMSGetFeatureInfo');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('goog.object');
goog.require('ol.format.GML2');
goog.require('ol.format.XMLFeature');
goog.require('ol.xml');



/**
 * @classdesc
 * Format for reading WMSGetFeatureInfo format. It uses
 * {@link ol.format.GML2} to read features.
 *
 * @constructor
 * @extends {ol.format.XMLFeature}
 * @api
 */
ol.format.WMSGetFeatureInfo = function() {

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

  goog.base(this);
};
goog.inherits(ol.format.WMSGetFeatureInfo, ol.format.XMLFeature);


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
ol.format.WMSGetFeatureInfo.prototype.readFeatures_ =
    function(node, objectStack) {

  node.namespaceURI = this.featureNS_;
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  var localName = ol.xml.getLocalName(node);
  /** @type {Array.<ol.Feature>} */
  var features = [];
  if (node.childNodes.length === 0) {
    return features;
  }
  if (localName == 'msGMLOutput') {
    for (var i = 0, ii = node.childNodes.length; i < ii; i++) {
      var layer = node.childNodes[i];
      if (layer.nodeType !== goog.dom.NodeType.ELEMENT) {
        continue;
      }
      var context = objectStack[0];
      goog.asserts.assert(goog.isObject(context),
          'context should be an Object');

      goog.asserts.assert(layer.localName.indexOf(
          ol.format.WMSGetFeatureInfo.layerIdentifier_) >= 0,
          'localName of layer node should match layerIdentifier');

      var toRemove = ol.format.WMSGetFeatureInfo.layerIdentifier_;
      var featureType = layer.localName.replace(toRemove, '') +
          ol.format.WMSGetFeatureInfo.featureIdentifier_;

      context['featureType'] = featureType;
      context['featureNS'] = this.featureNS_;

      var parsers = {};
      parsers[featureType] = ol.xml.makeArrayPusher(
          this.gmlFormat_.readFeatureElement, this.gmlFormat_);
      var parsersNS = ol.xml.makeStructureNS(
          [context['featureNS'], null], parsers);
      layer.namespaceURI = this.featureNS_;
      var layerFeatures = ol.xml.pushParseAndPop(
          [], parsersNS, layer, objectStack, this.gmlFormat_);
      if (layerFeatures) {
        goog.array.extend(features, layerFeatures);
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
ol.format.WMSGetFeatureInfo.prototype.readFeaturesFromNode =
    function(node, opt_options) {
  var options = {
    'featureType': this.featureType,
    'featureNS': this.featureNS
  };
  if (opt_options) {
    goog.object.extend(options, this.getReadOptions(node, opt_options));
  }
  return this.readFeatures_(node, [options]);
};
