/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD licence.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @requires OpenLayers/Layer/Grid.js
 *
 * Class: OpenLayers.Layer.TileCache
 * A read only TileCache layer.  Used to requests tiles cached by TileCache in
 *     a web accessible cache.  Create a new instance with the
 *     <OpenLayers.Layer.TileCache> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Grid>
 */
OpenLayers.Layer.TileCache = OpenLayers.Class(OpenLayers.Layer.Grid, {

    /** 
     * APIProperty: reproject
     * {Boolean} Try to reproject this layer if it is used as an overlay.
     *     Default is false.
     **/
    reproject: false,
    
    /** 
     * APIProperty: isBaseLayer
     * {Boolean} Treat this layer as a base layer.  Default is true.
     **/
    isBaseLayer: true,
    
    /**
     * APIProperty: tileOrigin
     * {<OpenLayers.LonLat>} Location of the tile lattice origin.  Default is
     *     bottom left of the maxExtent.
     **/
    tileOrigin: null,
    
    /** 
     * APIProperty: format
     * {String} Mime type of the images returned.  Default is image/png.
     **/
    format: 'image/png',

    /**
    * Constructor: OpenLayers.Layer.TileCache
    * Create a new read only TileCache layer.
    *
    * Parameters:
    * name - {String} Name of the layer displayed in the interface
    * url - {String} Location of the web accessible cache
    * layername - {String} Layer name as defined in the TileCache configuration
    * options - {Object} Hashtable of extra options to tag onto the layer
    */
    initialize: function(name, url, layername, options) {
        options = OpenLayers.Util.extend({maxResolution: 180/256}, options);
        this.layername = layername;
        OpenLayers.Layer.Grid.prototype.initialize.apply(this,
                                                         [name, url, {}, options]);
        this.extension = this.format.split('/')[1].toLowerCase();
        this.extension = (this.extension == 'jpeg') ? 'jpg' : this.extension;
    },    

    /**
     * APIMethod: clone
     * obj - {Object} 
     * 
     * Returns:
     * An exact clone of this <OpenLayers.Layer.TileCache>
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.TileCache(this.name,
                                           this.url,
                                           this.options);
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    },    
    
    /**
     * Method: getURL
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} 
     * 
     * Returns:
     * A string with the layer's url and parameters and also the 
     *      passed-in bounds and appropriate tile size specified as 
     *      parameters
     */
    getURL: function(bounds) {
        var res = this.map.getResolution();
        var bbox = this.maxExtent;
        var size = this.tileSize;
        var tileX = Math.floor((bounds.left - bbox.left) / (res * size.w));
        var tileY = Math.floor((bounds.bottom - bbox.bottom) / (res * size.h));
        var tileZ = this.map.zoom;
        /**
         * Zero-pad a positive integer.
         * number - {Int} 
         * length - {Int} 
         
         * Returns:
         * A zero-padded string
         */
        function zeroPad(number, length) {
            number = String(number);
            var zeros = [];
            for(var i=0; i<length; ++i) {
                zeros.push('0');
            }
            return zeros.join('').substring(0, length - number.length) + number;
        }
        var components = [
            this.layername,
            zeroPad(tileZ, 2),
            zeroPad(parseInt(tileX / 1000000), 3),
            zeroPad((parseInt(tileX / 1000) % 1000), 3),
            zeroPad((parseInt(tileX) % 1000), 3),
            zeroPad(parseInt(tileY / 1000000), 3),
            zeroPad((parseInt(tileY / 1000) % 1000), 3),
            zeroPad((parseInt(tileY) % 1000), 3) + '.' + this.extension
        ];
        var path = components.join('/'); 
        var url = this.url;
        if (url instanceof Array) {
            url = this.selectUrl(path, url);
        }
        url = (url.charAt(url.length - 1) == '/') ? url : url + '/';
        return url + path;
    },

    /**
    * Method: addTile
    * Create a tile, initialize it, and add it to the layer div. 
    *
    * Parameters: 
    * bounds - {<OpenLayers.Bounds>} 
    *
    * Returns:
    * The added {<OpenLayers.Tile.Image>}
    */
    addTile:function(bounds, position) {
        var url = this.getURL(bounds);
        return new OpenLayers.Tile.Image(this, position, bounds, 
                                             url, this.tileSize);
    },

    /** 
     * Method: setMap
     * When the layer is added to a map, then we can fetch our origin 
     *     (if we don't have one.) 
     * 
     * Parameters:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        if (!this.tileOrigin) { 
            this.tileOrigin = new OpenLayers.LonLat(this.map.maxExtent.left,
                                                    this.map.maxExtent.bottom);
        }
    },

    CLASS_NAME: "OpenLayers.Layer.TileCache"
});
