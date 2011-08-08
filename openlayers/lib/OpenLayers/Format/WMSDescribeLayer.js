/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML/VersionedOGC.js
 */

/**
 * Class: OpenLayers.Format.WMSDescribeLayer
 * Read SLD WMS DescribeLayer response
 * DescribeLayer is meant to couple WMS to WFS and WCS
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML.VersionedOGC>
 */
OpenLayers.Format.WMSDescribeLayer = OpenLayers.Class(OpenLayers.Format.XML.VersionedOGC, {

    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.  Default is "1.1.1".
     */
    defaultVersion: "1.1.1",
   
    /**
     * Method: getVersion
     * Returns the version to use. Subclasses can override this function
     * if a different version detection is needed.
     *
     * Parameters:
     * root - {DOMElement}
     * options - {Object} Optional configuration object.
     *
     * Returns:
     * {String} The version to use.
     */
    getVersion: function(root, options) {
        var version = OpenLayers.Format.XML.VersionedOGC.prototype.getVersion.apply(
            this, arguments);
        // these are identical to us, but some WMS use 1.1.1 and some use 1.1.0
        if (version == "1.1.1" || version == "1.1.0") {
            version = "1.1";
        }
        return version;
    },

    /**
     * Constructor: OpenLayers.Format.WMSDescribeLayer
     * Create a new parser for WMS DescribeLayer responses.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

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
    
    CLASS_NAME: "OpenLayers.Format.WMSDescribeLayer" 

});
