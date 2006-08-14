/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Marker.js
 */
OpenLayers.Marker.Box = Class.create();
OpenLayers.Marker.Box.prototype = Object.extend( new OpenLayers.Marker(), {
    /** @type OpenLayers.LonLat */
    bounds: null,

    div: null,
    
    /** 
    * @constructor
    *
    * @param {OpenLayers.Icon} icon
    * @param {OpenLayers.LonLat lonlat
    */
    initialize: function(bounds, borderColor, borderWidth) {
        if (arguments.length > 0) {
            this.bounds = bounds;
            this.div    = OpenLayers.Util.createDiv();
            this.events = new OpenLayers.Events(this, this.div, null);
            this.setBorder(borderColor, borderWidth);
        }
    },

    setBorder: function (color, width) {
        if (!color) color = "red";
        if (!width) width = 2;
        this.div.style.border = width + "px solid " + color;
    },
    
    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @return A new DOM Image with this marker´s icon set at the 
    *         location passed-in
    * @type DOMElement
    */
    draw: function(px, sz) {
        OpenLayers.Util.modifyDOMElement(this.div, null, px, sz);
        return this.div;
    }, 

    /**
     * @returns Whether or not the marker is currently visible on screen.
     * @type Boolean
     */
    onScreen:function() {
        var onScreen = false;
        if (this.map) {
            var screenBounds = this.map.getExtent();
            onScreen = screenBounds.containsBounds(this.bounds, true, true);
        }    
        return onScreen;
    },
    
    /** Hide or show the icon
     * 
     * @param {Boolean} display
     */
    display: function(display) {
        this.div.style.display = (display) ? "" : "none";
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Marker.Box"
});

