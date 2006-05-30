/**
* @class
*/
OpenLayers.Marker = Class.create();
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
        this.icon = (icon) ? icon : OpenLayers.Marker.defaultIcon();

        this.events = new OpenLayers.Events(this, this.icon.imageDiv, null);
    },
    
    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @return A new DOM Image with this marker´s icon set at the 
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
    

