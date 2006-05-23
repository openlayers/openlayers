// @require OpenLayers/Control.js

OpenLayers.Control.KeyboardDefaults = Class.create();
OpenLayers.Control.KeyboardDefaults.prototype = 
  Object.extend( new OpenLayers.Control(), {

    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },
    
    draw: function() {
        Event.observe(document, 'keypress', this.defaultKeyDown.bind(this.map));
    },
    
    /**
    * @param {Event} evt
    */
    defaultKeyDown: function (evt) {
        var i = 0;
        switch(evt.keyCode) {
            case Event.KEY_LEFT:
                var resolution = this.getResolution();
                var center = this.getCenter();
                this.setCenter(
                  new OpenLayers.LonLat(center.lon - (resolution * 50), 
                                        center.lat)
                                       );
                Event.stop(evt);
                break;
            case Event.KEY_RIGHT: 
                var resolution = this.getResolution();
                var center = this.getCenter();
                this.setCenter(
                  new OpenLayers.LonLat(center.lon + (resolution * 50),
                                        center.lat)
                                       );
                Event.stop(evt);
                break;
            case Event.KEY_UP:
                var resolution = this.getResolution();
                var center = this.getCenter();
                this.setCenter(
                  new OpenLayers.LonLat(center.lon, 
                                        center.lat + (resolution * 50))
                                       );
                Event.stop(evt);
                break;
            case Event.KEY_DOWN:
                var resolution = this.getResolution();
                var center = this.getCenter();
                this.setCenter(
                  new OpenLayers.LonLat(center.lon, 
                                        center.lat - (resolution * 50))
                                       );
                Event.stop(evt);
                break;
        }
    }

});
