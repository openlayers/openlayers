// FIXME Remove ol.xml.makeParsersNS, and use ol.xml.makeStructureNS instead.

goog.provide('ol.xml');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('goog.dom.xml');
goog.require('goog.object');
goog.require('goog.userAgent');


/**
 * When using {@link ol.xml.makeChildAppender} or
 * {@link ol.xml.makeSimpleNodeFactory}, the top `objectStack` item needs to
 * have this structure.
 * @typedef {{node:Node}}
 */
ol.xml.NodeStackItem;


/**
 * @typedef {function(Node, Array.<*>)}
 */
ol.xml.Parser;


/**
 * @typedef {function(Node, *, Array.<*>)}
 */
ol.xml.Serializer;


/**
 * This document should be used when creating nodes for XML serializations. This
 * document is also used by {@link ol.xml.createElementNS} and
 * {@link ol.xml.setAttributeNS}
 * @const
 * @type {Document}
 */
ol.xml.DOCUMENT = goog.dom.xml.createDocument();


/**
 * @param {string} namespaceURI Namespace URI.
 * @param {string} qualifiedName Qualified name.
 * @return {Node} Node.
 * @private
 */
ol.xml.createElementNS_ = function(namespaceURI, qualifiedName) {
  return ol.xml.DOCUMENT.createElementNS(namespaceURI, qualifiedName);
};


/**
 * @param {string} namespaceURI Namespace URI.
 * @param {string} qualifiedName Qualified name.
 * @return {Node} Node.
 * @private
 */
ol.xml.createElementNSActiveX_ = function(namespaceURI, qualifiedName) {
  if (goog.isNull(namespaceURI)) {
    namespaceURI = '';
  }
  return ol.xml.DOCUMENT.createNode(1, qualifiedName, namespaceURI);
};


/**
 * @param {string} namespaceURI Namespace URI.
 * @param {string} qualifiedName Qualified name.
 * @return {Node} Node.
 */
ol.xml.createElementNS =
    (document.implementation && document.implementation.createDocument) ?
        ol.xml.createElementNS_ : ol.xml.createElementNSActiveX_;


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
 * @param {Node} node Node.
 * @private
 * @return {string} Local name.
 */
ol.xml.getLocalName_ = function(node) {
  return node.localName;
};


/**
 * @param {Node} node Node.
 * @private
 * @return {string} Local name.
 */
ol.xml.getLocalNameIE_ = function(node) {
  var localName = node.localName;
  if (goog.isDef(localName)) {
    return localName;
  }
  var baseName = node.baseName;
  goog.asserts.assert(goog.isDefAndNotNull(baseName));
  return baseName;
};


/**
 * @param {Node} node Node.
 * @return {string} Local name.
 */
ol.xml.getLocalName = goog.userAgent.IE ?
    ol.xml.getLocalNameIE_ : ol.xml.getLocalName_;


/**
 * @param {?} value Value.
 * @private
 * @return {boolean} Is document.
 */
ol.xml.isDocument_ = function(value) {
  return value instanceof Document;
};


/**
 * @param {?} value Value.
 * @private
 * @return {boolean} Is document.
 */
ol.xml.isDocumentIE_ = function(value) {
  return goog.isObject(value) && value.nodeType == goog.dom.NodeType.DOCUMENT;
};


/**
 * @param {?} value Value.
 * @return {boolean} Is document.
 */
ol.xml.isDocument = goog.userAgent.IE ?
    ol.xml.isDocumentIE_ : ol.xml.isDocument_;


/**
 * @param {?} value Value.
 * @private
 * @return {boolean} Is node.
 */
ol.xml.isNode_ = function(value) {
  return value instanceof Node;
};


/**
 * @param {?} value Value.
 * @private
 * @return {boolean} Is node.
 */
ol.xml.isNodeIE_ = function(value) {
  return goog.isObject(value) && goog.isDef(value.nodeType);
};


/**
 * @param {?} value Value.
 * @return {boolean} Is node.
 */
ol.xml.isNode = goog.userAgent.IE ? ol.xml.isNodeIE_ : ol.xml.isNode_;


/**
 * @param {Node} node Node.
 * @param {?string} namespaceURI Namespace URI.
 * @param {string} name Attribute name.
 * @return {string} Value
 * @private
 */
ol.xml.getAttributeNS_ = function(node, namespaceURI, name) {
  return node.getAttributeNS(namespaceURI, name) || '';
};


