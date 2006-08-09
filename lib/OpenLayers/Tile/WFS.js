/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Tile.js
/**
* @class
*/
OpenLayers.Tile.WFS = Class.create();
OpenLayers.Tile.WFS.prototype = 
  Object.extend( new OpenLayers.Tile(), {

    /** @type Array(OpenLayers.Feature)*/ 
    features: null,

    /** @type Array(String) */
    urls: null,
    
    /** 
    * @constructor
    *
    * @param {OpenLayers.Layer} layer
    * @param {OpenLayers.Pixel} position
    * @param {OpenLayers.Bounds} bounds
    * @param {Array} urls
    * @param {OpenLayers.Size} size
    */
    initialize: function(layer, position, bounds, urls, size) {
        var newArguments = arguments;
        if (arguments.length > 0) {
            newArguments = [layer, position, bounds, null, size];
        }
        OpenLayers.Tile.prototype.initialize.apply(this, newArguments);

        this.urls = urls;        
        this.features = new Array();
    },

    /**
     * 
     */
    destroy: function() {
        for(var i=0; i < this.features.length; i++) {
            this.features[i].destroy();
        }
        this.urls = null;
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
    },

    /**
    */
    draw:function() {
        this.loadFeaturesForRegion(this.requestSuccess);        
    },

    /** 
     * @param {OpenLayers.Bounds}
     * @param {OpenLayers.pixel} position
     */
    moveTo: function (bounds, position) {
        OpenLayers.Tile.prototype.moveTo.apply(this, arguments);
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

        if (!this.loaded) {
        
            if (this.urls != null) {
        
                // TODO: Hmmm, this stops multiple loads of the data when a 
                //       result isn't immediately retrieved, but it's hacky. 
                //       Do it better.
                this.loaded = true; 
                
                for(var i=0; i < this.urls.length; i++) {
                    OpenLayers.loadURL(this.urls[i], null, this, 
                                        success, failure);
                }
            }
        }
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
        
        var resultFeatures = doc.getElementsByTagName("featureMember");
            
        this.addResults(resultFeatures);
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

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile.WFS"
  }
);

