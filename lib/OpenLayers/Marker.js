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
    
    /** the data object associated with the marker
    * @type Object */
    data: null,
    
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
    * @param {OpenLayers.Pixel} pixel
    * 
    * @return A new DOM Image with this marker´s icon set at the 
    *         location passed-in
    * @type DOMElement
    */
    draw: function(pixel) {
        this.image.style.top = (pixel.y + this.icon.offset.y) + "px"
        this.image.style.left = (pixel.x + this.icon.offset.x) + "px"; 
        return this.image;
    }, 
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Marker"
}
