// @require: OpenLayers/Control/PanZoom.js

//
// default zoom/pan controls
//
OpenLayers.Control.PanZoomBar = Class.create();
OpenLayers.Control.PanZoomBar.X = 4;
OpenLayers.Control.PanZoomBar.Y = 4;
OpenLayers.Control.PanZoomBar.prototype = 
  Object.extend( new OpenLayers.Control.PanZoom(), {
    /** @type Array(...) */
    buttons: null,

    /** @type int */
    zoomStopWidth: 18,

    /** @type int */
    zoomStopHeight: 11,

    initialize: function() {
        OpenLayers.Control.PanZoom.prototype.initialize.apply(this, arguments);
        this.position = new OpenLayers.Pixel(OpenLayers.Control.PanZoomBar.X,
                                             OpenLayers.Control.PanZoomBar.Y);
    },

    /**
    * @param {OpenLayers.Pixel} px
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
        this._addButton("pandown", "south-mini.png", centered.add(0, sz.h*2), sz);
        this._addButton("zoomin", "zoom-plus-mini.png", centered.add(0, sz.h*3), sz);
        centered = centered.add(0, sz.h*4);
        centered = this._addZoomBar(centered,sz.copyOf());
        this._addButton("zoomout", "zoom-minus-mini.png", centered, sz);
        return this.div;
    },
    _addZoomBar:function(centered,sz) {
        var imgLocation = OpenLayers.Util.getImagesLocation();
        
        var zoomStopSize = this.zoomStopHeight;
        var id = "OpenLayers_Control_PanZoomBar_Slider" + this.map.id;
        var slider = OpenLayers.Util.createAlphaImageDiv(id,
                       centered.add(-1, (this.map.getZoomLevels())*zoomStopSize), 
                       new OpenLayers.Size(20,9), 
                       imgLocation+"slider.png",
                       "absolute");
        slider.style.zIndex = this.div.zIndex + 5;
        this.slider = slider;
        
        this.sliderEvents = new OpenLayers.Events(this, slider);
        this.sliderEvents.register("mousedown", this, this.zoomBarDown);
        this.sliderEvents.register("mousemove", this, this.zoomBarDrag);
        this.sliderEvents.register("mouseup", this, this.zoomBarUp);
        this.sliderEvents.register("dblclick", this, this.doubleClick);
        
        sz.h = zoomStopSize*(this.map.getZoomLevels()+1);
        sz.w = this.zoomStopWidth;
        var div = null
        
        if (OpenLayers.Util.alphaHack()) {
            var id = "OpenLayers_Control_PanZoomBar" + this.map.id;
            div = OpenLayers.Util.createAlphaImageDiv(id, centered,
                                      new OpenLayers.Size(sz.w, zoomStopSize),
                                      imgLocation + "zoombar.png", 
                                      "absolute");
            div.style.height = sz.h;
        } else {
            div = OpenLayers.Util.createDiv(
                        'OpenLayers_Control_PanZoomBar_Zoombar' + this.map.id,
                        centered,
                        sz,
                        imgLocation+"zoombar.png");
        }
        
        this.divEvents = new OpenLayers.Events(this, div);
        this.divEvents.register("mousedown", this, this.divClick);
        this.divEvents.register("mousemove", this, this.zoomBarDivDrag);
        this.divEvents.register("dblclick", this, this.doubleClick);
        
        this.div.appendChild(div);

        this.startTop = parseInt(div.style.top);
        this.div.appendChild(slider);

        this.map.events.register("zoomend", this, this.moveZoomBar);

        centered = centered.add(0, zoomStopSize*(this.map.getZoomLevels()+1));
        return centered; 
    },
    divClick: function (evt) {
        var y = evt.xy.y;
        var top = Position.page(evt.object)[1];
        var levels = Math.floor((y - top)/this.zoomStopHeight);
        this.map.zoomTo(this.map.getZoomLevels() - levels);
        Event.stop(evt);
    },
    zoomBarDown:function(evt) {
        this.mouseDragStart = evt.xy.copyOf();
        this.zoomStart = evt.xy.copyOf();
        this.div.style.cursor = "move";
        Event.stop(evt);
    },
    zoomBarDivDrag: function(evt) {
        this.sliderEvents.handleBrowserEvent(evt);
    },
    zoomBarDrag:function(evt) {
        if (this.mouseDragStart != null) {
            var deltaY = this.mouseDragStart.y - evt.xy.y
            this.slider.style.top = (parseInt(this.slider.style.top)-deltaY)+"px";
            this.mouseDragStart = evt.xy.copyOf();
        }
    },
    zoomBarUp:function(evt) {
        this.div.style.cursor="default";
        var deltaY = this.zoomStart.y - evt.xy.y
        this.map.zoomTo(this.map.zoom + Math.round(deltaY/this.zoomStopHeight));
        this.moveZoomBar();
        this.mouseDragStart = null;
        Event.stop(evt);
    },
    moveZoomBar:function() {
        var newTop = 
            (this.map.getZoomLevels() - this.map.getZoom()) * this.zoomStopHeight
            + this.startTop + 1;
        this.slider.style.top = newTop + "px";
    },    
    
    destroy: function() {
        OpenLayers.Control.PanZoom.prototype.destroy.apply(this, arguments);
    }
});
