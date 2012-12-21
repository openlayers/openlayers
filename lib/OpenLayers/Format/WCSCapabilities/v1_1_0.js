/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WCSCapabilities/v1.js
 * @requires OpenLayers/Format/OWSCommon/v1.js
 */

/**
 * Class: OpenLayers.Format.WCSCapabilities/v1_1_0
 * Read WCS Capabilities version 1.1.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WCSCapabilities>
 */
OpenLayers.Format.WCSCapabilities.v1_1_0 = OpenLayers.Class(
    OpenLayers.Format.WCSCapabilities.v1, {

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


    errorProperty: "Contents",   // <== Not sure if this is strictly required by standard... maybe better to set to NULL?

    
    /**
     * Constructor: OpenLayers.Format.WCSCapabilities.v1_1_0
     * Create a new parser for WCS capabilities version 1.1.0.
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
        "wcs": OpenLayers.Util.applyDefaults({
            "Capabilities": function(node, obj) {           // In 1.0.0, this was WCS_Capabilties, in 1.1.0, it's just Capabilities
                this.readChildNodes(node, obj);
            },

            "Contents": function(node, request) {
                request.featureTypeList = {
                    contents: []
                };
                this.readChildNodes(node, request.contents);
            },

            "CoverageSummary": function(node, request) {
                request.featureTypeList = {
                    coverageSummary: []
                };
                this.readChildNodes(node, request.coverageSummary);
            },

            "Identifier": function(node, obj) {
                obj.identifier = this.getChildValue(node);
            },

            "SupportedCRS": function(node, obj) {
                var crs = this.getChildValue(node);
                if(crs) {
                    if(!obj["supportedCRS"]) { 
                        obj["supportedCRS"] = [];
                    }
                    obj["supportedCRS"].push(crs);
                }
            },

            "DefaultSRS": function(node, obj) {
                var defaultSRS = this.getChildValue(node);
                if (defaultSRS) {
                    obj.srs = defaultSRS;
                }
            }
        }, OpenLayers.Format.WCSCapabilities.v1.prototype.readers["wcs"]),
        "ows": OpenLayers.Format.OWSCommon.v1.prototype.readers["ows"]
    },

    CLASS_NAME: "OpenLayers.Format.WCSCapabilities.v1_1_0" 

});