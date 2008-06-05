/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/Grid.js
 */

/**
 * Class: OpenLayers.Layer.WorldWind
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.Grid>
 */
OpenLayers.Layer.WorldWind = OpenLayers.Class(OpenLayers.Layer.Grid, {
    
    DEFAULT_PARAMS: {
    },

    /**
     * APIProperty: isBaseLayer
     * WorldWind layer is a base layer by default.
     */
    isBaseLayer: true,    

    
    /** 
     * APIProperty: lzd
     * LevelZeroTileSizeDegrees
     */
    lzd: null,

    /**
     * APIProperty: zoomLevels
     * Number of zoom levels.
     */
    zoomLevels: null,
    
    /**
     * Constructor: OpenLayers.Layer.WorldWind
     * 
     * Parameters:
     * name - {String} Name of Layer
     * url - {String} Base URL  
     * lzd - {Float} Level zero tile size degrees 
     * zoomLevels - {Int} number of zoom levels
     * params - {Object} additional parameters
     * options - {Object} additional options
     */
    initialize: function(name, url, lzd, zoomLevels, params, options) {
        this.lzd = lzd;
        this.zoomLevels = zoomLevels;
        var newArguments = [];
        newArguments.push(name, url, params, options);
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);
        this.params = OpenLayers.Util.applyDefaults(
            this.params, this.DEFAULT_PARAMS
        );
    },
    /**
     * Method: addTile
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * position - {<OpenLayers.Pixel>}
     * 
     * Returns:
     * {<OpenLayers.Tile.Image>} The added OpenLayers.Tile.Image
     */
    addTile:function(bounds,position) {
        return new OpenLayers.Tile.Image(this, position, bounds, 
                                             null, this.tileSize);
    },

    /**
     * Method: getZoom
     * Convert map zoom to WW zoom.
     */
    getZoom: function () {
        var zoom = this.map.getZoom();
        var extent = this.map.getMaxExtent();
        zoom = zoom - Math.log(this.maxResolution / (this.lzd/512))/Math.log(2);
        return zoom;
    },

    /**
     * Method: getURL
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} 
     *
     * Returns:
     * {String} A string with the layer's url and parameters and also the 
     *           passed-in bounds and appropriate tile size specified as 
     *           parameters
     */
    getURL: function (bounds) {
        bounds = this.adjustBounds(bounds);
        var zoom = this.getZoom();
        var extent = this.map.getMaxExtent();
        var deg = this.lzd/Math.pow(2,this.getZoom());
        var x = Math.floor((bounds.left - extent.left)/deg);
        var y = Math.floor((bounds.bottom - extent.bottom)/deg);
        if (this.map.getResolution() <= (this.lzd/512)
            && this.getZoom() <= this.zoomLevels) {
            return this.getFullRequestString(
              { L: zoom, 
                X: x,
                Y: y
              });
        } else {
            return OpenLayers.Util.getImagesLocation() + "blank.gif";
        }

    },

    CLASS_NAME: "OpenLayers.Layer.WorldWind"
});
