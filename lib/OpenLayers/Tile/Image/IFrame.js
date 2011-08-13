/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
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
 *
 * Inherits from:
 *  - <OpenLayers.Tile.Image>
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
     * {String} This is only used as background image for the eventPane, so we
     * don't care that this doesn't actually result in a blank image on all
     * browsers
     */
    blankImageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAQAIBRAA7",

    /**
    * Method: updateBackBuffer
    * Update the <backBufferData>, and return a new or reposition the
    * backBuffer. When a backbuffer is returned, the tile's markup is not
    * available any more.
    *
    * Returns:
    * {HTMLDivElement} the tile's markup in a cloned element, or undefined if
    *     no backbuffer is currently available or needed
     */
    updateBackBuffer: function() {
        this.url = this.layer.getURL(this.bounds);
        var usedIFrame = this.useIFrame;
        this.useIFrame = this.maxGetUrlLength !== null && !this.layer.async &&
            this.url.length > this.maxGetUrlLength;
        var fromIFrame = usedIFrame && !this.useIFrame;
        var toIFrame = !usedIFrame && this.useIFrame;
        if (fromIFrame || toIFrame) {
            // switch between get (image) and post (iframe)
            this.clear();
            if (this.imgDiv && this.imgDiv.parentNode === this.frame) {
                this.frame.removeChild(this.imgDiv);
            }
            this.imgDiv = null;
            if (fromIFrame) {
                // remove eventPane
                this.frame.removeChild(this.frame.firstChild);
                this.resetBackBuffer();
            }
        }
        if (!this.useIFrame) {
            OpenLayers.Tile.Image.prototype.updateBackBuffer.apply(this, arguments);
        }
    },
    
    /**
     * Method: createImage
     * Creates the content for the frame on the tile.
     */
    createImage: function() {
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
            return OpenLayers.Tile.Image.prototype.createImage.apply(this, arguments);
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
                this.frame.appendChild(this.imgDiv);
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
    }

};