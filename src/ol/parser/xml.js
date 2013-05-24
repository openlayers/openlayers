goog.provide('ol.parser.XML');

goog.require('goog.dom.xml');
goog.require('ol.parser.Parser');



/**
 * @constructor
 * @extends {ol.parser.Parser}
 */
ol.parser.XML = function() {
  if (goog.global.ActiveXObject) {
    this.xmldom = new ActiveXObject('Microsoft.XMLDOM');
  }
  this.regExes = {
    trimSpace: (/^\s*|\s*$/g),
    removeSpace: (/\s*/g),
    splitSpace: (/\s+/),
    trimComma: (/\s*,\s*/g)
  };
};
goog.inherits(ol.parser.XML, ol.parser.Parser);


/**
 * Shorthand for applying one of the named readers given the node
 * namespace and local name.  Readers take two args (node, obj) and
 * generally extend or modify the second.
 *
 * @param {Element|Document} node The node to be read (required).
 * @param {Object} obj The object to be modified (optional).
 * @return {Object} The input object, modified (or a new one if none was
 * provided).
 */
ol.parser.XML.prototype.readNode = function(node, obj) {
  if (!obj) {
    obj = {};
  }
  var group = this.readers[node.namespaceURI] ||
      this.readers[this.defaultNamespaceURI];
  if (group) {
    var local = node.localName || node.nodeName.split(':').pop();
    var reader = group[local] || group['*'];
    if (reader) {
      reader.apply(this, [node, obj]);
    }
  }
  return obj;
};


/**
 * Shorthand for applying the named readers to all children of a node.
 * For each child of type 1 (element), <readSelf> is called.
 *
 * @param {Element|Document} node The node to be read (required).
 * @param {Object} obj The object to be modified (optional).
 * @return {Object} The input object, modified.
 */
ol.parser.XML.prototype.readChildNodes = function(node, obj) {
  if (!obj) {
    obj = {};
  }
  var children = node.childNodes;
  var child;
  for (var i = 0, len = children.length; i < len; ++i) {
    child = children[i];
    if (child.nodeType == 1) {
      this.readNode(child, obj);
    }
  }
  return obj;
};


/**
 * Get the textual value of the node if it exists, or return an
 * optional default string.  Returns an empty string if no first child
 * exists and no default value is supplied.
 *
 * @param {Element} node The element used to look for a first child value.
 * @param {string} def Optional string to return in the event that no
 * first child value exists.
 * @return {string} The value of the first child of the given node.
 */
ol.parser.XML.prototype.getChildValue = function(node, def) {
  var value = def || '';
  if (node) {
    for (var child = node.firstChild; child; child = child.nextSibling) {
      switch (child.nodeType) {
        case 3: // text node
        case 4: // cdata section
          value += child.nodeValue;
          break;
        default:
          break;
      }
    }
  }
  return value;
};


/**
 * Get an attribute node given the namespace URI and local name.
 *
 * @param {Element} node Node on which to search for attribute nodes.
 * @param {string} uri Namespace URI.
 * @param {string} name Local name of the attribute (without the prefix).
 * @return {?Element} An attribute node or null if none found.
 */
ol.parser.XML.prototype.getAttributeNodeNS = function(node, uri, name) {
  var attributeNode = null;
  if (node.getAttributeNodeNS) {
    attributeNode = node.getAttributeNodeNS(uri, name);
  } else {
    var attributes = node.attributes;
    var potentialNode, fullName;
    for (var i = 0, len = attributes.length; i < len; ++i) {
      potentialNode = attributes[i];
      if (potentialNode.namespaceURI == uri) {
        fullName = (potentialNode.prefix) ?
            (potentialNode.prefix + ':' + name) : name;
        if (fullName == potentialNode.nodeName) {
          attributeNode = potentialNode;
          break;
        }
      }
    }
  }
  return attributeNode;
};


/**
 * Get an attribute value given the namespace URI and local name.
 *
 * @param {Element} node Node on which to search for an attribute.
 * @param {string} uri Namespace URI.
 * @param {string} name Local name of the attribute (without the prefix).
 * @return {string} An attribute value or and empty string if none found.
 */
