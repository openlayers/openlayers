/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Format/OGCExceptionReport.js
 */

/**
 * Class: OpenLayers.Format.XML.VersionedOGC
 * Base class for versioned formats, i.e. a format which supports multiple
 * versions.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.XML.VersionedOGC = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.
     */
    defaultVersion: null,
    
    /**
     * APIProperty: version
     * {String} Specify a version string if one is known.
     */
    version: null,

    /**
     * APIProperty: profile
     * {String} If provided, use a custom profile.
     */
    profile: null,

    /**
     * APIProperty: errorProperty
     * {String} Which property of the returned object to check for in order to
     * determine whether or not parsing has failed. In the case that the
     * errorProperty is undefined on the returned object, the document will be
     * run through an OGCExceptionReport parser.
     */
    errorProperty: null,

    /**
     * Property: name
     * {String} The name of this parser, this is the part of the CLASS_NAME
     * except for "OpenLayers.Format."
     */
    name: null,

    /**
     * APIProperty: stringifyOutput
     * {Boolean} If true, write will return a string otherwise a DOMElement.
     * Default is false.
     */
    stringifyOutput: false,

    /**
     * Property: parser
     * {Object} Instance of the versioned parser.  Cached for multiple read and
     *     write calls of the same version.
     */
    parser: null,

    /**
     * Constructor: OpenLayers.Format.XML.VersionedOGC.
     * Constructor.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on
     *     the object.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
        var className = this.CLASS_NAME;
        this.name = className.substring(className.lastIndexOf(".")+1);
    },

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
        var version;
        // read
        if (root) {
            version = this.version;
            if(!version) {
                version = root.getAttribute("version");
                if(!version) {
                    version = this.defaultVersion;
                }
            }
        } else { // write
            version = (options && options.version) || 
                this.version || this.defaultVersion;
        }
        return version;
    },

    /**
     * Method: getParser
     * Get an instance of the cached parser if available, otherwise create one.
     *
     * Parameters:
     * version - {String}
     *
     * Returns:
     * {<OpenLayers.Format>}
     */
    getParser: function(version) {
        version = version || this.defaultVersion;
        var profile = this.profile ? "_" + this.profile : "";
        if(!this.parser || this.parser.VERSION != version) {
            var format = OpenLayers.Format[this.name][
                "v" + version.replace(/\./g, "_") + profile
            ];
            if(!format) {
                throw "Can't find a " + this.name + " parser for version " +
                      version + profile;
            }
            this.parser = new format(this.options);
        }
        return this.parser;
    },

    /**
     * APIMethod: write
     * Write a document.
     *
     * Parameters:
     * obj - {Object} An object representing the document.
     * options - {Object} Optional configuration object.
     *
     * Returns:
     * {String} The document as a string
     */
    write: function(obj, options) {
        var version = this.getVersion(null, options);
        this.parser = this.getParser(version);
        var root = this.parser.write(obj, options);
        if (this.stringifyOutput === false) {
            return root;
        } else {
            return OpenLayers.Format.XML.prototype.write.apply(this, [root]);
        }
    },

    /**
     * APIMethod: read
     * Read a doc and return an object representing the document.
     *
     * Parameters:
     * data - {String | DOMElement} Data to read.
     * options - {Object} Options for the reader.
     *
     * Returns:
     * {Object} An object representing the document.
     */
    read: function(data, options) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var root = data.documentElement;
        var version = this.getVersion(root);
        this.parser = this.getParser(version);
        var obj = this.parser.read(data, options);
        if (this.errorProperty !== null && obj[this.errorProperty] === undefined) {
            // an error must have happened, so parse it and report back
            var format = new OpenLayers.Format.OGCExceptionReport();
            obj.error = format.read(data);
        }
        obj.version = version;
        return obj;
    },

    CLASS_NAME: "OpenLayers.Format.XML.VersionedOGC"
});
