/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.PanZoom
 * The PanZoom is a visible control, composed of a
 * <OpenLayers.Control.PanPanel> and a <OpenLayers.Control.ZoomPanel>. By
 * default it is drawn in the upper left corner of the map.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.PanZoom = OpenLayers.Class(OpenLayers.Control, {

    /** 
     * APIProperty: slideFactor
     * {Integer} Number of pixels by which we'll pan the map in any direction 
     *     on clicking the arrow buttons.  If you want to pan by some ratio
     *     of the map dimensions, use <slideRatio> instead.
     */
    slideFactor: 50,

    /** 
     * APIProperty: slideRatio
     * {Number} The fraction of map width/height by which we'll pan the map            
     *     on clicking the arrow buttons.  Default is null.  If set, will
     *     override <slideFactor>. E.g. if slideRatio is .5, then the Pan Up
     *     button will pan up half the map height. 
     */
    slideRatio: null,

    /** 
     * Property: buttons
     * {Array(DOMElement)} Array of Button Divs 
     */
    buttons: null,

    /** 
     * Property: position
     * {<OpenLayers.Pixel>} 
     */
    position: null,

    /**
     * Constructor: OpenLayers.Control.PanZoom
     * 
     * Parameters:
     * options - {Object}
     */
    initialize: function(options) {
        this.position = new OpenLayers.Pixel(OpenLayers.Control.PanZoom.X,
                                             OpenLayers.Control.PanZoom.Y);
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /**
     * APIMethod: destroy
     */
    destroy: function() {
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
        this.removeButtons();
        this.buttons = null;
        this.position = null;
    },

    /**
     * Method: draw
     *
     * Parameters:
     * px - {<OpenLayers.Pixel>} 
     * 
     * Returns:
     * {DOMElement} A reference to the container div for the PanZoom control.
     */
    draw: function(px) {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        px = this.position;

        // place the controls
        this.buttons = [];

        var sz = new OpenLayers.Size(18,18);
        var centered = new OpenLayers.Pixel(px.x+sz.w/2, px.y);

        this._addButton("panup", "north-mini.png", centered, sz);
        px.y = centered.y+sz.h;
        this._addButton("panleft", "west-mini.png", px, sz);
        this._addButton("panright", "east-mini.png", px.add(sz.w, 0), sz);
        this._addButton("pandown", "south-mini.png", 
                        centered.add(0, sz.h*2), sz);
        this._addButton("zoomin", "zoom-plus-mini.png", 
                        centered.add(0, sz.h*3+5), sz);
        this._addButton("zoomworld", "zoom-world-mini.png", 
                        centered.add(0, sz.h*4+5), sz);
        this._addButton("zoomout", "zoom-minus-mini.png", 
                        centered.add(0, sz.h*5+5), sz);
        return this.div;
    },
    
    /**
     * Method: _addButton
     * 
     * Parameters:
     * id - {String} 
     * img - {String} 
     * xy - {<OpenLayers.Pixel>} 
     * sz - {<OpenLayers.Size>} 
     * 
     * Returns:
     * {DOMElement} A Div (an alphaImageDiv, to be precise) that contains the
     *     image of the button, and has all the proper event handlers set.
     */
    _addButton:function(id, img, xy, sz) {
        var imgLocation = OpenLayers.Util.getImagesLocation() + img;
        var btn = OpenLayers.Util.createAlphaImageDiv(
                                    this.id + "_" + id, 
                                    xy, sz, imgLocation, "absolute");

        //we want to add the outer div
        this.div.appendChild(btn);

        OpenLayers.Event.observe(btn, "mousedown", 
            OpenLayers.Function.bindAsEventListener(this.buttonDown, btn));
        OpenLayers.Event.observe(btn, "dblclick", 
            OpenLayers.Function.bindAsEventListener(this.doubleClick, btn));
        OpenLayers.Event.observe(btn, "click", 
            OpenLayers.Function.bindAsEventListener(this.doubleClick, btn));
        btn.action = id;
        btn.map = this.map;
    
        if(!this.slideRatio){
            var slideFactorPixels = this.slideFactor;
            var getSlideFactor = function() {
                return slideFactorPixels;
            };
        } else {
            var slideRatio = this.slideRatio;
            var getSlideFactor = function(dim) {
                return this.map.getSize()[dim] * slideRatio;
            };
        }

        btn.getSlideFactor = getSlideFactor;

        //we want to remember/reference the outer div
        this.buttons.push(btn);
        return btn;
    },
    
    /**
     * Method: _removeButton
     * 
     * Parameters:
     * btn - {Object}
     */
    _removeButton: function(btn) {
        OpenLayers.Event.stopObservingElement(btn);
        btn.map = null;
        btn.getSlideFactor = null;
        this.div.removeChild(btn);
        OpenLayers.Util.removeItem(this.buttons, btn);
    },
    
    /**
     * Method: removeButtons
     */
    removeButtons: function() {
        for(var i=this.buttons.length-1; i>=0; --i) {
            this._removeButton(this.buttons[i]);
        }
    },
    
    /**
     * Method: doubleClick
     *
     * Parameters:
     * evt - {Event} 
     *
     * Returns:
     * {Boolean}
     */
    doubleClick: function (evt) {
        OpenLayers.Event.stop(evt);
        return false;
    },
    
    /**
     * Method: buttonDown
     *
     * Parameters:
     * evt - {Event} 
     */
    buttonDown: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }

        switch (this.action) {
            case "panup": 
                this.map.pan(0, -this.getSlideFactor("h"));
                break;
            case "pandown": 
                this.map.pan(0, this.getSlideFactor("h"));
                break;
            case "panleft": 
                this.map.pan(-this.getSlideFactor("w"), 0);
                break;
            case "panright": 
                this.map.pan(this.getSlideFactor("w"), 0);
                break;
            case "zoomin": 
                this.map.zoomIn(); 
                break;
            case "zoomout": 
                this.map.zoomOut(); 
                break;
            case "zoomworld": 
                this.map.zoomToMaxExtent(); 
                break;
        }

        OpenLayers.Event.stop(evt);
    },

    CLASS_NAME: "OpenLayers.Control.PanZoom"
});

/**
 * Constant: X
 * {Integer}
 */
OpenLayers.Control.PanZoom.X = 4;

/**
 * Constant: Y
 * {Integer}
 */
OpenLayers.Control.PanZoom.Y = 4;
