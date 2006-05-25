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
    
    /** @type Object */
    data: null,
    
    /** @type DOMElement */
    image: null,
    
    /** 
    * @constructor
    *
    * @param {OpenLayers.Icon} icon
    * @param {OpenLayers.LonLat lonlat
    */
    initialize: function(lonlat, icon) {
        this.icon = icon;
        this.lonlat = lonlat;
        this.image = OpenLayers.Util.createImage(this.icon.url,
                                                 this.icon.size,
                                                 null,
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
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Marker"
}
