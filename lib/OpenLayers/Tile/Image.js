/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 * 
 * @requires OpenLayers/Tile.js
 */
OpenLayers.Tile.Image = OpenLayers.Class.create();
OpenLayers.Tile.Image.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Tile, {
    
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

    /**
     * 
     */
    destroy: function() {
        if ((this.imgDiv != null) && (this.imgDiv.parentNode == this.layer.div)) {
            this.layer.div.removeChild(this.imgDiv);
            this.imgDiv.map = null;
        }
        this.imgDiv = null;
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
    },

    /**
     * 
     */
    draw:function() {
        if (this.layer != this.layer.map.baseLayer && this.layer.reproject) {
            this.bounds = this.getBoundsFromBaseLayer(this.position);
        }
        if (!OpenLayers.Tile.prototype.draw.apply(this, arguments)) {
            return false;    
        }
        if (this.imgDiv == null) {
            this.initImgDiv();
        }

        this.imgDiv.viewRequestID = this.layer.map.viewRequestID;
        
        this.url = this.layer.getURL(this.bounds);
  
        if (this.layer.alpha) {
            OpenLayers.Util.modifyAlphaImageDiv(this.imgDiv,
                    null, this.position, this.size, this.url);
        } else {
            this.imgDiv.src = this.url;
            OpenLayers.Util.modifyDOMElement(this.imgDiv,
                    null, this.position, this.size) ;
        }
        this.drawn = true;
        return true;
    },

    /** Clear the tile of any bounds/position-related data so that it can 
     *   be reused in a new location.
     */
    clear: function() {
        OpenLayers.Tile.prototype.clear.apply(this, arguments);
        if(this.imgDiv) {
            this.imgDiv.style.display = "none";
        }
    },

    /** 
     * @param {OpenLayers.Bounds}
     * @param {OpenLayers.pixel} position
     * @param {Boolean} redraw
     */
    moveTo: function (bounds, position, redraw) {
        if (this.layer != this.layer.map.baseLayer && this.layer.reproject) {
            bounds = this.getBoundsFromBaseLayer(position);
        }
        this.url = this.layer.getURL(bounds);
        OpenLayers.Tile.prototype.moveTo.apply(this, arguments);
    },

    /**
     * 
     */
    initImgDiv: function() {
        if (this.layer.alpha) {
            this.imgDiv = OpenLayers.Util.createAlphaImageDiv(null,
                                                           this.position,
                                                           this.size,
                                                           null,
                                                           "absolute",
                                                           null,
                                                           null,
                                                           null,
                                                           true);
        } else {
            this.imgDiv = OpenLayers.Util.createImage(null,
                                                      this.position,
                                                      this.size,
                                                      null,
                                                      "absolute",
                                                      null,
                                                      null,
                                                      true);
        }
        
        this.imgDiv.className = 'olTileImage';

        /* checkImgURL used to be used to called as a work around, but it
           ended up hiding problems instead of solving them and broke things
           like relative URLs. See discussion on the dev list:
           http://openlayers.org/pipermail/dev/2007-January/000205.html

        OpenLayers.Event.observe( this.imgDiv, "load",
                        this.checkImgURL.bindAsEventListener(this) );
        */
        this.layer.div.appendChild(this.imgDiv);
        if(this.layer.opacity != null) {
            
            OpenLayers.Util.modifyDOMElement(this.imgDiv, null, null, null,
                                             null, null, null, 
                                             this.layer.opacity);
        }

        // we need this reference to check back the viewRequestID
        this.imgDiv.map = this.layer.map;

    },

    /**
     * Make sure that the image that just loaded is the one this tile is meant
     * to display, since panning/zooming might have changed the tile's URL in
     * the meantime. If the tile URL did change before the image loaded, set
     * the imgDiv display to 'none', as either (a) it will be reset to visible
     * when the new URL loads in the image, or (b) we don't want to display
     * this tile after all because its new bounds are outside our maxExtent.
     * 
     * This function should no longer  be neccesary with the improvements to
     * Grid.js in OpenLayers 2.3. The lack of a good isEquivilantURL function
     * caused problems in 2.2, but it's possible that with the improved 
     * isEquivilant URL function, this might be neccesary at some point.
     * 
     * See discussion in the thread at 
     * http://openlayers.org/pipermail/dev/2007-January/000205.html
     *
     * @private
     */
    checkImgURL: function () {
        // Sometimes our image will load after it has already been removed
        // from the map, in which case this check is not needed.  
        if (this.layer) {
            var loaded = this.layer.alpha ? this.imgDiv.firstChild.src : this.imgDiv.src;
            if (!OpenLayers.Util.isEquivalentUrl(loaded, this.url)) {
                this.imgDiv.style.display = "none";
            }
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile.Image"
  }
);
