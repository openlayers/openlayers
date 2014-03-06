goog.provide('ol.format.WFS');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.format.GML');
goog.require('ol.format.XMLFeature');
goog.require('ol.format.XSD');
goog.require('ol.xml');



/**
 * @constructor
 * @param {olx.format.WFSOptions=} opt_options
 *     Optional configuration object.
 * @extends {ol.format.XMLFeature}
 * @todo stability experimental
 */
ol.format.WFS = function(opt_options) {
  var options = /** @type {olx.format.WFSOptions} */
      (goog.isDef(opt_options) ? opt_options : {});

  /**
   * @private
   * @type {string}
   */
  this.featureType_ = options.featureType;

  /**
   * @private
   * @type {string}
   */
  this.featureNS_ = options.featureNS;

  /**
   * @private
   * @type {string}
   */
  this.schemaLocation_ = goog.isDef(options.schemaLocation) ?
      options.schemaLocation : ('http://www.opengis.net/wfs ' +
          'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd');

  goog.base(this);
};
goog.inherits(ol.format.WFS, ol.format.XMLFeature);


/**
 * @inheritDoc
 */
ol.format.WFS.prototype.readFeaturesFromNode = function(node) {
  var objectStack = [{
    'featureType': this.featureType_,
    'featureNS': this.featureNS_
  }];
  var features = ol.xml.pushParseAndPop(null,
      ol.format.GML.FEATURE_COLLECTION_PARSERS, node, objectStack);
  if (!goog.isDef(features)) {
    features = [];
  }
  return features;
};


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.WFS.QUERY_SERIALIZERS_ = {
  'http://www.opengis.net/wfs': {
    'PropertyName': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode)
  }
};


/**
 * @param {Node} node Node.
 * @param {string} featureType Feature type.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeQuery_ = function(node, featureType, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var featurePrefix = goog.object.get(context, 'featurePrefix');
  var featureNS = goog.object.get(context, 'featureNS');
  var propertyNames = goog.object.get(context, 'propertyNames');
  var srsName = goog.object.get(context, 'srsName');
  var prefix = goog.isDef(featurePrefix) ? featurePrefix + ':' : '';
  node.setAttribute('typeName', prefix + featureType);
  node.setAttribute('srsName', srsName);
  if (goog.isDef(featureNS)) {
    node.setAttribute('xmlns:' + featurePrefix, featureNS);
  }
  var item = goog.object.clone(context);
  goog.object.set(item, 'node', node);
  ol.xml.pushSerializeAndPop(item,
      ol.format.WFS.QUERY_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory('PropertyName'), propertyNames,
      objectStack);
};


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.WFS.GETFEATURE_SERIALIZERS_ = {
  'http://www.opengis.net/wfs': {
    'Query': ol.xml.makeChildAppender(
        ol.format.WFS.writeQuery_)
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<{string}>} featureTypes Feature types.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeGetFeature_ = function(node, featureTypes, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var item = goog.object.clone(context);
  goog.object.set(item, 'node', node);
  ol.xml.pushSerializeAndPop(item,
      ol.format.WFS.GETFEATURE_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory('Query'), featureTypes,
      objectStack);
};


/**
 * @param {olx.format.WFSWriteGetFeatureOptions} options Options.
 * @return {ArrayBuffer|Node|Object|string} Result.
 */
ol.format.WFS.prototype.writeGetFeature = function(options) {
  var node = ol.xml.createElementNS('http://www.opengis.net/wfs',
      'GetFeature');
  node.setAttribute('service', 'WFS');
  node.setAttribute('version', '1.1.0');
  if (goog.isDef(options)) {
    if (goog.isDef(options.handle)) {
      node.setAttribute('handle', options.handle);
    }
    if (goog.isDef(options.outputFormat)) {
      node.setAttribute('outputFormat', options.outputFormat);
    }
    if (goog.isDef(options.maxFeatures)) {
      node.setAttribute('maxFeatures', options.maxFeatures);
    }
    if (goog.isDef(options.resultType)) {
      node.setAttribute('resultType', options.resultType);
    }
    if (goog.isDef(options.startIndex)) {
      node.setAttribute('startIndex', options.startIndex);
    }
    if (goog.isDef(options.count)) {
      node.setAttribute('count', options.count);
    }
  }
  ol.xml.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation_);
  var context = {
    node: node,
    srsName: options.srsName,
    featureNS: goog.isDef(options.featureNS) ?
        options.featureNS : this.featureNS_,
    featurePrefix: options.featurePrefix,
    propertyNames: goog.isDef(options.propertyNames) ?
        options.propertyNames : []
  };
  goog.asserts.assert(goog.isArray(options.featureTypes));
  ol.format.WFS.writeGetFeature_(node, options.featureTypes, [context]);
  return node;
};
