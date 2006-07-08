/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

// @require: OpenLayers/Control.js

/**
 * @class
 */
OpenLayers.Control.Scale = Class.create();
OpenLayers.Control.Scale.prototype = 
  Object.extend( new OpenLayers.Control(), {
    INCHES_PER_UNIT: { // borrowed from MapServer mapscale.c
	dd: 1.0,
	ft: 12.0,
	mi: 63360.0,
	m: 39.3701,
	km: 39370.1
    },

    /** @type DOMElement */
    element: null,
    
    /** @type String */
    base: '',

    /** @type String */
    units: 'dd',
    
    /** @type Integer */
    dpi: 72,

    /**
     * @constructor
     * 
     * @param {DOMElement} element
     * @param {String} base
     */
    initialize: function(element, base, units) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.element = element;        
        if (base) this.base = base;
        if (units) this.units = units;
    },

    /**
     * @type DOMElement
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        if (!this.element) {
            this.element = document.createElement("div");
            this.div.style.right = "3px";
            this.div.style.bottom = "3px";
            this.div.style.left = "";
            this.div.style.top = "";
            this.div.style.display = "block";
            this.div.style.position = "absolute";
            this.element.style.fontSize="smaller";
            this.div.appendChild(this.element);
        }
        this.map.events.register( 'moveend', this, this.updateLink);
        return this.div;
    },
   
    /**
     * 
     */
    updateLink: function() {
        var res = this.map.getResolution();
	var scale = 1 / (res * self.INCHES_PER_UNIT[self.units] * self.dpi);
        this.element.innerHTML = "Scale = 1 : " + scale;
    }, 
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.Scale"
});

