/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.Panel
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.Panel = OpenLayers.Class(OpenLayers.Control, {
    /**
     * Property: controls
     * {Array(<OpenLayers.Control>)}
     */
    controls: null,    
    
    /** 
     * APIProperty: defaultControl
     * <OpenLayers.Control> The control which is activated when the control is
     * activated (turned on), which also happens at instantiation.
     */
    defaultControl: null, 

    /**
     * Constructor: OpenLayers.Control.Panel
     * Create a new control panel.
     * 
     * Parameters:
     * options - {Object} An optional object whose properties will be used
     *     to extend the control.
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.controls = [];
    },

    /**
     * APIMethod: destroy
     */
    destroy: function() {
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
        for(var i = this.controls.length - 1 ; i >= 0; i--) {
            if(this.controls[i].events) {
                this.controls[i].events.un({
                    "activate": this.redraw,
                    "deactivate": this.redraw,
                    scope: this
                });
            }
            OpenLayers.Event.stopObservingElement(this.controls[i].panel_div);
            this.controls[i].panel_div = null;
        }    
    },

    /**
     * APIMethod: activate
     */
    activate: function() {
        if (OpenLayers.Control.prototype.activate.apply(this, arguments)) {
            for(var i=0, len=this.controls.length; i<len; i++) {
                if (this.controls[i] == this.defaultControl) {
                    this.controls[i].activate();
                }
            }    
            this.redraw();
            return true;
        } else {
            return false;
        }
    },
    
    /**
     * APIMethod: deactivate
     */
    deactivate: function() {
        if (OpenLayers.Control.prototype.deactivate.apply(this, arguments)) {
            for(var i=0, len=this.controls.length; i<len; i++) {
                this.controls[i].deactivate();
            }    
            return true;
        } else {
            return false;
        }
    },
    
    /**
     * Method: draw
     *
     * Returns:
     * {DOMElement}
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        for (var i=0, len=this.controls.length; i<len; i++) {
            this.map.addControl(this.controls[i]);
            this.controls[i].deactivate();
            this.controls[i].events.on({
                "activate": this.redraw,
                "deactivate": this.redraw,
                scope: this
            });
        }
        this.activate();
        return this.div;
    },

    /**
     * Method: redraw
     */
    redraw: function() {
        this.div.innerHTML = "";
        if (this.active) {
            for (var i=0, len=this.controls.length; i<len; i++) {
                var element = this.controls[i].panel_div;
                if (this.controls[i].active) {
                    element.className = this.controls[i].displayClass + "ItemActive";
                } else {    
                    element.className = this.controls[i].displayClass + "ItemInactive";
                }    
                this.div.appendChild(element);
            }
        }
    },

    /**
     * APIMethod: activateControl
     * 
     * Parameters:
     * control - {<OpenLayers.Control>}
     */
    activateControl: function (control) {
        if (!this.active) { return false; }
        if (control.type == OpenLayers.Control.TYPE_BUTTON) {
            control.trigger();
            this.redraw();
            return;
        }
        if (control.type == OpenLayers.Control.TYPE_TOGGLE) {
            if (control.active) {
                control.deactivate();
            } else {
                control.activate();
            }
            this.redraw();
            return;
        }
        for (var i=0, len=this.controls.length; i<len; i++) {
            if (this.controls[i] != control) {
                if (this.controls[i].type != OpenLayers.Control.TYPE_TOGGLE) {
                    this.controls[i].deactivate();
                }
            }
        }
        control.activate();
    },

    /**
     * APIMethod: addControls
     * To build a toolbar, you add a set of controls to it. addControls
     * lets you add a single control or a list of controls to the 
     * Control Panel.
     *
     * Parameters:
     * controls - {<OpenLayers.Control>} 
     */    
    addControls: function(controls) {
        if (!(controls instanceof Array)) {
            controls = [controls];
        }
        this.controls = this.controls.concat(controls);
        
        // Give each control a panel_div which will be used later.
        // Access to this div is via the panel_div attribute of the 
        // control added to the panel.
        // Also, stop mousedowns and clicks, but don't stop mouseup,
        // since they need to pass through.
        for (var i=0, len=controls.length; i<len; i++) {
            var element = document.createElement("div");
            var textNode = document.createTextNode(" ");
            controls[i].panel_div = element;
            if (controls[i].title != "") {
                controls[i].panel_div.title = controls[i].title;
            }
            OpenLayers.Event.observe(controls[i].panel_div, "click", 
                OpenLayers.Function.bind(this.onClick, this, controls[i]));
            OpenLayers.Event.observe(controls[i].panel_div, "mousedown", 
                OpenLayers.Function.bindAsEventListener(OpenLayers.Event.stop));
        }    

        if (this.map) { // map.addControl() has already been called on the panel
            for (var i=0, len=controls.length; i<len; i++) {
                this.map.addControl(controls[i]);
                controls[i].deactivate();
                controls[i].events.on({
                    "activate": this.redraw,
                    "deactivate": this.redraw,
                    scope: this
                });
            }
            this.redraw();
        }
    },
   
    /**
     * Method: onClick
     */
    onClick: function (ctrl, evt) {
        OpenLayers.Event.stop(evt ? evt : window.event);
        this.activateControl(ctrl);
    },

    /**
     * APIMethod: getControlsBy
     * Get a list of controls with properties matching the given criteria.
     *
     * Parameter:
     * property - {String} A control property to be matched.
     * match - {String | Object} A string to match.  Can also be a regular
     *     expression literal or object.  In addition, it can be any object
     *     with a method named test.  For reqular expressions or other, if
     *     match.test(control[property]) evaluates to true, the control will be
     *     included in the array returned.  If no controls are found, an empty
     *     array is returned.
     *
     * Returns:
     * {Array(<OpenLayers.Control>)} A list of controls matching the given criteria.
     *     An empty array is returned if no matches are found.
     */
    getControlsBy: function(property, match) {
        var test = (typeof match.test == "function");
        var found = OpenLayers.Array.filter(this.controls, function(item) {
            return item[property] == match || (test && match.test(item[property]));
        });
        return found;
    },

    /**
     * APIMethod: getControlsByName
     * Get a list of contorls with names matching the given name.
     *
     * Parameter:
     * match - {String | Object} A control name.  The name can also be a regular
     *     expression literal or object.  In addition, it can be any object
     *     with a method named test.  For reqular expressions or other, if
     *     name.test(control.name) evaluates to true, the control will be included
     *     in the list of controls returned.  If no controls are found, an empty
     *     array is returned.
     *
     * Returns:
     * {Array(<OpenLayers.Control>)} A list of controls matching the given name.
     *     An empty array is returned if no matches are found.
     */
    getControlsByName: function(match) {
        return this.getControlsBy("name", match);
    },

    /**
     * APIMethod: getControlsByClass
     * Get a list of controls of a given type (CLASS_NAME).
     *
     * Parameter:
     * match - {String | Object} A control class name.  The type can also be a
     *     regular expression literal or object.  In addition, it can be any
     *     object with a method named test.  For reqular expressions or other,
     *     if type.test(control.CLASS_NAME) evaluates to true, the control will
     *     be included in the list of controls returned.  If no controls are
     *     found, an empty array is returned.
     *
     * Returns:
     * {Array(<OpenLayers.Control>)} A list of controls matching the given type.
     *     An empty array is returned if no matches are found.
     */
    getControlsByClass: function(match) {
        return this.getControlsBy("CLASS_NAME", match);
    },

    CLASS_NAME: "OpenLayers.Control.Panel"
});

