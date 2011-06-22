/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 */
 
/**
 * Class: OpenLayers.Format.WPSCapabilities
 * Read WPS Capabilities.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WPSCapabilities = OpenLayers.Class(OpenLayers.Format.XML, {
    
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
     * {<OpenLayers.Format>} A cached versioned format used for reading.
     */
    parser: null,     

    /**
     * Constructor: OpenLayers.Format.WPSCapabilities
     * Create a new parser for WPS Capabilities.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * APIMethod: read
     * Read capabilities data from a string, and return information about
     * the service.
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Object} Info about the WPS
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var root = data.documentElement;
        var version = this.version || root.getAttribute("version") || this.defaultVersion;
        if(!this.parser || this.parser.version !== version) {
            var constr = OpenLayers.Format.WPSCapabilities[
                "v" + version.replace(/\./g, "_")
            ];
            if(!constr) {
                throw "Can't find a WPS capabilities parser for version " + version;
            }
            var parser = new constr(this.options);
        }
        var capabilities = parser.read(data);
        capabilities.version = version;
        return capabilities; 
    },
    
    CLASS_NAME: "OpenLayers.Format.WPSCapabilities" 

});
