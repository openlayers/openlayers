/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @requires OpenLayers/Events.js
 * @requires OpenLayers/Icon.js
 * 
 * Class: OpenLayers.Marker
 * Instances of OpenLayers.Marker are a combination of a 
 * <OpenLayers.LonLat> and an <OpenLayers.Icon>.
 */
OpenLayers.Marker = OpenLayers.Class.create();
OpenLayers.Marker.prototype = {
    
    /** 
     * Property: icon 
     * {<OpenLayers.Icon>} 
     */
    icon: null,

    /** 
     * Property: lonlat 
     * {<OpenLayers.LonLat>} location of object
     */
    lonlat: null,
    
    /** 
     * Property: events 
     * {<OpenLayers.Events>}
     */
    events: null,
    
    /** 
     * Property: map 
     * {<OpenLayers.Map>}
     */
    map: null,
    
    /** 
     * Constructor: OpenLayers.Marker
     * Paraemeters:
     * icon - {<OpenLayers.Icon>}
     * lonlat - {<OpenLayers.LonLat>}
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
    * Method: draw
    * Calls draw on the icon, and returns that output.
    * 
    * Parameters:
    * px - {<OpenLayers.Pixel>}
    * 
    * Return:
    * {DOMElement} A new DOM Image with this marker's icon set at the 
    * location passed-in
    */
    draw: function(px) {
        return this.icon.draw(px);
    }, 

    /**
    * Method: moveTo
    * Move the marker to the new location.
    *
    * Parameters:
    * px - {<OpenLayers.Pixel>}
    */
    moveTo: function (px) {
        if ((px != null) && (this.icon != null)) {
            this.icon.moveTo(px);
        }           
        this.lonlat = this.map.getLonLatFromLayerPx(px);
    },

    /**
     * Method: onScreen
     *
     * Return:
     * {Boolean} Whether or not the marker is currently visible on screen.
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
     * Method: inflate
     *
     * Parameters:
     * inflate - {float}
     */
    inflate: function(inflate) {
        if (this.icon) {
            var newSize = new OpenLayers.Size(this.icon.size.w * inflate,
                                              this.icon.size.h * inflate);
            this.icon.setSize(newSize);
        }        
    },
    
    /** 
     * Method: setOpacity
     * Change the opacity of the marker by changin the opacity of 
     *   its icon
     * 
     * Parameters:
     * opacity - {float}  Specified as fraction (0.4, etc)
     */
    setOpacity: function(opacity) {
        this.icon.setOpacity(opacity);
    },

    /** 
     * Method: display
     * Hide or show the icon
     * 
     * display - {Boolean} 
     */
    display: function(display) {
        this.icon.display(display);
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Marker"
};


/**
 * Function: defaultIcon
 * Creates a default <OpenLayers.Icon>.
 * 
 * Returns:
 * {<OpenLayers.Icon>} A default OpenLayers.Icon to use for a marker
 */
OpenLayers.Marker.defaultIcon = function() {
    var url = OpenLayers.Util.getImagesLocation() + "marker.png";
    var size = new OpenLayers.Size(21, 25);
    var calculateOffset = function(size) {
                    return new OpenLayers.Pixel(-(size.w/2), -size.h);
                 };

    return new OpenLayers.Icon(url, size, null, calculateOffset);        
};
    

