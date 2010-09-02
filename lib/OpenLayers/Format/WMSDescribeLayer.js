/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 */

/**
 * Class: OpenLayers.Format.WMSDescribeLayer
 * Read SLD WMS DescribeLayer response
 * DescribeLayer is meant to couple WMS to WFS and WCS
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WMSDescribeLayer = OpenLayers.Class(OpenLayers.Format.XML, {

    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.  Default is "1.1.1".
     */
    defaultVersion: "1.1.1",
   
    /**
     * APIProperty: version
     * {String} Specify a version string if one is known.
     */
    version: null,

    /**
     * Constructor: OpenLayers.Format.WMSDescribeLayer
     * Create a new parser for WMS DescribeLayer responses.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
        this.options = options;
    },

    /**
     * APIMethod: read
     * Read DescribeLayer data from a string, and return the response. 
     * The OGC currently defines 2 formats which are allowed for output,
     * so we need to parse these 2 types
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Array} Array of {<LayerDescription>} objects which have:
     * - {String} owsType: WFS/WCS
     * - {String} owsURL: the online resource
     * - {String} typeName: the name of the typename on the service
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var root = data.documentElement;
        var version = this.version;
        if(!version) {
            version = root.getAttribute("version");
            if(!version) {
                version = this.defaultVersion;
            }
        }
        // these are identical to us, but some WMS use 1.1.1 and some use 1.1.0
        if (version == "1.1.1" || version == "1.1.0") {
            version = "1.1";
        }
        var constructor = OpenLayers.Format.WMSDescribeLayer[
            "v" + version.replace(/\./g, "_")
        ];
        if(!constructor) {
            throw "Can't find a WMS DescribeLayer parser for version " + 
                version;
        }
        var parser = new constructor(this.options);
        var describelayer = parser.read(data);
        describelayer.version = version;
        return describelayer;
    },
    
    CLASS_NAME: "OpenLayers.Format.WMSDescribeLayer" 

});
