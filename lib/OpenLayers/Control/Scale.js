/* Copyright (c) 2006-2007 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 *
 * Class: OpenLayers.Control.Scale
 * Display a small scale indicator on the map.
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.Scale = OpenLayers.Class(OpenLayers.Control, {
    
    /**
     * Parameter: element
     * {DOMElement}
     */
    element: null,
    
    /**
     * Constructor: OpenLayers.Control.Scale
     * 
     * Parameters:
     * element - {DOMElement} 
     * options - {Object} 
     */
    initialize: function(element, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.element = OpenLayers.Util.getElement(element);        
    },

    /**
     * Method: draw
     * 
     * Returns:
     * {DOMElemen}
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        if (!this.element) {
            this.element = document.createElement("div");
            this.div.className = this.displayClass;
            this.element.style.fontSize="smaller";
            this.div.appendChild(this.element);
        }
        this.map.events.register( 'moveend', this, this.updateScale);
        this.updateScale();
        return this.div;
    },
   
    /**
     * Method: updateScale
     */
    updateScale: function() {
        var scale = this.map.getScale();
        if (!scale) return;

        if (scale >= 9500 && scale <= 950000) {
            scale = Math.round(scale / 1000) + "K";
        } else if (scale >= 950000) {
            scale = Math.round(scale / 1000000) + "M";
        } else {
            scale = Math.round(scale);
        }    
        
        this.element.innerHTML = "Scale = 1 : " + scale;
    }, 

    CLASS_NAME: "OpenLayers.Control.Scale"
});

