/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

 
/**
 * @class
 * 
 * @requires OpenLayers/Tile.js
 */
OpenLayers.Tile.WFS = OpenLayers.Class.create();
OpenLayers.Tile.WFS.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Tile, {

    /** @type Array(OpenLayers.Feature)*/ 
    features: null,

    /** @type Array(String) */
    url: null,
    
    /** TBD 3.0 - reorder the parameters to the init function to put URL 
     *             as last, so we can continue to call tile.initialize() 
     *             without changing the arguments. 
     * 
    * @constructor
    *
    * @param {OpenLayers.Layer} layer
    * @param {OpenLayers.Pixel} position
    * @param {OpenLayers.Bounds} bounds
    * @param {String} url
    * @param {OpenLayers.Size} size
    */
    initialize: function(layer, position, bounds, url, size) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);
        this.url = url;        
        this.features = new Array();
    },

    /**
     * 
     */
    destroy: function() {
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
        this.destroyAllFeatures();
        this.features = null;
        this.url = null;
    },

    /** Clear the tile of any bounds/position-related data so that it can 
     *   be reused in a new location.
     */
    clear: function() {
        OpenLayers.Tile.prototype.clear.apply(this, arguments);
        this.destroyAllFeatures();
    },
    
    /**
     * 
     */
    draw:function() {
        if (OpenLayers.Tile.prototype.draw.apply(this, arguments)) {
            this.loadFeaturesForRegion(this.requestSuccess);
        }
    },

    /** get the full request string from the ds and the tile params 
    *     and call the AJAX loadURL(). 
    *
    *     input are function pointers for what to do on success and failure.
    * 
    * @param {function} success
    * @param {function} failure
    */
    loadFeaturesForRegion:function(success, failure) {
        OpenLayers.loadURL(this.url, null, this, success);
    },
    
    /** Return from AJAX request
    *
    * @param {} request
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
     * @param {Object} results
     */
    addResults: function(results) {
        for (var i=0; i < results.length; i++) {
            var feature = new this.layer.featureClass(this.layer, 
                                                      results[i]);
            this.features.push(feature);
        }
    },


    /** Iterate through and call destroy() on each feature, removing it from
     *   the local array
     * 
     * @private
     */
    destroyAllFeatures: function() {
        while(this.features.length > 0) {
            var feature = this.features.shift();
            feature.destroy();
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile.WFS"
  }
);