/**
 * @param {Node} node Node.
 * @param {?string} namespaceURI Namespace URI.
 * @param {string} name Attribute name.
 * @return {string} Value
 * @private
 */
ol.xml.getAttributeNSActiveX_ = function(node, namespaceURI, name) {
  var attributeValue = '';
  var attributeNode = ol.xml.getAttributeNodeNS(node, namespaceURI, name);
  if (goog.isDef(attributeNode)) {
    attributeValue = attributeNode.nodeValue;
  }
  return attributeValue;
};


/**
 * @param {Node} node Node.
 * @param {?string} namespaceURI Namespace URI.
 * @param {string} name Attribute name.
 * @return {string} Value
 */
ol.xml.getAttributeNS =
    (document.implementation && document.implementation.createDocument) ?
        ol.xml.getAttributeNS_ : ol.xml.getAttributeNSActiveX_;


/**
 * @param {Node} node Node.
 * @param {?string} namespaceURI Namespace URI.
 * @param {string} name Attribute name.
 * @return {?Node} Attribute node or null if none found.
 * @private
 */
ol.xml.getAttributeNodeNS_ = function(node, namespaceURI, name) {
  return node.getAttributeNodeNS(namespaceURI, name);
};


/**
 * @param {Node} node Node.
 * @param {?string} namespaceURI Namespace URI.
 * @param {string} name Attribute name.
 * @return {?Node} Attribute node or null if none found.
 * @private
 */
ol.xml.getAttributeNodeNSActiveX_ = function(node, namespaceURI, name) {
  var attributeNode = null;
  var attributes = node.attributes;
  var potentialNode, fullName;
  for (var i = 0, len = attributes.length; i < len; ++i) {
    potentialNode = attributes[i];
    if (potentialNode.namespaceURI == namespaceURI) {
      fullName = (potentialNode.prefix) ?
          (potentialNode.prefix + ':' + name) : name;
      if (fullName == potentialNode.nodeName) {
        attributeNode = potentialNode;
        break;
      }
    }
  }
  return attributeNode;
};


/**
 * @param {Node} node Node.
 * @param {?string} namespaceURI Namespace URI.
 * @param {string} name Attribute name.
 * @return {?Node} Attribute node or null if none found.
 */
ol.xml.getAttributeNodeNS =
    (document.implementation && document.implementation.createDocument) ?
        ol.xml.getAttributeNodeNS_ : ol.xml.getAttributeNodeNSActiveX_;


/**
 * @param {Node} node Node.
 * @param {?string} namespaceURI Namespace URI.
 * @param {string} name Attribute name.
 * @param {string|number} value Value.
 * @private
 */
ol.xml.setAttributeNS_ = function(node, namespaceURI, name, value) {
  node.setAttributeNS(namespaceURI, name, value);
};


/**
 * @param {Node} node Node.
 * @param {?string} namespaceURI Namespace URI.
 * @param {string} name Attribute name.
 * @param {string|number} value Value.
 * @private
 */
ol.xml.setAttributeNSActiveX_ = function(node, namespaceURI, name, value) {
  if (!goog.isNull(namespaceURI)) {
    var attribute = node.ownerDocument.createNode(2, name, namespaceURI);
    attribute.nodeValue = value;
    node.setAttributeNode(attribute);
  } else {
    node.setAttribute(name, value);
  }
};


/**
 * @param {Node} node Node.
 * @param {?string} namespaceURI Namespace URI.
 * @param {string} name Attribute name.
 * @param {string|number} value Value.
 */
ol.xml.setAttributeNS =
    (document.implementation && document.implementation.createDocument) ?
        ol.xml.setAttributeNS_ : ol.xml.setAttributeNSActiveX_;


/**
 * @param {string} xml XML.
 * @return {Document} Document.
 */
ol.xml.load = function(xml) {
  return new DOMParser().parseFromString(xml, 'application/xml');
};


/**
 * @param {function(this: T, Node, Array.<*>): (Array.<*>|undefined)}
 *     valueReader Value reader.
 * @param {T=} opt_this The object to use as `this` in `valueReader`.
 * @return {ol.xml.Parser} Parser.
 * @template T
 */
