/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WFSCapabilities.js
 */

/**
 * Class: OpenLayers.Format.WFSCapabilities.v1
 * Abstract class not to be instantiated directly.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WFSCapabilities.v1 = OpenLayers.Class(
    OpenLayers.Format.XML, {

    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        wfs: "http://www.opengis.net/wfs",
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance",
        ows: "http://www.opengis.net/ows"
    },


    /**
     * APIProperty: errorProperty
     * {String} Which property of the returned object to check for in order to
     * determine whether or not parsing has failed. In the case that the
     * errorProperty is undefined on the returned object, the document will be
     * run through an OGCExceptionReport parser.
     */
    errorProperty: "featureTypeList",

    /**
     * Property: defaultPrefix
     */
    defaultPrefix: "wfs",
    
    /**
     * Constructor: OpenLayers.Format.WFSCapabilities.v1_1
     * Create an instance of one of the subclasses.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * APIMethod: read
     * Read capabilities data from a string, and return a list of layers. 
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Array} List of named layers.
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var raw = data;
        if(data && data.nodeType == 9) {
            data = data.documentElement;
        }
        var capabilities = {};
        this.readNode(data, capabilities);
        return capabilities;
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
        "wfs": {
            "WFS_Capabilities": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "FeatureTypeList": function(node, request) {
                request.featureTypeList = {
                    featureTypes: []
                };
                this.readChildNodes(node, request.featureTypeList);
            },
            "FeatureType": function(node, featureTypeList) {
                var featureType = {};
                this.readChildNodes(node, featureType);
                featureTypeList.featureTypes.push(featureType);
            },
            "Name": function(node, obj) {
                var name = this.getChildValue(node);
                if(name) {
                    var parts = name.split(":");
                    obj.name = parts.pop();
                    if(parts.length > 0) {
                        obj.featureNS = this.lookupNamespaceURI(node, parts[0]);
                    }
                }
            },
            "Title": function(node, obj) {
                var title = this.getChildValue(node);
                if(title) {
                    obj.title = title;
                }
            },
            "Abstract": function(node, obj) {
                var abst = this.getChildValue(node);
                if(abst) {
                    obj["abstract"] = abst;
                }
            }
        }
    },

    CLASS_NAME: "OpenLayers.Format.WFSCapabilities.v1" 

});
