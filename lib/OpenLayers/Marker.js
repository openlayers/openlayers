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
    
    /** @type DOMElement */
    image: null,
    
    /** 
    * @constructor
    *
    * @param {OpenLayers.Icon} icon
    * @param {OpenLayers.LonLat lonlat
    */
    initialize: function(lonlat, icon) {
        this.lonlat = lonlat;

        this.icon = (icon) ? icon : this.defaultIcon();

        this.image = OpenLayers.Util.createAlphaImageDiv(null,
                                                 null,
                                                 this.icon.size,
                                                 this.icon.url,
                                                 "absolute"
                                                );
        this.events = new OpenLayers.Events(this, this.image, null);
    },
    
    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @return A new DOM Image with this marker´s icon set at the 
    *         location passed-in
    * @type DOMElement
    */
    draw: function(px) {
        this.moveTo(px);
        return this.image;
    }, 

    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function (px) {
        if ((px != null) && (this.image != null)) {
            this.image.style.top = (px.y + this.icon.offset.y) + "px"
            this.image.style.left = (px.x + this.icon.offset.x) + "px"; 
        }
    },

    /** 
     * @returns A default OpenLayers.Icon to use for a marker
     * @type OpenLayers.Icon
     */
    defaultIcon: function() {
        var url = OpenLayers.Util.getImagesLocation() + "marker.png";
        var size = new OpenLayers.Size(21, 25);
        var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);

        return new OpenLayers.Icon(url, size, offset);        
    }
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Marker"
}
