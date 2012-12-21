/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WCSCapabilities.js
 */

/**
 * Class: OpenLayers.Format.WCSCapabilities.v1
 * Abstract class not to be instantiated directly.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WCSCapabilities.v1 = OpenLayers.Class(
    OpenLayers.Format.XML, {

    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        wcs: "http://www.opengis.net/wcs",
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance",
        ows: "http://www.opengis.net/ows"
    },

    /**
     * Property: defaultPrefix
     */
    defaultPrefix: "wcs",
    
    /**
     * Constructor: OpenLayers.Format.WCSCapabilities.v1_1
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
        "wcs": {
            "WCS_Capabilities": function(node, obj) {           // In 1.0.0, this was WCS_Capabilties, changed in 1.1.0
                this.readChildNodes(node, obj);
            },
            "Name": function(node, obj) {   //????
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

    CLASS_NAME: "OpenLayers.Format.WCSCapabilities.v1" 

});