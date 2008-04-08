/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Popup/Anchored.js
 */

/**
 * Class: OpenLayers.Popup.Framed
 * 
 * Inherits from:
 *  - <OpenLayers.Popup.Anchored>
 */
OpenLayers.Popup.Framed =
  OpenLayers.Class(OpenLayers.Popup.Anchored, {

    /**
     * Property: imageSrc
     * {String} location of the image to be used as the popup frame
     */
    imageSrc: null,

    /**
     * Property: imageSize
     * {<OpenLayers.Size>} Size (measured in pixels) of the image located
     *     by the 'imageSrc' property.
     */
    imageSize: null,

    /**
     * APIProperty: isAlphaImage
     * {Boolean} The image has some alpha and thus needs to use the alpha 
     *     image hack. Note that setting this to true will have no noticeable
     *     effect in FF or IE7 browsers, but will all but crush the ie6 
     *     browser. 
     *     Default is false.
     */
    isAlphaImage: false,

    /**
     * Property: positionBlocks
     * {Object} Hash of different position blocks (Object/Hashs). Each block 
     *     will be keyed by a two-character 'relativePosition' 
     *     code string (ie "tl", "tr", "bl", "br"). Block properties are 
     *     'offset', 'padding' (self-explanatory), and finally the 'blocks'
     *     parameter, which is an array of the block objects. 
     * 
     *     Each block object must have 'size', 'anchor', and 'position' 
     *     properties.
     * 
     *     Note that positionBlocks should never be modified at runtime.
     */
    positionBlocks: null,

    /**
     * Property: blocks
     * {Array[Object]} Array of objects, each of which is one "block" of the 
     *     popup. Each block has a 'div' and an 'image' property, both of 
     *     which are DOMElements, and the latter of which is appended to the 
     *     former. These are reused as the popup goes changing positions for
     *     great economy and elegance.
     */
    blocks: null,

    /** 
     * APIProperty: fixedRelativePosition
     * {Boolean} We want the framed popup to work dynamically placed relative
     *     to its anchor but also in just one fixed position. A well designed
     *     framed popup will have the pixels and logic to display itself in 
     *     any of the four relative positions, but (understandably), this will
     *     not be the case for all of them. By setting this property to 'true', 
     *     framed popup will not recalculate for the best placement each time
     *     it's open, but will always open the same way. 
     *     Note that if this is set to true, it is generally advisable to also
     *     set the 'panIntoView' property to true so that the popup can be 
     *     scrolled into view (since it will often be offscreen on open)
     *     Default is false.
     */
    fixedRelativePosition: false,

    /** 
     * Constructor: OpenLayers.Popup.Framed
     * 
     * Parameters:
     * id - {String}
     * lonlat - {<OpenLayers.LonLat>}
     * size - {<OpenLayers.Size>}
     * contentHTML - {String}
     * anchor - {Object} Object to which we'll anchor the popup. Must expose 
     *     a 'size' (<OpenLayers.Size>) and 'offset' (<OpenLayers.Pixel>) 
     *     (Note that this is generally an <OpenLayers.Icon>).
     * closeBox - {Boolean}
     * closeBoxCallback - {Function} Function to be called on closeBox click.
     */
    initialize:function(id, lonlat, size, contentHTML, anchor, closeBox, 
                        closeBoxCallback) {

        OpenLayers.Popup.Anchored.prototype.initialize.apply(this, arguments);

        if (this.fixedRelativePosition) {
            //based on our decided relativePostion, set the current padding
            // this keeps us from getting into trouble 
            this.updateRelativePosition();
            
            //make calculateRelativePosition always returnt the specified
            // fiexed position.
            this.calculateRelativePosition = function(px) {
                return this.relativePosition;
            };
        }

        this.contentDiv.style.position = "absolute";
        this.contentDiv.style.zIndex = 1;

        if (closeBox) {
            this.closeDiv.style.zIndex = 1;
        }

        this.groupDiv.style.position = "absolute";
        this.groupDiv.style.top = "0px";
        this.groupDiv.style.left = "0px";
        this.groupDiv.style.height = "100%";
        this.groupDiv.style.width = "100%";
    },

    /** 
     * APIMethod: destroy
     */
    destroy: function() {
        this.imageSrc = null;
        this.imageSize = null;
        this.isAlphaImage = null;

        this.fixedRelativePosition = false;
        this.positionBlocks = null;

        //remove our blocks
        for(var i = 0; i < this.blocks.length; i++) {
            var block = this.blocks[i];

            if (block.image) {
                block.div.removeChild(block.image);
            }
            block.image = null;

            if (block.div) {
                this.groupDiv.removeChild(block.div);
            }
            block.div = null;
        }
        this.blocks = null;

        OpenLayers.Popup.Anchored.prototype.destroy.apply(this, arguments);
    },

    /**
     * APIMethod: setBackgroundColor
     */
    setBackgroundColor:function(color) {
        //does nothing since the framed popup's entire scheme is based on a 
        // an image -- changing the background color makes no sense. 
    },

    /**
     * APIMethod: setBorder
     */
    setBorder:function() {
        //does nothing since the framed popup's entire scheme is based on a 
        // an image -- changing the popup's border makes no sense. 
    },

    /**
     * Method: setOpacity
     * Sets the opacity of the popup.
     * 
     * Parameters:
     * opacity - {float} A value between 0.0 (transparent) and 1.0 (solid).   
     */
    setOpacity:function(opacity) {
        //does nothing since we suppose that we'll never apply an opacity
        // to a framed popup
    },

    /**
     * APIMethod: setSize
     * Overridden here, because we need to update the blocks whenever the size
     *     of the popup has changed.
     * 
     * Parameters:
     * size - {<OpenLayers.Size>}
     */
    setSize:function(size) { 
        OpenLayers.Popup.Anchored.prototype.setSize.apply(this, arguments);

        this.updateBlocks();
    },

    /**
     * Method: updateRelativePosition
     * When the relative position changes, we need to set the new padding 
     *     BBOX on the popup, reposition the close div, and update the blocks.
     */
    updateRelativePosition: function() {

        //update the padding
        this.padding = this.positionBlocks[this.relativePosition].padding;

        //update the position of our close box to new padding
        if (this.closeDiv) {
            // use the content div's css padding to determine if we should
            //  padd the close div
            var contentDivPadding = this.getContentDivPadding();

            this.closeDiv.style.right = contentDivPadding.right + 
                                        this.padding.right + "px";
            this.closeDiv.style.top = contentDivPadding.top + 
                                      this.padding.top + "px";
        }

        this.updateBlocks();
    },

    /** 
     * Method: calculateNewPx
     * Besides the standard offset as determined by the Anchored class, our 
     *     Framed popups have a special 'offset' property for each of their 
     *     positions, which is used to offset the popup relative to its anchor.
     * 
     * Parameters:
     * px - {<OpenLayers.Pixel>}
     * 
     * Returns:
     * {<OpenLayers.Pixel>} The the new px position of the popup on the screen
     *     relative to the passed-in px.
     */
    calculateNewPx:function(px) {
        var newPx = OpenLayers.Popup.Anchored.prototype.calculateNewPx.apply(
            this, arguments
        );

        newPx = newPx.offset(this.positionBlocks[this.relativePosition].offset);

        return newPx;
    },

    /**
     * Method: createBlocks
     */
    createBlocks: function() {
        this.blocks = [];

        //since all positions contain the same number of blocks, we can 
        // just pick the first position and use its blocks array to create
        // our blocks array
        var firstPosition = null;
        for(var key in this.positionBlocks) {
            firstPosition = key;
            break;
        }
        
        var position = this.positionBlocks[firstPosition];
        for (var i = 0; i < position.blocks.length; i++) {

            var block = {};
            this.blocks.push(block);

            var divId = this.id + '_FrameDecorationDiv_' + i;
            block.div = OpenLayers.Util.createDiv(divId, 
                null, null, null, "absolute", null, "hidden", null
            );

            var imgId = this.id + '_FrameDecorationImg_' + i;
            var imageCreator = 
                (this.isAlphaImage) ? OpenLayers.Util.createAlphaImageDiv
                                    : OpenLayers.Util.createImage;

            block.image = imageCreator(imgId, 
                null, this.imageSize, this.imageSrc, 
                "absolute", null, null, null
            );

            block.div.appendChild(block.image);
            this.groupDiv.appendChild(block.div);
        }
    },

    /**
     * Method: updateBlocks
     * Internal method, called on initialize and when the popup's relative
     *     position has changed. This function takes care of re-positioning
     *     the popup's blocks in their appropropriate places.
     */
    updateBlocks: function() {
        if (!this.blocks) {
            this.createBlocks();
        }
        
        if (this.relativePosition) {
            var position = this.positionBlocks[this.relativePosition];
            for (var i = 0; i < position.blocks.length; i++) {
    
                var positionBlock = position.blocks[i];
                var block = this.blocks[i];
    
                // adjust sizes
                var l = positionBlock.anchor.left;
                var b = positionBlock.anchor.bottom;
                var r = positionBlock.anchor.right;
                var t = positionBlock.anchor.top;
    
                //note that we use the isNaN() test here because if the 
                // size object is initialized with a "auto" parameter, the 
                // size constructor calls parseFloat() on the string, 
                // which will turn it into NaN
                //
                var w = (isNaN(positionBlock.size.w)) ? this.size.w - (r + l) 
                                                      : positionBlock.size.w;
    
                var h = (isNaN(positionBlock.size.h)) ? this.size.h - (b + t) 
                                                      : positionBlock.size.h;
    
                block.div.style.width = w + 'px';
                block.div.style.height = h + 'px';
    
                block.div.style.left = (l != null) ? l + 'px' : '';
                block.div.style.bottom = (b != null) ? b + 'px' : '';
                block.div.style.right = (r != null) ? r + 'px' : '';            
                block.div.style.top = (t != null) ? t + 'px' : '';
    
                block.image.style.left = positionBlock.position.x + 'px';
                block.image.style.top = positionBlock.position.y + 'px';
            }
    
            this.contentDiv.style.left = this.padding.left + "px";
            this.contentDiv.style.top = this.padding.top + "px";
        }
    },

    CLASS_NAME: "OpenLayers.Popup.Framed"
});
