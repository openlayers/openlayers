/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Control.js
 */
OpenLayers.Control.MousePosition = OpenLayers.Class.create();
OpenLayers.Control.MousePosition.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control, {
    
    /** @type DOMElement */
    element: null,
    
    /** @type String */
    prefix: '',
    
    /** @type String */
    separator: ', ',
    
    /** @type String */
    suffix: '',
    
    /** @type int */
    numdigits: 5,
    
    /** @type int */
    granularity: 10,
    
    /** @type OpenLayers.LonLat */
    lastXy: null,
    
    /**
     * @constructor
     * 
     * @param {DOMElement} options Options for control.
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /**
     * @type DOMElement
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);

        if (!this.element) {
            this.div.left = "";
            this.div.top = "";
            this.div.className = "olControlMousePosition";
            this.element = this.div;
        }
        
        this.redraw();
        return this.div;
    },
   
    /**
     * 
     */
    redraw: function(evt) {

        var lonLat;

        if (evt == null) {
            lonLat = new OpenLayers.LonLat(0, 0);
        } else {
            if (this.lastXy == null ||
                Math.abs(evt.xy.x - this.lastXy.x) > this.granularity ||
                Math.abs(evt.xy.y - this.lastXy.y) > this.granularity)
            {
                this.lastXy = evt.xy;
                return;
            }

            lonLat = this.map.getLonLatFromPixel(evt.xy);
            this.lastXy = evt.xy;
        }
        
        var digits = parseInt(this.numdigits);
        var newHtml =
            this.prefix +
            lonLat.lon.toFixed(digits) +
            this.separator + 
            lonLat.lat.toFixed(digits) +
            this.suffix;

        if (newHtml != this.element.innerHTML) {
            this.element.innerHTML = newHtml;
        }
    },

    /** 
     *
     */
    setMap: function() {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
        this.map.events.register( 'mousemove', this, this.redraw);
    },     
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.MousePosition"
});
