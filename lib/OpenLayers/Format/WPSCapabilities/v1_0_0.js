/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WPSCapabilities.js
 * @requires OpenLayers/Format/OWSCommon/v1_1_0.js
 */

/**
 * Class: OpenLayers.Format.WPSCapabilities.v1_0_0
 * Read WPS Capabilities version 1.0.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WPSCapabilities.v1_0_0 = OpenLayers.Class(
    OpenLayers.Format.XML, {

    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        ows: "http://www.opengis.net/ows/1.1",
        wps: "http://www.opengis.net/wps/1.0.0",
        xlink: "http://www.w3.org/1999/xlink"
    },

    /**
     * Property: regExes
     * Compiled regular expressions for manipulating strings.
     */
    regExes: {
        trimSpace: (/^\s*|\s*$/g),
        removeSpace: (/\s*/g),
        splitSpace: (/\s+/),
        trimComma: (/\s*,\s*/g)
    },
    
    /**
     * Constructor: OpenLayers.Format.WPSCapabilities.v1_0_0
     * Create a new parser for WPS capabilities version 1.0.0. 
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: read
     * Read capabilities data from a string, and return info about the WPS.
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Object} Information about the WPS service.
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
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
        "wps": {
            "Capabilities": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "ProcessOfferings": function(node, obj) {
                obj.processOfferings = {};
                this.readChildNodes(node, obj.processOfferings);
            },
            "Process": function(node, processOfferings) {
                var processVersion = this.getAttributeNS(node, this.namespaces.wps, "processVersion");
                var process = {processVersion: processVersion};
                this.readChildNodes(node, process);
                processOfferings[process.identifier] = process;
            },
            "Languages": function(node, obj) {
                obj.languages = [];
                this.readChildNodes(node, obj.languages);
            },
            "Default": function(node, languages) {
                var language = {isDefault: true};
                this.readChildNodes(node, language);
                languages.push(language);
            },
            "Supported": function(node, languages) {
                var language = {};
                this.readChildNodes(node, language);     
                languages.push(language);
            }
        },
        "ows": OpenLayers.Format.OWSCommon.v1_1_0.prototype.readers["ows"]
    },    
    
    CLASS_NAME: "OpenLayers.Format.WPSCapabilities.v1_0_0" 

});
