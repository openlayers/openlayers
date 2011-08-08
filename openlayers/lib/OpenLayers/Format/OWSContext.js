/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/Context.js
 */

/**
 * Class: OpenLayers.Format.OWSContext
 * Read and write OWS Context documents. OWS Context documents are a 
 * preliminary OGC (Open Geospatial Consortium) standard for storing the 
 * state of a web mapping application. In a way it is the successor to
 * Web Map Context (WMC), since it is more generic and more types of layers
 * can be stored. Also, nesting of layers is supported since version 0.3.1.
 * For more information see: http://www.ogcnetwork.net/context
 */
OpenLayers.Format.OWSContext = OpenLayers.Class(OpenLayers.Format.Context,{
    
    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.  Default is "0.3.1".
     */
    defaultVersion: "0.3.1",

    /**
     * Constructor: OpenLayers.Format.OWSContext
     * Create a new parser for OWS Context documents.
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
        var version = OpenLayers.Format.XML.VersionedOGC.prototype.getVersion.apply(
            this, arguments);
        // 0.3.1 is backwards compatible with 0.3.0
        if (version === "0.3.0") {
            version = this.defaultVersion;
        }
        return version;
    },

    /**
     * Method: toContext
     * Create a context object free from layer given a map or a
     * context object.
     *
     * Parameters:
     * obj - {<OpenLayers.Map> | Object} The map or context.
     *
     * Returns:
     * {Object} A context object.
     */
    toContext: function(obj) {
        var context = {};
        if(obj.CLASS_NAME == "OpenLayers.Map") {
            context.bounds = obj.getExtent();
            context.maxExtent = obj.maxExtent;
            context.projection = obj.projection;
            context.size = obj.getSize();
            context.layers = obj.layers;
        }
        return context;
    },

    CLASS_NAME: "OpenLayers.Format.OWSContext" 

});
