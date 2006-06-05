// @require: OpenLayers/Control.js
OpenLayers.Control.MouseToolbar = Class.create();
OpenLayers.Control.MouseToolbar.X = 4;
OpenLayers.Control.MouseToolbar.Y = 4;
OpenLayers.Control.MouseToolbar.prototype = 
  Object.extend( new OpenLayers.Control(), {
    
    mode: null,

    buttons: null,
    
    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.mode = null;
    },
    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        this.buttons = new Object();
        this.map.events.register( "dblclick", this, this.defaultDblClick );
        this.map.events.register( "mousedown", this, this.defaultMouseDown );
        this.map.events.register( "mouseup", this, this.defaultMouseUp );
        this.map.events.register( "mousemove", this, this.defaultMouseMove );
        this.map.events.register( "mouseout", this, this.defaultMouseOut );
        var sz = new OpenLayers.Size(18,18);
        var centered = new OpenLayers.Pixel(100, 20);
        this._addButton("zoombox", "west-mini.png", centered, sz);
        this._addButton("zoombox", "west-mini.png", "east-mini.png", centered, sz);
        return this.div;
    },
    
    _addButton:function(id, img, activeImg, xy, sz) {
        var imgLocation = OpenLayers.Util.getImagesLocation() + img;
        var activeImgLocation = OpenLayers.Util.getImagesLocation() + activeImg;
        // var btn = new ol.AlphaImage("_"+id, imgLocation, xy, sz);
        var btn = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_PanZoom_" + id, 
                                    xy, sz, imgLocation, "absolute");

        //we want to add the outer div
        this.div.appendChild(btn);
        btn.imgLocation = imgLocation;
        btn.activeImgLocation = activeImgLocation;
        
        btn.events = new OpenLayers.Events(this, btn);
        btn.events.register("click", this, this.buttonClick); 
        btn.action = id;
        btn.map = this.map;

        //we want to remember/reference the outer div
        this.buttons[id] = btn;
        return btn;
    },

    buttonClick: function(evt) {
        this.switchModeTo(evt.div.action);
        Event.stop(evt);
    },
    
    /**
    * @param {Event} evt
    */
    defaultDblClick: function (evt) {
        var newCenter = this.map.getLonLatFromScreenPx( evt.xy ); 
        this.map.setCenter(newCenter, this.map.zoom + 2);
    },

    /**
    * @param {Event} evt
    */
    defaultMouseDown: function (evt) {
        this.mouseDragStart = evt.xy.copyOf();
        if (evt.shiftKey) {
            this.switchModeTo("zoombox");
        } else if (evt.altKey) {
            this.switchModeTo("measure");
        }
        switch (this.mode) {
            case "zoombox":
                this.map.div.style.cursor = "crosshair";
                this.zoomBox = OpenLayers.Util.createDiv('zoomBox',
                                                         this.mouseDragStart,
                                                         null,
                                                         null,
                                                         "absolute",
                                                         "2px solid red");
                this.zoomBox.style.backgroundColor = "white";
                this.zoomBox.style.filter = "alpha(opacity=50)"; // IE
                this.zoomBox.style.opacity = "0.50";
                this.zoomBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
                this.map.viewPortDiv.appendChild(this.zoomBox);
                break;
            case "measure":
                break;
            default:
                this.map.div.style.cursor = "move";
                break;
        }
        Event.stop(evt);
    },

    switchModeTo: function(mode) {
            console.log('leave mode?'+mode+","+this.mode);
        if (mode != this.mode) {
            this.mode = mode;
            this.buttons[mode].firstChild.src = this.buttons[mode].activeImgLocation;
        } else {
            this.leaveMode();
        }
    }, 

    leaveMode: function() {
        var oldMode = this.mode;
        this.mode = null;
        if (oldMode) {
            this.buttons[oldMode].firstChild.src = this.buttons[oldMode].imgLocation;
        }
    },
    
    /**
    * @param {Event} evt
    */
    defaultMouseMove: function (evt) {
        if (this.mouseDragStart != null) {
            switch (this.mode) {
                case "zoombox": 
                    var deltaX = Math.abs(this.mouseDragStart.x - evt.xy.x);
                    var deltaY = Math.abs(this.mouseDragStart.y - evt.xy.y);
                    this.zoomBox.style.width = deltaX+"px";
                    this.zoomBox.style.height = deltaY+"px";
                    if (evt.xy.x < this.mouseDragStart.x) {
                        this.zoomBox.style.left = evt.xy.x+"px";
                    }
                    if (evt.xy.y < this.mouseDragStart.y) {
                        this.zoomBox.style.top = evt.xy.y+"px";
                    }
                    break;
                default:
                    var deltaX = this.mouseDragStart.x - evt.xy.x;
                    var deltaY = this.mouseDragStart.y - evt.xy.y;
                    var size = this.map.getSize();
                    var newXY = new OpenLayers.Pixel(size.w / 2 + deltaX,
                                                     size.h / 2 + deltaY);
                    var newCenter = this.map.getLonLatFromScreenPx( newXY ); 
                    this.map.setCenter(newCenter);
                    this.mouseDragStart = evt.xy.copyOf();
            }
        }
    },

    /**
    * @param {Event} evt
    */
    defaultMouseUp: function (evt) {
        switch (this.mode) {
            case "zoombox":
                var start = this.map.getLonLatFromScreenPx( this.mouseDragStart ); 
                var end = this.map.getLonLatFromScreenPx( evt.xy );
                var top = Math.max(start.lat, end.lat);
                var bottom = Math.min(start.lat, end.lat);
                var left = Math.min(start.lon, end.lon);
                var right = Math.max(start.lon, end.lon);
                var bounds = new OpenLayers.Bounds(left, bottom, right, top);
                var zoom = this.map.getZoomForExtent(bounds);
                this.map.setCenter(new OpenLayers.LonLat(
                  (start.lon + end.lon) / 2,
                  (start.lat + end.lat) / 2
                 ), zoom);
                this.map.viewPortDiv.removeChild(document.getElementById("zoomBox"));
                this.zoomBox = null;
                break;
        }
        if (this.mouseDragStart) {
            this.leaveMode();
        }
        this.mouseDragStart = null;
        this.map.div.style.cursor = "default";
    },

    defaultMouseOut: function (evt) {
        if (this.mouseDragStart != null
            && OpenLayers.Util.mouseLeft(evt, this.map.div)) {
                this.defaultMouseUp(evt);
        }
    }
});

