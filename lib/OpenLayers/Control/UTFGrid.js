/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Hover.js
 * @requires OpenLayers/Handler/Click.js
 */

/**
 * Class: OpenLayers.Control.UTFGrid
 *
 * This Control provides behavior associated with UTFGrid Layers.
 * These 'hit grids' provide underlying feature attributes without
 * calling the server (again). This control allows Mousemove, Hovering 
 * and Click events to trigger callbacks that use the attributes in 
 * whatever way you need. 
 *
 * The most common example may be a UTFGrid layer containing feature
 * attributes that are displayed in a div as you mouseover.
 *
 * Example Code:
 *
 * (start code)
 * var world_utfgrid = new OpenLayers.Layer.UTFGrid( 
 *     'UTFGrid Layer', 
 *     "http://tiles/world_utfgrid/${z}/${x}/${y}.json"
 * );
 * map.addLayer(world_utfgrid);
 * 
 * var control = new OpenLayers.Control.UTFGrid({
 *     'div': 'attrsdiv',
 *     'layers': [world_utfgrid],
 *     'handlerMode': 'move'
 * })
 * (end code)
 *
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.UTFGrid = OpenLayers.Class(OpenLayers.Control, {
    
    /**
     * APIProperty: autoActivate
     * {Boolean} Activate the control when it is added to a map.  Default is
     *     true.
     */
    autoActivate: true,

    /** 
     * APIProperty: Layers
     * List of layers to consider. Must be Layer.UTFGrids
     * `null` is the default indicating all UTFGrid Layers are queried.
     * {Array} <OpenLayers.Layer.UTFGrid> 
     */
    layers: null,

    /** 
     * Property: element
     * {DOMElement} 
     */
    element: null,

    /** 
     * Property: debugElement
     * {DOMElement} 
     */
    debugElement: null,
    
    /* Property: defaultHandlerOptions
     * The default opts passed to the handler constructors
     */
    defaultHandlerOptions: {
        'delay': 300,
        'pixelTolerance': 4,
        'stopMove': false,
        'single': true,
        'double': false,
        'stopSingle': false,
        'stopDouble': false
    },

    /* APIProperty: handlerMode
     * Defaults to 'click'. Can be 'hover' or 'move'.
     */
    handlerMode: 'click',

    /**
     * APIMethod: setHandler
     * sets this.handlerMode and calls resetHandler()
     *
     * Parameters:
     * hm - {String} Handler Mode string; 'click', 'hover' or 'move'.
     */
    setHandler: function(hm) {
        this.handlerMode = hm;
        this.resetHandler();
    },

    /**
     * Method: resetHandler
     * Deactivates the old hanlder and creates a new
     * <OpenLayers.Handler> based on the mode specified in
     * this.handlerMode
     *
     */
    resetHandler: function() {
        if (this.handler) {
            this.handler.deactivate();
            this.handler.destroy();
            this.handler = null;
        }
   
        if (this.handlerMode == 'hover') {
            // Handle this event on hover
            this.handler = new OpenLayers.Handler.Hover(
                this,
                {'pause': this.handleEvent, 'move': this.reset},
                this.handlerOptions
            );
        } else if (this.handlerMode == 'click') {
            // Handle this event on click
            this.handler = new OpenLayers.Handler.Click(
                this, {
                    'click': this.handleEvent
                }, this.handlerOptions
            );
        } else if (this.handlerMode == 'move') {
            this.handler = new OpenLayers.Handler.Hover(
                this,
                // Handle this event while hovering OR moving
                {'pause': this.handleEvent, 'move': this.handleEvent},
                this.handlerOptions
            );
        }
        if (this.handler) {
            return true;
        } else {
            return false;
        }
    },

    /**
     * Constructor: <OpenLayers.Control.UTFGrid>
     *
     * Parameters:
     * options - {Object} 
     */
    initialize: function(options) {
        options = options || {};
        options.handlerOptions = options.handlerOptions || this.defaultHandlerOptions;
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        if (options.div) {
            this.element = OpenLayers.Util.getElement(options.div);
        }
        this.resetHandler();
    }, 

    /**
     * Method: handleEvent
     * Internal method called when specified event is triggered.
     * 
     * This method does several things:
     *
     * Gets the lonLat of the event.
     *
     * Loops through the appropriate hit grid layers and gathers the attributes.
     *
     * Passes the attributes to the callback
     *
     * Parameters:
     * evt - {<OpenLayers.Event>} 
     */
    handleEvent: function(evt) {
        if (evt == null) {
            this.reset();
            return;
        }

        var lonLat = this.map.getLonLatFromPixel(evt.xy);
        if (!lonLat) { 
            return;
        }    
        
        var layers = this.findLayers();
        var globalAttrs = {};
        if (layers.length > 0) {
            var layer;
            for (var i=0, len=layers.length; i<len; i++) {
                layer = layers[i];
                var info = layer.getTileInfo( lonLat );
                this.writeDebugInfo(info);
                var tile = info.tile;
                var localAttrs = null;
                var resolution = layer.utfgridResolution || 4;
                if (tile !== null && typeof(tile) !== 'undefined') {
                    var data = tile.json
                    if (data !== null) {
                        var code = this.resolveCode(data.grid[ 
                                Math.floor((info.j) / resolution) 
                            ].charCodeAt(
                                Math.floor((info.i) / resolution)
                            ));
                        localAttrs = data.data[data.keys[code]];
                        for (var property in localAttrs) {
                            // If attribute names collide, last one takes it
                            globalAttrs[property] = localAttrs[property];
                        }
                    }
                }
            }
            this.callback(globalAttrs); // perhaps pass tile, lonLat?
        }
    },

    /** Method: writeDebugInfo
     * Writes out debug info on event 
     * Only fired off if this.debugElement is set
     *
     */
    writeDebugInfo: function(info) {
        var debug = "<ul>";
        debug += "<li>i :" + info.i + "</li>";
        debug += "<li>j :" + info.j + "</li>";
        debug += "<li>globalrow :" + info.globalRow + "</li>";
        debug += "<li>globalcol :" + info.globalCol + "</li>";
        debug += "<li>gridrow :" + info.gridRow + "</li>";
        debug += "<li>gridcol :" + info.gridCol + "</li>";
        debug += "</ul>";
        if (this.debugElement) {
            this.debugElement.innerHTML = debug;
        } 
    },

    /**
     * APIMethod: callback
     * Takes the attrs and does somethings with them
     * The default behavior is to make a simple table
     * and write to a div (defined by this.element)
     *
     * Parameters:
     * attrs - {Object}
     *
     * Returns:
     * {Boolean} - was the element updated?
     */
    callback: function(attrs) {
        if (attrs !== null && typeof(attrs) !== 'undefined') {
            val = "<table>";
            for(var index in attrs) {
                val += "<tr><th>" + index + "</th><td>" + attrs[index] + "</td></tr>";
            }
            val += "</table>";
            this.element.innerHTML = val;
            return true;
        } else {
            this.element.innerHTML = '';
            return false; 
        }
    },

    /**
     * Method: resolveCode
     * Resolve the UTF-8 encoding stored in grids to simple
     * number values.
     *  See the [utfgrid section of the mbtiles spec](https://github.com/mapbox/mbtiles-spec/blob/master/1.1/utfgrid.md)
     * for details.
     *
     * Parameters:
     * key - {Integer}
     *
     * Returns:
     * {Integer} Adjusted key for non-escaped chars
     */
    resolveCode: function(key) {
        if (key >= 93) key--;
        if (key >= 35) key--;
        key -= 32;
        return key;
    },

    /**
     * Method: reset
     * Resets the element
     */
    reset: function(evt) {
        this.callback(null);
        if (this.element)
            this.element.innerHTML = '';
    },

    /**
     * Method: findLayers
     * Internal method to get the layers, independent of whether we are
     *     inspecting the map or using a client-provided array
     *
     * The default value of this.layers is null; this causes the 
     * findLayers method to return ALL UTFGrid layers encountered.
     *
     * Parameters:
     * None
     *
     * Returns:
     * {Array} Layers to handle on each event
     */
    findLayers: function() {
        var candidates = this.layers || this.map.layers;
        var layers = [];
        var layer;
        for (var i=candidates.length-1; i>=0; --i) {
            layer = candidates[i];
            if (layer instanceof OpenLayers.Layer.UTFGrid ) { 
                layers.push(layer);
            }
        }
        return layers;
    },

    CLASS_NAME: "OpenLayers.Control.UTFGrid"
});
