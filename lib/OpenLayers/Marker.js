/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Events.js
 * @requires OpenLayers/Icon.js
 */

/**
 * Class: OpenLayers.Marker
 * Instances of OpenLayers.Marker are a combination of a 
 * <OpenLayers.LonLat> and an <OpenLayers.Icon>.  
 *
 * Markers are generally added to a special layer called
 * <OpenLayers.Layer.Markers>.
 *
 * Example:
 * (code)
 * var markers = new OpenLayers.Layer.Markers( "Markers" );
 * map.addLayer(markers);
 *
 * var size = new OpenLayers.Size(21,25);
 * var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
 * var icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', size, offset);
 * markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(0,0),icon));
 * markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(0,0),icon.clone()));
 *
 * (end)
 *
 * Note that if you pass an icon into the Marker constructor, it will take
 * that icon and use it. This means that you should not share icons between
 * markers -- you use them once, but you should clone() for any additional
 * markers using that same icon.
 */
OpenLayers.Marker = OpenLayers.Class({
    
    /** 
     * Property: icon 
     * {<OpenLayers.Icon>} The icon used by this marker.
     */
    icon: null,

    /** 
     * Property: lonlat 
     * {<OpenLayers.LonLat>} location of object
     */
    lonlat: null,
    
    /** 
     * Property: events 
     * {<OpenLayers.Events>} the event handler.
     */
    events: null,
    
    /** 
     * Property: map 
     * {<OpenLayers.Map>} the map this marker is attached to
     */
    map: null,
    
    /** 
     * Constructor: OpenLayers.Marker
     * Parameters:
     * lonlat - {<OpenLayers.LonLat>} the position of this marker
     * icon - {<OpenLayers.Icon>}  the icon for this marker
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
    
    /**
     * APIMethod: destroy
     * Destroy the marker. You must first remove the marker from any 
     * layer which it has been added to, or you will get buggy behavior.
     * (This can not be done within the marker since the marker does not
     * know which layer it is attached to.)
     */
    destroy: function() {
        // erase any drawn features
        this.erase();

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
    * Returns:
    * {DOMElement} A new DOM Image with this marker's icon set at the 
    * location passed-in
    */
    draw: function(px) {
        return this.icon.draw(px);
    }, 

    /** 
    * Method: erase
    * Erases any drawn elements for this marker.
    */
    erase: function() {
        if (this.icon != null) {
            this.icon.erase();
        }
    }, 

    /**
    * Method: moveTo
    * Move the marker to the new location.
    *
    * Parameters:
    * px - {<OpenLayers.Pixel>} the pixel position to move to
    */
    moveTo: function (px) {
        if ((px != null) && (this.icon != null)) {
            this.icon.moveTo(px);
        }           
        this.lonlat = this.map.getLonLatFromLayerPx(px);
    },

    /**
     * APIMethod: isDrawn
     * 
     * Returns:
     * {Boolean} Whether or not the marker is drawn.
     */
    isDrawn: function() {
        var isDrawn = (this.icon && this.icon.isDrawn());
        return isDrawn;   
    },

    /**
     * Method: onScreen
     *
     * Returns:
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
     * Englarges the markers icon by the specified ratio.
     *
     * Parameters:
     * inflate - {float} the ratio to enlarge the marker by (passing 2
     *                   will double the size).
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
     * Method: setUrl
     * Change URL of the Icon Image.
     * 
     * url - {String} 
     */
    setUrl: function(url) {
        this.icon.setUrl(url);
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

    CLASS_NAME: "OpenLayers.Marker"
});


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
    

