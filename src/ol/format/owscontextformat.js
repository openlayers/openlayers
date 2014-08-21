goog.provide('ol.format.OWSContext');

goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('goog.string');
goog.require('ol.format.OWS');
goog.require('ol.format.XLink');
goog.require('ol.format.XML');
goog.require('ol.format.XSD');
goog.require('ol.xml');



/**
 * @classdesc
 * Format for reading OWS Context data
 *
 * @constructor
 * @extends {ol.format.XML}
 * @api
 */
ol.format.OWSContext = function() {

  goog.base(this);

  /**
   * @type {string|undefined}
   */
  this.version = undefined;
};
goog.inherits(ol.format.OWSContext, ol.format.XML);


/**
 * read a OWS Context document.
 *
 * @function
 * @param {Document|Node|string} source the XML source.
 * @return {Object} An object representing the OWS Context.
 * @api
 */
ol.format.OWSContext.prototype.read;


/**
 * @param {Document} doc Document.
 * @return {Object} OWS Context object.
 */
ol.format.OWSContext.prototype.readFromDocument = function(doc) {
  goog.asserts.assert(doc.nodeType == goog.dom.NodeType.DOCUMENT);
  for (var n = doc.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      return this.readFromNode(n);
    }
  }
  return null;
};


/**
 * @param {Node} node Node.
 * @return {Object} OWS Context object.
 */
ol.format.OWSContext.prototype.readFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'OWSContext');
  this.version = goog.string.trim(node.getAttribute('version'));
  goog.asserts.assertString(this.version);
  var owsContextObject = ol.xml.pushParseAndPop({
    'version': this.version
  }, ol.format.OWSContext.PARSERS_, node, []);
  return goog.isDef(owsContextObject) ? owsContextObject : null;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Service object.
 */
ol.format.OWSContext.readGeneral_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'General');
  return ol.xml.pushParseAndPop(
      {}, ol.format.OWSContext.GENERAL_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Service object.
 */
ol.format.OWSContext.readLayer_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Layer');

  var layerObject = ol.xml.pushParseAndPop({
    'name': node.getAttribute('name'),
    'queryable': ol.format.XSD.readBooleanString(
        node.getAttribute('queryable')),
    'hidden': ol.format.XSD.readBooleanString(node.getAttribute('hidden')),
    'opacity': ol.format.XSD.readDecimalString(node.getAttribute('opacity'))
  }, ol.format.OWSContext.OWS_LAYER_PARSERS_, node, objectStack);

  return ol.xml.pushParseAndPop(layerObject,
      ol.format.OWSContext.OWSCONTEXT_LAYER_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Service object.
 */
ol.format.OWSContext.readResourceList_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'ResourceList');
  return ol.xml.pushParseAndPop(
      {}, ol.format.OWSContext.RESOURCELIST_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Service object.
 */
ol.format.OWSContext.readServer_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Server');
  var service = node.getAttribute('service');
  var version = goog.string.trim(node.getAttribute('version'));
  var obj = ol.xml.pushParseAndPop({
    'service': service,
    'version': version
  }, ol.format.OWSContext.SERVER_PARSERS_, node, objectStack);
  goog.asserts.assert(goog.isObject(obj));
  return obj;
};


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
ol.format.OWSContext.NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/ows-context'
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSContext.PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSContext.NAMESPACE_URIS_, {
      'General': ol.xml.makeObjectPropertySetter(
          ol.format.OWSContext.readGeneral_),
      'ResourceList': ol.xml.makeObjectPropertySetter(
          ol.format.OWSContext.readResourceList_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSContext.GENERAL_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS, {
      'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'BoundingBox': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readBoundingBox)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSContext.OWSCONTEXT_LAYER_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSContext.NAMESPACE_URIS_, {
      'Server': ol.xml.makeObjectPropertySetter(
          ol.format.OWSContext.readServer_),
      'Layer': ol.xml.makeObjectPropertyPusher(
          ol.format.OWSContext.readLayer_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSContext.OWS_LAYER_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS, {
      'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'OutputFormat': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSContext.RESOURCELIST_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSContext.NAMESPACE_URIS_, {
      'Layer': ol.xml.makeObjectPropertyPusher(
          ol.format.OWSContext.readLayer_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSContext.SERVER_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSContext.NAMESPACE_URIS_, {
      'OnlineResource': ol.xml.makeObjectPropertySetter(
          ol.format.XLink.readHref)
    });
