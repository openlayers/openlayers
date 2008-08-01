/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/Vector.js
 * @requires OpenLayers/Request/XMLHttpRequest.js
 */

/**
 * Class: OpenLayers.Layer.GML
 * Create a vector layer by parsing a GML file. The GML file is
 *     passed in as a parameter.
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Vector>
 */
OpenLayers.Layer.GML = OpenLayers.Class(OpenLayers.Layer.Vector, {
    
    /**
      * Property: loaded
      * {Boolean} Flag for whether the GML data has been loaded yet.
      */
    loaded: false,

    /**
      * APIProperty: format
      * {<OpenLayers.Format>} The format you want the data to be parsed with.
      */
    format: null,

    /**
     * APIProperty: formatOptions
     * {Object} Hash of options which should be passed to the format when it is
     * created. Must be passed in the constructor.
     */
    formatOptions: null, 
    
    /**
     * Constructor: OpenLayers.Layer.GML
     * Load and parse a single file on the web, according to the format
     * provided via the 'format' option, defaulting to GML. 
     *
     * Parameters:
     * name - {String} 
     * url - {String} URL of a GML file.
     * options - {Object} Hashtable of extra options to tag onto the layer.
     */
     initialize: function(name, url, options) {
        var newArguments = [];
        newArguments.push(name, options);
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, newArguments);
        this.url = url;
    },

    /**
     * APIMethod: setVisibility
     * Set the visibility flag for the layer and hide/show&redraw accordingly. 
     * Fire event unless otherwise specified
     * GML will be loaded if the layer is being made visible for the first
     * time.
     *  
     * Parameters:
     * visible - {Boolean} Whether or not to display the layer 
     *                          (if in range)
     * noEvent - {Boolean} 
     */
    setVisibility: function(visibility, noEvent) {
        OpenLayers.Layer.Vector.prototype.setVisibility.apply(this, arguments);
        if(this.visibility && !this.loaded){
            // Load the GML
            this.loadGML();
        }
    },

    /**
     * Method: moveTo
     * If layer is visible and GML has not been loaded, load GML, then load GML
     * and call OpenLayers.Layer.Vector.moveTo() to redraw at the new location.
     * 
     * Parameters:
     * bounds - {Object} 
     * zoomChanged - {Object} 
     * minor - {Object} 
     */
    moveTo:function(bounds, zoomChanged, minor) {
        OpenLayers.Layer.Vector.prototype.moveTo.apply(this, arguments);
        // Wait until initialisation is complete before loading GML
        // otherwise we can get a race condition where the root HTML DOM is
        // loaded after the GML is paited.
        // See http://trac.openlayers.org/ticket/404
        if(this.visibility && !this.loaded){
            this.events.triggerEvent("loadstart");
            this.loadGML();
        }
    },

    /**
     * Method: loadGML
     */
    loadGML: function() {
        if (!this.loaded) {
            OpenLayers.Request.GET({
                url: this.url,
                success: this.requestSuccess,
                failure: this.requestFailure,
                scope: this
            });
            this.loaded = true;
        }    
    },    
    
    /**
     * Method: setUrl
     * Change the URL and reload the GML
     *
     * Parameters:
     * url - {String} URL of a GML file.
     */
    setUrl:function(url) {
        this.url = url;
        this.destroyFeatures();
        this.loaded = false;
        this.events.triggerEvent("loadstart");
        this.loadGML();
    },
    
    /**
     * Method: requestSuccess
     * Process GML after it has been loaded.
     * Called by initialise() and loadUrl() after the GML has been loaded.
     *
     * Parameters:
     * request - {String} 
     */
    requestSuccess:function(request) {
        var doc = request.responseXML;
        
        if (!doc || !doc.documentElement) {
            doc = request.responseText;
        }
        
        var options = {};
        
        OpenLayers.Util.extend(options, this.formatOptions);
        if (this.map && !this.projection.equals(this.map.getProjectionObject())) {
            options.externalProjection = this.projection;
            options.internalProjection = this.map.getProjectionObject();
        }    
        
        var gml = this.format ? new this.format(options) : new OpenLayers.Format.GML(options);
        this.addFeatures(gml.read(doc));
        this.events.triggerEvent("loadend");
    },
    
    /**
     * Method: requestFailure
     * Process a failed loading of GML.
     * Called by initialise() and loadUrl() if there was a problem loading GML.
     *
     * Parameters:
     * request - {String} 
     */
    requestFailure: function(request) {
        OpenLayers.Console.userError(OpenLayers.i18n("errorLoadingGML", {'url':this.url}));
        this.events.triggerEvent("loadend");
    },

    CLASS_NAME: "OpenLayers.Layer.GML"
});
