/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Filter/FeatureId.js
 * @requires OpenLayers/Filter/Logical.js
 * @requires OpenLayers/Filter/Comparison.js
 */

/**
 * Class: OpenLayers.Format.Filter
 * Read/Wite ogc:Filter. Create a new instance with the <OpenLayers.Format.Filter>
 *     constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.Filter = OpenLayers.Class(OpenLayers.Format.XML, {
    
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
     * Constructor: OpenLayers.Format.Filter
     * Create a new parser for Filter.
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
     * Write an ogc:Filter given a filter object.
     *
     * Parameters:
     * filter - {<OpenLayers.Filter>} An filter.
     * options - {Object} Optional configuration object.
     *
     * Returns:
     * {Elment} An ogc:Filter element node.
     */
    write: function(filter, options) {
        var version = (options && options.version) ||
                      this.version || this.defaultVersion;
        if(!this.parser || this.parser.VERSION != version) {
            var format = OpenLayers.Format.Filter[
                "v" + version.replace(/\./g, "_")
            ];
            if(!format) {
                throw "Can't find a Filter parser for version " +
                      version;
            }
            this.parser = new format(this.options);
        }
        return this.parser.write(filter);
        //return OpenLayers.Format.XML.prototype.write.apply(this, [root]);
    },
    
    /**
     * APIMethod: read
     * Read and Filter doc and return an object representing the Filter.
     *
     * Parameters:
     * data - {String | DOMElement} Data to read.
     *
     * Returns:
     * {<OpenLayers.Filter>} A filter object.
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var root = data.nodeType == 9 ? data.documentElement : data;
        var version = this.version;
        if(!version) {
            version = this.defaultVersion;
        }
        if(!this.parser || this.parser.VERSION != version) {
            var format = OpenLayers.Format.Filter[
                "v" + version.replace(/\./g, "_")
            ];
            if(!format) {
                throw "Can't find a Filter parser for version " +
                      version;
            }
            this.parser = new format(this.options);
        }
        var filter = this.parser.read(data);
        return filter;
    },

    CLASS_NAME: "OpenLayers.Format.Filter" 
});
