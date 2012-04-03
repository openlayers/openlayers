/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/XYZ.js
 * @requires OpenLayers/Tile/UTFGrid.js
 */

/** 
 * Class: OpenLayers.Layer.UTFGrid
 * This Layer reads from UTFGrid tiled data sources.  Since UTFGrids are 
 * essentially JSON-based ASCII art with attached attributes, they are not 
 * visibly rendered.  In order to use them in the map, you must add a 
 * <OpenLayers.Control.UTFGrid> ontrol as well.
 *
 * Example:
 *
 * (start code)
 * var world_utfgrid = new OpenLayers.Layer.UTFGrid({
 *     url: "/tiles/world_utfgrid/${z}/${x}/${y}.json",
 *     utfgridResolution: 4,
 *     displayInLayerSwitcher: false
 * );
 * map.addLayer(world_utfgrid);
 * 
 * var control = new OpenLayers.Control.UTFGrid({
 *     layers: [world_utfgrid],
 *     handlerMode: 'move',
 *     callback: function(dataLookup) {
 *         // do something with returned data
 *     }
 * })
 * (end code)
 *
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.XYZ>
 */
OpenLayers.Layer.UTFGrid = OpenLayers.Class(OpenLayers.Layer.XYZ, {
    
    /**
     * APIProperty: isBaseLayer
     * Default is true, as this is designed to be a base tile source. 
     */
    isBaseLayer: false,
    
    /**
     * APIProperty: projection
     * {<OpenLayers.Projection>}
     * Source projection for the UTFGrids.  Default is "EPSG:900913".
     */
    projection: new OpenLayers.Projection("EPSG:900913"),

    /**
     * Property: useJSONP
     * {Boolean}
     * Should we use a JSONP script approach instead of a standard AJAX call?
     *
     * Set to true for using utfgrids from another server. 
     * Avoids same-domain policy restrictions. 
     * Note that this only works if the server accepts 
     * the callback GET parameter and dynamically 
     * wraps the returned json in a function call.
     * 
     * Default is false
     */
    useJSONP: false,
    
    /**
     * APIProperty: url
     * {String}
     * URL tempate for UTFGrid tiles.  Include x, y, and z parameters.
     * E.g. "/tiles/${z}/${x}/${y}.json"
     */

    /**
     * APIProperty: utfgridResolution
     * {Number}
     * Ratio of the pixel width to the width of a UTFGrid data point.  If an 
     *     entry in the grid represents a 4x4 block of pixels, the 
     *     utfgridResolution would be 4.  Default is 2 (specified in 
     *     <OpenLayers.Tile.UTFGrid>).
     */

    /**
     * Property: tileClass
     * {<OpenLayers.Tile>} The tile class to use for this layer.
     *     Defaults is <OpenLayers.Tile.UTFGrid>.
     */
    tileClass: OpenLayers.Tile.UTFGrid,

    /**
     * Constructor: OpenLayers.Layer.UTFGrid
     * Create a new UTFGrid layer.
     *
     * Parameters:
     * config - {Object} Configuration properties for the layer.
     *
     * Required configuration properties:
     * url - {String} The url template for UTFGrid tiles.  See the <url> property.
     */
    initialize: function(options) {
        OpenLayers.Layer.Grid.prototype.initialize.apply(
            this, [options.name, options.url, {}, options]
        );
        this.tileOptions = OpenLayers.Util.extend({
            utfgridResolution: this.utfgridResolution
        }, this.tileOptions);
    },
    
    /**
     * APIMethod: clone
     * Create a clone of this layer
     *
     * Parameters:
     * obj - {Object} Only used by a subclass of this layer.
     * 
     * Returns:
     * {<OpenLayers.Layer.UTFGrid>} An exact clone of this OpenLayers.Layer.UTFGrid
     */
    clone: function (obj) {
        if (obj == null) {
            obj = new OpenLayers.Layer.UTFGrid(this.getOptions());
        }

        // get all additions from superclasses
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);

        return obj;
    },

    /**
     * APIProperty: getFeatureInfo
     * Get details about a feature associated with a map location.  The object
     *     returned will have id and data properties.  If the given location
     *     doesn't correspond to a feature, null will be returned.
     *
     * Parameters:
     * location - {<OpenLayers.LonLat>} map location
     *
     * Returns:
     * {Object} Object representing the feature id and UTFGrid data 
     *     corresponding to the given map location.  Returns null if the given
     *     location doesn't hit a feature.
     */
    getFeatureInfo: function(location) {
        var info = null;
        var tileInfo = this.getTileData(location);
        if (tileInfo.tile) {
            info = tileInfo.tile.getFeatureInfo(tileInfo.i, tileInfo.j);
        }
        return info;
    },

    /**
     * APIMethod: getFeatureId
     * Get the identifier for the feature associated with a map location.
     *
     * Parameters:
     * location - {<OpenLayers.LonLat>} map location
     *
     * Returns:
     * {String} The feature identifier corresponding to the given map location.
     *     Returns null if the location doesn't hit a feature.
     */
    getFeatureId: function(location) {
        var id = null;
        var info = this.getTileData(location);
        if (info.tile) {
            id = info.tile.getFeatureId(info.i, info.j);
        }
        return id;
    },

    CLASS_NAME: "OpenLayers.Layer.UTFGrid"
});
