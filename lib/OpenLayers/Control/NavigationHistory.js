/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Control/Button.js
 */

/**
 * Class: OpenLayers.Control.NavigationHistory
 * A navigation history control.  This is a meta-control, that creates two
 *     dependent controls: <previous> and <next>.  Call the trigger method
 *     on the <previous> and <next> controls to restore previous and next
 *     history states.  The previous and next controls will become active
 *     when there are available states to restore and will become deactive
 *     when there are no states to restore.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.NavigationHistory = OpenLayers.Class(OpenLayers.Control, {

    /**
     * Property: type
     * {String} Note that this control is not intended to be added directly
     *     to a control panel.  Instead, add the sub-controls previous and
     *     next.  These sub-controls are button type controls that activate
     *     and deactivate themselves.  If this parent control is added to
     *     a panel, it will act as a toggle.
     */
    type: OpenLayers.Control.TYPE_TOGGLE,

    /**
     * APIProperty: previous
     * {<OpenLayers.Control>} A button type control whose trigger method restores
     *     the previous state managed by this control.
     */
    previous: null,
    
    /**
     * APIProperty: previousOptions
     * {Object} Set this property on the options argument of the constructor
     *     to set optional properties on the <previous> control.
     */
    previousOptions: null,
    
    /**
     * APIProperty: next
     * {<OpenLayers.Control>} A button type control whose trigger method restores
     *     the next state managed by this control.
     */
    next: null,

    /**
     * APIProperty: nextOptions
     * {Object} Set this property on the options argument of the constructor
     *     to set optional properties on the <next> control.
     */
    nextOptions: null,

    /**
     * APIProperty: limit
     * {Integer} Optional limit on the number of history items to retain.  If
     *     null, there is no limit.  Default is 50.
     */
    limit: 50,

    /**
     * APIProperty: autoActivate
     * {Boolean} Activate the control when it is added to a map.  Default is
     *     true.
     */
    autoActivate: true,

    /**
     * Property: clearOnDeactivate
     * {Boolean} Clear the history when the control is deactivated.  Default
     *     is false.
     */
    clearOnDeactivate: false,

    /**
     * Property: registry
     * {Object} An object with keys corresponding to event types.  Values
     *     are functions that return an object representing the current state.
     */
    registry: null,

    /**
     * Property: nextStack
     * {Array} Array of items in the history.
     */
    nextStack: null,

    /**
     * Property: previousStack
     * {Array} List of items in the history.  First item represents the current
     *     state.
     */
    previousStack: null,
    
    /**
     * Property: listeners
     * {Object} An object containing properties corresponding to event types.
     *     This object is used to configure the control and is modified on
     *     construction.
     */
    listeners: null,
    
    /**
     * Property: restoring
     * {Boolean} Currently restoring a history state.  This is set to true
     *     before calling restore and set to false after restore returns.
     */
    restoring: false,
    
    /**
     * Constructor: OpenLayers.Control.NavigationHistory 
     * 
     * Parameters:
     * options - {Object} An optional object whose properties will be used
     *     to extend the control.
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        
        this.registry = OpenLayers.Util.extend({
            "moveend": this.getState
        }, this.registry);
        
        var previousOptions = {
            trigger: OpenLayers.Function.bind(this.previousTrigger, this),
            displayClass: this.displayClass + " " + this.displayClass + "Previous"
        };
        OpenLayers.Util.extend(previousOptions, this.previousOptions);
        this.previous = new OpenLayers.Control.Button(previousOptions);
        
        var nextOptions = {
            trigger: OpenLayers.Function.bind(this.nextTrigger, this),
            displayClass: this.displayClass + " " + this.displayClass + "Next"
        };
        OpenLayers.Util.extend(nextOptions, this.nextOptions);
        this.next = new OpenLayers.Control.Button(nextOptions);

        this.clear();
    },
    
    /**
     * Method: onPreviousChange
     * Called when the previous history stack changes.
     *
     * Parameters:
     * state - {Object} An object representing the state to be restored
     *     if previous is triggered again or null if no previous states remain.
     * length - {Integer} The number of remaining previous states that can
     *     be restored.
     */
    onPreviousChange: function(state, length) {
        if(state && !this.previous.active) {
            this.previous.activate();
        } else if(!state && this.previous.active) {
            this.previous.deactivate();
        }
    },
    
    /**
     * Method: onNextChange
     * Called when the next history stack changes.
     *
     * Parameters:
     * state - {Object} An object representing the state to be restored
     *     if next is triggered again or null if no next states remain.
     * length - {Integer} The number of remaining next states that can
     *     be restored.
     */
    onNextChange: function(state, length) {
        if(state && !this.next.active) {
            this.next.activate();
        } else if(!state && this.next.active) {
            this.next.deactivate();
        }
    },
    
    /**
     * APIMethod: destroy
     * Destroy the control.
     */
    destroy: function() {
        OpenLayers.Control.prototype.destroy.apply(this);
        this.previous.destroy();
        this.next.destroy();
        this.deactivate();
        for(var prop in this) {
            this[prop] = null;
        }
    },
    
    /** 
     * Method: setMap
     * Set the map property for the control and <previous> and <next> child
     *     controls.
     *
     * Parameters:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        this.map = map;
        this.next.setMap(map);
        this.previous.setMap(map);
    },

    /**
     * Method: draw
     * Called when the control is added to the map.
     */
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        this.next.draw();
        this.previous.draw();
    },
    
    /**
     * Method: previousTrigger
     * Restore the previous state.  If no items are in the previous history
     *     stack, this has no effect.
     *
     * Returns:
     * {Object} Item representing state that was restored.  Undefined if no
     *     items are in the previous history stack.
     */
    previousTrigger: function() {
        var current = this.previousStack.shift();
        var state = this.previousStack.shift();
        if(state != undefined) {
            this.nextStack.unshift(current);
            this.previousStack.unshift(state);
            this.restoring = true;
            this.restore(state);
            this.restoring = false;
            this.onNextChange(this.nextStack[0], this.nextStack.length);
            this.onPreviousChange(
                this.previousStack[1], this.previousStack.length - 1
            );
        } else {
            this.previousStack.unshift(current);
        }
        return state;
    },
    
    /**
     * APIMethod: nextTrigger
     * Restore the next state.  If no items are in the next history
     *     stack, this has no effect.  The next history stack is populated
     *     as states are restored from the previous history stack.
     *
     * Returns:
     * {Object} Item representing state that was restored.  Undefined if no
     *     items are in the next history stack.
     */
    nextTrigger: function() {
        var state = this.nextStack.shift();
        if(state != undefined) {
            this.previousStack.unshift(state);
            this.restoring = true;
            this.restore(state);
            this.restoring = false;
            this.onNextChange(this.nextStack[0], this.nextStack.length);
            this.onPreviousChange(
                this.previousStack[1], this.previousStack.length - 1
            );
        }
        return state;
    },
    
    /**
     * APIMethod: clear
     * Clear history.
     */
    clear: function() {
        this.previousStack = [];
        this.previous.deactivate();
        this.nextStack = [];
        this.next.deactivate();
    },

    /**
     * Method: getState
     * Get the current state and return it.
     *
     * Returns:
     * {Object} An object representing the current state.
     */
    getState: function() {
        return {
            center: this.map.getCenter(),
            resolution: this.map.getResolution(),
            projection: this.map.getProjectionObject(),
            units: this.map.getProjectionObject().getUnits() || 
                this.map.units || this.map.baseLayer.units
        };
    },

    /**
     * Method: restore
     * Update the state with the given object.
     *
     * Parameters:
     * state - {Object} An object representing the state to restore.
     */
    restore: function(state) {
        var center, zoom;
        if (this.map.getProjectionObject() == state.projection) { 
            zoom = this.map.getZoomForResolution(state.resolution);
            center = state.center;
        } else {
            center = state.center.clone();
            center.transform(state.projection, this.map.getProjectionObject());
            var sourceUnits = state.units;
            var targetUnits = this.map.getProjectionObject().getUnits() || 
                this.map.units || this.map.baseLayer.units;
            var resolutionFactor = sourceUnits && targetUnits ? 
                OpenLayers.INCHES_PER_UNIT[sourceUnits] / OpenLayers.INCHES_PER_UNIT[targetUnits] : 1;
            zoom = this.map.getZoomForResolution(resolutionFactor*state.resolution); 
        }
        this.map.setCenter(center, zoom);
    },
    
    /**
     * Method: setListeners
     * Sets functions to be registered in the listeners object.
     */
    setListeners: function() {
        this.listeners = {};
        for(var type in this.registry) {
            this.listeners[type] = OpenLayers.Function.bind(function() {
                if(!this.restoring) {
                    var state = this.registry[type].apply(this, arguments);
                    this.previousStack.unshift(state);
                    if(this.previousStack.length > 1) {
                        this.onPreviousChange(
                            this.previousStack[1], this.previousStack.length - 1
                        );
                    }
                    if(this.previousStack.length > (this.limit + 1)) {
                        this.previousStack.pop();
                    }
                    if(this.nextStack.length > 0) {
                        this.nextStack = [];
                        this.onNextChange(null, 0);
                    }
                }
                return true;
            }, this);
        }
    },

    /**
     * APIMethod: activate
     * Activate the control.  This registers any listeners.
     *
     * Returns:
     * {Boolean} Control successfully activated.
     */
    activate: function() {
        var activated = false;
        if(this.map) {
            if(OpenLayers.Control.prototype.activate.apply(this)) {
                if(this.listeners == null) {
                    this.setListeners();
                }
                for(var type in this.listeners) {
                    this.map.events.register(type, this, this.listeners[type]);
                }
                activated = true;
                if(this.previousStack.length == 0) {
                    this.initStack();
                }
            }
        }
        return activated;
    },
    
    /**
     * Method: initStack
     * Called after the control is activated if the previous history stack is
     *     empty.
     */
    initStack: function() {
        if(this.map.getCenter()) {
            this.listeners.moveend();
        }
    },
    
    /**
     * APIMethod: deactivate
     * Deactivate the control.  This unregisters any listeners.
     *
     * Returns:
     * {Boolean} Control successfully deactivated.
     */
    deactivate: function() {
        var deactivated = false;
        if(this.map) {
            if(OpenLayers.Control.prototype.deactivate.apply(this)) {
                for(var type in this.listeners) {
                    this.map.events.unregister(
                        type, this, this.listeners[type]
                    );
                }
                if(this.clearOnDeactivate) {
                    this.clear();
                }
                deactivated = true;
            }
        }
        return deactivated;
    },
    
    CLASS_NAME: "OpenLayers.Control.NavigationHistory"
});