ol.xml.makeArrayExtender = function(valueReader, opt_this) {
  return (
      /**
       * @param {Node} node Node.
       * @param {Array.<*>} objectStack Object stack.
       */
      function(node, objectStack) {
        var value = valueReader.call(opt_this, node, objectStack);
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
 * @param {T=} opt_this The object to use as `this` in `valueReader`.
 * @return {ol.xml.Parser} Parser.
 * @template T
 */
ol.xml.makeArrayPusher = function(valueReader, opt_this) {
  return (
      /**
       * @param {Node} node Node.
       * @param {Array.<*>} objectStack Object stack.
       */
      function(node, objectStack) {
        var value = valueReader.call(opt_this, node, objectStack);
        if (goog.isDef(value)) {
          var array = objectStack[objectStack.length - 1];
          goog.asserts.assert(goog.isArray(array));
          array.push(value);
        }
      });
};


/**
 * @param {function(this: T, Node, Array.<*>): *} valueReader Value reader.
 * @param {T=} opt_this The object to use as `this` in `valueReader`.
 * @return {ol.xml.Parser} Parser.
 * @template T
 */
ol.xml.makeReplacer = function(valueReader, opt_this) {
  return (
      /**
       * @param {Node} node Node.
       * @param {Array.<*>} objectStack Object stack.
       */
      function(node, objectStack) {
        var value = valueReader.call(opt_this, node, objectStack);
        if (goog.isDef(value)) {
          objectStack[objectStack.length - 1] = value;
        }
      });
};


/**
 * @param {function(this: T, Node, Array.<*>): *} valueReader Value reader.
 * @param {string=} opt_property Property.
 * @param {T=} opt_this The object to use as `this` in `valueReader`.
 * @return {ol.xml.Parser} Parser.
 * @template T
 */
ol.xml.makeObjectPropertyPusher =
    function(valueReader, opt_property, opt_this) {
  goog.asserts.assert(goog.isDef(valueReader));
  return (
      /**
       * @param {Node} node Node.
       * @param {Array.<*>} objectStack Object stack.
       */
      function(node, objectStack) {
        var value = valueReader.call(opt_this, node, objectStack);
        if (goog.isDef(value)) {
          var object = /** @type {Object} */
              (objectStack[objectStack.length - 1]);
          var property = goog.isDef(opt_property) ?
              opt_property : node.localName;
          goog.asserts.assert(goog.isObject(object));
          var array = goog.object.setIfUndefined(object, property, []);
          array.push(value);
        }
      });
};


/**
 * @param {function(this: T, Node, Array.<*>): *} valueReader Value reader.
 * @param {string=} opt_property Property.
 * @param {T=} opt_this The object to use as `this` in `valueReader`.
 * @return {ol.xml.Parser} Parser.
 * @template T
 */
ol.xml.makeObjectPropertySetter =
    function(valueReader, opt_property, opt_this) {
  goog.asserts.assert(goog.isDef(valueReader));
  return (
      /**
       * @param {Node} node Node.
       * @param {Array.<*>} objectStack Object stack.
       */
      function(node, objectStack) {
        var value = valueReader.call(opt_this, node, objectStack);
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
  return /** @type {Object.<string, Object.<string, ol.xml.Parser>>} */ (
      ol.xml.makeStructureNS(namespaceURIs, parsers, opt_parsersNS));
};


/**
 * Creates a serializer that appends nodes written by its `nodeWriter` to its
 * designated parent. The parent is the `node` of the
 * {@link ol.xml.NodeStackItem} at the top of the `objectStack`.
 * @param {function(this: T, Node, V, Array.<*>)}
 *     nodeWriter Node writer.
 * @param {T=} opt_this The object to use as `this` in `nodeWriter`.
 * @return {ol.xml.Serializer} Serializer.
 * @template T, V
 */
ol.xml.makeChildAppender = function(nodeWriter, opt_this) {
  return function(node, value, objectStack) {
    nodeWriter.call(opt_this, node, value, objectStack);
    var parent = objectStack[objectStack.length - 1];
    goog.asserts.assert(goog.isObject(parent));
    var parentNode = parent.node;
    goog.asserts.assert(ol.xml.isNode(parentNode) ||
        ol.xml.isDocument(parentNode));
    parentNode.appendChild(node);
  };
};


/**
 * Creates a serializer that calls the provided `nodeWriter` from
 * {@link ol.xml.serialize}. This can be used by the parent writer to have the
 * 'nodeWriter' called with an array of values when the `nodeWriter` was
 * designed to serialize a single item. An example would be a LineString
 * geometry writer, which could be reused for writing MultiLineString
 * geometries.
 * @param {function(this: T, Node, V, Array.<*>)}
 *     nodeWriter Node writer.
 * @param {T=} opt_this The object to use as `this` in `nodeWriter`.
 * @return {ol.xml.Serializer} Serializer.
 * @template T, V
 */
ol.xml.makeArraySerializer = function(nodeWriter, opt_this) {
  var serializersNS, nodeFactory;
  return function(node, value, objectStack) {
    if (!goog.isDef(serializersNS)) {
      serializersNS = {};
      var serializers = {};
      goog.object.set(serializers, node.localName, nodeWriter);
      goog.object.set(serializersNS, node.namespaceURI, serializers);
      nodeFactory = ol.xml.makeSimpleNodeFactory(node.localName);
    }
    ol.xml.serialize(serializersNS, nodeFactory, value, objectStack);
  };
};


/**
 * Creates a node factory which can use the `opt_keys` passed to
 * {@link ol.xml.serialize} or {@link ol.xml.pushSerializeAndPop} as node names,
 * or a fixed node name. The namespace of the created nodes can either be fixed,
 * or the parent namespace will be used.
 * @param {string=} opt_nodeName Fixed node name which will be used for all
 *     created nodes. If not provided, the 3rd argument to the resulting node
 *     factory needs to be provided and will be the nodeName.
 * @param {string=} opt_namespaceURI Fixed namespace URI which will be used for
 *     all created nodes. If not provided, the namespace of the parent node will
 *     be used.
 * @return {function(*, Array.<*>, string=): (Node|undefined)} Node factory.
 */
ol.xml.makeSimpleNodeFactory = function(opt_nodeName, opt_namespaceURI) {
  var fixedNodeName = opt_nodeName;
  return (
      /**
       * @param {*} value Value.
       * @param {Array.<*>} objectStack Object stack.
       * @param {string=} opt_nodeName Node name.
       * @return {Node} Node.
       */
      function(value, objectStack, opt_nodeName) {
        var context = objectStack[objectStack.length - 1];
        var node = context.node;
        goog.asserts.assert(ol.xml.isNode(node) || ol.xml.isDocument(node));
        var nodeName = fixedNodeName;
        if (!goog.isDef(nodeName)) {
          nodeName = opt_nodeName;
        }
        var namespaceURI = opt_namespaceURI;
        if (!goog.isDef(opt_namespaceURI)) {
          namespaceURI = node.namespaceURI;
        }
        goog.asserts.assert(goog.isDef(nodeName));
        return ol.xml.createElementNS(namespaceURI, nodeName);
      }
  );
};


/**
 * A node factory that creates a node using the parent's `namespaceURI` and the
 * `nodeName` passed by {@link ol.xml.serialize} or
 * {@link ol.xml.pushSerializeAndPop} to the node factory.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 */
ol.xml.OBJECT_PROPERTY_NODE_FACTORY = ol.xml.makeSimpleNodeFactory();


/**
 * Creates an array of `values` to be used with {@link ol.xml.serialize} or
 * {@link ol.xml.pushSerializeAndPop}, where `orderedKeys` has to be provided as
 * `opt_key` argument.
 * @param {Object.<string, V>} object Key-value pairs for the sequence. Keys can
 *     be a subset of the `orderedKeys`.
 * @param {Array.<string>} orderedKeys Keys in the order of the sequence.
 * @return {Array.<V>} Values in the order of the sequence. The resulting array
 *     has the same length as the `orderedKeys` array. Values that are not
 *     present in `object` will be `undefined` in the resulting array.
 * @template V
 */
ol.xml.makeSequence = function(object, orderedKeys) {
  var length = orderedKeys.length;
  var sequence = new Array(length);
  for (var i = 0; i < length; ++i) {
    sequence[i] = object[orderedKeys[i]];
  }
  return sequence;
};


/**
 * Creates a namespaced structure, using the same values for each namespace.
 * This can be used as a starting point for versioned parsers, when only a few
 * values are version specific.
 * @param {Array.<string>} namespaceURIs Namespace URIs.
 * @param {T} structure Structure.
 * @param {Object.<string, T>=} opt_structureNS Namespaced structure to add to.
 * @return {Object.<string, T>} Namespaced structure.
 * @template T
 */
ol.xml.makeStructureNS = function(namespaceURIs, structure, opt_structureNS) {
  /**
   * @type {Object.<string, *>}
   */
  var structureNS = goog.isDef(opt_structureNS) ? opt_structureNS : {};
  var i, ii;
  for (i = 0, ii = namespaceURIs.length; i < ii; ++i) {
    structureNS[namespaceURIs[i]] = structure;
  }
  return structureNS;
};


/**
 * @param {Object.<string, Object.<string, ol.xml.Parser>>} parsersNS
 *     Parsers by namespace.
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @param {*=} opt_this The object to use as `this`.
 */
ol.xml.parse = function(parsersNS, node, objectStack, opt_this) {
  var n;
  for (n = node.firstElementChild; !goog.isNull(n); n = n.nextElementSibling) {
    var parsers = parsersNS[n.namespaceURI];
    if (goog.isDef(parsers)) {
      var parser = parsers[n.localName];
      if (goog.isDef(parser)) {
        parser.call(opt_this, n, objectStack);
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
 * @param {*=} opt_this The object to use as `this`.
 * @return {T|undefined} Object.
 * @template T
 */
ol.xml.pushParseAndPop = function(
    object, parsersNS, node, objectStack, opt_this) {
  objectStack.push(object);
  ol.xml.parse(parsersNS, node, objectStack, opt_this);
  return objectStack.pop();
};


/**
 * Walks through an array of `values` and calls a serializer for each value.
 * @param {Object.<string, Object.<string, ol.xml.Serializer>>} serializersNS
 *     Namespaced serializers.
 * @param {function(this: T, *, Array.<*>, (string|undefined)): (Node|undefined)} nodeFactory
 *     Node factory. The `nodeFactory` creates the node whose namespace and name
 *     will be used to choose a node writer from `serializersNS`. This
 *     separation allows us to decide what kind of node to create, depending on
 *     the value we want to serialize. An example for this would be different
 *     geometry writers based on the geometry type.
 * @param {Array.<*>} values Values to serialize. An example would be an array
 *     of {@link ol.Feature} instances.
 * @param {Array.<*>} objectStack Node stack.
 * @param {Array.<string>=} opt_keys Keys of the `values`. Will be passed to the
 *     `nodeFactory`. This is used for serializing object literals where the
 *     node name relates to the property key. The array length of `opt_keys` has
 *     to match the length of `values`. For serializing a sequence, `opt_keys`
 *     determines the order of the sequence.
 * @param {T=} opt_this The object to use as `this` for the node factory and
 *     serializers.
 * @template T
 */
ol.xml.serialize = function(
    serializersNS, nodeFactory, values, objectStack, opt_keys, opt_this) {
  var length = (goog.isDef(opt_keys) ? opt_keys : values).length;
  var value, node;
  for (var i = 0; i < length; ++i) {
    value = values[i];
    if (goog.isDef(value)) {
      node = nodeFactory.call(opt_this, value, objectStack,
          goog.isDef(opt_keys) ? opt_keys[i] : undefined);
      if (goog.isDef(node)) {
        serializersNS[node.namespaceURI][node.localName]
            .call(opt_this, node, value, objectStack);
      }
    }
  }
};


/**
 * @param {O} object Object.
 * @param {Object.<string, Object.<string, ol.xml.Serializer>>} serializersNS
 *     Namespaced serializers.
 * @param {function(this: T, *, Array.<*>, (string|undefined)): (Node|undefined)} nodeFactory
 *     Node factory. The `nodeFactory` creates the node whose namespace and name
 *     will be used to choose a node writer from `serializersNS`. This
 *     separation allows us to decide what kind of node to create, depending on
 *     the value we want to serialize. An example for this would be different
 *     geometry writers based on the geometry type.
 * @param {Array.<*>} values Values to serialize. An example would be an array
 *     of {@link ol.Feature} instances.
 * @param {Array.<*>} objectStack Node stack.
 * @param {Array.<string>=} opt_keys Keys of the `values`. Will be passed to the
 *     `nodeFactory`. This is used for serializing object literals where the
 *     node name relates to the property key. The array length of `opt_keys` has
 *     to match the length of `values`. For serializing a sequence, `opt_keys`
 *     determines the order of the sequence.
 * @param {T=} opt_this The object to use as `this` for the node factory and
 *     serializers.
 * @return {O|undefined} Object.
 * @template O, T
 */
ol.xml.pushSerializeAndPop = function(object,
    serializersNS, nodeFactory, values, objectStack, opt_keys, opt_this) {
  objectStack.push(object);
  ol.xml.serialize(
      serializersNS, nodeFactory, values, objectStack, opt_keys, opt_this);
  return objectStack.pop();
};
