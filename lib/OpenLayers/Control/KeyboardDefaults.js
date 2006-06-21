// @require: OpenLayers/Control.js

/**
 * @class
 */
OpenLayers.Control.KeyboardDefaults = Class.create();
OpenLayers.Control.KeyboardDefaults.prototype = 
  Object.extend( new OpenLayers.Control(), {

    /**
     * @constructor
     */
    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * 
     */
    draw: function() {
        Event.observe(document, 
                      'keypress', 
                      this.defaultKeyDown.bind(this.map));
    },
    
    /**
    * @param {Event} evt
    */
    defaultKeyDown: function (evt) {

        var resolution = this.getResolution();
        var center = this.getCenter();
    
        var newCenter = center.copyOf();

        switch(evt.keyCode) {
            case Event.KEY_LEFT:
                newCenter.add( -(resolution * 50), 0);
                break;
            case Event.KEY_RIGHT: 
                newCenter.add( (resolution * 50), 0);
                break;
            case Event.KEY_UP:
                newCenter.add( 0, (resolution * 50));
                break;
            case Event.KEY_DOWN:
                newCenter.add( 0, -(resolution * 50));
                break;
        }
        
        if (!newCenter.equals(center)) {
            this.setCenter(newCenter);
            Event.stop(evt);
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.KeyboardDefaults"
});
