/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/Grid.js
 */

/**
 * Class: OpenLayers.Layer.TMS
 * Create a layer for accessing tiles from services that conform with the 
 *     Tile Map Service Specification 
 *     (http://wiki.osgeo.org/wiki/Tile_Map_Service_Specification).
 *
 * Example:
 * (code)
 *     var layer = new OpenLayers.Layer.TMS(
 *         "My Layer", // name for display in LayerSwitcher
 *         "http://tilecache.osgeo.org/wms-c/Basic.py/", // service endpoint
 *         {layername: "basic", type: "png"} // required properties
 *     );
 * (end)
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.Grid>
 */
OpenLayers.Layer.TMS = OpenLayers.Class(OpenLayers.Layer.Grid, {

    /**
     * APIProperty: serviceVersion
     * {String} Service version for tile requests.  Default is "1.0.0".
     */
    serviceVersion: "1.0.0",

    /**
     * APIProperty: layername
     * {String} The identifier for the <TileMap> as advertised by the service.  
     *     For example, if the service advertises a <TileMap> with 
     *    'href="http://tms.osgeo.org/1.0.0/vmap0"', the <layername> property 
     *     would be set to "vmap0".
     */
    layername: null,

    /**
     * APIProperty: type
     * {String} The format extension corresponding to the requested tile image
     *     type.  This is advertised in a <TileFormat> element as the 
     *     "extension" attribute.  For example, if the service advertises a 
     *     <TileMap> with <TileFormat width="256" height="256" mime-type="image/jpeg" extension="jpg" />,
     *     the <type> property would be set to "jpg".
     */
    type: null,

    /**
     * APIProperty: isBaseLayer
     * {Boolean} Make this layer a base layer.  Default is true.  Set false to
     *     use the layer as an overlay.
     */
    isBaseLayer: true,

    /**
     * APIProperty: tileOrigin
     * {<OpenLayers.LonLat>} Optional origin for aligning the grid of tiles.
     *     If provided, requests for tiles at all resolutions will be aligned
     *     with this location (no tiles shall overlap this location).  If
     *     not provided, the grid of tiles will be aligned with the bottom-left
     *     corner of the map's <maxExtent>.  Default is ``null``.
     *
     * Example:
     * (code)
     *     var layer = new OpenLayers.Layer.TMS(
     *         "My Layer",
     *         "http://tilecache.osgeo.org/wms-c/Basic.py/",
     *         {
     *             layername: "basic", 
     *             type: "png",
     *             // set if different than the bottom left of map.maxExtent
     *             tileOrigin: new OpenLayers.LonLat(-180, -90)
     *         }
     *     );
     * (end)
     */
    tileOrigin: null,

    /**
     * APIProperty: serverResolutions
     * {Array} A list of all resolutions available on the server.  Only set this
     *     property if the map resolutions differ from the server. This
     *     property serves two purposes. (a) <serverResolutions> can include
     *     resolutions that the server supports and that you don't want to
     *     provide with this layer; you can also look at <zoomOffset>, which is
     *     an alternative to <serverResolutions> for that specific purpose.
     *     (b) The map can work with resolutions that aren't supported by
     *     the server, i.e. that aren't in <serverResolutions>. When the
     *     map is displayed in such a resolution data for the closest
     *     server-supported resolution is loaded and the layer div is
     *     stretched as necessary.
     */
    serverResolutions: null,

    /**
     * APIProperty: zoomOffset
     * {Number} If your cache has more zoom levels than you want to provide
     *     access to with this layer, supply a zoomOffset.  This zoom offset
     *     is added to the current map zoom level to determine the level
     *     for a requested tile.  For example, if you supply a zoomOffset
     *     of 3, when the map is at the zoom 0, tiles will be requested from
     *     level 3 of your cache.  Default is 0 (assumes cache level and map
     *     zoom are equivalent).  Using <zoomOffset> is an alternative to
     *     setting <serverResolutions> if you only want to expose a subset
     *     of the server resolutions.
     */
    zoomOffset: 0,
    
    /**
     * Constructor: OpenLayers.Layer.TMS
     * 
     * Parameters:
     * name - {String} Title to be displayed in a <OpenLayers.Control.LayerSwitcher>
     * url - {String} Service endpoint (without the version number).  E.g.
     *     "http://tms.osgeo.org/".
     * options - {Object} Additional properties to be set on the layer.  The
     *     <layername> and <type> properties must be set here.
     */
    initialize: function(name, url, options) {
        var newArguments = [];
        newArguments.push(name, url, {}, options);
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);
    },    

    /**
     * APIMethod: clone
     * Create a complete copy of this layer.
     *
     * Parameters:
     * obj - {Object} Should only be provided by subclasses that call this
     *     method.
     * 
     * Returns:
     * {<OpenLayers.Layer.TMS>} An exact clone of this <OpenLayers.Layer.TMS>
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.TMS(this.name,
                                           this.url,
                                           this.getOptions());
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
     * {String} A string with the layer's url and parameters and also the 
     *          passed-in bounds and appropriate tile size specified as 
     *          parameters
     */
    getURL: function (bounds) {
        bounds = this.adjustBounds(bounds);
        var res = this.getServerResolution();
        var x = Math.round((bounds.left - this.tileOrigin.lon) / (res * this.tileSize.w));
        var y = Math.round((bounds.bottom - this.tileOrigin.lat) / (res * this.tileSize.h));
        var z = this.getServerZoom();
        var path = this.serviceVersion + "/" + this.layername + "/" + z + "/" + x + "/" + y + "." + this.type; 
        var url = this.url;
        if (OpenLayers.Util.isArray(url)) {
            url = this.selectUrl(path, url);
        }
        return url + path;
    },

    /** 
     * Method: setMap
     * When the layer is added to a map, then we can fetch our origin 
     *    (if we don't have one.) 
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

    CLASS_NAME: "OpenLayers.Layer.TMS"
});
