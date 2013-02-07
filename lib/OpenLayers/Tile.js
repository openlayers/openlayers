/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/BaseTypes/Class.js
 * @requires OpenLayers/Util.js
 */

/**
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
     * APIProperty: events
     * {<OpenLayers.Events>} An events object that handles all 
     *     events on the tile.
     *
     * Register a listener for a particular event with the following syntax:
     * (code)
     * tile.events.register(type, obj, listener);
     * (end)
     *
     * Supported event types:
     * beforedraw - Triggered before the tile is drawn. Used to defer
     *     drawing to an animation queue. To defer drawing, listeners need
     *     to return false, which will abort drawing. The queue handler needs
     *     to call <draw>(true) to actually draw the tile.
     * loadstart - Triggered when tile loading starts.
     * loadend - Triggered when tile loading ends.
     * loaderror - Triggered before the loadend event (i.e. when the tile is
     *     still hidden) if the tile could not be loaded.
     * reload - Triggered when an already loading tile is reloaded.
     * unload - Triggered before a tile is unloaded.
     */
    events: null,

    /**
     * APIProperty: eventListeners
     * {Object} If set as an option at construction, the eventListeners
     *     object will be registered with <OpenLayers.Events.on>.  Object
     *     structure must be a listeners object as shown in the example for
     *     the events.on method.
     *
     * This options can be set in the ``tileOptions`` option from
     * <OpenLayers.Layer.Grid>. For example, to be notified of the
     * ``loadend`` event of each tiles:
     * (code)
     * new OpenLayers.Layer.OSM('osm', 'http://tile.openstreetmap.org/${z}/${x}/${y}.png', {
     *     tileOptions: {
     *         eventListeners: {
     *             'loadend': function(evt) {
     *                 // do something on loadend
     *             }
     *         }
     *     }
     * });
     * (end)
     */
    eventListeners: null,

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
     */

    /** 
     * Constructor: OpenLayers.Tile
     * Constructor for a new <OpenLayers.Tile> instance.
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer>} layer that the tile will go in.
     * position - {<OpenLayers.Pixel>}
     * bounds - {<OpenLayers.Bounds>}
     * url - {<String>}
     * size - {<OpenLayers.Size>}
     * options - {Object}
     */   
    initialize: function(layer, position, bounds, url, size, options) {
        this.layer = layer;
        this.position = position.clone();
        this.setBounds(bounds);
        this.url = url;
        if (size) {
            this.size = size.clone();
        }

        //give the tile a unique id based on its BBOX.
        this.id = OpenLayers.Util.createUniqueID("Tile_");

        OpenLayers.Util.extend(this, options);

        this.events = new OpenLayers.Events(this);
        if (this.eventListeners instanceof Object) {
            this.events.on(this.eventListeners);
        }
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
        
        if (this.eventListeners) {
            this.events.un(this.eventListeners);
        }
        this.events.destroy();
        this.eventListeners = null;
        this.events = null;
    },
    
    /**
     * Method: draw
     * Clear whatever is currently in the tile, then return whether or not 
     *     it should actually be re-drawn. This is an example implementation
     *     that can be overridden by subclasses. The minimum thing to do here
     *     is to call <clear> and return the result from <shouldDraw>.
     *
     * Parameters:
     * force - {Boolean} If true, the tile will not be cleared and no beforedraw
     *     event will be fired. This is used for drawing tiles asynchronously
     *     after drawing has been cancelled by returning false from a beforedraw
     *     listener.
     * 
     * Returns:
     * {Boolean} Whether or not the tile should actually be drawn. Returns null
     *     if a beforedraw listener returned false.
     */
    draw: function(force) {
        if (!force) {
            //clear tile's contents and mark as not drawn
            this.clear();
        }
        var draw = this.shouldDraw();
        if (draw && !force && this.events.triggerEvent("beforedraw") === false) {
            draw = null;
        }
        return draw;
    },
    
    /**
     * Method: shouldDraw
     * Return whether or not the tile should actually be (re-)drawn. The only
     * case where we *wouldn't* want to draw the tile is if the tile is outside
     * its layer's maxExtent
     * 
     * Returns:
     * {Boolean} Whether or not the tile should actually be drawn.
     */
    shouldDraw: function() {        
        var withinMaxExtent = false,
            maxExtent = this.layer.maxExtent;
        if (maxExtent) {
            var map = this.layer.map;
            var worldBounds = map.baseLayer.wrapDateLine && map.getMaxExtent();
            if (this.bounds.intersectsBounds(maxExtent, {inclusive: false, worldBounds: worldBounds})) {
                withinMaxExtent = true;
            }
        }
        
        return withinMaxExtent || this.layer.displayOutsideMaxExtent;
    },
    
    /**
     * Method: setBounds
     * Sets the bounds on this instance
     *
     * Parameters:
     * bounds {<OpenLayers.Bounds>}
     */
    setBounds: function(bounds) {
        bounds = bounds.clone();
        if (this.layer.map.baseLayer.wrapDateLine) {
            var worldExtent = this.layer.map.getMaxExtent(),
                tolerance = this.layer.map.getResolution();
            bounds = bounds.wrapDateLine(worldExtent, {
                leftTolerance: tolerance,
                rightTolerance: tolerance
            });
        }
        this.bounds = bounds;
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

        this.setBounds(bounds);
        this.position = position.clone();
        if (redraw) {
            this.draw();
        }
    },

    /** 
     * Method: clear
     * Clear the tile of any bounds/position-related data so that it can 
     *     be reused in a new location.
     */
    clear: function(draw) {
        // to be extended by subclasses
    },
    
    CLASS_NAME: "OpenLayers.Tile"
});
