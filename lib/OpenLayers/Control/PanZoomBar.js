// @require OpenLayers/Control/PanZoom.js

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
        /*** THIS METHOD IS A HAIRBALL AND SHOULD BE REFACTORED ***/
        var zoomStopSize = this.zoomStopHeight;
        var slider = OpenLayers.Util.createImage("img/slider.png",
                       new OpenLayers.Pixel(20,9), 
                       centered.add(-1, (this.map.getZoomLevels())*zoomStopSize), "absolute",
                       "OpenLayers_Control_PanZoomBar_Slider");
        sz.h = zoomStopSize*(this.map.getZoomLevels()+1);
        sz.w = this.zoomStopWidth;

        var div = OpenLayers.Util.createDiv('OpenLayers_Control_PanZoomBar_Zoombar',centered,sz);
        div.style.backgroundImage = "url(img/zoombar.png)";
        div.onmousedown = this.divClick.bindAsEventListener(div);
        div.ondblclick  = this.doubleClick.bindAsEventListener(div);
        div.slider = slider;
        div.getMousePosition = this.getMousePosition;
        div.map = this.map;
        div.div = this.div;
        this.div.appendChild(div);

        slider.startTop = parseInt(div.style.top);
        slider.getMousePosition = this.getMousePosition;
        slider.onmousedown = this.zoomBarDown.bindAsEventListener(slider);
        slider.onmousemove = this.zoomBarDrag.bindAsEventListener(slider);
        slider.onmouseup   = this.zoomBarUp.bindAsEventListener(slider);
        slider.ondblclick  = this.doubleClick.bindAsEventListener(slider);
        slider.div = this.div;
        slider.map = this.map;
        slider.zoomStopHeight = this.zoomStopHeight;
        slider.moveZoomBar = this.moveZoomBar;
        slider.zIndex = this.div.zIndex + 5;
        this.div.appendChild(slider);
        this.buttons.append(slider);

        this.map.events.register("zoomend", slider, this.moveZoomBar);

        centered = centered.add(0, zoomStopSize*(this.map.getZoomLevels()+1));
        return centered; 
    },
    divClick: function (evt) {
        evt.xy = this.getMousePosition(evt);
        var y = evt.xy.y;
        var top = this.style.top;
        var levels = Math.floor((y - parseInt(top))/this.zoomStopHeight);
        this.map.zoomTo(this.map.getZoomLevels() - levels);
        Event.stop(evt);
    },
    getMousePosition: function (evt) {
        var offsets = Position.page(this.div); 
        return new OpenLayers.Pixel(
                        evt.clientX - offsets[0], 
                        evt.clientY - offsets[1]); 
    },
    zoomBarDown:function(evt) {
        evt.xy = this.getMousePosition(evt);
        this.mouseDragStart = evt.xy.copyOf();
        this.zoomStart = evt.xy.copyOf();
        this.div.style.cursor = "move";
        Event.stop(evt);
    },
    zoomBarDivDrag: function(evt) {
        this.slider.onmousemove(evt);
    },
    zoomBarDrag:function(evt) {
        if (this.mouseDragStart != null) {
            evt.xy = this.getMousePosition(evt);
            var deltaY = this.mouseDragStart.y - evt.xy.y
            this.style.top = (parseInt(this.style.top)-deltaY)+"px";
            this.mouseDragStart = evt.xy.copyOf();
        }
    },
    zoomBarUp:function(evt) {
        evt.xy = this.getMousePosition(evt);
        var deltaY = this.zoomStart.y - evt.xy.y
        this.map.zoomTo(this.map.zoom + Math.round(deltaY/this.zoomStopHeight));
        this.moveZoomBar();
        this.div.style.cursor="default";
        this.mouseDragStart = null;
        Event.stop(evt);
    },
    moveZoomBar:function() {
        /*** `this` is actually slider... that should be fixed at some point */
        var newTop = 
            (this.map.getZoomLevels() - this.map.getZoom()) * this.zoomStopHeight
            + this.startTop + 1;
        this.style.top = newTop + "px";
    },    
    
    destroy: function() {
        OpenLayers.Control.PanZoom.prototype.destroy.apply(this, arguments);
    }
});
