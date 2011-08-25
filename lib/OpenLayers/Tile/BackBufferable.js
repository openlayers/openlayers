/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Tile.js
 * @requires OpenLayers/Util.js
 */

/**
 * Class: OpenLayers.Tile.BackBufferable
 * Base class for tiles that can have backbuffers during transitions. Do not
 * create instances of this class.
 */
OpenLayers.Tile.BackBufferable = OpenLayers.Class(OpenLayers.Tile, {
    
    /**
     * Property: backBufferMode
     * {Integer} Bitmap: 0 for no backbuffering at all, 1 for singleTile
     * layers, 2 for transition effect set, 3 for both.
     */
    backBufferMode: null,
    
    /**
     * Property: backBufferData
     * {Object} Object including the necessary data for the back
     * buffer.
     *
     * The object includes three properties:
     * tile - {DOMElement} The DOM element for the back buffer.
     * bounds - {<OpenLayers.Bounds>} The bounds of the tile to back.
     * resolution - {Number} The resolution of the tile to back.
     */
    backBufferData: null,

    /** 
     * Method: initialize
     * Determines the backBuffer mode and registers events
     */   
    initialize: function() {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);
        
        var transitionSupported = OpenLayers.Util.indexOf(
                                    this.layer.SUPPORTED_TRANSITIONS,
                                    this.layer.transitionEffect) != -1;
        this.backBufferMode = (this.layer.singleTile && 1) |
                              (transitionSupported && 2);

        this.backBufferData = {};
        if (!this.size) {
            this.size = new OpenLayers.Size(256, 256);
        }
    },
    
    /**
     * Method: draw
     * Check that a tile should be drawn, and draw it.
     * 
     * Returns:
     * {Boolean} Was a tile drawn?
     */
    draw: function() {
        var draw = OpenLayers.Tile.prototype.shouldDraw.apply(this, arguments),
            backBufferMode = this.backBufferMode;
        if (draw) {
            this.updateBackBuffer();
        }
        this.clear();
        if (!draw) {
            this.resetBackBuffer();
        };
        return draw;
    },
    
    /**
     * Method: getTile
     * Get the tile's markup. To be implemented by subclasses.
     *
     * Returns:
     * {DOMElement} The tile's markup
     */

    /**
     * Method: createBackBuffer
     * Create a copy of this tile's markup for the back buffer. To be
     * implemented by subclasses.
     *
     * Returns:
     * {DOMElement} A copy of the tile's markup.
     */
    
    /**
     * Method: setBackBufferData
     * Stores the current bounds and resolution, for offset and ratio
     * calculations
     */
    setBackBufferData: function() {
        this.backBufferData = OpenLayers.Util.extend(this.backBufferData, {
            bounds: this.bounds,
            resolution: this.layer.map.getResolution()
        });
    },
    
    /**
     * Method: updateBackBuffer
     * Update the <backBufferData>, and return a new or reposition the
     * backBuffer. When a backbuffer is returned, the tile's markup is not
     * available any more.
     *
     * Returns:
     * {HTMLDivElement} the tile's markup in a cloned element, or undefined if
     *     no backbuffer is currently available or needed
     */
    updateBackBuffer: function() {
        var layer = this.layer, map = layer.map,
            backBufferMode = this.backBufferMode,
            data = this.backBufferData,
            tile = this.getTile(),
            backBuffer = data.tile,
            resolution = data.resolution,
            ratio = resolution ? resolution / map.getResolution() : 1,
            
        // Cases where we don't position and return a back buffer, but only
        // update backBufferData and return undefined:
            // (1) current ratio and backBufferMode dont't require a backbuffer
            notNeeded = !(ratio == 1 ? backBufferMode & 1 : backBufferMode & 2),
            // (2) the tile is not appended to the layer's div
            noParent = tile && tile.parentNode !== layer.div,
            // (3) we don't have a tile available that we could use as buffer
            noTile = !(tile && tile.childNodes.length > 0),
            // (4) no backbuffer is displayed for a tile that's still loading
            noBackBuffer = !backBuffer && this.isLoading;            
        if (notNeeded || noParent || noTile || noBackBuffer) {
            this.setBackBufferData();
            return;
        }

        // Create a back buffer tile and add it to the DOM
        if (!backBuffer) {
            backBuffer = this.createBackBuffer();
            // some browsers fire the onload event before the image is
            // displayed, so we keep the buffer until the whole layer finished
            // loading to avoid visual glitches
            layer.events.register("loadend", this, this.resetBackBuffer);
            data.tile = backBuffer;
            layer.div.insertBefore(backBuffer, tile);
        }

        // Position the back buffer now that we have one
        var lonLat = {lon: data.bounds.left, lat: data.bounds.top},
            position = map.getPixelFromLonLat(lonLat),
            containerStyle = map.layerContainerDiv.style,
            leftOffset = parseInt(containerStyle.left, 10),
            topOffset = parseInt(containerStyle.top, 10),
            style = backBuffer.style;
        style.left = (position.x - leftOffset) + "px";
        style.top = (position.y - topOffset) + "px";
        style.width = (this.size.w * ratio) + "px";
        style.height = (this.size.h * ratio) + "px";        

        return backBuffer;
    },
    
    /**
     * Method: resetBackBuffer
     * Handler for the layer's loadend event.
     */
    resetBackBuffer: function() {
        this.layer.events.unregister("loadend", this, this.resetBackBuffer);
        this.removeBackBuffer();
        this.setBackBufferData();
    },
    
    /**
     * Method: removeBackBuffer
     * Removes the backBuffer for this tile.
     */
    removeBackBuffer: function() {
        var backBufferData = this.backBufferData;
        var backBuffer = backBufferData.tile;
        delete backBufferData.tile;
        var parent = backBuffer && backBuffer.parentNode;
        if (backBuffer) {
            parent.removeChild(backBuffer);
        }
    },
    
    /** 
     * APIMethod: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        this.removeBackBuffer();
        this.layer.events.unregister("loadend", this, this.resetBackBuffer);
        this.backBufferData = null;
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
    }
        
});
