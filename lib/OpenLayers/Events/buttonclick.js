/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
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
 */
OpenLayers.Events.buttonclick = OpenLayers.Class({
    
    /**
     * APIProperty: target
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
        'touchstart', 'touchmove', 'touchend'
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
            if (OpenLayers.Element.hasClass(element, "olAlphaImg")) {
                element = element.parentNode;
            }
            if (OpenLayers.Element.hasClass(element, "olButton")) {
                if (this._buttonStarted) {
                    if (this.completeRegEx.test(evt.type)) {
                        this.target.triggerEvent("buttonclick", {
                            button: element
                        });
                    }
                    if (this.cancelRegEx.test(evt.type)) {
                        delete this._buttonStarted;
                    }
                    OpenLayers.Event.stop(evt);
                    propagate = false;
                }
                if (this.startRegEx.test(evt.type)) {
                    this._buttonStarted = true;
                    OpenLayers.Event.stop(evt);
                    propagate = false;
                }
            } else {
                delete this._buttonStarted;
            }
        }
        return propagate;
    }
    
});