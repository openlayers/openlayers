goog.provide('ol.xml');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('goog.object');


/**
 * @typedef {function(Node, Array.<*>)}
 */
ol.xml.Parser;


/**
 * @param {Node} node Node.
 * @param {boolean} normalizeWhitespace Normalize whitespace.
 * @return {string} All text content.
 */
ol.xml.getAllTextContent = function(node, normalizeWhitespace) {
  return ol.xml.getAllTextContent_(node, normalizeWhitespace, []).join('');
};


/**
 * @param {Node} node Node.
 * @param {boolean} normalizeWhitespace Normalize whitespace.
 * @param {Array.<String|string>} accumulator Accumulator.
 * @private
 * @return {Array.<String|string>} Accumulator.
 */
ol.xml.getAllTextContent_ = function(node, normalizeWhitespace, accumulator) {
  if (node.nodeType == goog.dom.NodeType.CDATA_SECTION ||
      node.nodeType == goog.dom.NodeType.TEXT) {
    if (normalizeWhitespace) {
      // FIXME understand why goog.dom.getTextContent_ uses String here
      accumulator.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ''));
    } else {
      accumulator.push(node.nodeValue);
    }
  } else {
    var n;
    for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
      ol.xml.getAllTextContent_(n, normalizeWhitespace, accumulator);
    }
  }
  return accumulator;
};


/**
 * @param {function(this: T, Node, Array.<*>): (Array.<*>|undefined)}
 *     valueReader Value reader.
 * @param {T=} opt_obj Scope.
 * @return {ol.xml.Parser} Parser.
 * @template T
 */
ol.xml.makeArrayExtender = function(valueReader, opt_obj) {
  return (
      /**
       * @param {Node} node Node.
       * @param {Array.<*>} objectStack Object stack.
       */
      function(node, objectStack) {
        var value = valueReader.call(opt_obj, node, objectStack);
        if (goog.isDef(value)) {
          goog.asserts.assert(goog.isArray(value));
          var array = /** @type {Array.<*>} */
              (objectStack[objectStack.length - 1]);
          goog.asserts.assert(goog.isArray(array));
          goog.array.extend(array, value);
        }
      });
};


/**
 * @param {function(this: T, Node, Array.<*>): *} valueReader Value reader.
 * @param {T=} opt_obj Scope.
 * @return {ol.xml.Parser} Parser.
 * @template T
 */
ol.xml.makeArrayPusher = function(valueReader, opt_obj) {
  return (
      /**
       * @param {Node} node Node.
       * @param {Array.<*>} objectStack Object stack.
       */
      function(node, objectStack) {
        var value = valueReader.call(opt_obj, node, objectStack);
        if (goog.isDef(value)) {
          var array = objectStack[objectStack.length - 1];
          goog.asserts.assert(goog.isArray(array));
          array.push(value);
        }
      });
};


/**
 * @param {function(this: T, Node, Array.<*>): *} valueReader Value reader.
 * @param {T=} opt_obj Scope.
 * @return {ol.xml.Parser} Parser.
 * @template T
 */
ol.xml.makeReplacer = function(valueReader, opt_obj) {
  return (
      /**
       * @param {Node} node Node.
       * @param {Array.<*>} objectStack Object stack.
       */
      function(node, objectStack) {
        var value = valueReader.call(opt_obj, node, objectStack);
        if (goog.isDef(value)) {
          objectStack[objectStack.length - 1] = value;
        }
      });
};


/**
 * @param {function(this: T, Node, Array.<*>): *} valueReader Value reader.
 * @param {string=} opt_property Property.
 * @param {T=} opt_obj Scope.
 * @return {ol.xml.Parser} Parser.
 * @template T
 */
ol.xml.makeObjectPropertySetter = function(valueReader, opt_property, opt_obj) {
  goog.asserts.assert(goog.isDef(valueReader));
  return (
      /**
       * @param {Node} node Node.
       * @param {Array.<*>} objectStack Object stack.
       */
      function(node, objectStack) {
        var value = valueReader.call(opt_obj, node, objectStack);
        if (goog.isDef(value)) {
          var object = /** @type {Object} */
              (objectStack[objectStack.length - 1]);
          var property = goog.isDef(opt_property) ?
              opt_property : node.localName;
          goog.asserts.assert(goog.isObject(object));
          goog.object.set(object, property, value);
        }
      });
};


/**
 * @param {Array.<string>} namespaceURIs Namespace URIs.
 * @param {Object.<string, ol.xml.Parser>} parsers Parsers.
 * @param {Object.<string, Object.<string, ol.xml.Parser>>=} opt_parsersNS
 *     ParsersNS.
 * @return {Object.<string, Object.<string, ol.xml.Parser>>} Parsers NS.
 */
ol.xml.makeParsersNS = function(namespaceURIs, parsers, opt_parsersNS) {
  /** @type {Object.<string, Object.<string, ol.xml.Parser>>} */
  var parsersNS = goog.isDef(opt_parsersNS) ? opt_parsersNS : {};
  var i, ii;
  for (i = 0, ii = namespaceURIs.length; i < ii; ++i) {
    parsersNS[namespaceURIs[i]] = parsers;
  }
  return parsersNS;
};


/**
 * @param {Object.<string, Object.<string, ol.xml.Parser>>} parsersNS
 *     Parsers by namespace.
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @param {*=} opt_obj Scope.
 */
ol.xml.parse = function(parsersNS, node, objectStack, opt_obj) {
  var n;
  for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      var parsers = parsersNS[n.namespaceURI];
      if (goog.isDef(parsers)) {
        var parser = parsers[n.localName];
        if (goog.isDef(parser)) {
          parser.call(opt_obj, n, objectStack);
        }
      }
    }
  }
};


/**
 * @param {T} object Object.
 * @param {Object.<string, Object.<string, ol.xml.Parser>>} parsersNS
 *     Parsers by namespace.
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @param {*=} opt_obj Scope.
 * @return {T|undefined} Object.
 * @template T
 */
ol.xml.pushAndParse = function(object, parsersNS, node, objectStack, opt_obj) {
  objectStack.push(object);
  ol.xml.parse(parsersNS, node, objectStack, opt_obj);
  return objectStack.pop();
};
