/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/*
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Console.js
 */

/*
 * Class: OpenLayers.Tile 
 * This is a class designed to designate a single tile, however
 *     it is explicitly designed to do relatively little. Tiles store 
 *     information about themselves -- such as the URL that they are related
 *     to, and their size - but do not add themselves to the layer div 
 *     automatically, for example. Create a new tile with the 
 *     <OpenLayers.Tile> constructor, or a subclass. 
 * 
 * TBD 3.0 - remove reference to url in above paragraph
 * 
 */
OpenLayers.Tile = OpenLayers.Class({
    
    /** 
     * Constant: EVENT_TYPES
     * {Array(String)} Supported application event types
     */
    EVENT_TYPES: [ "loadstart", "loadend", "reload", "unload"],
    
    /**
     * APIProperty: events
     * {<OpenLayers.Events>} An events object that handles all 
     *                       events on the tile.
     */
    events: null,

    /**
     * Property: id 
     * {String} null
     */
    id: null,
    
    /** 
     * Property: layer 
     * {<OpenLayers.Layer>} layer the tile is attached to 
     */
    layer: null,
    
    /**
     * Property: url
     * {String} url of the request.
     *
     * TBD 3.0 
     * Deprecated. The base tile class does not need an url. This should be 
     * handled in subclasses. Does not belong here.
     */
    url: null,

    /** 
     * APIProperty: bounds 
     * {<OpenLayers.Bounds>} null
     */
    bounds: null,
    
    /** 
     * Property: size 
     * {<OpenLayers.Size>} null
     */
    size: null,
    
    /** 
     * Property: position 
     * {<OpenLayers.Pixel>} Top Left pixel of the tile
     */    
    position: null,

    /**
     * Property: isLoading
     * {Boolean} Is the tile loading?
     */
    isLoading: false,
        
    /** TBD 3.0 -- remove 'url' from the list of parameters to the constructor.
     *             there is no need for the base tile class to have a url.
     * 
     * Constructor: OpenLayers.Tile
     * Constructor for a new <OpenLayers.Tile> instance.
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer>} layer that the tile will go in.
     * position - {<OpenLayers.Pixel>}
     * bounds - {<OpenLayers.Bounds>}
     * url - {<String>}
     * size - {<OpenLayers.Size>}
     */   
    initialize: function(layer, position, bounds, url, size) {
        this.layer = layer;
        this.position = position.clone();
        this.bounds = bounds.clone();
        this.url = url;
        this.size = size.clone();

        //give the tile a unique id based on its BBOX.
        this.id = OpenLayers.Util.createUniqueID("Tile_");
        
        this.events = new OpenLayers.Events(this, null, this.EVENT_TYPES);
    },

    /**
     * Method: unload
     * Call immediately before destroying if you are listening to tile
     * events, so that counters are properly handled if tile is still
     * loading at destroy-time. Will only fire an event if the tile is
     * still loading.
     */
    unload: function() {
       if (this.isLoading) { 
           this.isLoading = false; 
           this.events.triggerEvent("unload"); 
       }
    },
    
    /** 
     * APIMethod: destroy
     * Nullify references to prevent circular references and memory leaks.
     */
    destroy:function() {
        this.layer  = null;
        this.bounds = null;
        this.size = null;
        this.position = null;
        
        this.events.destroy();
        this.events = null;
    },
    
    /**
     * Method: clone
     *
     * Parameters:
     * obj - {<OpenLayers.Tile>} The tile to be cloned
     *
     * Returns:
     * {<OpenLayers.Tile>} An exact clone of this <OpenLayers.Tile>
     */
    clone: function (obj) {
        if (obj == null) {
            obj = new OpenLayers.Tile(this.layer, 
                                      this.position, 
                                      this.bounds, 
                                      this.url, 
                                      this.size);
        } 
        
        // catch any randomly tagged-on properties
        OpenLayers.Util.applyDefaults(obj, this);
        
        return obj;
    },

    /**
     * Method: draw
     * Clear whatever is currently in the tile, then return whether or not 
     *     it should actually be re-drawn.
     * 
     * Returns:
     * {Boolean} Whether or not the tile should actually be drawn. Note that 
     *     this is not really the best way of doing things, but such is 
     *     the way the code has been developed. Subclasses call this and
     *     depend on the return to know if they should draw or not.
     */
    draw: function() {
        var maxExtent = this.layer.maxExtent;
        var withinMaxExtent = (maxExtent &&
                               this.bounds.intersectsBounds(maxExtent, false));
 
        // The only case where we *wouldn't* want to draw the tile is if the 
        // tile is outside its layer's maxExtent.
        this.shouldDraw = (withinMaxExtent || this.layer.displayOutsideMaxExtent);
                
        //clear tile's contents and mark as not drawn
        this.clear();
        
        return this.shouldDraw;
    },
    
    /** 
     * Method: moveTo
     * Reposition the tile.
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * position - {<OpenLayers.Pixel>}
     * redraw - {Boolean} Call draw method on tile after moving.
     *     Default is true
     */
    moveTo: function (bounds, position, redraw) {
        if (redraw == null) {
            redraw = true;
        }

        this.bounds = bounds.clone();
        this.position = position.clone();
        if (redraw) {
            this.draw();
        }
    },

    /** 
     * Method: clear
     * Clear the tile of any bounds/position-related data so that it can 
     *     be reused in a new location. To be implemented by subclasses.
     */
    clear: function() {
        // to be implemented by subclasses
    },
    
    /**   
     * Method: getBoundsFromBaseLayer
     * Take the pixel locations of the corner of the tile, and pass them to 
     *     the base layer and ask for the location of those pixels, so that 
     *     displaying tiles over Google works fine.
     *
     * Parameters:
     * position - {<OpenLayers.Pixel>}
     *
     * Returns:
     * bounds - {<OpenLayers.Bounds>} 
     */
    getBoundsFromBaseLayer: function(position) {
        var msg = OpenLayers.i18n('reprojectDeprecated',
                                              {'layerName':this.layer.name});
        OpenLayers.Console.warn(msg);
        var topLeft = this.layer.map.getLonLatFromLayerPx(position); 
        var bottomRightPx = position.clone();
        bottomRightPx.x += this.size.w;
        bottomRightPx.y += this.size.h;
        var bottomRight = this.layer.map.getLonLatFromLayerPx(bottomRightPx); 
        // Handle the case where the base layer wraps around the date line.
        // Google does this, and it breaks WMS servers to request bounds in 
        // that fashion.  
        if (topLeft.lon > bottomRight.lon) {
            if (topLeft.lon < 0) {
                topLeft.lon = -180 - (topLeft.lon+180);
            } else {
                bottomRight.lon = 180+bottomRight.lon+180;
            }        
        }
        var bounds = new OpenLayers.Bounds(topLeft.lon, 
                                       bottomRight.lat, 
                                       bottomRight.lon, 
                                       topLeft.lat);  
        return bounds;
    },        
        
    /** 
     * Method: showTile
     * Show the tile only if it should be drawn.
     */
    showTile: function() { 
        if (this.shouldDraw) {
            this.show();
        }
    },
    
    /** 
     * Method: show
     * Show the tile.  To be implemented by subclasses.
     */
    show: function() { },
    
    /** 
     * Method: hide
     * Hide the tile.  To be implemented by subclasses.
     */
    hide: function() { },
    
    CLASS_NAME: "OpenLayers.Tile"
});
