/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Tile.js
 */

/**
 * Class: OpenLayers.Tile.Image
 * Instances of OpenLayers.Tile.Image are used to manage the image tiles
 * used by various layers.  Create a new image tile with the
 * <OpenLayers.Tile.Image> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Tile>
 */
OpenLayers.Tile.Image = OpenLayers.Class(OpenLayers.Tile, {

    /** 
     * Property: url
     * {String} The URL of the image being requested. No default. Filled in by
     * layer.getURL() function. 
     */
    url: null,
    
    /** 
     * Property: imgDiv
     * {DOMElement} The div element which wraps the image.
     */
    imgDiv: null,

    /**
     * Property: frame
     * {DOMElement} The image element is appended to the frame.  Any gutter on
     * the image will be hidden behind the frame. 
     */ 
    frame: null, 

    
    /**
     * Property: layerAlphaHack
     * {Boolean} True if the png alpha hack needs to be applied on the layer's div.
     */
    layerAlphaHack: null,

    /** TBD 3.0 - reorder the parameters to the init function to remove 
     *             URL. the getUrl() function on the layer gets called on 
     *             each draw(), so no need to specify it here.
     * 
     * Constructor: OpenLayers.Tile.Image
     * Constructor for a new <OpenLayers.Tile.Image> instance.
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer>} layer that the tile will go in.
     * position - {<OpenLayers.Pixel>}
     * bounds - {<OpenLayers.Bounds>}
     * url - {<String>} Deprecated. Remove me in 3.0.
     * size - {<OpenLayers.Size>}
     */   
    initialize: function(layer, position, bounds, url, size) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);

        this.url = url; //deprecated remove me
        
        this.frame = document.createElement('div'); 
        this.frame.style.overflow = 'hidden'; 
        this.frame.style.position = 'absolute'; 

        this.layerAlphaHack = this.layer.alpha && OpenLayers.Util.alphaHack();
    },

    /** 
     * APIMethod: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        if (this.imgDiv != null)  {
            if (this.layerAlphaHack) {
                OpenLayers.Event.stopObservingElement(this.imgDiv.childNodes[0].id);                
            } else {
                OpenLayers.Event.stopObservingElement(this.imgDiv.id);
            }
            if (this.imgDiv.parentNode == this.frame) {
                this.frame.removeChild(this.imgDiv);
                this.imgDiv.map = null;
            }
        }
        this.imgDiv = null;
        if ((this.frame != null) && (this.frame.parentNode == this.layer.div)) { 
            this.layer.div.removeChild(this.frame); 
        }
        this.frame = null; 
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
    },

    /**
     * Method: clone
     *
     * Parameters:
     * obj - {<OpenLayers.Tile.Image>} The tile to be cloned
     *
     * Returns:
     * {<OpenLayers.Tile.Image>} An exact clone of this <OpenLayers.Tile.Image>
     */
    clone: function (obj) {
        if (obj == null) {
            obj = new OpenLayers.Tile.Image(this.layer, 
                                            this.position, 
                                            this.bounds, 
                                            this.url, 
                                            this.size);        
        } 
        
        //pick up properties from superclass
        obj = OpenLayers.Tile.prototype.clone.apply(this, [obj]);
        
        //dont want to directly copy the image div
        obj.imgDiv = null;
            
        
        return obj;
    },
    
    /**
     * Method: draw
     * Check that a tile should be drawn, and draw it.
     * 
     * Returns:
     * {Boolean} Always returns true.
     */
    draw: function() {
        if (this.layer != this.layer.map.baseLayer && this.layer.reproject) {
            this.bounds = this.getBoundsFromBaseLayer(this.position);
        }
        if (!OpenLayers.Tile.prototype.draw.apply(this, arguments)) {
            return false;    
        }
        
        if (this.isLoading) {
            //if we're already loading, send 'reload' instead of 'loadstart'.
            this.events.triggerEvent("reload"); 
        } else {
            this.isLoading = true;
            this.events.triggerEvent("loadstart");
        }
        
        return this.renderTile();
    },
    
    /**
     * Method: renderTile
     * Internal function to actually initialize the image tile,
     *     position it correctly, and set its url.
     */
    renderTile: function() {
        if (this.imgDiv == null) {
            this.initImgDiv();
        }

        this.imgDiv.viewRequestID = this.layer.map.viewRequestID;
        
        this.url = this.layer.getURL(this.bounds);
        // position the frame 
        OpenLayers.Util.modifyDOMElement(this.frame, 
                                         null, this.position, this.size);   

        var imageSize = this.layer.getImageSize(); 
        if (this.layerAlphaHack) {
            OpenLayers.Util.modifyAlphaImageDiv(this.imgDiv,
                    null, null, imageSize, this.url);
        } else {
            OpenLayers.Util.modifyDOMElement(this.imgDiv,
                    null, null, imageSize) ;
            this.imgDiv.src = this.url;
        }
        return true;
    },

    /** 
     * Method: clear
     *  Clear the tile of any bounds/position-related data so that it can 
     *   be reused in a new location.
     */
    clear: function() {
        if(this.imgDiv) {
            this.hide();
            if (OpenLayers.Tile.Image.useBlankTile) { 
                this.imgDiv.src = OpenLayers.Util.getImagesLocation() + "blank.gif";
            }    
        }
    },

    /**
     * Method: initImgDiv
     * Creates the imgDiv property on the tile.
     */
    initImgDiv: function() {
        
        var offset = this.layer.imageOffset; 
        var size = this.layer.getImageSize(); 
     
        if (this.layerAlphaHack) {
            this.imgDiv = OpenLayers.Util.createAlphaImageDiv(null,
                                                           offset,
                                                           size,
                                                           null,
                                                           "relative",
                                                           null,
                                                           null,
                                                           null,
                                                           true);
        } else {
            this.imgDiv = OpenLayers.Util.createImage(null,
                                                      offset,
                                                      size,
                                                      null,
                                                      "relative",
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
            OpenLayers.Function.bind(this.checkImgURL, this) );
        */
        this.frame.style.zIndex = this.isBackBuffer ? 0 : 1;
        this.frame.appendChild(this.imgDiv); 
        this.layer.div.appendChild(this.frame); 

        if(this.layer.opacity != null) {
            
            OpenLayers.Util.modifyDOMElement(this.imgDiv, null, null, null,
                                             null, null, null, 
                                             this.layer.opacity);
        }

        // we need this reference to check back the viewRequestID
        this.imgDiv.map = this.layer.map;

        //bind a listener to the onload of the image div so that we 
        // can register when a tile has finished loading.
        var onload = function() {
            
            //normally isLoading should always be true here but there are some 
            // right funky conditions where loading and then reloading a tile
            // with the same url *really*fast*. this check prevents sending 
            // a 'loadend' if the msg has already been sent
            //
            if (this.isLoading) { 
                this.isLoading = false; 
                this.events.triggerEvent("loadend"); 
            }
        };
        
        if (this.layerAlphaHack) { 
            OpenLayers.Event.observe(this.imgDiv.childNodes[0], 'load', 
                                     OpenLayers.Function.bind(onload, this));    
        } else { 
            OpenLayers.Event.observe(this.imgDiv, 'load', 
                                 OpenLayers.Function.bind(onload, this)); 
        } 
        

        // Bind a listener to the onerror of the image div so that we
        // can registere when a tile has finished loading with errors.
        var onerror = function() {

            // If we have gone through all image reload attempts, it is time
            // to realize that we are done with this image. Since
            // OpenLayers.Util.onImageLoadError already has taken care about
            // the error, we can continue as if the image was loaded
            // successfully.
            if (this.imgDiv._attempts > OpenLayers.IMAGE_RELOAD_ATTEMPTS) {
                onload.call(this);
            }
        };
        OpenLayers.Event.observe(this.imgDiv, "error",
                                 OpenLayers.Function.bind(onerror, this));
    },

    /**
     * Method: checkImgURL
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
     */
    checkImgURL: function () {
        // Sometimes our image will load after it has already been removed
        // from the map, in which case this check is not needed.  
        if (this.layer) {
            var loaded = this.layerAlphaHack ? this.imgDiv.firstChild.src : this.imgDiv.src;
            if (!OpenLayers.Util.isEquivalentUrl(loaded, this.url)) {
                this.hide();
            }
        }
    },
    
    /**
     * Method: startTransition
     * This method is invoked on tiles that are backBuffers for tiles in the
     *     grid.  The grid tile is about to be cleared and a new tile source
     *     loaded.  This is where the transition effect needs to be started
     *     to provide visual continuity.
     */
    startTransition: function() {
        // backBufferTile has to be valid and ready to use
        if (!this.backBufferTile || !this.backBufferTile.imgDiv) {
            return;
        }

        // calculate the ratio of change between the current resolution of the
        // backBufferTile and the layer.  If several animations happen in a
        // row, then the backBufferTile will scale itself appropriately for
        // each request.
        var ratio = 1;
        if (this.backBufferTile.resolution) {
            ratio = this.backBufferTile.resolution / this.layer.getResolution();
        }
        
        // if the ratio is not the same as it was last time (i.e. we are
        // zooming), then we need to adjust the backBuffer tile
        if (ratio != this.lastRatio) {
            if (this.layer.transitionEffect == 'resize') {
                // In this case, we can just immediately resize the 
                // backBufferTile.
                var upperLeft = new OpenLayers.LonLat(
                    this.backBufferTile.bounds.left, 
                    this.backBufferTile.bounds.top
                );
                var size = new OpenLayers.Size(
                    this.backBufferTile.size.w * ratio,
                    this.backBufferTile.size.h * ratio
                );

                var px = this.layer.map.getLayerPxFromLonLat(upperLeft);
                OpenLayers.Util.modifyDOMElement(this.backBufferTile.frame, 
                                                 null, px, size);
                var imageSize = this.backBufferTile.imageSize;
                imageSize = new OpenLayers.Size(imageSize.w * ratio, 
                                                imageSize.h * ratio);
                var imageOffset = this.backBufferTile.imageOffset;
                if(imageOffset) {
                    imageOffset = new OpenLayers.Pixel(
                        imageOffset.x * ratio, imageOffset.y * ratio
                    );
                }

                OpenLayers.Util.modifyDOMElement(
                    this.backBufferTile.imgDiv, null, imageOffset, imageSize
                ) ;

                this.backBufferTile.show();
            }
        } else {
            // default effect is just to leave the existing tile
            // until the new one loads if this is a singleTile and
            // there was no change in resolution.  Otherwise we
            // don't bother to show the backBufferTile at all
            if (this.layer.singleTile) {
                this.backBufferTile.show();
            } else {
                this.backBufferTile.hide();
            }
        }
        this.lastRatio = ratio;

    },
    
    /** 
     * Method: show
     * Show the tile by showing its frame.
     */
    show: function() {
        this.frame.style.display = '';
        // Force a reflow on gecko based browsers to actually show the element
        // before continuing execution.
        if (OpenLayers.Util.indexOf(this.layer.SUPPORTED_TRANSITIONS, 
                this.layer.transitionEffect) != -1) {
            if (navigator.userAgent.toLowerCase().indexOf("gecko") != -1) { 
                this.frame.scrollLeft = this.frame.scrollLeft; 
            } 
        }
    },
    
    /** 
     * Method: hide
     * Hide the tile by hiding its frame.
     */
    hide: function() {
        this.frame.style.display = 'none';
    },
    
    CLASS_NAME: "OpenLayers.Tile.Image"
  }
);

OpenLayers.Tile.Image.useBlankTile = ( 
    OpenLayers.Util.getBrowserName() == "safari" || 
    OpenLayers.Util.getBrowserName() == "opera"); 
