/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 */

/**
 * Class: OpenLayers.Format.XLS
 * Read/Wite XLS (OpenLS). Create a new instance with the <OpenLayers.Format.XLS>
 *     constructor. Currently only implemented for Location Utility Services, more
 *     specifically only for Geocoding. No support for Reverse Geocoding as yet.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.XLS = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.  Default is "1.1.0".
     */
    defaultVersion: "1.1.0",
    
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
     * Constructor: OpenLayers.Format.XLS
     * Create a new parser for XLS.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: write
     * Write out an XLS request.
     *
     * Parameters:
     * request - {Object} An object representing the LUS request.
     * options - {Object} Optional configuration object.
     *
     * Returns:
     * {String} An XLS document string.
     */
    write: function(request, options) {
        var version = (options && options.version) ||
                      this.version || this.defaultVersion;
        if(!this.parser || this.parser.VERSION != version) {
            var format = OpenLayers.Format.XLS[
                "v" + version.replace(/\./g, "_")
            ];
            if(!format) {
                throw "Can't find an XLS parser for version " +
                      version;
            }
            this.parser = new format(this.options);
        }
        var root = this.parser.write(request);
        return OpenLayers.Format.XML.prototype.write.apply(this, [root]);
    },
    
    /**
     * APIMethod: read
     * Read an XLS doc and return an object representing the result.
     *
     * Parameters:
     * data - {String | DOMElement} Data to read.
     * options - {Object} Options for the reader.
     *
     * Returns:
     * {Object} An object representing the GeocodeResponse.
     */
    read: function(data, options) {
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
        if(!this.parser || this.parser.VERSION != version) {
            var format = OpenLayers.Format.XLS[
                "v" + version.replace(/\./g, "_")
            ];
            if(!format) {
                throw "Can't find an XLS parser for version " +
                      version;
            }
            this.parser = new format(this.options);
        }
        var xls = this.parser.read(data, options);
        return xls;
    },

    CLASS_NAME: "OpenLayers.Format.XLS" 
});
