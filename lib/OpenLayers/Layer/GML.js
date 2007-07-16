/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Layer/Vector.js
 * @requires OpenLayers/Ajax.js
 
 * Class: OpenLayers.Layer.GML
 * Create a vector layer by parsing a GML file. The GML file is
 * passed in as a parameter.
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
        var newArguments = new Array()
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
            this.loadGML();
        }
    },

    /**
     * Method: loadGML
     */
    loadGML: function() {
        if (!this.loaded) {
            var results = OpenLayers.loadURL(this.url, null, this, this.requestSuccess, this.requestFailure);
            this.loaded = true;
        }    
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
        
        if (!doc || request.fileType!="XML") {
            doc = request.responseText;
        }

        var gml = this.format ? new this.format() : new OpenLayers.Format.GML();
        this.addFeatures(gml.read(doc));
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
        alert("Error in loading GML file "+this.url);
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.GML"
    });
