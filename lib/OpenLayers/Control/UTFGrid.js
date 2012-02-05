/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
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
     * APIProperty: prefix
     * {String}
     */
    prefix: '',
    
    /** 
     * APIProperty: separator
     * {String}
     */
    separator: ', ',
    
    /** 
     * APIProperty: suffix
     * {String}
     */
    suffix: '',
    
    /** 
     * APIProperty: numDigits
     * {Integer}
     */
    numDigits: 5,
    
    /** 
     * APIProperty: granularity
     * {Integer} 
     */
    granularity: 10,

    /**
     * APIProperty: emptyString 
     * {String} Set this to some value to set when the mouse is outside the
     *     map.
     */
    emptyString: null,
    
    /** 
     * Property: lastXy
     * {<OpenLayers.Pixel>}
     */
    lastXy: null,

    /**
     * APIProperty: displayProjection
     * {<OpenLayers.Projection>} The projection in which the 
     * mouse position is displayed
     */
    displayProjection: null, 
    
    /**
     * Constructor: OpenLayers.Control.UTFGrid
     * 
     * Parameters:
     * options - {Object} Options for control.
     */

    /**
     * Method: destroy
     */
     destroy: function() {
         this.deactivate();
         OpenLayers.Control.prototype.destroy.apply(this, arguments);
     },

    /**
     * APIMethod: activate
     */
    activate: function() {
        if (OpenLayers.Control.prototype.activate.apply(this, arguments)) {
            this.map.events.register('mousemove', this, this.redraw);
            this.map.events.register('mouseout', this, this.reset);
            //this.map.events.register('click', this, this.redraw);
            this.redraw();
            return true;
        } else {
            return false;
        }
    },
    
    /**
     * APIMethod: deactivate
     */
    deactivate: function() {
        if (OpenLayers.Control.prototype.deactivate.apply(this, arguments)) {
            //this.map.events.unregister('click', this, this.redraw);
            this.map.events.unregister('mousemove', this, this.redraw);
            this.map.events.unregister('mouseout', this, this.reset);
            this.element.innerHTML = "";
            return true;
        } else {
            return false;
        }
    },

    /**
     * Method: draw
     * {DOMElement}
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);

        if (!this.element) {
            this.div.left = "";
            this.div.top = "";
            this.element = this.div;
        }
        
        return this.div;
    },
   
    /**
     * Method: redraw  
     */
    redraw: function(evt) {

        var lonLat;

        if (evt == null) {
            this.reset();
            return;
        } else {
            if (this.lastXy == null ||
                Math.abs(evt.xy.x - this.lastXy.x) > this.granularity ||
                Math.abs(evt.xy.y - this.lastXy.y) > this.granularity)
            {
                this.lastXy = evt.xy;
                return;
            }

            lonLat = this.map.getLonLatFromPixel(evt.xy);
            if (!lonLat) { 
                // map has not yet been properly initialized
                return;
            }    
            this.lastXy = evt.xy;
        }
        
        var newHtml = this.formatOutput(lonLat);

        var layers = this.findLayers();
        if (layers.length > 0) {
            var layer;
            for (var i=0, len=layers.length; i<len; i++) {
                layer = layers[i];
                var info = layer.getTileInfo( lonLat );
                if (this.debugElement) {
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
                    this.debugElement.innerHTML = debug;
                }
                var tile = info.tile;
                /*
                TODO Sanity checks
                if ((Math.floor(info.i) >= tileSize) ||
                    (Math.floor(info.j) >= tileSize)) alert("TOO BIG");
                */
                var attrs = null;
                var resolution = 4;
                if (tile !== null && typeof(tile) !== 'undefined') {
                    var data = tile.json
                    if (data !== null) {
                        //val = data;
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

    /**
     * Method: callback
     * Takes the attrs and does somethings with them
     * this is a default (intended to be overridden)
     */
    callback: function(attrs) {
        if (attrs !== null && typeof(attrs) !== 'undefined') {
            val = "<p>Attributes</p><ul>";
            for(var index in attrs) {
                val += "<li>" + index + " : " + attrs[index] + "</li>";
            }
            val += "</ul>";
            //var val = attrs.NAME + ": population " + attrs.POP2005;
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
        if (this.emptyString != null) {
            this.element.innerHTML = this.emptyString;
        }
    },

    /**
     * Method: formatOutput
     * Override to provide custom display output
     *
     * Parameters:
     * lonLat - {<OpenLayers.LonLat>} Location to display
     */
    formatOutput: function(lonLat) {
        var digits = parseInt(this.numDigits);
        var newHtml =
            this.prefix +
            lonLat.lon.toFixed(digits) +
            this.separator + 
            lonLat.lat.toFixed(digits) +
            this.suffix;
        return newHtml;
    },

    /**
     * Method: findLayers
     * Internal method to get the layers, independent of whether we are
     *     inspecting the map or using a client-provided array
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