ol.parser.XML.prototype.getAttributeNS = function(node, uri, name) {
  var attributeValue = '';
  if (node.getAttributeNS) {
    attributeValue = node.getAttributeNS(uri, name) || '';
  } else {
    var attributeNode = this.getAttributeNodeNS(node, uri, name);
    if (attributeNode) {
      attributeValue = attributeNode.nodeValue;
    }
  }
  return attributeValue;
};


/**
 * Create a new element with namespace.  This node can be appended to
 * another node with the standard node.appendChild method.  For
 * cross-browser support, this method must be used instead of
 * document.createElementNS.
 *
 * @param {string} name The qualified name of the element (prefix:localname).
 * @param {string=} opt_uri Namespace URI for the element.
 * @return {Element} A DOM element with namespace.
 */
ol.parser.XML.prototype.createElementNS = function(name, opt_uri) {
  var uri = opt_uri ? opt_uri : this.defaultNamespaceURI;
  var element;
  if (this.xmldom) {
    element = this.xmldom.createNode(1, name, uri);
  } else {
    element = document.createElementNS(uri, name);
  }
  return element;
};


/**
 * Shorthand for applying one of the named writers and appending the
 * results to a node.
 *
 * @param {string} name The name of a node to generate. Only use a local name.
 * @param {Object} obj Structure containing data for the writer.
 * @param {string=} opt_uri The name space uri to which the node belongs.
 * @param {Element=} opt_parent Result will be appended to this node. If no
 * parent is supplied, the node will not be appended to anything.
 * @return {?Element} The child node.
 */
ol.parser.XML.prototype.writeNode = function(name, obj, opt_uri, opt_parent) {
  var child = null;
  if (goog.isDef(this.writers)) {
    var uri = opt_uri ? opt_uri : this.defaultNamespaceURI;
    child = this.writers[uri][name].apply(this, [obj]);
    if (opt_parent && child) {
      opt_parent.appendChild(child);
    }
  }
  return child;
};


/**
 * Create a text node. This node can be appended to another node with
 * the standard node.appendChild method.  For cross-browser support,
 * this method must be used instead of document.createTextNode.
 *
 * @param {string} text The text of the node.
 * @return {Element} A DOM text node.
 */
ol.parser.XML.prototype.createTextNode = function(text) {
  var node;
  if (this.xmldom) {
    node = this.xmldom.createTextNode(text);
  } else {
    node = document.createTextNode(text);
  }
  return node;
};


/**
 * Adds a new attribute or changes the value of an attribute with the given
 * namespace and name.
 *
 * @param {Element} node Element node on which to set the attribute.
 * @param {string} uri Namespace URI for the attribute.
 * @param {string} name Qualified name (prefix:localname) for the attribute.
 * @param {string} value Attribute value.
 */
ol.parser.XML.prototype.setAttributeNS = function(node, uri, name, value) {
  if (node.setAttributeNS) {
    node.setAttributeNS(uri, name, value);
  } else {
    if (this.xmldom) {
      if (uri) {
        var attribute = node.ownerDocument.createNode(
            2, name, uri);
        attribute.nodeValue = value;
        node.setAttributeNode(attribute);
      } else {
        node.setAttribute(name, value);
      }
    } else {
      throw new Error('setAttributeNS not implemented');
    }
  }
};


/**
 * Serializes a node.
 *
 * @param {Element} node Element node to serialize.
 * @return {string} The serialized XML string.
 */
ol.parser.XML.prototype.serialize = function(node) {
  if (this.xmldom) {
    return node.xml;
  } else if (node.nodeType == 1) {
    // Add nodes to a document before serializing. Everything else
    // is serialized as is. This is also needed to get all namespaces
    // defined in some browsers such as Chrome (xmlns attributes).
    var doc = document.implementation.createDocument('', '', null);
    if (doc.importNode) {
      doc.appendChild(doc.importNode(node, true));
    } else {
      doc.appendChild(node);
    }
    return goog.dom.xml.serialize(doc);
  } else {
    return goog.dom.xml.serialize(node);
  }
};
