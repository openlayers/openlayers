/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 * 
 * @requires OpenLayers/Control.js
 */
OpenLayers.Control.PanZoom = OpenLayers.Class.create();
OpenLayers.Control.PanZoom.X = 4;
OpenLayers.Control.PanZoom.Y = 4;
OpenLayers.Control.PanZoom.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control, {

    /** @type int */
    slideFactor: 50,

    /** @type Array of Button Divs */
    buttons: null,

    /** @type OpenLayers.Pixel */
    position: null,

    /**
     * @constructor
     */
    initialize: function() {
        this.position = new OpenLayers.Pixel(OpenLayers.Control.PanZoom.X,
                                             OpenLayers.Control.PanZoom.Y);
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /**
     * 
     */
    destroy: function() {
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
        while(this.buttons.length) {
            var btn = this.buttons.shift();
            btn.map = null;
            OpenLayers.Event.stopObservingElement(btn);
        }
        this.buttons = null;
        this.position = null;
    },

    /**
    * @param {OpenLayers.Pixel} px
    * 
    * @returns A reference to the container div for the PanZoom control
    * @type DOMElement
    */
    draw: function(px) {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        px = this.position;

        // place the controls
        this.buttons = new Array();

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
     * @param {String} id
     * @param {String} img
     * @param {OpenLayers.Pixel} xy
     * @param {OpenLayers.Size} sz
     * 
     * @returns A Div (an alphaImageDiv, to be precise) that contains the 
     *          image of the button, and has all the proper event handlers
     *          set.
     * @type DOMElement
     */
    _addButton:function(id, img, xy, sz) {
        var imgLocation = OpenLayers.Util.getImagesLocation() + img;
        var btn = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_PanZoom_" + id, 
                                    xy, sz, imgLocation, "absolute");

        //we want to add the outer div
        this.div.appendChild(btn);

        OpenLayers.Event.observe(btn, "mousedown", 
                                 this.buttonDown.bindAsEventListener(btn));
        OpenLayers.Event.observe(btn, "mouseup", 
                                 this.doubleClick.bindAsEventListener(btn));
        OpenLayers.Event.observe(btn, "dblclick", 
                                 this.doubleClick.bindAsEventListener(btn));
        OpenLayers.Event.observe(btn, "click", 
                                 this.doubleClick.bindAsEventListener(btn));
        btn.action = id;
        btn.map = this.map;
        btn.slideFactor = this.slideFactor;

        //we want to remember/reference the outer div
        this.buttons.push(btn);
        return btn;
    },
    
    /**
     * @param {Event} evt
     * 
     * @type Boolean
     */
    doubleClick: function (evt) {
        OpenLayers.Event.stop(evt);
        return false;
    },
    
    /**
     * @param {Event} evt
     */
    buttonDown: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) return;

        switch (this.action) {
            case "panup": 
                this.map.pan(0, -50);
                break;
            case "pandown": 
                this.map.pan(0, 50);
                break;
            case "panleft": 
                this.map.pan(-50, 0);
                break;
            case "panright": 
                this.map.pan(50, 0);
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

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.PanZoom"
});
