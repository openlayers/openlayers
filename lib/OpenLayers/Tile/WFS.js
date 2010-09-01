/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

 
/**
 * @requires OpenLayers/Tile.js
 * @requires OpenLayers/Request/XMLHttpRequest.js
 */

/**
 * Class: OpenLayers.Tile.WFS
 * Instances of OpenLayers.Tile.WFS are used to manage the image tiles
 * used by various layers.  Create a new image tile with the
 * <OpenLayers.Tile.WFS> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Tile>
 */
OpenLayers.Tile.WFS = OpenLayers.Class(OpenLayers.Tile, {

    /** 
     * Property: features 
     * {Array(<OpenLayers.Feature>)} list of features in this tile 
     */
    features: null,

    /** 
     * Property: url 
     * {String} 
     */
    url: null,
    
    /** 
     * Property: request 
     * {<OpenLayers.Request.XMLHttpRequest>} 
     */ 
    request: null,     
    
    /** TBD 3.0 - reorder the parameters to the init function to put URL 
     *             as last, so we can continue to call tile.initialize() 
     *             without changing the arguments. 
     * 
     * Constructor: OpenLayers.Tile.WFS
     * Constructor for a new <OpenLayers.Tile.WFS> instance.
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer>} layer that the tile will go in.
     * position - {<OpenLayers.Pixel>}
     * bounds - {<OpenLayers.Bounds>}
     * url - {<String>}
     * size - {<OpenLayers.Size>}
     */   
    initialize: function(layer, position, bounds, url, size) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);
        this.url = url;        
        this.features = [];
    },

    /** 
     * APIMethod: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
        this.destroyAllFeatures();
        this.features = null;
        this.url = null;
        if(this.request) {
            this.request.abort();
            //this.request.destroy();
            this.request = null;
        }
    },

    /** 
     * Method: clear
     *  Clear the tile of any bounds/position-related data so that it can 
     *   be reused in a new location.
     */
    clear: function() {
        this.destroyAllFeatures();
    },
    
    /**
     * Method: draw
     * Check that a tile should be drawn, and load features for it.
     */
    draw:function() {
        if (OpenLayers.Tile.prototype.draw.apply(this, arguments)) {
            if (this.isLoading) {
                //if already loading, send 'reload' instead of 'loadstart'.
                this.events.triggerEvent("reload"); 
            } else {
                this.isLoading = true;
                this.events.triggerEvent("loadstart");
            }
            this.loadFeaturesForRegion(this.requestSuccess);
        }
    },

    /** 
    * Method: loadFeaturesForRegion
    * Abort any pending requests and issue another request for data. 
    *
    * Input are function pointers for what to do on success and failure.
    *
    * Parameters:
    * success - {function}
    * failure - {function}
    */
    loadFeaturesForRegion:function(success, failure) {
        if(this.request) {
            this.request.abort();
        }
        this.request = OpenLayers.Request.GET({
            url: this.url,
            success: success,
            failure: failure,
            scope: this
        });
    },
    
    /**
    * Method: requestSuccess
    * Called on return from request succcess. Adds results via 
    * layer.addFeatures in vector mode, addResults otherwise. 
    *
    * Parameters:
    * request - {<OpenLayers.Request.XMLHttpRequest>}
    */
    requestSuccess:function(request) {
        if (this.features) {
            var doc = request.responseXML;
            if (!doc || !doc.documentElement) {
                doc = request.responseText; 
            }
            if (this.layer.vectorMode) {
                this.layer.addFeatures(this.layer.formatObject.read(doc));
            } else {
                var xml = new OpenLayers.Format.XML();
                if (typeof doc == "string") {
                    doc = xml.read(doc);
                }
                var resultFeatures = xml.getElementsByTagNameNS(
                    doc, "http://www.opengis.net/gml", "featureMember"
                );
                this.addResults(resultFeatures);
            }
        }
        if (this.events) {
            this.events.triggerEvent("loadend"); 
        }

        //request produced with success, we can delete the request object.
        //this.request.destroy();
        this.request = null;
    },

    /**
     * Method: addResults
     * Construct new feature via layer featureClass constructor, and add to
     * this.features.
     * 
     * Parameters:
     * results - {Object}
     */
    addResults: function(results) {
        for (var i=0; i < results.length; i++) {
            var feature = new this.layer.featureClass(this.layer, 
                                                      results[i]);
            this.features.push(feature);
        }
    },


    /** 
     * Method: destroyAllFeatures
     * Iterate through and call destroy() on each feature, removing it from
     *   the local array
     */
    destroyAllFeatures: function() {
        while(this.features.length > 0) {
            var feature = this.features.shift();
            feature.destroy();
        }
    },

    CLASS_NAME: "OpenLayers.Tile.WFS"
  }
);
