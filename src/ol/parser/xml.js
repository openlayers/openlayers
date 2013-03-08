goog.provide('ol.parser.XML');



/**
 * @constructor
 */
ol.parser.XML = function() {
  this.regExes = {
    trimSpace: (/^\s*|\s*$/g),
    removeSpace: (/\s*/g),
    splitSpace: (/\s+/),
    trimComma: (/\s*,\s*/g)
  };
};


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
