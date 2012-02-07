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
 * The UTFGrid control displays .... 
 * pointer, as it is moved about the map.
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
     * Property: element
     * {DOMElement} 
     */
    element: null,
    debugElement: null,
    
    /**
     * Constructor: OpenLayers.Control.UTFGrid
     * Parameters:
     * options - {Object} Options for control.
     */
    defaultHandlerOptions: {
        'delay': 200,
        'pixelTolerance': null,
        'stopMove': false,
        'single': true,
        'double': false,
        'pixelTolerance': 4,
        'stopSingle': false,
        'stopDouble': false
    },

    /* Property: handlerMode
     * Defaults to 'click'. Can be 'hover' or 'move'.
     */
    handlerMode: 'hover',

    setHandler: function(hm) {
        this.handlerMode = hm;
        this.resetHandler();
    },

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
        options.handlerOptions = options.handlerOptions || {};
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        if (options.div) {
            this.element = OpenLayers.Util.getElement(options.div);
        }
        this.resetHandler();
    }, 

    /**
     * Method: handleEvent
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
        if (layers.length > 0) {
            var layer;
            for (var i=0, len=layers.length; i<len; i++) {
                layer = layers[i];
                var info = layer.getTileInfo( lonLat );
                this.writeDebugInfo(info);
                var tile = info.tile;
                var attrs = null;
                var resolution = layer.utfgridResolution || 4;
                if (tile !== null && typeof(tile) !== 'undefined') {
                    var data = tile.json
                    if (data !== null) {
                        var code = this.resolveCode(data.grid[ 
                                Math.floor((info.j) / resolution) 
                            ].charCodeAt(
                                Math.floor((info.i) / resolution)
                            ));
                        attrs = data.data[data.keys[code]];
                        this.callback(attrs);
                    }
                }
            }
        }
    },

    /** Method: 
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
        debug += "<li>gridrow offset :" + info.gridRowOffset + "</li>";
        debug += "<li>gridcol offset :" + info.gridColOffset + "</li>";
        debug += "</ul>";
        if (this.debugElement) {
            this.debugElement.innerHTML = debug;
        } 
    },

    /**
     * Method: callback
     * Takes the attrs and does somethings with them
     * this is a default (intended to be overridden)
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
     */
    resolveCode: function(key) {
        if (key >= 93) key--;
        if (key >= 35) key--;
        key -= 32;
        return key;
    },

    /**
     * Method: reset
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
     *     MP TODO respect list of user-supplied candidates
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
