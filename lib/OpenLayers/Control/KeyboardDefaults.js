/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Keyboard.js
 * @requires OpenLayers/Events.js
 */

/**
 * Class: OpenLayers.Control.KeyboardDefaults
 * The KeyboardDefaults control adds panning and zooming functions, controlled
 * with the keyboard. By default arrow keys pan, +/- keys zoom & Page Up/Page
 * Down/Home/End scroll by three quarters of a page.
 * 
 * This control has no visible appearance.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.KeyboardDefaults = OpenLayers.Class(OpenLayers.Control, {

    /**
     * APIProperty: autoActivate
     * {Boolean} Activate the control when it is added to a map.  Default is
     *     true.
     */
    autoActivate: true,

    /**
     * APIProperty: slideFactor
     * Pixels to slide by.
     */
    slideFactor: 75,

    /**
     * APIProperty: observeElement
     * {DOMelement|String} The DOM element to handle keys for. You
     *     can use the map div here, to have the navigation keys
     *     work when the map div has the focus. If undefined the
     *     document is used.
     */
    observeElement: null,

    /**
     * Constructor: OpenLayers.Control.KeyboardDefaults
     */
        
    /**
     * Method: draw
     * Create handler.
     */
    draw: function() {
        var observeElement = this.observeElement || document;
        this.handler = new OpenLayers.Handler.Keyboard( this,
                {"keydown": this.defaultKeyPress},
                {observeElement: observeElement}
        );
    },
    
    /**
     * Method: defaultKeyPress
     * When handling the key event, we only use evt.keyCode. This holds 
     * some drawbacks, though we get around them below. When interpretting
     * the keycodes below (including the comments associated with them),
     * consult the URL below. For instance, the Safari browser returns
     * "IE keycodes", and so is supported by any keycode labeled "IE".
     * 
     * Very informative URL:
     *    http://unixpapa.com/js/key.html
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultKeyPress: function (evt) {
        var size, handled = true;

        var target = OpenLayers.Event.element(evt);
        if (target  &&
            (target.tagName == 'INPUT' ||
             target.tagName == 'TEXTAREA' ||
             target.tagName == 'SELECT')) {
            return;
        }

        switch (evt.keyCode) {
            case OpenLayers.Event.KEY_LEFT:
                this.map.pan(-this.slideFactor, 0);
                break;
            case OpenLayers.Event.KEY_RIGHT: 
                this.map.pan(this.slideFactor, 0);
                break;
            case OpenLayers.Event.KEY_UP:
                this.map.pan(0, -this.slideFactor);
                break;
            case OpenLayers.Event.KEY_DOWN:
                this.map.pan(0, this.slideFactor);
                break;
            
            case 33: // Page Up. Same in all browsers.
                size = this.map.getSize();
                this.map.pan(0, -0.75*size.h);
                break;
            case 34: // Page Down. Same in all browsers.
                size = this.map.getSize();
                this.map.pan(0, 0.75*size.h);
                break; 
            case 35: // End. Same in all browsers.
                size = this.map.getSize();
                this.map.pan(0.75*size.w, 0);
                break; 
            case 36: // Home. Same in all browsers.
                size = this.map.getSize();
                this.map.pan(-0.75*size.w, 0);
                break; 

            case 43:  // +/= (ASCII), keypad + (ASCII, Opera)
            case 61:  // +/= (Mozilla, Opera, some ASCII)
            case 187: // +/= (IE)
            case 107: // keypad + (IE, Mozilla)
                this.map.zoomIn();
                break; 
            case 45:  // -/_ (ASCII, Opera), keypad - (ASCII, Opera)
            case 109: // -/_ (Mozilla), keypad - (Mozilla, IE)
            case 189: // -/_ (IE)
            case 95:  // -/_ (some ASCII)
                this.map.zoomOut();
                break; 
            default:
                handled = false;
        }
        if (handled) {
            // prevent browser default not to move the page
            // when moving the page with the keyboard
            OpenLayers.Event.stop(evt);
        }
    },

    CLASS_NAME: "OpenLayers.Control.KeyboardDefaults"
});
