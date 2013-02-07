/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Tile/Image.js
 */

/**
 * Constant: OpenLayers.Tile.Image.IFrame
 * Mixin for tiles that use form-encoded POST requests to get images from
 * remote services. Images will be loaded using HTTP-POST into an IFrame.
 *
 * This mixin will be applied to <OpenLayers.Tile.Image> instances
 * configured with <OpenLayers.Tile.Image.maxGetUrlLength> set.
 */
OpenLayers.Tile.Image.IFrame = {

    /**
     * Property: useIFrame
     * {Boolean} true if we are currently using an IFrame to render POST
     * responses, false if we are using an img element to render GET responses.
     */ 
    useIFrame: null,

    /**
     * Property: blankImageUrl
     * {String} Using a data scheme url is not supported by all browsers, but
     * we don't care because we either set it as css backgroundImage, or the
     * image's display style is set to "none" when we use it.
     */
    blankImageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAQAIBRAA7",

    /**
     * Method: draw
     * Set useIFrame in the instance, and operate the image/iframe switch.
     * Then call Tile.Image.draw.
     *
     * Returns:
     * {Boolean}
     */
    draw: function() {
        var draw = OpenLayers.Tile.Image.prototype.shouldDraw.call(this);
        if(draw) {

            // this.url isn't set to the currect value yet, so we call getURL
            // on the layer and store the result in a local variable
            var url = this.layer.getURL(this.bounds);

            var usedIFrame = this.useIFrame;
            this.useIFrame = this.maxGetUrlLength !== null &&
                             !this.layer.async &&
                             url.length > this.maxGetUrlLength;

            var fromIFrame = usedIFrame && !this.useIFrame;
            var toIFrame = !usedIFrame && this.useIFrame;

            if(fromIFrame || toIFrame) {

                // Switching between GET (image) and POST (iframe).

                // We remove the imgDiv (really either an image or an iframe)
                // from the frame and set it to null to make sure initImage
                // will call getImage.

                if(this.imgDiv && this.imgDiv.parentNode === this.frame) {
                    this.frame.removeChild(this.imgDiv);
                }
                this.imgDiv = null;

                // And if we had an iframe we also remove the event pane.

                if(fromIFrame) {
                    this.frame.removeChild(this.frame.firstChild);
                }
            }
        }
        return OpenLayers.Tile.Image.prototype.draw.apply(this, arguments);
    },

    /**
     * Method: getImage
     * Creates the content for the frame on the tile.
     */
    getImage: function() {
        if (this.useIFrame === true) {
            if (!this.frame.childNodes.length) {
                var eventPane = document.createElement("div"),
                    style = eventPane.style;
                style.position = "absolute";
                style.width = "100%";
                style.height = "100%";
                style.zIndex = 1;
                style.backgroundImage = "url(" + this.blankImageUrl + ")";
                this.frame.appendChild(eventPane);
            }

            var id = this.id + '_iFrame', iframe;
            if (parseFloat(navigator.appVersion.split("MSIE")[1]) < 9) {
                // Older IE versions do not set the name attribute of an iFrame 
                // properly via DOM manipulation, so we need to do it on our own with
                // this hack.
                iframe = document.createElement('<iframe name="'+id+'">');

                // IFrames in older IE versions are not transparent, if you set
                // the backgroundColor transparent. This is a workaround to get 
                // transparent iframes.
                iframe.style.backgroundColor = '#FFFFFF';
                iframe.style.filter          = 'chroma(color=#FFFFFF)';
            }
            else {
                iframe = document.createElement('iframe');
                iframe.style.backgroundColor = 'transparent';

                // iframe.name needs to be an unique id, otherwise it 
                // could happen that other iframes are overwritten.
                iframe.name = id;
            }

            // some special properties to avoid scaling the images and scrollbars 
            // in the iframe
            iframe.scrolling      = 'no';
            iframe.marginWidth    = '0px';
            iframe.marginHeight   = '0px';
            iframe.frameBorder    = '0';

            iframe.style.position = "absolute";
            iframe.style.width    = "100%";
            iframe.style.height   = "100%";

            if (this.layer.opacity < 1) {
                OpenLayers.Util.modifyDOMElement(iframe, null, null, null,
                    null, null, null, this.layer.opacity);
            }
            this.frame.appendChild(iframe);
            this.imgDiv = iframe;
            return iframe;
        } else {
            return OpenLayers.Tile.Image.prototype.getImage.apply(this, arguments);
        }
    },
    
    /**
     * Method: createRequestForm
     * Create the html <form> element with width, height, bbox and all 
     * parameters specified in the layer params.
     *
     * Returns: 
     * {DOMElement} The form element which sends the HTTP-POST request to the
     *              WMS. 
     */
    createRequestForm: function() {
        // creation of the form element
        var form = document.createElement('form');
        form.method = 'POST';
        var cacheId = this.layer.params["_OLSALT"];
        cacheId = (cacheId ? cacheId + "_" : "") + this.bounds.toBBOX();
        form.action = OpenLayers.Util.urlAppend(this.layer.url, cacheId);
        form.target = this.id + '_iFrame';

        // adding all parameters in layer params as hidden fields to the html
        // form element
        var imageSize = this.layer.getImageSize(),
            params = OpenLayers.Util.getParameters(this.url),
            field;
            
        for(var par in params) {
            field = document.createElement('input');
            field.type  = 'hidden';
            field.name  = par;
            field.value = params[par];
            form.appendChild(field);
        }   

        return form;
    },

    /**
     * Method: setImgSrc
     * Sets the source for the tile image
     *
     * Parameters:
     * url - {String}
     */
    setImgSrc: function(url) {
        if (this.useIFrame === true) {
            if (url) {
                var form = this.createRequestForm();
                this.frame.appendChild(form);
                form.submit();
                this.frame.removeChild(form);
            } else if (this.imgDiv.parentNode === this.frame) {
                // we don't reuse iframes to avoid caching issues
                this.frame.removeChild(this.imgDiv);
                this.imgDiv = null;
            }
        } else {
            OpenLayers.Tile.Image.prototype.setImgSrc.apply(this, arguments);
        }
    },
    
    /**
     * Method: onImageLoad
     * Handler for the image onload event
     */
    onImageLoad: function() {
        //TODO de-uglify opacity handling
        OpenLayers.Tile.Image.prototype.onImageLoad.apply(this, arguments);
        if (this.useIFrame === true) {
            this.imgDiv.style.opacity = 1;
            this.frame.style.opacity = this.layer.opacity;
        }
    },

    /**
     * Method: createBackBuffer
     * Override createBackBuffer to do nothing when we use an iframe. Moving an
     * iframe from one element to another makes it necessary to reload the iframe
     * because its content is lost. So we just give up.
     *
     * Returns:
     * {DOMElement}
     */
    createBackBuffer: function() {
        var backBuffer;
        if(this.useIFrame === false) {
            backBuffer = OpenLayers.Tile.Image.prototype.createBackBuffer.call(this);
        }
        return backBuffer;
    }
};
