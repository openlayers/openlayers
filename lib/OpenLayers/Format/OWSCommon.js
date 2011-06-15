/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 */

/**
 * Class: OpenLayers.Format.OWSCommon
 * Read OWSCommon. Create a new instance with the <OpenLayers.Format.OWSCommon>
 *     constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.OWSCommon = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.  Default is "1.0.0".
     */
    defaultVersion: "1.0.0",
    
    /**
     * APIProperty: version
     * {String} Specify a version string if one is known.
     */
    version: null,
    
    /**
     * Property: parser
     * {Object} Instance of the versioned parser.  Cached for multiple read and
     *     write calls of the same version.
     */
    parser: null,

    /**
     * Constructor: OpenLayers.Format.OWSCommon
     * Create a new parser for OWSCommon.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

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
    read: function(data, options) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var root = data.documentElement;
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
        if(!this.parser || this.parser.VERSION != version) {
            var format = OpenLayers.Format.OWSCommon[
                "v" + version.replace(/\./g, "_")
            ];
            if(!format) {
                throw "Can't find a OWSCommon parser for version " +
                      version;
            }
            this.parser = new format(this.options);
        }
        var ows = this.parser.read(data, options);
        return ows;
    },

    CLASS_NAME: "OpenLayers.Format.OWSCommon" 
});
