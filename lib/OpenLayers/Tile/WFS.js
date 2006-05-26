// @require: OpenLayers/Tile.js
/**
* @class
*/
OpenLayers.Tile.WFS = Class.create();
OpenLayers.Tile.WFS.prototype = 
  Object.extend( new OpenLayers.Tile(), {

    /** @type Array of Function */
    handlers: null,
    
    /** @type Array of */ 
    markers: null,


    /** 
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
        
        this.markers = new Array();

        this.handlers = new Array();
        this.handlers["requestSuccess"] = this.requestSuccess;
    },

    /**
    */
    draw:function() {
        OpenLayers.Tile.prototype.draw.apply(this, arguments);
        this.loadFeaturesForRegion("requestSuccess");        
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
//                ol.Log.info("request string: " + this.url);
                OpenLayers.loadURL(this.url, null, this, success, failure);
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
        
        var resultFeatures = OpenLayers.Util.getNodes(doc, "gml:featureMember");
//        ol.Log.info(this.layer.name + " found " +
//                     resultFeatures.length + " features");
            
        //clear old featureList
        this.features = new Array();

        for (var i=0; i < resultFeatures.length; i++) {
        
            var feature = new MCFeature(resultFeatures[i]);
            var icon = new OpenLayers.Icon(feature.markerImage, feature.size);
            var marker = new OpenLayers.Marker(feature.lonlat, icon, feature);

            //add to local collection
            this.markers.append(marker);

            //add to layer
            this.layer.addMarker(marker);
    	}
        
    },


    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile.WFS"
  }
);

