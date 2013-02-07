/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Format/CSWGetDomain.js
 */

/**
 * Class: OpenLayers.Format.CSWGetDomain.v2_0_2
 *     A format for creating CSWGetDomain v2.0.2 transactions. 
 *     Create a new instance with the
 *     <OpenLayers.Format.CSWGetDomain.v2_0_2> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.CSWGetDomain.v2_0_2 = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance",
        csw: "http://www.opengis.net/cat/csw/2.0.2"
    },

    /**
     * Property: defaultPrefix
     * {String} The default prefix (used by Format.XML).
     */
    defaultPrefix: "csw",
    
    /**
     * Property: version
     * {String} CSW version number.
     */
    version: "2.0.2",
    
    /**
     * Property: schemaLocation
     * {String} http://www.opengis.net/cat/csw/2.0.2
     *   http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd
     */
    schemaLocation: "http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd",

    /**
     * APIProperty: PropertyName
     * {String} Value of the csw:PropertyName element, used when
     *     writing a GetDomain document.
     */
    PropertyName: null,

    /**
     * APIProperty: ParameterName
     * {String} Value of the csw:ParameterName element, used when
     *     writing a GetDomain document.
     */
    ParameterName: null,
    
    /**
     * Constructor: OpenLayers.Format.CSWGetDomain.v2_0_2
     * A class for parsing and generating CSWGetDomain v2.0.2 transactions.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     *
     * Valid options properties:
     * - PropertyName
     * - ParameterName
     */

    /**
     * APIMethod: read
     * Parse the response from a GetDomain request.
     */
    read: function(data) {
        if(typeof data == "string") { 
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        if(data && data.nodeType == 9) {
            data = data.documentElement;
        }
        var obj = {};
        this.readNode(data, obj);
        return obj;
    },
    
    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {
        "csw": {
            "GetDomainResponse": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "DomainValues": function(node, obj) {
                if (!(OpenLayers.Util.isArray(obj.DomainValues))) {
                    obj.DomainValues = [];
                }
                var attrs = node.attributes;
                var domainValue = {};
                for(var i=0, len=attrs.length; i<len; ++i) {
                    domainValue[attrs[i].name] = attrs[i].nodeValue;
                }
                this.readChildNodes(node, domainValue);
                obj.DomainValues.push(domainValue);
            },
            "PropertyName": function(node, obj) {
                obj.PropertyName = this.getChildValue(node);
            },
            "ParameterName": function(node, obj) {
                obj.ParameterName = this.getChildValue(node);
            },
            "ListOfValues": function(node, obj) {
                if (!(OpenLayers.Util.isArray(obj.ListOfValues))) {
                    obj.ListOfValues = [];
                }
                this.readChildNodes(node, obj.ListOfValues);
            },
            "Value": function(node, obj) {
                var attrs = node.attributes;
                var value = {};
                for(var i=0, len=attrs.length; i<len; ++i) {
                    value[attrs[i].name] = attrs[i].nodeValue;
                }
                value.value = this.getChildValue(node);
                obj.push({Value: value});
            },
            "ConceptualScheme": function(node, obj) {
                obj.ConceptualScheme = {};
                this.readChildNodes(node, obj.ConceptualScheme);
            },
            "Name": function(node, obj) {
                obj.Name = this.getChildValue(node);
            },
            "Document": function(node, obj) {
                obj.Document = this.getChildValue(node);
            },
            "Authority": function(node, obj) {
                obj.Authority = this.getChildValue(node);
            },
            "RangeOfValues": function(node, obj) {
                obj.RangeOfValues = {};
                this.readChildNodes(node, obj.RangeOfValues);
            },
            "MinValue": function(node, obj) {
                var attrs = node.attributes;
                var value = {};
                for(var i=0, len=attrs.length; i<len; ++i) {
                    value[attrs[i].name] = attrs[i].nodeValue;
                }
                value.value = this.getChildValue(node);
                obj.MinValue = value;
            },
            "MaxValue": function(node, obj) {
                var attrs = node.attributes;
                var value = {};
                for(var i=0, len=attrs.length; i<len; ++i) {
                    value[attrs[i].name] = attrs[i].nodeValue;
                }
                value.value = this.getChildValue(node);
                obj.MaxValue = value;
            }
        }
    },
    
    /**
     * APIMethod: write
     * Given an configuration js object, write a CSWGetDomain request. 
     *
     * Parameters:
     * options - {Object} A object mapping the request.
     *
     * Returns:
     * {String} A serialized CSWGetDomain request.
     */
    write: function(options) {
        var node = this.writeNode("csw:GetDomain", options);
        return OpenLayers.Format.XML.prototype.write.apply(this, [node]);
    },

    /**
     * Property: writers
     * As a compliment to the readers property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {
        "csw": {
            "GetDomain": function(options) {
                var node = this.createElementNSPlus("csw:GetDomain", {
                    attributes: {
                        service: "CSW",
                        version: this.version
                    }
                });
                if (options.PropertyName || this.PropertyName) {
                    this.writeNode(
                        "csw:PropertyName",
                        options.PropertyName || this.PropertyName,
                        node
                    );
                } else if (options.ParameterName || this.ParameterName) {
                    this.writeNode(
                        "csw:ParameterName",
                        options.ParameterName || this.ParameterName,
                        node
                    );
                }
                this.readChildNodes(node, options);
                return node;
            },
            "PropertyName": function(value) {
                var node = this.createElementNSPlus("csw:PropertyName", {
                    value: value
                });
                return node;
            },
            "ParameterName": function(value) {
                var node = this.createElementNSPlus("csw:ParameterName", {
                    value: value
                });
                return node;
            }
        }
    },
   
    CLASS_NAME: "OpenLayers.Format.CSWGetDomain.v2_0_2" 
});
