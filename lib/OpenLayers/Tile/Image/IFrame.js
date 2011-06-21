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
 * configured with <OpenLayers.Tile.Image.allowPost> or
 * <OpenLayers.Tile.Image.enforcePost> set to true.
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
     * Method: clear
     * Removes the iframe from DOM (avoids back-button problems).
     */
    clear: function() {
        if (this.useIFrame) {
            if (this.imgDiv) {
                var iFrame = this.imgDiv.firstChild;
                OpenLayers.Event.stopObservingElement(iFrame);
                this.imgDiv.removeChild(iFrame);
                delete iFrame;
            }
        } else {
            OpenLayers.Tile.Image.prototype.clear.apply(this, arguments);
        }
    },

    /**
     * Method: renderTile
     */
     renderTile: function() {
        if (OpenLayers.Tile.Image.prototype.renderTile.apply(this, arguments) &&
                                                            this.useIFrame) {
            // create a html form and add it temporary to the layer div
            var form = this.createRequestForm();
            this.imgDiv.appendChild(form);

            // submit the form (means fetching the image)
            form.submit();
            this.imgDiv.removeChild(form);
            delete form;
        }
        return true;
    },

    /**
     * Method: initImgDiv
     * Creates the imgDiv property on the tile.
     */
    initImgDiv: function() {
        this.useIFrame = this.maxGetUrlLength !== null && !this.layer.async &&
            this.url.length > this.maxGetUrlLength;
        if (this.imgDiv != null) {
            var nodeName = this.imgDiv.nodeName.toLowerCase();
            if ((this.useIFrame && nodeName == "img") ||
                                        (!this.useIFrame && nodeName == "div")) {
                // switch between get and post
                this.removeImgDiv();
                this.imgDiv = null;
            }
        }
        if (this.useIFrame) {
            if (this.imgDiv == null) {
                var eventPane = document.createElement("div");

                if(OpenLayers.BROWSER_NAME == "msie") {
                    // IE cannot handle events on elements without backgroundcolor.
                    // So we use this little hack to make elements transparent
                    eventPane.style.backgroundColor = '#FFFFFF';
                    eventPane.style.filter          = 'chroma(color=#FFFFFF)';
                }

                OpenLayers.Util.modifyDOMElement(eventPane, null,
                    new OpenLayers.Pixel(0,0), this.layer.getImageSize(), "absolute");

                this.imgDiv = document.createElement("div");
                this.imgDiv.appendChild(eventPane);

                OpenLayers.Util.modifyDOMElement(this.imgDiv, this.id, null,
                    this.layer.getImageSize(), "relative");
                this.imgDiv.className = 'olTileImage';

                this.frame.appendChild(this.imgDiv); 
                this.layer.div.appendChild(this.frame); 

                if(this.layer.opacity != null) {

                    OpenLayers.Util.modifyDOMElement(this.imgDiv, null, null,
                                                     null, null, null, null, 
                                                     this.layer.opacity);
                }

                // we need this reference to check back the viewRequestID
                this.imgDiv.map = this.layer.map;
            }
            this.imgDiv.viewRequestID = this.layer.map.viewRequestID;

        } else {
            OpenLayers.Tile.Image.prototype.initImgDiv.apply(this, arguments);
        }
    },

    /**
     * Method: createIFrame
     * Create the IFrame which shows the image.
     *
     * Returns:
     * {DOMElement} Iframe
     */
    createIFrame: function() {
        var id = this.id+'_iFrame';
        var iframe;
        if(OpenLayers.BROWSER_NAME == "msie") {
            // InternetExplorer does not set the name attribute of an iFrame 
            // properly via DOM manipulation, so we need to do it on our own with
            // this hack.
            iframe = document.createElement('<iframe name="'+id+'">');

            // IFrames in InternetExplorer are not transparent, if you set the
            // backgroundColor transparent. This is a workarround to get 
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
        iframe.id = id;

        // some special properties to avoid scaling the images and scrollbars 
        // in the iframe
        iframe.scrolling             = 'no';
        iframe.marginWidth           = '0px';
        iframe.marginHeight          = '0px';
        iframe.frameBorder           = '0';

        OpenLayers.Util.modifyDOMElement(iframe, id, 
            new OpenLayers.Pixel(0,0), this.layer.getImageSize(), "absolute");

        //bind a listener to the onload of the iframe so that we
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
        OpenLayers.Event.observe(iframe, 'load',
            OpenLayers.Function.bind(onload, this));

        return iframe;
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

        // insert the iframe, which has been removed to avoid back-button
        // problems
        this.imgDiv.insertBefore(this.createIFrame(), this.imgDiv.firstChild);

        form.target = this.id+'_iFrame';

        // adding all parameters in layer params as hidden fields to the html
        // form element
        var imageSize = this.layer.getImageSize();
        var params = OpenLayers.Util.getParameters(this.url);
            
        for(var par in params) {
            var field = document.createElement('input');
            field.type  = 'hidden';
            field.name  = par;
            field.value = params[par];
            form.appendChild(field);
        }   

        return form;
    }
};

