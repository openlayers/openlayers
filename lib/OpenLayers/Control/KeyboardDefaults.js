/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Control.js

/**
 * @class
 */
OpenLayers.Control.KeyboardDefaults = Class.create();
OpenLayers.Control.KeyboardDefaults.prototype = 
  Object.extend( new OpenLayers.Control(), {

    /** @type int */
    slideFactor: 50,

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
                      this.defaultKeyDown.bind(this));
    },
    
    /**
    * @param {Event} evt
    */
    defaultKeyDown: function (evt) {

        var slide = this.map.getResolution() * this.slideFactor;
        var center = this.map.getCenter();
    
        var newCenter = center.copyOf();

        switch(evt.keyCode) {
            case Event.KEY_LEFT:
                newCenter = newCenter.add( -slide, 0);
                break;
            case Event.KEY_RIGHT: 
                newCenter = newCenter.add( slide, 0);
                break;
            case Event.KEY_UP:
                newCenter = newCenter.add( 0, slide);
                break;
            case Event.KEY_DOWN:
                newCenter = newCenter.add( 0, -slide);
                break;
        }
        
        if (!newCenter.equals(center)) {
            this.map.setCenter(newCenter);
            Event.stop(evt);
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.KeyboardDefaults"
});
