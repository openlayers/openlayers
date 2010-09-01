/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

 
/**
 * @requires OpenLayers/Layer/WMS.js
 * @requires OpenLayers/Tile/Image/IFrame.js
 */

/**
 * Class: OpenLayers.Layer.WMS.Post
 * Instances of OpenLayers.Layer.WMS.Post are used to retrieve data from OGC
 * Web Mapping Services via HTTP-POST (application/x-www-form-urlencoded). 
 * Create a new WMS layer with the <OpenLayers.Layer.WMS.Post> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Layer.WMS>
 */
OpenLayers.Layer.WMS.Post = OpenLayers.Class(OpenLayers.Layer.WMS, {

    /**
     * Property: tileClass
     * {Object} Class, used to create tiles.
     */
    tileClass: null,

    /**
     * APIProperty: unsupportedBrowsers
     * {Array} Array with browsers, which should use the HTTP-GET protocol 
     * instead of HTTP-POST for fetching tiles from a WMS .
     * Defaults to ["mozilla", "firefox", "opera"], because Opera is not able 
     * to show transparent images in IFrames and Firefox/Mozilla has some ugly 
     * effects of viewport-shaking when panning the map. Both browsers, Opera
     * and Firefox/Mozilla, have no problem with long urls, which is the reason
     * for using POST instead of GET. The strings to pass to this array are
     * the ones returned by <OpenLayers.Util.getBrowserName()>.
     */
    unsupportedBrowsers: ["mozilla", "firefox", "opera"],

    /**
     * Property: SUPPORTED_TRANSITIONS
     * {Array} 
     * no supported transitions for this type of layer, because it is not
     * possible to modify the initialized tiles (iframes)
     */
    SUPPORTED_TRANSITIONS: [],

    /**
     * Constructor: OpenLayers.Layer.WMS.Post
     * Creates a new WMS layer object.
     *
     * Example:
     * (code)
     * var wms = new OpenLayers.Layer.WMS.Post(
     *  "NASA Global Mosaic",
     *  "http://wms.jpl.nasa.gov/wms.cgi",
     *  {layers: "modis, global_mosaic"});
     * (end)
     *
     * Parameters:
     * name - {String} A name for the layer
     * url - {String} Base url for the WMS
     *                (e.g. http://wms.jpl.nasa.gov/wms.cgi)
     * params - {Object} An object with key/value pairs representing the
     *                   GetMap query string parameters and parameter values.
     * options - {Object} Hashtable of extra options to tag onto the layer.
     */
    initialize: function(name, url, params, options) {
        var newArguments = [];
        newArguments.push(name, url, params, options);
        OpenLayers.Layer.WMS.prototype.initialize.apply(this, newArguments);

        this.tileClass = OpenLayers.Util.indexOf(
            this.unsupportedBrowsers, OpenLayers.Util.getBrowserName()) != -1
                ? OpenLayers.Tile.Image
                : OpenLayers.Tile.Image.IFrame;
    },
    
    /**
     * Method: addTile
     * addTile creates a tile, initializes it and adds it as iframe to the
     * layer div.
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * position - {<OpenLayers.Pixel>}
     *
     * Returns:
     * {<OpenLayers.Tile.Image.IFrame>} The added OpenLayers.Tile.Image.IFrame
     */
    addTile: function(bounds,position) {
        return new this.tileClass(
            this, position, bounds, null, this.tileSize);
    },

    CLASS_NAME: 'OpenLayers.Layer.WMS.Post'
});
