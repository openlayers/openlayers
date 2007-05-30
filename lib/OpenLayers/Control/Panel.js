/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Control.js
 */
OpenLayers.Control.Panel = OpenLayers.Class.create();
OpenLayers.Control.Panel.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control, {
    /**
     * @type Array(OpenLayers.Control)
     */
    controls: null,    
    
    /** 
     * The control which is activated when the control is activated (turned 
     * on), which also happens at instantiation.
     * @type OpenLayers.Control
     */
    defaultControl: null, 

    /**
     * @constructor
     * 
     * @param {DOMElement} element
     * @param {String} base
     */
    initialize: function(element) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.controls = [];
    },

    destroy: function() {
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
        for(var i = this.controls.length - 1 ; i >= 0; i--) {
            OpenLayers.Event.stopObservingElement(this.controls[i].panel_div);
            this.controls[i].panel_div = null;
        }    
    },

    activate: function() {
        if (OpenLayers.Control.prototype.activate.apply(this, arguments)) {
            for(var i = 0; i < this.controls.length; i++) {
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
    
    deactivate: function() {
        if (OpenLayers.Control.prototype.deactivate.apply(this, arguments)) {
            for(var i = 0; i < this.controls.length; i++) {
                this.controls[i].deactivate();
            }    
            this.redraw();
            return true;
        } else {
            return false;
        }
    },
    
    /**
     * @type DOMElement
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        for (var i = 0; i < this.controls.length; i++) {
            this.map.addControl(this.controls[i]);
            this.controls[i].deactivate();
        }
        this.activate();
        return this.div;
    },

    /**
     * @private
     */
    redraw: function() {
        this.div.innerHTML = "";
        if (this.active) {
            for (var i = 0; i < this.controls.length; i++) {
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
        for (var i = 0; i < this.controls.length; i++) {
            if (this.controls[i] == control) {
                control.activate();
            } else {
                this.controls[i].deactivate();
            }
        }
        this.redraw();
    },

    /**
     * To build a toolbar, you add a set of controls to it. addControls
     * lets you add a single control or a list of controls to the 
     * Control Panel.
     * @param OpenLayers.Control
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
        for (var i = 0; i < controls.length; i++) {
            var element = document.createElement("div");
            var textNode = document.createTextNode(" ");
            controls[i].panel_div = element;
            OpenLayers.Event.observe(controls[i].panel_div, "click", 
                                     this.onClick.bind(this, controls[i]));
            OpenLayers.Event.observe(controls[i].panel_div, "mousedown", 
                              OpenLayers.Event.stop.bindAsEventListener());
        }    

        if (this.map) { // map.addControl() has already been called on the panel
            for (var i = 0; i < controls.length; i++) {
                this.map.addControl(controls[i]);
                controls[i].deactivate();
            }
            this.redraw();
        }
    },
    
    onClick: function (ctrl, evt) {
        OpenLayers.Event.stop(evt ? evt : window.event);
        this.activateControl(ctrl);
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.Panel"
});

