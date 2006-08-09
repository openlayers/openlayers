/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Tile.js
/**
* @class
*/
OpenLayers.Tile.Image = Class.create();
OpenLayers.Tile.Image.prototype = 
  Object.extend( new OpenLayers.Tile(), {
    
    /** @type DOMElement img */
    imgDiv: null,

    /** 
    * @constructor
    *
    * @param {OpenLayers.Grid} layer
    * @param {OpenLayers.Pixel} position
    * @param {OpenLayers.Bounds} bounds
    * @param {String} url
    * @param {OpenLayers.Size} size
    */
    initialize: function(layer, position, bounds, url, size) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);
    },

    destroy: function() {
        if ((this.imgDiv != null) && (this.imgDiv.parentNode == this.layer.div)) {
            this.layer.div.removeChild(this.imgDiv);
        }
        this.imgDiv = null;
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
    },

    /**
    */
    draw:function() {
        if (this.layer.alpha) {
            this.imgDiv = OpenLayers.Util.createAlphaImageDiv(null,
                                                           this.position,
                                                           this.size,
                                                           this.url,
                                                           "absolute",
                                                           null,
                                                           null,
                                                           true);
        } else {
            this.imgDiv = OpenLayers.Util.createImage(null,
                                                      this.position,
                                                      this.size,
                                                      this.url,
                                                      "absolute",
                                                      null,
                                                      true);
        }
        this.layer.div.appendChild(this.imgDiv);
    },

    /** Clear the tile of any bounds/position-related data so that it can 
     *   be reused in a new location.
     */
    clear: function() {
        this.imgDiv.style.display = "none";
    },

    /** 
     * @param {OpenLayers.Bounds}
     * @param {OpenLayers.pixel} position
     */
    moveTo: function (bounds, position) {
        this.url = this.layer.getURL(bounds);
        OpenLayers.Tile.prototype.moveTo.apply(this, arguments);
    },

    redraw: function () {
        this.imgDiv.style.display = "none";
        if (this.layer.alpha) {
            OpenLayers.Util.modifyAlphaImageDiv(this.imgDiv,
        			null, this.position, this.size, this.url);
        } else {
            this.imgDiv.src = this.url;
            OpenLayers.Util.modifyDOMElement(this.imgDiv,
        			null, this.position, this.size) ;
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile.Image"
  }
);
