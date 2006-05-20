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
        this.map.events.register( "mouseout", this.map, this.defaultMouseUp );
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
        this.div.style.cursor = "move";
        Event.stop(evt);
    },

    /**
    * @param {Event} evt
    */
    defaultMouseMove: function (evt) {
        if (this.mouseDragStart != null) {
            var deltaX = this.mouseDragStart.x - evt.xy.x;
            var deltaY = this.mouseDragStart.y - evt.xy.y
            var size = this.getSize();
            var newXY = new OpenLayers.Pixel(size.w / 2 + deltaX,
                                             size.h / 2 + deltaY);
            var newCenter = this.getLonLatFromPixel( newXY ); 
            this.setCenter(newCenter);
            this.mouseDragStart = evt.xy.copyOf();
        }
    },

    /**
    * @param {Event} evt
    */
    defaultMouseUp: function (evt) {
        this.mouseDragStart = null;
        this.div.style.cursor = "default";
    }

});

