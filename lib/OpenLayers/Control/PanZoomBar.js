/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class 
 * 
 * @requires OpenLayers/Control/PanZoom.js
 */
OpenLayers.Control.PanZoomBar = OpenLayers.Class.create();
OpenLayers.Control.PanZoomBar.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control.PanZoom, {

    /** @type int */
    zoomStopWidth: 18,

    /** @type int */
    zoomStopHeight: 11,

    /** @type DOMElement */
    slider: null,

    /** @type OpenLayers.Events */
    sliderEvents: null,

    /** @type DOMElement */
    zoomBarDiv: null,

    /** @type OpenLayers.Events */
    divEvents: null,

    initialize: function() {
        OpenLayers.Control.PanZoom.prototype.initialize.apply(this, arguments);
    },

    /**
     * 
     */
    destroy: function() {

        this.div.removeChild(this.slider);
        this.slider = null;

        this.sliderEvents.destroy();
        this.sliderEvents = null;
        
        this.div.removeChild(this.zoombarDiv);
        this.zoomBarDiv = null;

        this.divEvents.destroy();
        this.divEvents = null;

        this.map.events.unregister("zoomend", this, this.moveZoomBar);
        this.map.events.unregister("changebaselayer", this, this.redraw)

        OpenLayers.Control.PanZoom.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        OpenLayers.Control.PanZoom.prototype.setMap.apply(this, arguments);
        this.map.events.register("changebaselayer", this, this.redraw);
    },

    /** clear the div and start over.
     * 
     */
    redraw: function() {
        if (this.div != null) {
            this.div.innerHTML = "";
        }  
        this.draw();
    },
    
    /**
    * @param {OpenLayers.Pixel} px
    */
    draw: function(px) {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        px = this.position.clone();

        // place the controls
        this.buttons = new Array();

        var sz = new OpenLayers.Size(18,18);
        var centered = new OpenLayers.Pixel(px.x+sz.w/2, px.y);

        this._addButton("panup", "north-mini.png", centered, sz);
        px.y = centered.y+sz.h;
        this._addButton("panleft", "west-mini.png", px, sz);
        this._addButton("panright", "east-mini.png", px.add(sz.w, 0), sz);
        this._addButton("pandown", "south-mini.png", centered.add(0, sz.h*2), sz);
        this._addButton("zoomin", "zoom-plus-mini.png", centered.add(0, sz.h*3+5), sz);
        centered = this._addZoomBar(centered.add(0, sz.h*4 + 5));
        this._addButton("zoomout", "zoom-minus-mini.png", centered, sz);
        return this.div;
    },

    /** 
    * @param {OpenLayers.Pixel} location where zoombar drawing is to start.
    */
    _addZoomBar:function(centered) {
        var imgLocation = OpenLayers.Util.getImagesLocation();
        
        var id = "OpenLayers_Control_PanZoomBar_Slider" + this.map.id;
        var zoomsToEnd = this.map.getNumZoomLevels() - 1 - this.map.getZoom();
        var slider = OpenLayers.Util.createAlphaImageDiv(id,
                       centered.add(-1, zoomsToEnd * this.zoomStopHeight), 
                       new OpenLayers.Size(20,9), 
                       imgLocation+"slider.png",
                       "absolute");
        this.slider = slider;
        
        this.sliderEvents = new OpenLayers.Events(this, slider, null, true);
        this.sliderEvents.register("mousedown", this, this.zoomBarDown);
        this.sliderEvents.register("mousemove", this, this.zoomBarDrag);
        this.sliderEvents.register("mouseup", this, this.zoomBarUp);
        this.sliderEvents.register("dblclick", this, this.doubleClick);
        this.sliderEvents.register("click", this, this.doubleClick);
        
        sz = new OpenLayers.Size();
        sz.h = this.zoomStopHeight * this.map.getNumZoomLevels();
        sz.w = this.zoomStopWidth;
        var div = null
        
        if (OpenLayers.Util.alphaHack()) {
            var id = "OpenLayers_Control_PanZoomBar" + this.map.id;
            div = OpenLayers.Util.createAlphaImageDiv(id, centered,
                                      new OpenLayers.Size(sz.w, 
                                              this.zoomStopHeight),
                                      imgLocation + "zoombar.png", 
                                      "absolute", null, "crop");
            div.style.height = sz.h;
        } else {
            div = OpenLayers.Util.createDiv(
                        'OpenLayers_Control_PanZoomBar_Zoombar' + this.map.id,
                        centered,
                        sz,
                        imgLocation+"zoombar.png");
        }
        
        this.zoombarDiv = div;
        
        this.divEvents = new OpenLayers.Events(this, div, null, true);
        this.divEvents.register("mousedown", this, this.divClick);
        this.divEvents.register("mousemove", this, this.passEventToSlider);
        this.divEvents.register("dblclick", this, this.doubleClick);
        this.divEvents.register("click", this, this.doubleClick);
        
        this.div.appendChild(div);

        this.startTop = parseInt(div.style.top);
        this.div.appendChild(slider);

        this.map.events.register("zoomend", this, this.moveZoomBar);

        centered = centered.add(0, 
            this.zoomStopHeight * this.map.getNumZoomLevels());
        return centered; 
    },
    /* 
     * @param evt
     * This function is used to pass events that happen on the div, or the map,
     * through to the slider, which then does its moving thing.
     */
    passEventToSlider:function(evt) {
        this.sliderEvents.handleBrowserEvent(evt);
    },
    
    /*
     * divClick: Picks up on clicks directly on the zoombar div
     *           and sets the zoom level appropriately.
     */
    divClick: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) return;
        var y = evt.xy.y;
        var top = OpenLayers.Util.pagePosition(evt.object)[1];
        var levels = Math.floor((y - top)/this.zoomStopHeight);
        this.map.zoomTo((this.map.getNumZoomLevels() -1) -  levels);
        OpenLayers.Event.stop(evt);
    },
    
    /* 
     * @param evt
     * event listener for clicks on the slider
     */
    zoomBarDown:function(evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) return;
        this.map.events.register("mousemove", this, this.passEventToSlider);
        this.map.events.register("mouseup", this, this.passEventToSlider);
        this.mouseDragStart = evt.xy.clone();
        this.zoomStart = evt.xy.clone();
        this.div.style.cursor = "move";
        // reset the div offsets just in case the div moved
        this.zoombarDiv.offsets = null; 
        OpenLayers.Event.stop(evt);
    },
    
    /*
     * @param evt
     * This is what happens when a click has occurred, and the client is dragging.
     * Here we must ensure that the slider doesn't go beyond the bottom/top of the 
     * zoombar div, as well as moving the slider to its new visual location
     */
    zoomBarDrag:function(evt) {
        if (this.mouseDragStart != null) {
            var deltaY = this.mouseDragStart.y - evt.xy.y
            var offsets = OpenLayers.Util.pagePosition(this.zoombarDiv);
            if ((evt.clientY - offsets[1]) > 0 && 
                (evt.clientY - offsets[1]) < parseInt(this.zoombarDiv.style.height) - 2) {
                var newTop = parseInt(this.slider.style.top) - deltaY;
                this.slider.style.top = newTop+"px";
            }
            this.mouseDragStart = evt.xy.clone();
            OpenLayers.Event.stop(evt);
        }
    },
    
    /* 
     * @param evt
     * Perform cleanup when a mouseup event is received -- discover new zoom level
     * and switch to it.
     */
    zoomBarUp:function(evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) return;
        if (this.zoomStart) {
            this.div.style.cursor="";
            this.map.events.unregister("mouseup", this, this.passEventToSlider);
            this.map.events.unregister("mousemove", this, this.passEventToSlider);
            var deltaY = this.zoomStart.y - evt.xy.y
            this.map.zoomTo(this.map.zoom + Math.round(deltaY/this.zoomStopHeight));
            this.moveZoomBar();
            this.mouseDragStart = null;
            OpenLayers.Event.stop(evt);
        }
    },
    
    /* 
    * Change the location of the slider to match the current zoom level.
    */
    moveZoomBar:function() {
        var newTop = 
            ((this.map.getNumZoomLevels()-1) - this.map.getZoom()) * 
            this.zoomStopHeight + this.startTop + 1;
        this.slider.style.top = newTop + "px";
    },    
    
    CLASS_NAME: "OpenLayers.Control.PanZoomBar"
});
