/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.Panel
 * The Panel control is a container for other controls. With it toolbars
 * may be composed.
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
     * APIProperty: autoActivate
     * {Boolean} Activate the control when it is added to a map.  Default is
     *     true.
     */
    autoActivate: true,

    /** 
     * APIProperty: defaultControl
     * {<OpenLayers.Control>} The control which is activated when the control is
     * activated (turned on), which also happens at instantiation.
     * If <saveState> is true, <defaultControl> will be nullified after the
     * first activation of the panel.
     */
    defaultControl: null,
    
    /**
     * APIProperty: saveState
     * {Boolean} If set to true, the active state of this panel's controls will
     * be stored on panel deactivation, and restored on reactivation. Default
     * is false.
     */
    saveState: false,
      
    /**
     * APIProperty: allowDepress
     * {Boolean} If is true the <OpenLayers.Control.TYPE_TOOL> controls can 
     *     be deactivated by clicking the icon that represents them.  Default 
     *     is false.
     */
    allowDepress: false,
    
    /**
     * Property: activeState
     * {Object} stores the active state of this panel's controls.
     */
    activeState: null,

    /**
     * Constructor: OpenLayers.Control.Panel
     * Create a new control panel.
     *
     * Each control in the panel is represented by an icon. When clicking 
     *     on an icon, the <activateControl> method is called.
     *
     * Specific properties for controls on a panel:
     * type - {Number} One of <OpenLayers.Control.TYPE_TOOL>,
     *     <OpenLayers.Control.TYPE_TOGGLE>, <OpenLayers.Control.TYPE_BUTTON>.
     *     If not provided, <OpenLayers.Control.TYPE_TOOL> is assumed.
     * title - {string} Text displayed when mouse is over the icon that 
     *     represents the control.     
     *
     * The <OpenLayers.Control.type> of a control determines the behavior when
     * clicking its icon:
     * <OpenLayers.Control.TYPE_TOOL> - The control is activated and other
     *     controls of this type in the same panel are deactivated. This is
     *     the default type.
     * <OpenLayers.Control.TYPE_TOGGLE> - The active state of the control is
     *     toggled.
     * <OpenLayers.Control.TYPE_BUTTON> - The
     *     <OpenLayers.Control.Button.trigger> method of the control is called,
     *     but its active state is not changed.
     *
     * If a control is <OpenLayers.Control.active>, it will be drawn with the
     * olControl[Name]ItemActive class, otherwise with the
     * olControl[Name]ItemInactive class.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be used
     *     to extend the control.
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.controls = [];
        this.activeState = {};
    },

    /**
     * APIMethod: destroy
     */
    destroy: function() {
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
        for (var ctl, i = this.controls.length - 1; i >= 0; i--) {
            ctl = this.controls[i];
            if (ctl.events) {
                ctl.events.un({
                    activate: this.iconOn,
                    deactivate: this.iconOff
                });
            }
            OpenLayers.Event.stopObservingElement(ctl.panel_div);
            ctl.panel_div = null;
        }
        this.activeState = null;
    },

    /**
     * APIMethod: activate
     */
    activate: function() {
        if (OpenLayers.Control.prototype.activate.apply(this, arguments)) {
            var control;
            for (var i=0, len=this.controls.length; i<len; i++) {
                control = this.controls[i];
                if (control === this.defaultControl ||
                            (this.saveState && this.activeState[control.id])) {
                    control.activate();
                }
            }    
            if (this.saveState === true) {
                this.defaultControl = null;
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
            var control;
            for (var i=0, len=this.controls.length; i<len; i++) {
                control = this.controls[i];
                this.activeState[control.id] = control.deactivate();
            }    
            this.redraw();
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
        this.addControlsToMap(this.controls);
        return this.div;
    },

    /**
     * Method: redraw
     */
    redraw: function() {
        for (var l=this.div.childNodes.length, i=l-1; i>=0; i--) {
            this.div.removeChild(this.div.childNodes[i]);
        }
        this.div.innerHTML = "";
        if (this.active) {
            for (var i=0, len=this.controls.length; i<len; i++) {
                this.div.appendChild(this.controls[i].panel_div);
            }
        }
    },

    /**
     * APIMethod: activateControl
     * This method is called when the user click on the icon representing a 
     *     control in the panel.
     *
     * Parameters:
     * control - {<OpenLayers.Control>}
     */
    activateControl: function (control) {
        if (!this.active) { return false; }
        if (control.type == OpenLayers.Control.TYPE_BUTTON) {
            control.trigger();
            return;
        }
        if (control.type == OpenLayers.Control.TYPE_TOGGLE) {
            if (control.active) {
                control.deactivate();
            } else {
                control.activate();
            }
            return;
        }
        if (this.allowDepress && control.active) {
            control.deactivate();
        } else {
            var c;
            for (var i=0, len=this.controls.length; i<len; i++) {
                c = this.controls[i];
                if (c != control &&
                   (c.type === OpenLayers.Control.TYPE_TOOL || c.type == null)) {
                    c.deactivate();
                }
            }
            control.activate();
        }
    },

    /**
     * APIMethod: addControls
     * To build a toolbar, you add a set of controls to it. addControls
     * lets you add a single control or a list of controls to the 
     * Control Panel.
     *
     * Parameters:
     * controls - {<OpenLayers.Control>} Controls to add in the panel.
     */    
    addControls: function(controls) {
        if (!(OpenLayers.Util.isArray(controls))) {
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
            element.className = controls[i].displayClass + "ItemInactive";
            controls[i].panel_div = element;
            if (controls[i].title != "") {
                controls[i].panel_div.title = controls[i].title;
            }
            OpenLayers.Event.observe(controls[i].panel_div, "click", 
                OpenLayers.Function.bind(this.onClick, this, controls[i]));
            OpenLayers.Event.observe(controls[i].panel_div, "dblclick", 
                OpenLayers.Function.bind(this.onDoubleClick, this, controls[i]));
            OpenLayers.Event.observe(controls[i].panel_div, "mousedown", 
                OpenLayers.Function.bindAsEventListener(OpenLayers.Event.stop));
        }    

        if (this.map) { // map.addControl() has already been called on the panel
            this.addControlsToMap(controls);
            this.redraw();
        }
    },
   
    /**
     * Method: addControlsToMap
     * Only for internal use in draw() and addControls() methods.
     *
     * Parameters:
     * controls - {Array(<OpenLayers.Control>)} Controls to add into map.
     */         
    addControlsToMap: function (controls) {
        var control;
        for (var i=0, len=controls.length; i<len; i++) {
            control = controls[i];
            if (control.autoActivate === true) {
                control.autoActivate = false;
                this.map.addControl(control);
                control.autoActivate = true;
            } else {
                this.map.addControl(control);
                control.deactivate();
            }
            control.events.on({
                activate: this.iconOn,
                deactivate: this.iconOff
            });
        }  
    },

    /**
     * Method: iconOn
     * Internal use, for use only with "controls[i].events.on/un".
     */
     iconOn: function() {
        var d = this.panel_div; // "this" refers to a control on panel!
        d.className = d.className.replace(/ItemInactive$/, "ItemActive");
    },

    /**
     * Method: iconOff
     * Internal use, for use only with "controls[i].events.on/un".
     */
     iconOff: function() {
        var d = this.panel_div; // "this" refers to a control on panel!
        d.className = d.className.replace(/ItemActive$/, "ItemInactive");
    },

    /**
     * Method: onClick
     */
    onClick: function (ctrl, evt) {
        OpenLayers.Event.stop(evt ? evt : window.event);
        this.activateControl(ctrl);
    },

    /**
     * Method: onDoubleClick
     */
    onDoubleClick: function(ctrl, evt) {
        OpenLayers.Event.stop(evt ? evt : window.event);
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

