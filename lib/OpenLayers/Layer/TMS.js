/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD licence.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 * 
 * @requires OpenLayers/Layer/Grid.js
 */
OpenLayers.Layer.TMS = OpenLayers.Class.create();
OpenLayers.Layer.TMS.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Layer.Grid, {

    
    reproject: false,
    isBaseLayer: true,
    tileOrigin: null,

    /**
    * @constructor
    *
    * @param {String} name
    * @param {String} url
    * @param {Object} params
    * @param {Object} options Hashtable of extra options to tag onto the layer
    */
    initialize: function(name, url, options) {
        var newArguments = new Array();
        newArguments.push(name, url, {}, options);
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);
    },    

    /**
     * 
     */
    destroy: function() {
        // for now, nothing special to do here. 
        OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments);  
    },

    
    /**
     * @param {Object} obj
     * 
     * @returns An exact clone of this OpenLayers.Layer.TMS
     * @type OpenLayers.Layer.TMS
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.TMS(this.name,
                                           this.url,
                                           this.options);
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    },    
    
    /**
     * @param {OpenLayers.Bounds} bounds
     * 
     * @returns A string with the layer's url and parameters and also the 
     *           passed-in bounds and appropriate tile size specified as 
     *           parameters
     * @type String
     */
    getURL: function (bounds) {
        var res = this.map.getResolution();
        var x = (bounds.left - this.tileOrigin.lon) / (res * this.tileSize.w);
        var y = (bounds.bottom - this.tileOrigin.lat) / (res * this.tileSize.h);
        var z = this.map.getZoom();
        var path = "1.0.0" + "/" + this.layername + "/" + z + "/" + x + "/" + y + "." + this.type; 
        var url = this.url;
        if (url instanceof Array) {
            url = this.selectUrl(path, url);
        }
        return url + path;
    },

    /**
    * addTile creates a tile, initializes it, and 
    * adds it to the layer div. 
    *
    * @param {OpenLayers.Bounds} bounds
    *
    * @returns The added OpenLayers.Tile.Image
    * @type OpenLayers.Tile.Image
    */
    addTile:function(bounds,position) {
        var url = this.getURL(bounds);
        return new OpenLayers.Tile.Image(this, position, bounds, 
                                             url, this.tileSize);
    },

    /** When the layer is added to a map, then we can fetch our origin 
     *  (if we don't have one.) 
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        if (!this.tileOrigin) { 
            this.tileOrigin = new OpenLayers.LonLat(this.map.maxExtent.left,
                                                this.map.maxExtent.bottom);
        }                                       
    },

    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.TMS"
});
