/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 * @requires OpenLayers/Events.js
 * @requires OpenLayers/Icon.js
 */
OpenLayers.Marker = OpenLayers.Class.create();
OpenLayers.Marker.prototype = {
    
    /** @type OpenLayers.Icon */
    icon: null,

    /** location of object
    * @type OpenLayers.LonLat */
    lonlat: null,
    
    /** @type OpenLayers.Events*/
    events: null,
    
    /** @type OpenLayers.Map */
    map: null,
    
    /** 
    * @constructor
    *
    * @param {OpenLayers.Icon} icon
    * @param {OpenLayers.LonLat lonlat
    */
    initialize: function(lonlat, icon) {
        this.lonlat = lonlat;
        
        var newIcon = (icon) ? icon : OpenLayers.Marker.defaultIcon();
        if (this.icon == null) {
            this.icon = newIcon;
        } else {
            this.icon.url = newIcon.url;
            this.icon.size = newIcon.size;
            this.icon.offset = newIcon.offset;
            this.icon.calculateOffset = newIcon.calculateOffset;
        }
        this.events = new OpenLayers.Events(this, this.icon.imageDiv, null);
    },
    
    destroy: function() {
        this.map = null;

        this.events.destroy();
        this.events = null;

        if (this.icon != null) {
            this.icon.destroy();
            this.icon = null;
        }
    },
    
    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @return A new DOM Image with this marker's icon set at the 
    *         location passed-in
    * @type DOMElement
    */
    draw: function(px) {
        return this.icon.draw(px);
    }, 

    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function (px) {
        if ((px != null) && (this.icon != null)) {
            this.icon.moveTo(px);
        }           
        this.lonlat = this.map.getLonLatFromLayerPx(px);
    },

    /**
     * @returns Whether or not the marker is currently visible on screen.
     * @type Boolean
     */
    onScreen:function() {
        
        var onScreen = false;
        if (this.map) {
            var screenBounds = this.map.getExtent();
            onScreen = screenBounds.containsLonLat(this.lonlat);
        }    
        return onScreen;
    },
    
    /**
     * @param {float} inflate
     */
    inflate: function(inflate) {
        if (this.icon) {
            var newSize = new OpenLayers.Size(this.icon.size.w * inflate,
                                              this.icon.size.h * inflate);
            this.icon.setSize(newSize);
        }        
    },
    
    /** Change the opacity of the marker by changin the opacity of 
     *   its icon
     * 
     * @param {float} opacity Specified as fraction (0.4, etc)
     */
    setOpacity: function(opacity) {
        this.icon.setOpacity(opacity);
    },

    /** Hide or show the icon
     * 
     * @param {Boolean} display
     */
    display: function(display) {
        this.icon.display(display);
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Marker"
};


/** 
 * @returns A default OpenLayers.Icon to use for a marker
 * @type OpenLayers.Icon
 */
OpenLayers.Marker.defaultIcon = function() {
    var url = OpenLayers.Util.getImagesLocation() + "marker.png";
    var size = new OpenLayers.Size(21, 25);
    var calculateOffset = function(size) {
                    return new OpenLayers.Pixel(-(size.w/2), -size.h);
                 };

    return new OpenLayers.Icon(url, size, null, calculateOffset);        
};
    

