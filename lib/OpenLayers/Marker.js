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
    
    /** @type */
    events: null,
    
    /** @type OpenLayers.Map */
    map: null,
    
    object: null,
    
    events:null,
    
    /** 
    * @param {OpenLayers.Icon} icon
    * @param {OpenLayers.LonLat lonlat
    */
    initialize: function(icon, lonlat) {
        this.icon = icon;
        this.lonlat = lonlat;
        this.object = OpenLayers.Util.createImage(
            this.icon.url,
            this.icon.size
        );
        this.events = new OpenLayers.Events(this, this.object, null);
        this.events.register("click", this, this.onclick );
    },
    
    /** 
    * @param {OpenLayers.Pixel} pixel
    * 
    * @return A new DOM Image with this marker´s icon set at the 
    *         location passed-in
    * @type DOMElement
    */
    generateMarker: function(pixel) {
        // Create a div here, and set the location to the pixel above modified
        // by the icon size.
        this.object.style.top = (pixel.y+this.icon.offset.y) + "px"
        this.object.style.left = (pixel.x+this.icon.offset.x) + "px"; 
        this.object.onclick = this.onclick;
        return this.object;
    }, 
    onclick: function(evt) {
        alert('onclick');
    }
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Marker"
}
