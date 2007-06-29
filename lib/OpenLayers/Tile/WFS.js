/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

 
/**
 * @requires OpenLayers/Tile.js
 * 
 * Class: OpenLayers.Tile.WFS
 * Instances of OpenLayers.Tile.WFS are used to manage the image tiles
 * used by various layers.  Create a new image tile with the
 * <OpenLayers.Tile.WFS> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Tile>
 */
OpenLayers.Tile.WFS = OpenLayers.Class.create();
OpenLayers.Tile.WFS.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Tile, {

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
        this.features = new Array();
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
    },

    /** 
     * Method: clear
     *  Clear the tile of any bounds/position-related data so that it can 
     *   be reused in a new location.
     */
    clear: function() {
        OpenLayers.Tile.prototype.clear.apply(this, arguments);
        this.destroyAllFeatures();
    },
    
    /**
     * Method: draw
     * Check that a tile should be drawn, and load features for it.
     */
    draw:function() {
        if (OpenLayers.Tile.prototype.draw.apply(this, arguments)) {
            this.loadFeaturesForRegion(this.requestSuccess);
        }
    },

    /** 
    * Method: loadFeaturesForRegion
    * get the full request string from the ds and the tile params 
    *     and call the AJAX loadURL(). 
    *
    * Input are function pointers for what to do on success and failure.
    *
    * Parameters:
    * success - {function}
    * failure - {function}
    */
    loadFeaturesForRegion:function(success, failure) {
        OpenLayers.loadURL(this.url, null, this, success);
    },
    
    /**
    * Method: requestSuccess
    * Called on return from request succcess. Adds results via 
    * layer.addFeatures in vector mode, addResults otherwise. 
    *
    * Parameters:
    * request - {XMLHttpRequest}
    */
    requestSuccess:function(request) {
        var doc = request.responseXML;
        
        if (!doc || request.fileType!="XML") {
            doc = OpenLayers.parseXMLString(request.responseText);
        }
        if (this.layer.vectorMode) {
            var gml = new OpenLayers.Format.GML({extractAttributes: this.layer.options.extractAttributes});
            this.layer.addFeatures(gml.read(doc));
        } else {
            var resultFeatures = OpenLayers.Ajax.getElementsByTagNameNS(doc, "http://www.opengis.net/gml","gml", "featureMember");
            this.addResults(resultFeatures);
        }
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
    
    /**
     * Constant: CLASS_NAME
     * {String} Name of class.
     */
    CLASS_NAME: "OpenLayers.Tile.WFS"
  }
);
