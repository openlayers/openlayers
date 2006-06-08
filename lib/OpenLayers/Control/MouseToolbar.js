// @require: OpenLayers/Control.js
OpenLayers.Control.MouseToolbar = Class.create();
OpenLayers.Control.MouseToolbar.X = 4;
OpenLayers.Control.MouseToolbar.Y = 4;
OpenLayers.Control.MouseToolbar.prototype = 
  Object.extend( new OpenLayers.Control(), {
    
    mode: null,

    buttons: null,

    direction: "vertical",
    
    initialize: function(direction) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        if (direction) {
            this.direction = direction; 
        }
        this.measureDivs = [];
    },
    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        this.buttons = new Object();
        this.map.events.register( "dblclick", this, this.defaultDblClick );
        this.map.events.register( "mousedown", this, this.defaultMouseDown );
        this.map.events.register( "mouseup", this, this.defaultMouseUp );
        this.map.events.register( "mousemove", this, this.defaultMouseMove );
        this.map.events.register( "mouseout", this, this.defaultMouseOut );
        var sz = new OpenLayers.Size(28,28);
        var centered = new OpenLayers.Pixel(12, 300);
        this._addButton("zoombox", "drag-rectangle-off.png", "drag-rectangle-on.png", centered, sz);
        this._addButton("pan", "panning-hand-off.png", "panning-hand-on.png", new OpenLayers.Pixel(12,328), sz);
        this._addButton("measure", "measuring-stick-off.png", "measuring-stick-on.png", new OpenLayers.Pixel(12,356), sz);
        this.switchModeTo("pan");
        this.map.events.register("zoomend", this, function() { this.switchModeTo("pan"); });
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
        btn.events.register("mousedown", this, this.buttonClick); 
        btn.events.register("mouseup", this, this.stopAction); 
        btn.action = id;
        btn.map = this.map;

        //we want to remember/reference the outer div
        this.buttons[id] = btn;
        return btn;
    },

    stopAction: function(evt) {
        Event.stop(evt);
    },

    buttonClick: function(evt) {
        this.switchModeTo(evt.div.action);
        Event.stop(evt);
    },
    
    /**
    * @param {Event} evt
    */
    defaultDblClick: function (evt) {
        this.switchModeTo("pan");
        var newCenter = this.map.getLonLatFromScreenPx( evt.xy ); 
        this.map.setCenter(newCenter, this.map.zoom + 2);
    },

    /**
    * @param {Event} evt
    */
    defaultMouseDown: function (evt) {
        this.mouseDragStart = evt.xy.copyOf();
        if (evt.shiftKey && this.mode !="zoombox") {
            this.switchModeTo("zoombox");
        } else if (evt.altKey && this.mode !="measure") {
            this.switchModeTo("measure");
        } else if (!this.mode) {
            this.switchModeTo("pan");
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
                var distance = "";
                if (this.measureStart) {
                    measureEnd = this.map.getLonLatFromScreenPx(this.mouseDragStart);
                    distance = OpenLayers.Util.distVincenty(this.measureStart, measureEnd);
                    distance = Math.round(distance * 100) / 100;
                    distance = distance + "km";
                    this.measureStartBox = this.measureBox;
                }    
                this.measureStart = this.map.getLonLatFromScreenPx(this.mouseDragStart);;
                this.measureBox = OpenLayers.Util.createDiv(null,
                                                         this.mouseDragStart.add(
                                                           -2-parseInt(this.map.layerContainerDiv.style.left),
                                                           -2-parseInt(this.map.layerContainerDiv.style.top)),
                                                         null,
                                                         null,
                                                         "absolute");
                this.measureBox.style.width="4px";
                this.measureBox.style.height="4px";
                this.measureBox.style.backgroundColor="red";
                this.measureBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
                this.map.layerContainerDiv.appendChild(this.measureBox);
                if (distance) {
                    this.measureBoxDistance = OpenLayers.Util.createDiv(null,
                                                         this.mouseDragStart.add(
                                                           -2-parseInt(this.map.layerContainerDiv.style.left),
                                                           2-parseInt(this.map.layerContainerDiv.style.top)),
                                                         null,
                                                         null,
                                                         "absolute");
                    
                    this.measureBoxDistance.innerHTML = distance;
                    this.measureBoxDistance.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
                    this.map.layerContainerDiv.appendChild(this.measureBoxDistance);
                    this.measureDivs.append(this.measureBoxDistance);
                }
                this.measureBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
                this.map.layerContainerDiv.appendChild(this.measureBox);
                this.measureDivs.append(this.measureBox);
                break;
            default:
                this.map.div.style.cursor = "move";
                break;
        }
        Event.stop(evt);
    },

    switchModeTo: function(mode) {
        if (mode != this.mode) {
            if (this.mode) {
                this.buttons[this.mode].firstChild.src = this.buttons[this.mode].imgLocation;
            }
            if (this.mode == "measure" && mode != "measure") {
                for(var i = 0; i < this.measureDivs.length; i++) {
                    if (this.measureDivs[i]) { 
                        this.map.layerContainerDiv.removeChild(this.measureDivs[i]);
                    }
                }
                this.measureDivs = [];
                this.measureStart = null;
            }
            this.mode = mode;
            this.buttons[mode].firstChild.src = this.buttons[mode].activeImgLocation;
        } 
    }, 

    leaveMode: function() {
        this.switchModeTo("pan");
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
                this.leaveMode();
                break;
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

