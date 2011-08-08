/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format.js
 */

/**
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
OpenLayers.Format.XML = OpenLayers.Class(OpenLayers.Format, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.  Properties
     *     of this object should not be set individually.  Read-only.  All
     *     XML subclasses should have their own namespaces object.  Use
     *     <setNamespace> to add or set a namespace alias after construction.
     */
    namespaces: null,
    
    /**
     * Property: namespaceAlias
     * {Object} Mapping of namespace URI to namespace alias.  This object
     *     is read-only.  Use <setNamespace> to add or set a namespace alias.
     */
    namespaceAlias: null,
    
    /**
     * Property: defaultPrefix
     * {String} The default namespace alias for creating element nodes.
     */
    defaultPrefix: null,
    
    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {},
    
    /**
     * Property: writers
     * As a compliment to the <readers> property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {},

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
        // clone the namespace object and set all namespace aliases
        this.namespaces = OpenLayers.Util.extend({}, this.namespaces);
        this.namespaceAlias = {};
        for(var alias in this.namespaces) {
            this.namespaceAlias[this.namespaces[alias]] = alias;
        }
    },
    
    /**
     * APIMethod: destroy
     * Clean up.
     */
    destroy: function() {
        this.xmldom = null;
        OpenLayers.Format.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * Method: setNamespace
     * Set a namespace alias and URI for the format.
     *
     * Parameters:
     * alias - {String} The namespace alias (prefix).
     * uri - {String} The namespace URI.
     */
    setNamespace: function(alias, uri) {
        this.namespaces[alias] = uri;
        this.namespaceAlias[uri] = alias;
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
            OpenLayers.Function.bind((
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
                }
            ), this),
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

        if(this.keepData) {
            this.data = node;
        }

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
            if (node.nodeType == 1) {
                // Add nodes to a document before serializing. Everything else
                // is serialized as is. This may need more work. See #1218 .
                var doc = document.implementation.createDocument("", "", null);
                if (doc.importNode) {
                    node = doc.importNode(node, true);
                }
                doc.appendChild(node);
                data = serializer.serializeToString(doc);
            } else {
                data = serializer.serializeToString(node);
            }
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
            if(typeof uri == "string") {
                element = this.xmldom.createNode(1, name, uri);
            } else {
                element = this.xmldom.createNode(1, name, "");
            }
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
        if (typeof text !== "string") {
            text = String(text);
        }
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
            // brute force method
            var allNodes = node.getElementsByTagName("*");
            var potentialNode, fullName;
            for(var i=0, len=allNodes.length; i<len; ++i) {
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
            for(var i=0, len=attributes.length; i<len; ++i) {
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
            attributeValue = node.getAttributeNS(uri, name) || "";
        } else {
            var attributeNode = this.getAttributeNodeNS(node, uri, name);
            if(attributeNode) {
                attributeValue = attributeNode.nodeValue;
            }
        }
        return attributeValue;
    },
    
    /**
     * APIMethod: getChildValue
     * Get the textual value of the node if it exists, or return an
     *     optional default string.  Returns an empty string if no first child
     *     exists and no default value is supplied.
     *
     * Parameters:
     * node - {DOMElement} The element used to look for a first child value.
     * def - {String} Optional string to return in the event that no
     *     first child value exists.
     *
     * Returns:
     * {String} The value of the first child of the given node.
     */
    getChildValue: function(node, def) {
        var value = def || "";
        if(node) {
            for(var child=node.firstChild; child; child=child.nextSibling) {
                switch(child.nodeType) {
                    case 3: // text node
                    case 4: // cdata section
                        value += child.nodeValue;
                }
            }
        }
        return value;
    },

    /**
     * APIMethod: concatChildValues
     * *Deprecated*. Use <getChildValue> instead.
     *
     * Concatenate the value of all child nodes if any exist, or return an
     *     optional default string.  Returns an empty string if no children
     *     exist and no default value is supplied.  Not optimized for large
     *     numbers of child nodes.
     *
     * Parameters:
     * node - {DOMElement} The element used to look for child values.
     * def - {String} Optional string to return in the event that no
     *     child exist.
     *
     * Returns:
     * {String} The concatenated value of all child nodes of the given node.
     */
    concatChildValues: function(node, def) {
        var value = "";
        var child = node.firstChild;
        var childValue;
        while(child) {
            childValue = child.nodeValue;
            if(childValue) {
                value += childValue;
            }
            child = child.nextSibling;
        }
        if(value == "" && def != undefined) {
            value = def;
        }
        return value;
    },
    
    /**
     * APIMethod: isSimpleContent
     * Test if the given node has only simple content (i.e. no child element
     *     nodes).
     *
     * Parameters:
     * node - {DOMElement} An element node.
     *
     * Returns:
     * {Boolean} The node has no child element nodes (nodes of type 1). 
     */
    isSimpleContent: function(node) {
        var simple = true;
        for(var child=node.firstChild; child; child=child.nextSibling) {
            if(child.nodeType === 1) {
                simple = false;
                break;
            }
        }
        return simple;
    },
    
    /**
     * APIMethod: contentType
     * Determine the content type for a given node.
     *
     * Parameters:
     * node - {DOMElement}
     *
     * Returns:
     * {Integer} One of OpenLayers.Format.XML.CONTENT_TYPE.{EMPTY,SIMPLE,COMPLEX,MIXED}
     *     if the node has no, simple, complex, or mixed content.
     */
    contentType: function(node) {
        var simple = false,
            complex = false;
            
        var type = OpenLayers.Format.XML.CONTENT_TYPE.EMPTY;

        for(var child=node.firstChild; child; child=child.nextSibling) {
            switch(child.nodeType) {
                case 1: // element
                    complex = true;
                    break;
                case 8: // comment
                    break;
                default:
                    simple = true;
            }
            if(complex && simple) {
                break;
            }
        }
        
        if(complex && simple) {
            type = OpenLayers.Format.XML.CONTENT_TYPE.MIXED;
        } else if(complex) {
            return OpenLayers.Format.XML.CONTENT_TYPE.COMPLEX;
        } else if(simple) {
            return OpenLayers.Format.XML.CONTENT_TYPE.SIMPLE;
        }
        return type;
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
    
    /**
     * APIMethod: setAttributeNS
     * Adds a new attribute or changes the value of an attribute with the given
     *     namespace and name.
     *
     * Parameters:
     * node - {Element} Element node on which to set the attribute.
     * uri - {String} Namespace URI for the attribute.
     * name - {String} Qualified name (prefix:localname) for the attribute.
     * value - {String} Attribute value.
     */
    setAttributeNS: function(node, uri, name, value) {
        if(node.setAttributeNS) {
            node.setAttributeNS(uri, name, value);
        } else {
            if(this.xmldom) {
                if(uri) {
                    var attribute = node.ownerDocument.createNode(
                        2, name, uri
                    );
                    attribute.nodeValue = value;
                    node.setAttributeNode(attribute);
                } else {
                    node.setAttribute(name, value);
                }
            } else {
                throw "setAttributeNS not implemented";
            }
        }
    },

    /**
     * Method: createElementNSPlus
     * Shorthand for creating namespaced elements with optional attributes and
     *     child text nodes.
     *
     * Parameters:
     * name - {String} The qualified node name.
     * options - {Object} Optional object for node configuration.
     *
     * Valid options:
     * uri - {String} Optional namespace uri for the element - supply a prefix
     *     instead if the namespace uri is a property of the format's namespace
     *     object.
     * attributes - {Object} Optional attributes to be set using the
     *     <setAttributes> method.
     * value - {String} Optional text to be appended as a text node.
     *
     * Returns:
     * {Element} An element node.
     */
    createElementNSPlus: function(name, options) {
        options = options || {};
        // order of prefix preference
        // 1. in the uri option
        // 2. in the prefix option
        // 3. in the qualified name
        // 4. from the defaultPrefix
        var uri = options.uri || this.namespaces[options.prefix];
        if(!uri) {
            var loc = name.indexOf(":");
            uri = this.namespaces[name.substring(0, loc)];
        }
        if(!uri) {
            uri = this.namespaces[this.defaultPrefix];
        }
        var node = this.createElementNS(uri, name);
        if(options.attributes) {
            this.setAttributes(node, options.attributes);
        }
        var value = options.value;
        if(value != null) {
            node.appendChild(this.createTextNode(value));
        }
        return node;
    },
    
    /**
     * Method: setAttributes
     * Set multiple attributes given key value pairs from an object.
     *
     * Parameters:
     * node - {Element} An element node.
     * obj - {Object || Array} An object whose properties represent attribute
     *     names and values represent attribute values.  If an attribute name
     *     is a qualified name ("prefix:local"), the prefix will be looked up
     *     in the parsers {namespaces} object.  If the prefix is found,
     *     setAttributeNS will be used instead of setAttribute.
     */
    setAttributes: function(node, obj) {
        var value, uri;
        for(var name in obj) {
            if(obj[name] != null && obj[name].toString) {
                value = obj[name].toString();
                // check for qualified attribute name ("prefix:local")
                uri = this.namespaces[name.substring(0, name.indexOf(":"))] || null;
                this.setAttributeNS(node, uri, name, value);
            }
        }
    },

    /**
     * Method: readNode
     * Shorthand for applying one of the named readers given the node
     *     namespace and local name.  Readers take two args (node, obj) and
     *     generally extend or modify the second.
     *
     * Parameters:
     * node - {DOMElement} The node to be read (required).
     * obj - {Object} The object to be modified (optional).
     *
     * Returns:
     * {Object} The input object, modified (or a new one if none was provided).
     */
    readNode: function(node, obj) {
        if(!obj) {
            obj = {};
        }
        var group = this.readers[node.namespaceURI ? this.namespaceAlias[node.namespaceURI]: this.defaultPrefix];
        if(group) {
            var local = node.localName || node.nodeName.split(":").pop();
            var reader = group[local] || group["*"];
            if(reader) {
                reader.apply(this, [node, obj]);
            }
        }
        return obj;
    },

    /**
     * Method: readChildNodes
     * Shorthand for applying the named readers to all children of a node.
     *     For each child of type 1 (element), <readSelf> is called.
     *
     * Parameters:
     * node - {DOMElement} The node to be read (required).
     * obj - {Object} The object to be modified (optional).
     *
     * Returns:
     * {Object} The input object, modified.
     */
    readChildNodes: function(node, obj) {
        if(!obj) {
            obj = {};
        }
        var children = node.childNodes;
        var child;
        for(var i=0, len=children.length; i<len; ++i) {
            child = children[i];
            if(child.nodeType == 1) {
                this.readNode(child, obj);
            }
        }
        return obj;
    },

    /**
     * Method: writeNode
     * Shorthand for applying one of the named writers and appending the
     *     results to a node.  If a qualified name is not provided for the
     *     second argument (and a local name is used instead), the namespace
     *     of the parent node will be assumed.
     *
     * Parameters:
     * name - {String} The name of a node to generate.  If a qualified name
     *     (e.g. "pre:Name") is used, the namespace prefix is assumed to be
     *     in the <writers> group.  If a local name is used (e.g. "Name") then
     *     the namespace of the parent is assumed.  If a local name is used
     *     and no parent is supplied, then the default namespace is assumed.
     * obj - {Object} Structure containing data for the writer.
     * parent - {DOMElement} Result will be appended to this node.  If no parent
     *     is supplied, the node will not be appended to anything.
     *
     * Returns:
     * {DOMElement} The child node.
     */
    writeNode: function(name, obj, parent) {
        var prefix, local;
        var split = name.indexOf(":");
        if(split > 0) {
            prefix = name.substring(0, split);
            local = name.substring(split + 1);
        } else {
            if(parent) {
                prefix = this.namespaceAlias[parent.namespaceURI];
            } else {
                prefix = this.defaultPrefix;
            }
            local = name;
        }
        var child = this.writers[prefix][local].apply(this, [obj]);
        if(parent) {
            parent.appendChild(child);
        }
        return child;
    },

    /**
     * APIMethod: getChildEl
     * Get the first child element.  Optionally only return the first child
     *     if it matches the given name and namespace URI.
     *
     * Parameters:
     * node - {DOMElement} The parent node.
     * name - {String} Optional node name (local) to search for.
     * uri - {String} Optional namespace URI to search for.
     *
     * Returns:
     * {DOMElement} The first child.  Returns null if no element is found, if
     *     something significant besides an element is found, or if the element
     *     found does not match the optional name and uri.
     */
    getChildEl: function(node, name, uri) {
        return node && this.getThisOrNextEl(node.firstChild, name, uri);
    },
    
    /**
     * APIMethod: getNextEl
     * Get the next sibling element.  Optionally get the first sibling only
     *     if it matches the given local name and namespace URI.
     *
     * Parameters:
     * node - {DOMElement} The node.
     * name - {String} Optional local name of the sibling to search for.
     * uri - {String} Optional namespace URI of the sibling to search for.
     *
     * Returns:
     * {DOMElement} The next sibling element.  Returns null if no element is
     *     found, something significant besides an element is found, or the
     *     found element does not match the optional name and uri.
     */
    getNextEl: function(node, name, uri) {
        return node && this.getThisOrNextEl(node.nextSibling, name, uri);
    },
    
    /**
     * Method: getThisOrNextEl
     * Return this node or the next element node.  Optionally get the first
     *     sibling with the given local name or namespace URI.
     *
     * Parameters:
     * node - {DOMElement} The node.
     * name - {String} Optional local name of the sibling to search for.
     * uri - {String} Optional namespace URI of the sibling to search for.
     *
     * Returns:
     * {DOMElement} The next sibling element.  Returns null if no element is
     *     found, something significant besides an element is found, or the
     *     found element does not match the query.
     */
    getThisOrNextEl: function(node, name, uri) {
        outer: for(var sibling=node; sibling; sibling=sibling.nextSibling) {
            switch(sibling.nodeType) {
                case 1: // Element
                    if((!name || name === (sibling.localName || sibling.nodeName.split(":").pop())) &&
                       (!uri || uri === sibling.namespaceURI)) {
                        // matches
                        break outer;
                    }
                    sibling = null;
                    break outer;
                case 3: // Text
                    if(/^\s*$/.test(sibling.nodeValue)) {
                        break;
                    }
                case 4: // CDATA
                case 6: // ENTITY_NODE
                case 12: // NOTATION_NODE
                case 10: // DOCUMENT_TYPE_NODE
                case 11: // DOCUMENT_FRAGMENT_NODE
                    sibling = null;
                    break outer;
            } // ignore comments and processing instructions
        }
        return sibling || null;
    },
    
    /**
     * APIMethod: lookupNamespaceURI
     * Takes a prefix and returns the namespace URI associated with it on the given
     *     node if found (and null if not). Supplying null for the prefix will
     *     return the default namespace.
     *
     * For browsers that support it, this calls the native lookupNamesapceURI
     *     function.  In other browsers, this is an implementation of
     *     http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespaceURI.
     *
     * For browsers that don't support the attribute.ownerElement property, this
     *     method cannot be called on attribute nodes.
     *     
     * Parameters:
     * node - {DOMElement} The node from which to start looking.
     * prefix - {String} The prefix to lookup or null to lookup the default namespace.
     * 
     * Returns:
     * {String} The namespace URI for the given prefix.  Returns null if the prefix
     *     cannot be found or the node is the wrong type.
     */
    lookupNamespaceURI: function(node, prefix) {
        var uri = null;
        if(node) {
            if(node.lookupNamespaceURI) {
                uri = node.lookupNamespaceURI(prefix);
            } else {
                outer: switch(node.nodeType) {
                    case 1: // ELEMENT_NODE
                        if(node.namespaceURI !== null && node.prefix === prefix) {
                            uri = node.namespaceURI;
                            break outer;
                        }
                        var len = node.attributes.length;
                        if(len) {
                            var attr;
                            for(var i=0; i<len; ++i) {
                                attr = node.attributes[i];
                                if(attr.prefix === "xmlns" && attr.name === "xmlns:" + prefix) {
                                    uri = attr.value || null;
                                    break outer;
                                } else if(attr.name === "xmlns" && prefix === null) {
                                    uri = attr.value || null;
                                    break outer;
                                }
                            }
                        }
                        uri = this.lookupNamespaceURI(node.parentNode, prefix);
                        break outer;
                    case 2: // ATTRIBUTE_NODE
                        uri = this.lookupNamespaceURI(node.ownerElement, prefix);
                        break outer;
                    case 9: // DOCUMENT_NODE
                        uri = this.lookupNamespaceURI(node.documentElement, prefix);
                        break outer;
                    case 6: // ENTITY_NODE
                    case 12: // NOTATION_NODE
                    case 10: // DOCUMENT_TYPE_NODE
                    case 11: // DOCUMENT_FRAGMENT_NODE
                        break outer;
                    default: 
                        // TEXT_NODE (3), CDATA_SECTION_NODE (4), ENTITY_REFERENCE_NODE (5),
                        // PROCESSING_INSTRUCTION_NODE (7), COMMENT_NODE (8)
                        uri =  this.lookupNamespaceURI(node.parentNode, prefix);
                        break outer;
                }
            }
        }
        return uri;
    },
    
    /**
     * Method: getXMLDoc
     * Get an XML document for nodes that are not supported in HTML (e.g.
     * createCDATASection). On IE, this will either return an existing or
     * create a new <xmldom> on the instance. On other browsers, this will
     * either return an existing or create a new shared document (see
     * <OpenLayers.Format.XML.document>).
     *
     * Returns:
     * {XMLDocument}
     */
    getXMLDoc: function() {
        if (!OpenLayers.Format.XML.document && !this.xmldom) {
            if (document.implementation && document.implementation.createDocument) {
                OpenLayers.Format.XML.document =
                    document.implementation.createDocument("", "", null);
            } else if (!this.xmldom && window.ActiveXObject) {
                this.xmldom = new ActiveXObject("Microsoft.XMLDOM");
            }
        }
        return OpenLayers.Format.XML.document || this.xmldom;
    },

    CLASS_NAME: "OpenLayers.Format.XML" 

});     

