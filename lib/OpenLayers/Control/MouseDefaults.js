// @require: OpenLayers/Control.js
OpenLayers.Control.MouseDefaults = Class.create();
OpenLayers.Control.MouseDefaults.prototype = 
  Object.extend( new OpenLayers.Control(), {

    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },
    
    draw: function() {
        this.map.events.register( "dblclick", this, this.defaultDblClick );
        this.map.events.register( "mousedown", this, this.defaultMouseDown );
        this.map.events.register( "mouseup", this, this.defaultMouseUp );
        this.map.events.register( "mousemove", this, this.defaultMouseMove );
        this.map.events.register( "mouseout", this, this.defaultMouseOut );
    },
    
    /**
    * @param {Event} evt
    */
    defaultDblClick: function (evt) {
        var newCenter = this.map.getLonLatFromPixel( evt.xy ); 
        this.map.setCenter(newCenter, this.map.zoom + 1);
    },

    /**
    * @param {Event} evt
    */
    defaultMouseDown: function (evt) {
        this.mouseDragStart = evt.xy.copyOf();
        if (evt.shiftKey) {
            this.map.div.style.cursor = "crosshair";
            this.zoomBox = OpenLayers.Util.createDiv('zoomBox');
            this.zoomBox.style.border = '2px solid red';
            this.zoomBox.style.backgroundColor = "white";
            this.zoomBox.style.filter = "alpha(opacity=50)"; // IE
            this.zoomBox.style.opacity = "0.50";
            this.zoomBox.style.position="absolute";
            this.zoomBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
            this.zoomBox.style.top=this.mouseDragStart.y;
            this.zoomBox.style.left=this.mouseDragStart.x;
            this.map.viewPortDiv.appendChild(this.zoomBox);
        } else {
            this.map.div.style.cursor = "move";
        }
        Event.stop(evt);
    },

    /**
    * @param {Event} evt
    */
    defaultMouseMove: function (evt) {
        if (this.mouseDragStart != null) {
            if (this.zoomBox) {
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
            } else {
                var deltaX = this.mouseDragStart.x - evt.xy.x;
                var deltaY = this.mouseDragStart.y - evt.xy.y;
                var size = this.map.getSize();
                var newXY = new OpenLayers.Pixel(size.w / 2 + deltaX,
                                                 size.h / 2 + deltaY);
                var newCenter = this.map.getLonLatFromPixel( newXY ); 
                this.map.setCenter(newCenter);
                this.mouseDragStart = evt.xy.copyOf();
            }
        }
    },

    /**
    * @param {Event} evt
    */
    defaultMouseUp: function (evt) {
        if (this.zoomBox) {
            var start = this.map.getLonLatFromPixel( this.mouseDragStart ); 
            var end = this.map.getLonLatFromPixel( evt.xy );
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

