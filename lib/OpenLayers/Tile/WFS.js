/**
* @class
*/
OpenLayers.Tile.WFS = Class.create();
OpenLayers.Tile.WFS.prototype = 
  Object.extend( new OpenLayers.Tile(), {

    /** @type Array of Function */
    handlers: null,
    
    /** @type Array of */ 
    features: null,


    /** 
    * @constructor
    *
    * @param {OpenLayers.Bounds} bounds
    * @param {String} url
    * @param {OpenLayers.Size} size
    */
    initialize: function(bounds, url, size) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);
        
        this.features = new Array();

        this.handlers = new Array();
        this.handlers["requestSuccess"] = this._requestSuccess;
    },

    /**
    */
    draw:function() {
        OpenLayers.Tile.prototype.draw.apply(this, arguments);
        this.loadFeaturesForRegion("requestSuccess");        
    },

    /**
     * @param OpenLayers.Pixel
     */
    setPosition:function(pixel) {
        this.position = pixel;
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
        
            if (this.url != "") {
        
                // TODO: Hmmm, this stops multiple loads of the data when a 
                //       result isn't immediately retrieved, but it's hacky. 
                //       Do it better.
                this.loaded = true; 
                ol.Log.info("request string: " + this.url);
                ol.Application.loadURL(this.url, null, this, success, failure);
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
            doc = ol.Application.parseXMLString(request.responseText);
        }
        
        var resultFeatures = ol.Application.getNodes(doc, "gml:featureMember");
        ol.Log.info(this.CLASS_NAME + " found " +
                     resultFeatures.length + " features");
            
        //clear old featureList
        this.features = new Array();

        for (var i=0; i < resultFeatures.length; i++) {
        
            //create new Feature and add it 
            var newFeature = new ol.Feature(resultFeatures[i]);

            //add new marker
            var newMarker = this._createMarker(newFeature);
            this._addMarker(newMarker);

            //save reference to the feature and marker
            this.featureList[i] = new ol.Tile.WFS.FeatureItem(
                                        newFeature, newMarker);
    	}
        
        if (this.ds.markers != null) {
            this.ds.markers.redraw();
        }
    },


    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile.WFS"
  }
);
