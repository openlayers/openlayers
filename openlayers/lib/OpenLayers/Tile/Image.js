/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
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
    
    /**
     * Property: isBackBuffer
     * {Boolean} Is this tile a back buffer tile?
     */
    isBackBuffer: false,
    
    /**
     * Property: isFirstDraw
     * {Boolean} Is this the first time the tile is being drawn?
     *     This is used to force resetBackBuffer to synchronize
     *     the backBufferTile with the foreground tile the first time
     *     the foreground tile loads so that if the user zooms
     *     before the layer has fully loaded, the backBufferTile for
     *     tiles that have been loaded can be used.
     */
    isFirstDraw: true,
        
    /**
     * Property: backBufferTile
     * {<OpenLayers.Tile>} A clone of the tile used to create transition
     *     effects when the tile is moved or changes resolution.
     */
    backBufferTile: null,
    
    /**
     * APIProperty: maxGetUrlLength
     * {Number} If set, requests that would result in GET urls with more
     * characters than the number provided will be made using form-encoded
     * HTTP POST. It is good practice to avoid urls that are longer than 2048
     * characters.
     *
     * Caution:
     * Older versions of Gecko based browsers (e.g. Firefox < 3.5) and
     * Opera < 10.0 do not fully support this option.
     *
     * Note:
     * Do not use this option for layers that have a transitionEffect
     * configured - IFrame tiles from POST requests can not be resized.
     */
    maxGetUrlLength: null,
    
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
     * options - {Object}
     */   
    initialize: function(layer, position, bounds, url, size, options) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);

        if (this.maxGetUrlLength != null) {
            OpenLayers.Util.extend(this, OpenLayers.Tile.Image.IFrame);
        }

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
            this.removeImgDiv();
        }
        this.imgDiv = null;
        if ((this.frame != null) && (this.frame.parentNode == this.layer.div)) { 
            this.layer.div.removeChild(this.frame); 
        }
        this.frame = null; 
        
        /* clean up the backBufferTile if it exists */
        if (this.backBufferTile) {
            this.backBufferTile.destroy();
            this.backBufferTile = null;
        }
        
        this.layer.events.unregister("loadend", this, this.resetBackBuffer);
        
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
        var drawTile = OpenLayers.Tile.prototype.draw.apply(this, arguments);
        
        if ((OpenLayers.Util.indexOf(this.layer.SUPPORTED_TRANSITIONS, this.layer.transitionEffect) != -1) || 
            this.layer.singleTile) {
            if (drawTile) {
                //we use a clone of this tile to create a double buffer for visual
                //continuity.  The backBufferTile is used to create transition
                //effects while the tile in the grid is repositioned and redrawn
                if (!this.backBufferTile) {
                    this.backBufferTile = this.clone();
                    this.backBufferTile.hide();
                    // this is important.  It allows the backBuffer to place itself
                    // appropriately in the DOM.  The Image subclass needs to put
                    // the backBufferTile behind the main tile so the tiles can
                    // load over top and display as soon as they are loaded.
                    this.backBufferTile.isBackBuffer = true;
                    
                    // potentially end any transition effects when the tile loads
                    this.events.register('loadend', this, this.resetBackBuffer);
                    
                    // clear transition back buffer tile only after all tiles in
                    // this layer have loaded to avoid visual glitches
                    this.layer.events.register("loadend", this, this.resetBackBuffer);
                }
                // run any transition effects
                this.startTransition();
            } else {
                // if we aren't going to draw the tile, then the backBuffer should
                // be hidden too!
                if (this.backBufferTile) {
                    this.backBufferTile.clear();
                }
            }
        } else {
            if (drawTile && this.isFirstDraw) {
                this.events.register('loadend', this, this.showTile);
                this.isFirstDraw = false;
            }   
        }    
        
        if (!drawTile) {
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
     * Method: resetBackBuffer
     * Triggered by two different events, layer loadend, and tile loadend.
     *     In any of these cases, we check to see if we can hide the 
     *     backBufferTile yet and update its parameters to match the 
     *     foreground tile.
     *
     * Basic logic:
     *  - If the backBufferTile hasn't been drawn yet, reset it
     *  - If layer is still loading, show foreground tile but don't hide
     *    the backBufferTile yet
     *  - If layer is done loading, reset backBuffer tile and show 
     *    foreground tile
     */
    resetBackBuffer: function() {
        this.showTile();
        if (this.backBufferTile && 
            (this.isFirstDraw || !this.layer.numLoadingTiles)) {
            this.isFirstDraw = false;
            // check to see if the backBufferTile is within the max extents
            // before rendering it 
            var maxExtent = this.layer.maxExtent;
            var withinMaxExtent = (maxExtent &&
                                   this.bounds.intersectsBounds(maxExtent, false));
            if (withinMaxExtent) {
                this.backBufferTile.position = this.position;
                this.backBufferTile.bounds = this.bounds;
                this.backBufferTile.size = this.size;
                this.backBufferTile.imageSize = this.layer.getImageSize(this.bounds) || this.size;
                this.backBufferTile.imageOffset = this.layer.imageOffset;
                this.backBufferTile.resolution = this.layer.getResolution();
                this.backBufferTile.renderTile();
            }

            this.backBufferTile.hide();
        }
    },
    
    /**
     * Method: renderTile
     * Internal function to actually initialize the image tile,
     *     position it correctly, and set its url.
     */
    renderTile: function() {
        if (this.layer.async) {
            this.initImgDiv();
            // Asyncronous image requests call the asynchronous getURL method
            // on the layer to fetch an image that covers 'this.bounds', in the scope of
            // 'this', setting the 'url' property of the layer itself, and running
            // the callback 'positionFrame' when the image request returns.
            this.layer.getURLasync(this.bounds, this, "url", this.positionImage);
        } else {
            // syncronous image requests get the url and position the frame immediately,
            // and don't wait for an image request to come back.
          
            this.url = this.layer.getURL(this.bounds);

            this.initImgDiv();
          
            // position the frame immediately
            this.positionImage(); 
        }
        return true;
    },

    /**
     * Method: positionImage
     * Using the properties currenty set on the layer, position the tile correctly.
     * This method is used both by the async and non-async versions of the Tile.Image
     * code.
     */
     positionImage: function() {
        // if the this layer doesn't exist at the point the image is
        // returned, do not attempt to use it for size computation
        if (this.layer === null) {
            return;
        }
        // position the frame 
        OpenLayers.Util.modifyDOMElement(this.frame, 
                                          null, this.position, this.size);   

        var imageSize = this.layer.getImageSize(this.bounds); 
        if (this.layerAlphaHack) {
            OpenLayers.Util.modifyAlphaImageDiv(this.imgDiv,
                    null, null, imageSize, this.url);
        } else {
            OpenLayers.Util.modifyDOMElement(this.imgDiv,
                    null, null, imageSize) ;
            this.imgDiv.src = this.url;
        }
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
        if (this.imgDiv == null) {
            var offset = this.layer.imageOffset; 
            var size = this.layer.getImageSize(this.bounds); 

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

            // needed for changing to a different server for onload error
            if (OpenLayers.Util.isArray(this.layer.url)) {
                this.imgDiv.urls = this.layer.url.slice();
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
        }
        
        this.imgDiv.viewRequestID = this.layer.map.viewRequestID;
    },

    /**
     * Method: removeImgDiv
     * Removes the imgDiv from the DOM and stops listening to events on it.
     */
    removeImgDiv: function() {
        // unregister the "load" and "error" handlers. Only the "error" handler if
        // this.layerAlphaHack is true.
        OpenLayers.Event.stopObservingElement(this.imgDiv);
        
        if (this.imgDiv.parentNode == this.frame) {
            this.frame.removeChild(this.imgDiv);
            this.imgDiv.map = null;
        }
        this.imgDiv.urls = null;

        var child = this.imgDiv.firstChild;
        //check for children (alphaHack img or IFrame)
        if (child) {
            OpenLayers.Event.stopObservingElement(child);
            this.imgDiv.removeChild(child);
            delete child;
        } else {
            // abort any currently loading image
            this.imgDiv.src = OpenLayers.Util.getImagesLocation() + "blank.gif";
        }
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
        if (ratio != 1) {
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
            if (OpenLayers.IS_GECKO === true) { 
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
    OpenLayers.BROWSER_NAME == "safari" || 
    OpenLayers.BROWSER_NAME == "opera"); 
