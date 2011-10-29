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
     * {HTMLImageElement} The image for this tile.
     */
    imgDiv: null,
    
    /**
     * Property: frame
     * {DOMElement} The image element is appended to the frame.  Any gutter on
     * the image will be hidden behind the frame. 
     */ 
    frame: null, 

    /** 
     * Property: imageReloadAttempts
     * {Integer} Attempts to load the image.
     */
    imageReloadAttempts: null,
    
    /**
     * Property: layerAlphaHack
     * {Boolean} True if the png alpha hack needs to be applied on the layer's div.
     */
    layerAlphaHack: null,
    
    /**
     * Property: asyncRequestId
     * {Integer} ID of an request to see if request is still valid. This is a
     * number which increments by 1 for each asynchronous request.
     */
    asyncRequestId: null,
    
    /**
     * Property: blankImageUrl
     * {String} Using a data scheme url is not supported by all browsers, but
     * we don't care because we either set it as css backgroundImage, or the
     * image's display style is set to "none" when we use it.
     */
    blankImageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAQAIBRAA7",

    /**
     * APIProperty: maxGetUrlLength
     * {Number} If set, requests that would result in GET urls with more
     * characters than the number provided will be made using form-encoded
     * HTTP POST. It is good practice to avoid urls that are longer than 2048
     * characters.
     *
     * Caution:
     * Older versions of Gecko based browsers (e.g. Firefox < 3.5) and most
     * Opera versions do not fully support this option. On all browsers,
     * transition effects are not supported if POST requests are used.
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

        this.url = url; //deprecated remove me

        this.frame = document.createElement("div");
        this.frame.style.position = "absolute";
        this.frame.style.overflow = "hidden";
        
        this.layerAlphaHack = this.layer.alpha && OpenLayers.Util.alphaHack();

        if (this.maxGetUrlLength != null) {
            OpenLayers.Util.extend(this, OpenLayers.Tile.Image.IFrame);
        }
    },
    
    /** 
     * APIMethod: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        if (this.frame != null)  {
            this.clear();
            this.imgDiv = null;
            this.frame = null;
        }
        // don't handle async requests any more
        this.asyncRequestId = null;
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * Method: draw
     * Check that a tile should be drawn, and draw it.
     * 
     * Returns:
     * {Boolean} Was a tile drawn?
     */
    draw: function() {
        var drawn = OpenLayers.Tile.prototype.draw.apply(this, arguments);
        if (drawn) {
            if (this.layer != this.layer.map.baseLayer && this.layer.reproject) {
                this.bounds = this.getBoundsFromBaseLayer(this.position);
            }
            if (this.isLoading) {
                //if we're already loading, send 'reload' instead of 'loadstart'.
                this.events.triggerEvent("reload"); 
            } else {
                this.isLoading = true;
                this.events.triggerEvent("loadstart");
            }
            this.positionTile();
            this.renderTile();
        } else {
            this.unload();
        }
        return drawn;
    },
    
    /**
     * Method: renderTile
     * Internal function to actually initialize the image tile,
     *     position it correctly, and set its url.
     */
    renderTile: function() {
        this.layer.div.appendChild(this.frame);
        if (this.layer.async) {
            // Asynchronous image requests call the asynchronous getURL method
            // on the layer to fetch an image that covers 'this.bounds', in the scope of
            // 'this', setting the 'url' property of the layer itself, and running
            // the callback 'initImage' when the image request returns.
            var myId = this.asyncRequestId = (this.asyncRequestId || 0) + 1;
            this.layer.getURLasync(this.bounds, this, "url", function() {
                if (myId == this.asyncRequestId) {
                    this.initImage();
                }
            });
        } else {
            // synchronous image requests get the url immediately.
            this.url = this.layer.getURL(this.bounds);
            this.initImage();
        }
    },

    /**
     * Method: positionTile
     * Using the properties currenty set on the layer, position the tile correctly.
     * This method is used both by the async and non-async versions of the Tile.Image
     * code.
     */
    positionTile: function() {
        var style = this.frame.style;
        style.left = this.position.x + "%";
        style.top = this.position.y + "%";
        style.width = this.size.w + "%";
        style.height = this.size.h + "%";
    },

    /** 
     * Method: clear
     * Remove the tile from the DOM, clear it of any image related data so that
     * it can be reused in a new location.
     */
    clear: function() {
        var img = this.imgDiv;
        if (img) {
            OpenLayers.Event.stopObservingElement(img);
            if (this.frame.parentNode === this.layer.div) {
                this.layer.div.removeChild(this.frame);
            }
            this.setImgSrc();
            if (this.layerAlphaHack === true) {
                img.style.filter = "";
            }
            OpenLayers.Element.removeClass(img, "olImageLoadError");
        }
    },
    
    /**
     * Method: createImage
     * Creates the content for the frame on the tile.
     */
    createImage: function() {
        var img = document.createElement("img");
        this.imgDiv = img;

        img.className = "olTileImage";
        // avoid image gallery menu in IE6
        img.galleryImg = "no";

        var style = img.style,
            gutter = this.layer.gutter;
        if (gutter) {
            var tileSize = this.layer.tileSize,
                left = (gutter / tileSize.w * 100),
                top = (gutter / tileSize.h * 100);
            style.left = -left + "%";
            style.top = -top + "%";
            style.width = (2 * left + 100) + "%";
            style.height = (2 * top + 100) + "%";
            style.position = "absolute";
        } else {
            style.width = "100%";
            style.height = "100%";
        }
        style.display = "none";
        if (this.layer.opacity < 1) {
            OpenLayers.Util.modifyDOMElement(img, null, null, null, null, null,
                null, this.layer.opacity);
        }
        if (this.layerAlphaHack) {
            // move the image out of sight
            style.paddingTop = style.height;
            style.height = "0";
        }

        this.frame.appendChild(img);
        return img;
    },

    /**
     * Method: initImage
     * Creates the content for the frame on the tile.
     */
    initImage: function() {
        var img = this.imgDiv || this.createImage();
        if (this.url && img.getAttribute("src") == this.url) {
            this.onImageLoad();
        } else {
            // We need to start with a blank image, to make sure that no
            // loading image placeholder and no old image is displayed when we
            // set the display style to "" in onImageLoad, which is called
            // after the image is loaded, but before it is rendered. So we set
            // a blank image with a data scheme URI, and register for the load
            // event (for browsers that support data scheme) and the error
            // event (for browsers that don't). In the event handler, we set
            // the final src.
            var load = OpenLayers.Function.bind(function() {
                OpenLayers.Event.stopObservingElement(img);
                OpenLayers.Event.observe(img, "load",
                    OpenLayers.Function.bind(this.onImageLoad, this)
                );
                OpenLayers.Event.observe(img, "error",
                    OpenLayers.Function.bind(this.onImageError, this)
                );
                this.imageReloadAttempts = 0;
                this.setImgSrc(this.url);
            }, this);
            if (img.getAttribute("src") == this.blankImageUrl) {
                load();
            } else {
                OpenLayers.Event.observe(img, "load", load);
                OpenLayers.Event.observe(img, "error", load);
                img.src = this.blankImageUrl;
            }
        }
    },
    
    /**
     * Method: setImgSrc
     * Sets the source for the tile image
     *
     * Parameters:
     * url - {String} or undefined to hide the image
     */
    setImgSrc: function(url) {
        var img = this.imgDiv;
        img.style.display = "none";
        if (url) {
            img.src = url;
        }
    },
    
    /**
     * Method: getTile
     * Get the tile's markup.
     *
     * Returns:
     * {DOMElement} The tile's markup
     */
    getTile: function() {
        return this.frame;
    },

    /**
     * Method: createBackBuffer
     * Create a backbuffer for this tile. A backbuffer isn't exactly a clone
     * of the tile's markup, because we want to avoid the reloading of the
     * image. So we clone the frame, and steal the image from the tile.
     *
     * Returns:
     * {DOMElement} The markup, or undefined if the tile has no image
     * or if it's currently loading.
     */
    createBackBuffer: function() {
        if(!this.imgDiv || this.isLoading) {
            return;
        }
        var backBuffer = this.frame.cloneNode(false);
        backBuffer.appendChild(this.imgDiv);
        this.imgDiv = null;
        return backBuffer;
    },

    /**
     * Method: onImageLoad
     * Handler for the image onload event
     */
    onImageLoad: function() {
        var img = this.imgDiv;
        OpenLayers.Event.stopObservingElement(img);
        img.style.display = "";
        this.isLoading = false;
        this.events.triggerEvent("loadend");

        // IE<7 needs a reflow when the tiles are loaded because of the
        // percentage based positioning. Otherwise nothing is shown
        // until the user interacts with the map in some way.
        if (parseFloat(navigator.appVersion.split("MSIE")[1]) < 7 &&
                this.layer && this.layer.div) {
            var span = document.createElement("span");
            span.style.display = "none";
            var layerDiv = this.layer.div;
            layerDiv.appendChild(span);
            window.setTimeout(function() {
                span.parentNode === layerDiv && span.parentNode.removeChild(span);
            }, 0);
        }

        if (this.layerAlphaHack === true) {
            img.style.filter =
                "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" +
                img.src + "', sizingMethod='scale')";
        }
    },
    
    /**
     * Method: onImageError
     * Handler for the image onerror event
     */
    onImageError: function() {
        var img = this.imgDiv;
        if (img.src != null) {
            this.imageReloadAttempts++;
            if (this.imageReloadAttempts <= OpenLayers.IMAGE_RELOAD_ATTEMPTS) {
                this.setImgSrc(this.layer.getURL(this.bounds));
            } else {
                OpenLayers.Element.addClass(img, "olImageLoadError");
                this.onImageLoad();
            }
        }
    },

    CLASS_NAME: "OpenLayers.Tile.Image"

});
