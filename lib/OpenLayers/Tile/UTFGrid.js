/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Tile.js
 */

/**
 * Class: OpenLayers.Tile.UTFGrid
 * Instances of OpenLayers.Tile.UTFGrid are used to manage 
 * UTFGrids. This is an unusual tile type in that it doesn't have a
 * rendered image; only a 'hit grid' that can be used to 
 * look up feature attributes.
 *
 * IMPORTANT - remove all traces of IMAGES
 *
 * <OpenLayers.Tile.UTFGrid> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Tile>
 */
OpenLayers.Tile.UTFGrid = OpenLayers.Class(OpenLayers.Tile, {

    /** 
     * Property: url
     * {String} The URL of the image being requested. No default. Filled in by
     * layer.getURL() function. 
     */
    url: null,
    
    /** 
     * Property: json
     * Stores the parsed JSON tile data structure. 
     * {Object} The image for this tile.
     */
    json: null,

    /** 
     * Property: imageReloadAttempts
     * {Integer} Attempts to load the image.
     */
    imageReloadAttempts: null,
    
    /**
     * Property: asyncRequestId
     * {Integer} ID of an request to see if request is still valid. This is a
     * number which increments by 1 for each asynchronous request.
     */
    asyncRequestId: null,
    
    /** TBD 3.0 - reorder the parameters to the init function to remove 
     *             URL. the getUrl() function on the layer gets called on 
     *             each draw(), so no need to specify it here.
     * 
     * Constructor: OpenLayers.Tile.Image
     * Constructor for a new <OpenLayers.Tile.Image> instance.
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer>} layer that the tile will go in.
     * position - {<OpenLayers.Pixel>}
     * bounds - {<OpenLayers.Bounds>}
     * url - {<String>} Deprecated. Remove me in 3.0.
     * size - {<OpenLayers.Size>}
     * options - {Object}
     */   
    initialize: function(layer, position, bounds, url, size, options) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);
        this.url = url; //deprecated remove me
    },
    
    /** 
     * APIMethod: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        if (this.imgDiv)  {
            this.clear();
            this.imgDiv = null;
            this.frame = null;
        }
        // don't handle async requests any more
        this.asyncRequestId = null;
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * Method: draw
     * Check that a tile should be drawn, and draw it.
     * In the case of UTFGrids, "drawing" it means fetching and
     * parsing the json. 
     * 
     * Returns:
     * {Boolean} Was a tile drawn?
     */
    draw: function() {
        var drawn = OpenLayers.Tile.prototype.draw.apply(this, arguments);
        if (drawn) {
            if (this.isLoading) {
                //if we're already loading, send 'reload' instead of 'loadstart'.
                this.events.triggerEvent("reload"); 
            } else {
                this.isLoading = true;
                this.events.triggerEvent("loadstart");
            }
            this.url = this.layer.getURL(this.bounds);

            var resp = new OpenLayers.Protocol.Response({requestType: "read"});
            resp.priv = OpenLayers.Request.GET({
                url: this.url,
                callback: this.parseData,
                scope: this
            });

            /*
             * MP TODO Investigate JSONP method to avoid xbrowser polucy
             *
            grid = function(e) { 
                console.log(e);
            };

            var ols = new OpenLayers.Protocol.Script({
                url: "http://tiles/world_utfgrid/2/2/1.json", 
                callback: grid,
                scope: this
            });
            var res = ols.read();
            console.log(res.priv);
            */

            this.positionTile();
        } else {
            this.unload();
        }
        return drawn;
    },

    /**
     * Method: parseJSON
     * Parse the JSON from a request
     * 
     * Returns:
     * {Object} parsed javascript data
     */
    parseData: function(req) {
        if (req.status == 200) {
            var text = req.responseText;
            this.json = JSON.parse(text);
        } 
    },
    
    /**
     * Method: positionTile
     * Using the properties currenty set on the layer, position the tile correctly.
     * This method is used both by the async and non-async versions of the Tile.Image
     * code.
     */
    positionTile: function() {
        var style = this.getTile().style;
        style.left = this.position.x + "%";
        style.top = this.position.y + "%";
        style.width = this.size.w + "%";
        style.height = this.size.h + "%";
    },

    /** 
     * Method: clear
     * Remove the tile from the DOM, clear it of any image related data so that
     * it can be reused in a new location.
     */
    clear: function() {
        this.json = null;
        var tile = this.getTile();
        if (tile.parentNode === this.layer.div) {
            this.layer.div.removeChild(tile);
        }
    },
    
    /**
     * Method: getImage
     * Returns or creates and returns the tile image.
     */
    getImage: function() {
        if (!this.imgDiv) {
            // MP TODO do we NEED to create an image here?  
            this.imgDiv = document.createElement("img");
            this.imgDiv.className = "olTileImage";
            var style = this.imgDiv.style;
            style.width = "100%";
            style.height = "100%";
            style.visibility = "hidden";
            style.opacity = 0;
            style.position = "absolute";
            if (this.frame) {
                this.frame.appendChild(this.imgDiv);
            }
        }

        return this.imgDiv;
    },

    /**
     * Method: getTile
     * Get the tile's markup.
     *
     * Returns:
     * {DOMElement} The tile's markup
     */
    getTile: function() {
        return this.frame ? this.frame : this.getImage();
    },

    CLASS_NAME: "OpenLayers.Tile.UTFGrid"

});
