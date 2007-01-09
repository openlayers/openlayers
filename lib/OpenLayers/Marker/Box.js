/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 * 
 * @requires OpenLayers/Marker.js
 */
OpenLayers.Marker.Box = OpenLayers.Class.create();
OpenLayers.Marker.Box.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Marker, {

    /** @type OpenLayers.Bounds */
    bounds: null,

    /** @type DOMElement */
    div: null,
    
    /** 
     * @constructor
     *
     * @param {OpenLayers.Bounds} bounds
     * @param {String} borderColor
     * @param {int} borderWidth
     */
    initialize: function(bounds, borderColor, borderWidth) {
        this.bounds = bounds;
        this.div    = OpenLayers.Util.createDiv();
        this.div.style.overflow = 'hidden';
        this.events = new OpenLayers.Events(this, this.div, null);
        this.setBorder(borderColor, borderWidth);
    },

    /** Allow the user to change the box's color and border width
     * 
     * @param {String} color Default is "red"
     * @param {int} width Default is 2
     */
    setBorder: function (color, width) {
        if (!color) {
            color = "red";
        }
        if (!width) {
            width = 2;
        }
        this.div.style.border = width + "px solid " + color;
    },
    
    /** 
    * @param {OpenLayers.Pixel} px
    * @param {OpenLayers.Size} sz
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

