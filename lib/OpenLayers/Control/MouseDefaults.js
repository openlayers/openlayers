OpenLayers.Control.MouseDefaults = Class.create();
OpenLayers.Control.MouseDefaults.prototype = 
  Object.extend( new OpenLayers.Control(), {

    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },
    
    draw: function() {
        this.map.events.register( "dblclick", this.map, this.defaultDblClick );
        this.map.events.register( "mousedown", this.map, this.defaultMouseDown );
        this.map.events.register( "mouseup", this.map, this.defaultMouseUp );
        this.map.events.register( "mousemove", this.map, this.defaultMouseMove );
        //this.map.events.register( "mouseout", this.map, this.defaultMouseUp );
    },
    
    /**
    * @param {Event} evt
    */
    defaultDblClick: function (evt) {
        var newCenter = this.getLonLatFromPixel( evt.xy ); 
        this.setCenter(newCenter, this.zoom + 1);
    },

    /**
    * @param {Event} evt
    */
    defaultMouseDown: function (evt) {
        this.mouseDragStart = evt.xy.copyOf();
        if (evt.shiftKey) {
            this.div.style.cursor = "crosshair";
            this.zoomBox = OpenLayers.Util.createDiv('zoomBox');
            this.zoomBox.style.border = '1px solid red';
            this.zoomBox.style.position="absolute";
            this.zoomBox.style.zIndex=1000;
            this.zoomBox.style.top=this.mouseDragStart.y;
            this.zoomBox.style.left=this.mouseDragStart.x;
            this.viewPortDiv.appendChild(this.zoomBox);
        } else {
            this.div.style.cursor = "move";
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
                var size = this.getSize();
                var newXY = new OpenLayers.Pixel(size.w / 2 + deltaX,
                                                 size.h / 2 + deltaY);
                var newCenter = this.getLonLatFromPixel( newXY ); 
                this.setCenter(newCenter);
                this.mouseDragStart = evt.xy.copyOf();
            }
        }
    },

    /**
    * @param {Event} evt
    */
    defaultMouseUp: function (evt) {
        if (this.zoomBox) {
            var start = this.getLonLatFromPixel( this.mouseDragStart ); 
            var end = this.getLonLatFromPixel( evt.xy );
            var top = (start.lat > end.lat ? start.lat : end.lat);
            var bottom = (start.lat < end.lat ? start.lat : end.lat);
            var left = (start.lon < end.lon ? start.lon : end.lon);
            var right = (start.lon > end.lon ? start.lon : end.lon);
            var bounds = new OpenLayers.Bounds(left, bottom, right, top);
            var zoom = this.getZoomForExtent(bounds);
            this.setCenter(new OpenLayers.LonLat(
              (start.lon + end.lon) / 2,
              (start.lat + end.lat) / 2
             ), zoom);
            this.viewPortDiv.removeChild(document.getElementById("zoomBox"));
            this.zoomBox = null;
        }
        this.mouseDragStart = null;
        this.div.style.cursor = "default";
    }

});