OpenLayers.Format.XML.CONTENT_TYPE = {EMPTY: 0, SIMPLE: 1, COMPLEX: 2, MIXED: 3};

/**
 * APIFunction: OpenLayers.Format.XML.lookupNamespaceURI
 * Takes a prefix and returns the namespace URI associated with it on the given
 *     node if found (and null if not). Supplying null for the prefix will
 *     return the default namespace.
 *
 * For browsers that support it, this calls the native lookupNamesapceURI
 *     function.  In other browsers, this is an implementation of
 *     http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespaceURI.
 *
 * For browsers that don't support the attribute.ownerElement property, this
 *     method cannot be called on attribute nodes.
 *     
 * Parameters:
 * node - {DOMElement} The node from which to start looking.
 * prefix - {String} The prefix to lookup or null to lookup the default namespace.
 * 
 * Returns:
 * {String} The namespace URI for the given prefix.  Returns null if the prefix
 *     cannot be found or the node is the wrong type.
 */
OpenLayers.Format.XML.lookupNamespaceURI = OpenLayers.Function.bind(
    OpenLayers.Format.XML.prototype.lookupNamespaceURI,
    OpenLayers.Format.XML.prototype
);

/**
 * Property: OpenLayers.Format.XML.document
 * {XMLDocument} XML document to reuse for creating non-HTML compliant nodes,
 * like document.createCDATASection.
 */
OpenLayers.Format.XML.document = null;
