// @require: core/util.js
// @require: core/alphaImage.js

//
// default zoom/pan controls
//
OpenLayers.Control.PanZoomBar = Class.create();
OpenLayers.Control.PanZoomBar.prototype = 
  Object.extend( new OpenLayers.Control(), {
    // Array(...)
    buttons: null,

    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    draw: function() {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this);

        // place the controls
        this.buttons = new Array();

        var sz = new OpenLayers.Size(18,18);
        var xy = new OpenLayers.Pixel(4,4);
        var centered = new OpenLayers.Pixel(xy.x+sz.w/2, xy.y);

        this._addButton("panup", "north-mini.png", centered, sz);
        xy.y = centered.y+sz.h;
        this._addButton("panleft", "west-mini.png", xy, sz);
        this._addButton("panright", "east-mini.png", xy.add(sz.w, 0), sz);
        this._addButton("pandown", "south-mini.png", centered.add(0, sz.h*2), sz);
        this._addButton("zoomin", "zoom-plus-mini.png", centered.add(0, sz.h*3), sz);
        centered = centered.add(0, sz.h*4);
        centered = this._addZoomBar(centered,sz.copyOf());
        this._addButton("zoomout", "zoom-minus-mini.png", centered, sz);
        return this.div;
    },
    _addZoomBar:function(centered,sz) {
        var zoomStopSize = 15;
        var slider = OpenLayers.Util.createImage("img/slider.png",
                       new OpenLayers.Pixel(22,9), 
                       centered.add(0, (this.map.getZoomLevels())*zoomStopSize), "absolute",
                       "OpenLayers_Control_PanZoomBar_Slider");
        sz.h = zoomStopSize*(this.map.getZoomLevels()+1);
        sz.w = 17;
        var div = OpenLayers.Util.createDiv('OpenLayers_Control_PanZoomBar_Zoombar',centered,sz);
        div.style.backgroundImage = "url(img/zoombar.png)";
        div.onmousedown  = this.doubleClick.bindAsEventListener(div);
        div.onmousemove  = this.zoomBarDivDrag.bindAsEventListener(div);
        div.ondblclick  = this.doubleClick.bindAsEventListener(div);
        div.slider = slider;
        this.div.appendChild(div);
        slider.startTop = div.style.top;
        slider.getMousePosition = this.getMousePosition;
        slider.onmousedown = this.zoomBarDown.bindAsEventListener(slider);
        slider.onmousemove = this.zoomBarDrag.bindAsEventListener(slider);
        slider.onmouseup   = this.zoomBarUp.bindAsEventListener(slider);
        slider.ondblclick  = this.doubleClick.bindAsEventListener(slider);
        slider.div = this.div;
        slider.map = this.map;
        slider.zIndex = this.div.zIndex + 5;
        this.div.appendChild(slider);
        this.buttons.append(slider);
        centered = centered.add(0, zoomStopSize*(this.map.getZoomLevels()+1));
        return centered; 
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
        this.map.zoomTo(this.map.zoom + Math.round(deltaY/15));
        this.style.top = (this.map.getZoomLevels() - this.map.getZoom())*15+
                          parseInt(document.getElementById("OpenLayers_Control_PanZoomBar_Zoombar").style.top) + 3;
        this.div.style.cursor="default";
        this.mouseDragStart = null;
        Event.stop(evt);
    },
    _addButton:function(id, img, xy, sz) {
        var imgLocation = OpenLayers.Util.getImagesLocation() + img;
        // var btn = new ol.AlphaImage("_"+id, imgLocation, xy, sz);
        var btn = OpenLayers.Util.createImage(
                    imgLocation, sz, xy, "absolute", 
                    "OpenLayers_Control_PanZoomBar_" + id );

        //we want to add the outer div
        this.div.appendChild(btn);

        btn.onmousedown = this.buttonDown.bindAsEventListener(btn);
        btn.ondblclick  = this.doubleClick.bindAsEventListener(btn);
        btn.action = id;
        btn.map = this.map;

        //we want to remember/reference the outer div
        this.buttons.push(btn);
        return btn;
    },
    
    doubleClick: function (evt) {
        Event.stop(evt);
    },
    
    buttonDown: function (evt) {
        switch (this.action) {
            case "panup": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LatLon(center.lat + (resolution * 50), 
                                        center.lon
                                       )
                                  );
                break;
            case "pandown": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LatLon(center.lat - (resolution * 50), 
                                        center.lon
                                       )
                                  );
                break;
            case "panleft": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LatLon(center.lat, 
                                        center.lon - (resolution * 50)
                                       )
                                  );
                break;
            case "panright": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LatLon(center.lat, 
                                        center.lon + (resolution * 50)
                                       )
                                  );
                break;
            case "zoomin": this.map.zoomIn(); break;
            case "zoomout": this.map.zoomOut(); break;
            case "zoomextents": this.map.zoomExtent(); break;
        }
        Event.stop(evt);
    },
    destroy: function() {
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
        for(i=0; i<this.buttons.length; i++) {
            this.buttons[i].map = null;
        }
    }
});
