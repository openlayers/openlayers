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
 *  - <OpenLayers.Format.WCSCapabilities.v1>
 */
OpenLayers.Format.WCSCapabilities.v1_1_0 = OpenLayers.Class(
    OpenLayers.Format.WCSCapabilities.v1, {


    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        wcs: "http://www.opengis.net/wcs/1.1",
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance",
        ows: "http://www.opengis.net/ows/1.1"
    },

    /**
     * APIProperty: errorProperty
     * {String} Which property of the returned object to check for in order to
     * determine whether or not parsing has failed. In the case that the
     * errorProperty is undefined on the returned object, the document will be
     * run through an OGCExceptionReport parser.
     */
    errorProperty: "operationsMetadata",

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
                request.contents = [];
                this.readChildNodes(node, request.contents);
            },
            "CoverageSummary": function(node, contents) {
                var coverageSummary = {};
                this.readChildNodes(node, coverageSummary);     // Read the summary
                contents.push(coverageSummary);                 // Add it to the contents array
            },
            "Identifier": function(node, coverageSummary) {
                coverageSummary.identifier = this.getChildValue(node);
            },
            "Title": function(node, coverageSummary) {
              coverageSummary.title = this.getChildValue(node);
            },
            "Abstract": function(node, coverageSummary) {
                coverageSummary.abstract = this.getChildValue(node);
            },
            "SupportedCRS": function(node, coverageSummary) {
                var crs = this.getChildValue(node);
                if(crs) {
                    if(!coverageSummary["supportedCRS"]) { 
                        coverageSummary["supportedCRS"] = [];
                    }
                    coverageSummary["supportedCRS"].push(crs);
                }
            },
            "SupportedFormat": function(node, coverageSummary) {
                var format = this.getChildValue(node);
                if(format) {
                    if(!coverageSummary["supportedFormat"]) { 
                        coverageSummary["supportedFormat"] = [];
                    }
                    coverageSummary["supportedFormat"].push(format);
                }
            },

        }, OpenLayers.Format.WCSCapabilities.v1.prototype.readers["wcs"]),
        "ows": OpenLayers.Format.OWSCommon.v1.prototype.readers["ows"]
    },

    CLASS_NAME: "OpenLayers.Format.WCSCapabilities.v1_1_0" 

});