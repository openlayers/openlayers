/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
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
     * Method: getParser
     * Get the OWSContext parser given a version. Create a new parser if it does not
     * already exist.
     *
     * Parameters:
     * version - {String} The version of the parser.
     *
     * Returns:
     * {<OpenLayers.Format.OWSContext>} An OWSContext parser.
     */
    getParser: function(version) {
        var v = version || this.version || this.defaultVersion;
        // 0.3.1 is backwards compatible with 0.3.0
        if (v === "0.3.0") {
            v = this.defaultVersion;
        }
        if(!this.parser || this.parser.VERSION != v) {
            var format = OpenLayers.Format.OWSContext[
                "v" + v.replace(/\./g, "_")
            ];
            if(!format) {
                throw "Can't find a OWSContext parser for version " + v;
            }
            this.parser = new format(this.options);
        }
        return this.parser;
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
