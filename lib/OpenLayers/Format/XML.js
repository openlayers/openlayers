/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Format.js
 *
 * Class: OpenLayers.Format.XML
 * Read and write XML.  For cross-browser XML generation, use methods on an
 *     instance of the XML format class instead of on <code>document<end>.
 *     The DOM creation and traversing methods exposed here all mimic the
 *     W3C XML DOM methods.  Create a new parser with the
 *     <OpenLayers.Format.XML> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format>
 */
OpenLayers.Format.XML = OpenLayers.Class.create();
OpenLayers.Format.XML.prototype = 
  OpenLayers.Class.inherit(OpenLayers.Format, {
    
    /**
     * Property: xmldom
     * {XMLDom} If this browser uses ActiveX, this will be set to a XMLDOM
     *     object.  It is not intended to be a browser sniffing property.
     *     Instead, the xmldom property is used instead of <code>document<end>
     *     where namespaced node creation methods are not supported. In all
     *     other browsers, this remains null.
     */
    xmldom: null,

    /**
     * Constructor: OpenLayers.Format.XML
     * Construct an XML parser.  The parser is used to read and write XML.
     *     Reading XML from a string returns a DOM element.  Writing XML from
     *     a DOM element returns a string.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on
     *     the object.
     */
    initialize: function(options) {
        if(window.ActiveXObject) {
            this.xmldom = new ActiveXObject("Microsoft.XMLDOM");
        }
        OpenLayers.Format.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: read
     * Deserialize a XML string and return a DOM node.
     *
     * Parameters:
     * text - {String} A XML string
     
     * Returns:
     * {DOMElement} A DOM node
     */
    read: function(text) {
        var index = text.indexOf('<');
        if(index > 0) {
            text = text.substring(index);
        }
        var node = OpenLayers.Util.Try(
            function() {
                var xmldom;
                /**
                 * Since we want to be able to call this method on the prototype
                 * itself, this.xmldom may not exist even if in IE.
                 */
                if(window.ActiveXObject && !this.xmldom) {
                    xmldom = new ActiveXObject("Microsoft.XMLDOM");
                } else {
                    xmldom = this.xmldom;
                }
                xmldom.loadXML(text);
                return xmldom;
            },
            function() {
                return new DOMParser().parseFromString(text, 'text/xml');
            },
            function() {
                var req = new XMLHttpRequest();
                req.open("GET", "data:" + "text/xml" +
                         ";charset=utf-8," + encodeURIComponent(text), false);
                if(req.overrideMimeType) {
                    req.overrideMimeType("text/xml");
                }
                req.send(null);
                return req.responseXML;
            }
        );
        return node;
    },

    /**
     * APIMethod: write
     * Serialize a DOM node into a XML string.
     * 
     * Parameters:
     * node - {DOMElement} A DOM node.
     *
     * Returns:
     * {String} The XML string representation of the input node.
     */
    write: function(node) {
        var data;
        if(this.xmldom) {
            data = node.xml;
        } else {
            var serializer = new XMLSerializer();
            data = serializer.serializeToString(node);
        }
        return data;
    },

    /**
     * APIMethod: createElementNS
     * Create a new element with namespace.  This node can be appended to
     *     another node with the standard node.appendChild method.  For
     *     cross-browser support, this method must be used instead of
     *     document.createElementNS.
     *
     * Parameters:
     * uri - {String} Namespace URI for the element.
     * name - {String} The qualified name of the element (prefix:localname).
     * 
     * Returns:
     * {Element} A DOM element with namespace.
     */
    createElementNS: function(uri, name) {
        var element;
        if(this.xmldom) {
            element = this.xmldom.createNode(1, name, uri);
        } else {
            element = document.createElementNS(uri, name);
        }
        return element;
    },

    /**
     * APIMethod: createTextNode
     * Create a text node.  This node can be appended to another node with
     *     the standard node.appendChild method.  For cross-browser support,
     *     this method must be used instead of document.createTextNode.
     * 
     * Parameters:
     * text - {String} The text of the node.
     * 
     * Returns: 
     * {DOMElement} A DOM text node.
     */
    createTextNode: function(text) {
        var node;
        if(this.xmldom) {
            node = this.xmldom.createTextNode(text);
        } else {
            node = document.createTextNode(text);
        }
        return node;
    },

    /**
     * APIMethod: getElementsByTagNameNS
     * Get a list of elements on a node given the namespace URI and local name.
     *     To return all nodes in a given namespace, use '*' for the name
     *     argument.  To return all nodes of a given (local) name, regardless
     *     of namespace, use '*' for the uri argument.
     * 
     * Parameters:
     * node - {Element} Node on which to search for other nodes.
     * uri - {String} Namespace URI.
     * name - {String} Local name of the tag (without the prefix).
     * 
     * Returns:
     * {NodeList} A node list or array of elements.
     */
    getElementsByTagNameNS: function(node, uri, name) {
        var elements = [];
        if(node.getElementsByTagNameNS) {
            elements = node.getElementsByTagNameNS(uri, name);
        } else {
            var allNodes = node.getElementsByTagName("*");
            var potentialNode, fullName;
            for(var i=0; i<allNodes.length; ++i) {
                potentialNode = allNodes[i];
                fullName = (potentialNode.prefix) ?
                           (potentialNode.prefix + ":" + name) : name;
                if((name == "*") || (fullName == potentialNode.nodeName)) {
                    if((uri == "*") || (uri == potentialNode.namespaceURI)) {
                        elements.push(potentialNode);
                    }
                }
            }
        }
        return elements;
    },

    /**
     * APIMethod: getAttributeNodeNS
     * Get an attribute node given the namespace URI and local name.
     * 
     * Parameters:
     * node - {Element} Node on which to search for attribute nodes.
     * uri - {String} Namespace URI.
     * name - {String} Local name of the attribute (without the prefix).
     * 
     * Returns:
     * {DOMElement} An attribute node or null if none found.
     */
    getAttributeNodeNS: function(node, uri, name) {
        var attributeNode = null;
        if(node.getAttributeNodeNS) {
            attributeNode = node.getAttributeNodeNS(uri, name);
        } else {
            var attributes = node.attributes;
            var potentialNode, fullName;
            for(var i=0; i<attributes.length; ++i) {
                potentialNode = attributes[i];
                if(potentialNode.namespaceURI == uri) {
                    fullName = (potentialNode.prefix) ?
                               (potentialNode.prefix + ":" + name) : name;
                    if(fullName == potentialNode.nodeName) {
                        attributeNode = potentialNode;
                        break;
                    }
                }
            }
        }
        return attributeNode;
    },

    /**
     * APIMethod: getAttributeNS
     * Get an attribute value given the namespace URI and local name.
     * 
     * Parameters:
     * node - {Element} Node on which to search for an attribute.
     * uri - {String} Namespace URI.
     * name - {String} Local name of the attribute (without the prefix).
     * 
     * Returns:
     * {String} An attribute value or and empty string if none found.
     */
    getAttributeNS: function(node, uri, name) {
        var attributeValue = "";
        if(node.getAttributeNS) {
            attributeValue = node.getAttributeNS(uri, name);
        } else {
            var attributeNode = this.getAttributeNodeNS(node, uri, name);
            if(attributeNode) {
                attributeValue = attributeNode.nodeValue;
            }
        }
        return attributeValue;
    },

    /**
     * APIMethod: hasAttributeNS
     * Determine whether a node has a particular attribute matching the given
     *     name and namespace.
     * 
     * Parameters:
     * node - {Element} Node on which to search for an attribute.
     * uri - {String} Namespace URI.
     * name - {String} Local name of the attribute (without the prefix).
     * 
     * Returns:
     * {Boolean} The node has an attribute matching the name and namespace.
     */
    hasAttributeNS: function(node, uri, name) {
        var found = false;
        if(node.hasAttributeNS) {
            found = node.hasAttributeNS(uri, name);
        } else {
            found = !!this.getAttributeNodeNS(node, uri, name);
        }
        return found;
    },

    CLASS_NAME: "OpenLayers.Format.XML" 

});     
