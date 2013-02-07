/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML/VersionedOGC.js
 */

/**
 * Class: OpenLayers.Format.OWSCommon
 * Read OWSCommon. Create a new instance with the <OpenLayers.Format.OWSCommon>
 *     constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML.VersionedOGC>
 */
OpenLayers.Format.OWSCommon = OpenLayers.Class(OpenLayers.Format.XML.VersionedOGC, {
    
    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.  Default is "1.0.0".
     */
    defaultVersion: "1.0.0",
    
    /**
     * Constructor: OpenLayers.Format.OWSCommon
     * Create a new parser for OWSCommon.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

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
        var version = this.version;
        if(!version) {
            // remember version does not correspond to the OWS version
            // it corresponds to the WMS/WFS/WCS etc. request version
            var uri = root.getAttribute("xmlns:ows");
            // the above will fail if the namespace prefix is different than
            // ows and if the namespace is declared on a different element
            if (uri && uri.substring(uri.lastIndexOf("/")+1) === "1.1") {
                version ="1.1.0";
            } 
            if(!version) {
                version = this.defaultVersion;
            }
        }
        return version;
    },

    /**
     * APIMethod: read
     * Read an OWSCommon document and return an object.
     *
     * Parameters:
     * data - {String | DOMElement} Data to read.
     * options - {Object} Options for the reader.
     *
     * Returns:
     * {Object} An object representing the structure of the document.
     */

    CLASS_NAME: "OpenLayers.Format.OWSCommon" 
});
