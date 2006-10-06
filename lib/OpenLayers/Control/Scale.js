/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Control.js
 */
OpenLayers.Control.Scale = OpenLayers.Class.create();
OpenLayers.Control.Scale.prototype = 
  OpenLayers.Util.extend( new OpenLayers.Control(), {
    /** @type DOMElement */
    element: null,
    
    /**
     * @constructor
     * 
     * @param {DOMElement} element
     * @param {String} base
     */
    initialize: function(element) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.element = element;        
    },

    /**
     * @type DOMElement
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        if (!this.element) {
            this.element = document.createElement("div");
            this.div.className = "olControlScale";
            this.element.style.fontSize="smaller";
            this.div.appendChild(this.element);
        }
        this.map.events.register( 'moveend', this, this.updateScale);
        this.updateScale();
        return this.div;
    },
   
    /**
     * 
     */
    updateScale: function() {
        var scale = this.map.getScale();
        if (!scale) return;

        if (scale >= 9500 && scale <= 950000) {
            scale = Math.round(scale / 1000) + "K";
        } else if (scale >= 950000) {
            scale = Math.round(scale / 1000000) + "M";
        } else {
            scale = Math.round(scale / 100) * 100;
        }
        this.element.innerHTML = "Scale = 1 : " + scale;
    }, 
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.Scale"
});

