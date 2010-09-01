/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Style.js
 * @requires OpenLayers/Rule.js
 * @requires OpenLayers/Filter/FeatureId.js
 * @requires OpenLayers/Filter/Logical.js
 * @requires OpenLayers/Filter/Comparison.js
 * @requires OpenLayers/Filter/Spatial.js
 */

/**
 * Class: OpenLayers.Format.SLD
 * Read/Wite SLD. Create a new instance with the <OpenLayers.Format.SLD>
 *     constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.SLD = OpenLayers.Class(OpenLayers.Format.XML, {
    
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
     * APIProperty: namedLayersAsArray
     * {Boolean} Generate a namedLayers array.  If false, the namedLayers
     *     property value will be an object keyed by layer name. Default is
     *     false.
     */
    namedLayersAsArray: false,
    
    /**
     * Property: parser
     * {Object} Instance of the versioned parser.  Cached for multiple read and
     *     write calls of the same version.
     */
    parser: null,

    /**
     * Constructor: OpenLayers.Format.SLD
     * Create a new parser for SLD.
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
     * Write a SLD document given a list of styles.
     *
     * Parameters:
     * sld - {Object} An object representing the SLD.
     * options - {Object} Optional configuration object.
     *
     * Returns:
     * {String} An SLD document string.
     */
    write: function(sld, options) {
        var version = (options && options.version) ||
                      this.version || this.defaultVersion;
        if(!this.parser || this.parser.VERSION != version) {
            var format = OpenLayers.Format.SLD[
                "v" + version.replace(/\./g, "_")
            ];
            if(!format) {
                throw "Can't find a SLD parser for version " +
                      version;
            }
            this.parser = new format(this.options);
        }
        var root = this.parser.write(sld);
        return OpenLayers.Format.XML.prototype.write.apply(this, [root]);
    },
    
    /**
     * APIMethod: read
     * Read and SLD doc and return an object representing the SLD.
     *
     * Parameters:
     * data - {String | DOMElement} Data to read.
     * options - {Object} Options for the reader.
     *
     * Returns:
     * {Object} An object representing the SLD.
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
            var format = OpenLayers.Format.SLD[
                "v" + version.replace(/\./g, "_")
            ];
            if(!format) {
                throw "Can't find a SLD parser for version " +
                      version;
            }
            this.parser = new format(this.options);
        }
        var sld = this.parser.read(data, options);
        return sld;
    },

    CLASS_NAME: "OpenLayers.Format.SLD" 
});
