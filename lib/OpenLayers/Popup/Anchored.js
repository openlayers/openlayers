// @require: OpenLayers/Util.js

/**
* @class
*/
OpenLayers.Popup.Anchored = Class.create();
OpenLayers.Popup.Anchored.prototype =
   Object.extend( new OpenLayers.Popup(), {

    /** 
    * @constructor
    * 
    * @param {String} id
    * @param {OpenLayers.LonLat} lonlat
    * @param {OpenLayers.Size} size
    * @param {String} contentHTML
    */
    initialize:function(id, lonlat, size, contentHTML) {
        OpenLayers.Popup.prototype.initialize.apply(this, arguments);
    },

    /** 
    */
    destroy: function() {
        OpenLayers.Popup.prototype.destroy.apply(this, arguments);
    },

    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @returns Reference to a div that contains the drawn popup
    * @type DOMElement
    */
    draw: function(px) {
        OpenLayers.Popup.prototype.draw.apply(this, arguments);
    },

    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function(px) {
        OpenLayers.Popup.prototype.moveTo.apply(this, arguments);
    },

    CLASS_NAME: "OpenLayers.Popup.Anchored"
});
