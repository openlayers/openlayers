/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 */
 
/**
 * Class: OpenLayers.Format.WFSDescribeFeatureType
 * Read WFS DescribeFeatureType response
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WFSDescribeFeatureType = OpenLayers.Class(
    OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        xsd: "http://www.w3.org/2001/XMLSchema"
    },
    
    /**
     * Constructor: OpenLayers.Format.WFSDescribeFeatureType
     * Create a new parser for WFS DescribeFeatureType responses.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    
    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {
        "xsd": {
            "schema": function(node, obj) {
                var complexTypes = [];
                var customTypes = {};
                var schema = {
                    complexTypes: complexTypes,
                    customTypes: customTypes
                };
                
                this.readChildNodes(node, schema);

                var attributes = node.attributes;
                var attr, name;
                for(var i=0, len=attributes.length; i<len; ++i) {
                    attr = attributes[i];
                    name = attr.name;
                    if(name.indexOf("xmlns") == 0) {
                        this.setNamespace(name.split(":")[1] || "", attr.value);
                    } else {
                        obj[name] = attr.value;
                    }
                }
                obj.featureTypes = complexTypes;                
                obj.targetPrefix = this.namespaceAlias[obj.targetNamespace];
                
                // map complexTypes to names of customTypes
                var complexType, customType;
                for(var i=0, len=complexTypes.length; i<len; ++i) {
                    complexType = complexTypes[i];
                    customType = customTypes[complexType.typeName];
                    if(customTypes[complexType.typeName]) {
                        complexType.typeName = customType.name;
                    }
                }
            },
            "complexType": function(node, obj) {
                var complexType = {
                    // this is a temporary typeName, it will be overwritten by
                    // the schema reader with the metadata found in the
                    // customTypes hash
                    "typeName": node.getAttribute("name")
                };
                this.readChildNodes(node, complexType);
                obj.complexTypes.push(complexType);
            },
            "complexContent": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "extension": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "sequence": function(node, obj) {
                var sequence = {
                    elements: []
                };
                this.readChildNodes(node, sequence);
                obj.properties = sequence.elements;
            },
            "element": function(node, obj) {
                if(obj.elements) {
                    var element = {};
                    var attributes = node.attributes;
                    var attr;
                    for(var i=0, len=attributes.length; i<len; ++i) {
                        attr = attributes[i];
                        element[attr.name] = attr.value;
                    }
                    
                    var type = element.type;
                    if(!type) {
                        type = {};
                        this.readChildNodes(node, type);
                        element.restriction = type;
                        element.type = type.base;
                    }
                    var fullType = type.base || type;
                    element.localType = fullType.split(":").pop();
                    obj.elements.push(element);
                }
                
                if(obj.complexTypes) {
                    var type = node.getAttribute("type");
                    var localType = type.split(":").pop();
                    obj.customTypes[localType] = {
                        "name": node.getAttribute("name"),
                        "type": type
                    };
                }
            },
            "simpleType": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "restriction": function(node, obj) {
                obj.base = node.getAttribute("base");
                this.readRestriction(node, obj);
            }
        }
    },
    
    /**
     * Method: readRestriction
     * Reads restriction defined in the child nodes of a restriction element
     * 
     * Parameters:
     * node - {DOMElement} the node to parse
     * obj - {Object} the object that receives the read result
     */
    readRestriction: function(node, obj) {
        var children = node.childNodes;
        var child, nodeName, value;
        for(var i=0, len=children.length; i<len; ++i) {
            child = children[i];
            if(child.nodeType == 1) {
                nodeName = child.nodeName.split(":").pop();
                value = child.getAttribute("value");
                if(!obj[nodeName]) {
                    obj[nodeName] = value;
                } else {
                    if(typeof obj[nodeName] == "string") {
                        obj[nodeName] = [obj[nodeName]];
                    }
                    obj[nodeName].push(value);
                }
            }
        }
    },
    
    /**
     * Method: read
     *
     * Parameters:
     * data - {DOMElement|String} A WFS DescribeFeatureType document.
     *
     * Returns:
     * {Object} An object representing the WFS DescribeFeatureType response.
     */
    read: function(data) {
        if(typeof data == "string") { 
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        if(data && data.nodeType == 9) {
            data = data.documentElement;
        }
        var schema = {};
        this.readNode(data, schema);
        
        return schema;
    },
    
    CLASS_NAME: "OpenLayers.Format.WFSDescribeFeatureType" 

});
