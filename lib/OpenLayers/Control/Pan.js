/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.Pan
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.Pan = OpenLayers.Class(OpenLayers.Control, {

    /** 
     * APIProperty: slideFactor
     * {Integer} Number of pixels by which we'll pan the map in any direction 
     *     on clicking the arrow buttons. 
     */
    slideFactor: 50,

    /** 
     * Property: direction
     * {String} in {'North', 'South', 'East', 'West'}
     */
    direction: null,

    /**
     * Property: type
     * {String} The type of <OpenLayers.Control> -- When added to a 
     *     <Control.Panel>, 'type' is used by the panel to determine how to 
     *     handle our events.
     */
    type: OpenLayers.Control.TYPE_BUTTON,

    /**
     * Constructor: OpenLayers.Control.Pan 
     * Control which handles the panning (in any of the cardinal directions)
     *     of the map by a set px distance. 
     *
     * Parameters:
     * direction - {String} The direction this button should pan.
     * options - {Object} An optional object whose properties will be used
     *     to extend the control.
     */
    initialize: function(direction, options) {
    
        this.direction = direction;
        this.CLASS_NAME += this.direction;
        
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * Method: trigger
     */
    trigger: function(){
    
        switch (this.direction) {
            case OpenLayers.Control.Pan.NORTH: 
                this.map.pan(0, -this.slideFactor);
                break;
            case OpenLayers.Control.Pan.SOUTH: 
                this.map.pan(0, this.slideFactor);
                break;
            case OpenLayers.Control.Pan.WEST: 
                this.map.pan(-this.slideFactor, 0);
                break;
            case OpenLayers.Control.Pan.EAST: 
                this.map.pan(this.slideFactor, 0);
                break;
        }
    },

    CLASS_NAME: "OpenLayers.Control.Pan"
});

OpenLayers.Control.Pan.NORTH = "North";
OpenLayers.Control.Pan.SOUTH = "South";
OpenLayers.Control.Pan.EAST = "East";
OpenLayers.Control.Pan.WEST = "West";