/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Events.js
 */

/**
 * Class: OpenLayers.Events.buttonclick
 * Extension event type for handling buttons on top of a dom element. This
 *     event type fires "buttonclick" on its <target> when a button was
 *     clicked. Buttons are detected by the "olButton" class.
 *
 * This event type makes sure that button clicks do not interfere with other
 *     events that are registered on the same <element>.
 *
 * Event types provided by this extension:
 * - *buttonclick* Triggered when a button is clicked. Listeners receive an
 *     object with a *buttonElement* property referencing the dom element of
 *     the clicked button, and an *buttonXY* property with the click position
 *     relative to the button.
 */
OpenLayers.Events.buttonclick = OpenLayers.Class({
    
    /**
     * Property: target
     * {<OpenLayers.Events>} The events instance that the buttonclick event will
     * be triggered on.
     */
    target: null,
    
    /**
     * Property: events
     * {Array} Events to observe and conditionally stop from propagating when
     *     an element with the olButton class (or its olAlphaImg child) is
     *     clicked.
     */
    events: [
        'mousedown', 'mouseup', 'click', 'dblclick',
        'touchstart', 'touchmove', 'touchend', 'keydown'
    ],
    
    /**
     * Property: startRegEx
     * {RegExp} Regular expression to test Event.type for events that start
     *     a buttonclick sequence.
     */
    startRegEx: /^mousedown|touchstart$/,

    /**
     * Property: cancelRegEx
     * {RegExp} Regular expression to test Event.type for events that cancel
     *     a buttonclick sequence.
     */
    cancelRegEx: /^touchmove$/,

    /**
     * Property: completeRegEx
     * {RegExp} Regular expression to test Event.type for events that complete
     *     a buttonclick sequence.
     */
    completeRegEx: /^mouseup|touchend$/,
    
    /**
     * Property: startEvt
     * {Event} The event that started the click sequence
     */
    
    /**
     * Constructor: OpenLayers.Events.buttonclick
     * Construct a buttonclick event type. Applications are not supposed to
     *     create instances of this class - they are created on demand by
     *     <OpenLayers.Events> instances.
     *
     * Parameters:
     * target - {<OpenLayers.Events>} The events instance that the buttonclick
     *     event will be triggered on.
     */
    initialize: function(target) {
        this.target = target;
        for (var i=this.events.length-1; i>=0; --i) {
            this.target.register(this.events[i], this, this.buttonClick, {
                extension: true
            });
        }
    },
    
    /**
     * Method: destroy
     */
    destroy: function() {
        for (var i=this.events.length-1; i>=0; --i) {
            this.target.unregister(this.events[i], this, this.buttonClick);
        }
        delete this.target;
    },

    /**
     * Method: getPressedButton
     * Get the pressed button, if any. Returns undefined if no button
     * was pressed.
     *
     * Arguments:
     * element - {DOMElement} The event target.
     *
     * Returns:
     * {DOMElement} The button element, or undefined.
     */
    getPressedButton: function(element) {
        var depth = 3, // limit the search depth
            button;
        do {
            if(OpenLayers.Element.hasClass(element, "olButton")) {
                // hit!
                button = element;
                break;
            }
            element = element.parentNode;
        } while(--depth > 0 && element);
        return button;
    },

    /**
     * Method: buttonClick
     * Check if a button was clicked, and fire the buttonclick event
     *
     * Parameters:
     * evt - {Event}
     */
    buttonClick: function(evt) {
        var propagate = true,
            element = OpenLayers.Event.element(evt);
        if (element && (OpenLayers.Event.isLeftClick(evt) || !~evt.type.indexOf("mouse"))) {
            // was a button pressed?
            var button = this.getPressedButton(element);
            if (button) {
                if (evt.type === "keydown") {
                    switch (evt.keyCode) {
                    case OpenLayers.Event.KEY_RETURN:
                    case OpenLayers.Event.KEY_SPACE:
                        this.target.triggerEvent("buttonclick", {
                            buttonElement: button
                        });
                        OpenLayers.Event.stop(evt);
                        propagate = false;
                        break;
                    }
                } else if (this.startEvt) {
                    if (this.completeRegEx.test(evt.type)) {
                        var pos = OpenLayers.Util.pagePosition(button);
                        this.target.triggerEvent("buttonclick", {
                            buttonElement: button,
                            buttonXY: {
                                x: this.startEvt.clientX - pos[0],
                                y: this.startEvt.clientY - pos[1]
                            }
                        });
                    }
                    if (this.cancelRegEx.test(evt.type)) {
                        delete this.startEvt;
                    }
                    OpenLayers.Event.stop(evt);
                    propagate = false;
                }
                if (this.startRegEx.test(evt.type)) {
                    this.startEvt = evt;
                    OpenLayers.Event.stop(evt);
                    propagate = false;
                }
            } else {
                delete this.startEvt;
            }
        }
        return propagate;
    }
    
});
