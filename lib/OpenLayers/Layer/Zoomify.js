/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/*
 * Development supported by a R&D grant DC08P02OUK006 - Old Maps Online
 * (www.oldmapsonline.org) from Ministry of Culture of the Czech Republic.
 */


/**
 * @requires OpenLayers/Layer/Grid.js
 */

/**
 * Class: OpenLayers.Layer.Zoomify
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Grid>
 */
OpenLayers.Layer.Zoomify = OpenLayers.Class(OpenLayers.Layer.Grid, {

    /**
     * Property: size
     * {<OpenLayers.Size>} The Zoomify image size in pixels.
     */
    size: null,

    /**
     * APIProperty: isBaseLayer
     * {Boolean}
     */
    isBaseLayer: true,

    /**
     * Property: standardTileSize
     * {Integer} The size of a standard (non-border) square tile in pixels.
     */
    standardTileSize: 256,

    /** 
     * Property: tileOriginCorner
     * {String} This layer uses top-left as tile origin
     **/
    tileOriginCorner: "tl",

    /**
     * Property: numberOfTiers
     * {Integer} Depth of the Zoomify pyramid, number of tiers (zoom levels)
     *                          - filled during Zoomify pyramid initialization.
     */
    numberOfTiers: 0,

    /**
     * Property: tileCountUpToTier
     * {Array(Integer)} Number of tiles up to the given tier of pyramid.
     *                          - filled during Zoomify pyramid initialization.
     */
    tileCountUpToTier: null,

    /**
     * Property: tierSizeInTiles
     * {Array(<OpenLayers.Size>)} Size (in tiles) for each tier of pyramid.
     *                          - filled during Zoomify pyramid initialization.
     */
    tierSizeInTiles: null,

    /**
     * Property: tierImageSize
     * {Array(<OpenLayers.Size>)} Image size in pixels for each pyramid tier.
     *                          - filled during Zoomify pyramid initialization.
     */
    tierImageSize: null,

    /**
     * Constructor: OpenLayers.Layer.Zoomify
     *
     * Parameters:
     * name - {String} A name for the layer.
     * url - {String} - Relative or absolute path to the image or more
     *        precisly to the TileGroup[X] directories root.
     *        Flash plugin use the variable name "zoomifyImagePath" for this.
     * size - {<OpenLayers.Size>} The size (in pixels) of the image.
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, url, size, options) {

        // initilize the Zoomify pyramid for given size
        this.initializeZoomify(size);

        OpenLayers.Layer.Grid.prototype.initialize.apply(this, [
            name, url, size, {}, options
        ]);
    },

    /**
     * Method: initializeZoomify
     * It generates constants for all tiers of the Zoomify pyramid
     *
     * Parameters:
     * size - {<OpenLayers.Size>} The size of the image in pixels
     *
     */
    initializeZoomify: function( size ) {

        var imageSize = size.clone();
        this.size = size.clone();
        var tiles = new OpenLayers.Size(
            Math.ceil( imageSize.w / this.standardTileSize ),
            Math.ceil( imageSize.h / this.standardTileSize )
            );

        this.tierSizeInTiles = [tiles];
        this.tierImageSize = [imageSize];

        while (imageSize.w > this.standardTileSize ||
               imageSize.h > this.standardTileSize ) {

            imageSize = new OpenLayers.Size(
                Math.floor( imageSize.w / 2 ),
                Math.floor( imageSize.h / 2 )
                );
            tiles = new OpenLayers.Size(
                Math.ceil( imageSize.w / this.standardTileSize ),
                Math.ceil( imageSize.h / this.standardTileSize )
                );
            this.tierSizeInTiles.push( tiles );
            this.tierImageSize.push( imageSize );
        }

        this.tierSizeInTiles.reverse();
        this.tierImageSize.reverse();

        this.numberOfTiers = this.tierSizeInTiles.length;
        var resolutions = [1];
        this.tileCountUpToTier = [0];
        for (var i = 1; i < this.numberOfTiers; i++) {
            resolutions.unshift(Math.pow(2, i));
            this.tileCountUpToTier.push(
                this.tierSizeInTiles[i-1].w * this.tierSizeInTiles[i-1].h +
                this.tileCountUpToTier[i-1]
                );
        }
        if (!this.serverResolutions) {
            this.serverResolutions = resolutions;
        }
    },

    /**
     * APIMethod:destroy
     */
    destroy: function() {
        // for now, nothing special to do here.
        OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments);

        // Remove from memory the Zoomify pyramid - is that enough?
        this.tileCountUpToTier.length = 0;
        this.tierSizeInTiles.length = 0;
        this.tierImageSize.length = 0;

    },

    /**
     * APIMethod: clone
     *
     * Parameters:
     * obj - {Object}
     *
     * Returns:
     * {<OpenLayers.Layer.Zoomify>} An exact clone of this <OpenLayers.Layer.Zoomify>
     */
    clone: function (obj) {

        if (obj == null) {
            obj = new OpenLayers.Layer.Zoomify(this.name,
                                           this.url,
                                           this.size,
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
     * {String} A string with the layer's url and parameters and also the
     *          passed-in bounds and appropriate tile size specified as
     *          parameters
     */
    getURL: function (bounds) {
        bounds = this.adjustBounds(bounds);
        var res = this.getServerResolution();
        var x = Math.round((bounds.left - this.tileOrigin.lon) / (res * this.tileSize.w));
        var y = Math.round((this.tileOrigin.lat - bounds.top) / (res * this.tileSize.h));
        var z = this.getZoomForResolution( res );

        var tileIndex = x + y * this.tierSizeInTiles[z].w + this.tileCountUpToTier[z];
        var path = "TileGroup" + Math.floor( (tileIndex) / 256 ) +
            "/" + z + "-" + x + "-" + y + ".jpg";
        var url = this.url;
        if (OpenLayers.Util.isArray(url)) {
            url = this.selectUrl(path, url);
        }
        return url + path;
    },

    /**
     * Method: getImageSize
     * getImageSize returns size for a particular tile. If bounds are given as
     * first argument, size is calculated (bottom-right tiles are non square).
     *
     */
    getImageSize: function() {
        if (arguments.length > 0) {
            var bounds = this.adjustBounds(arguments[0]);
            var res = this.getServerResolution();
            var x = Math.round((bounds.left - this.tileOrigin.lon) / (res * this.tileSize.w));
            var y = Math.round((this.tileOrigin.lat - bounds.top) / (res * this.tileSize.h));
            var z = this.getZoomForResolution( res );
            var w = this.standardTileSize;
            var h = this.standardTileSize;
            if (x == this.tierSizeInTiles[z].w -1 ) {
                var w = this.tierImageSize[z].w % this.standardTileSize;
            }
            if (y == this.tierSizeInTiles[z].h -1 ) {
                var h = this.tierImageSize[z].h % this.standardTileSize;
            }
            return (new OpenLayers.Size(w, h));
        } else {
            return this.tileSize;
        }
    },

    /**
     * APIMethod: setMap
     * When the layer is added to a map, then we can fetch our origin
     *    (if we don't have one.)
     *
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    setMap: function(map) {
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        this.tileOrigin = new OpenLayers.LonLat(this.map.maxExtent.left,
                                                this.map.maxExtent.top);
    },

    CLASS_NAME: "OpenLayers.Layer.Zoomify"
});
