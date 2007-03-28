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

    activate: function() {
        OpenLayers.Control.prototype.activate.apply(this, arguments);
        for(var i = 0; i < this.controls.length; i++) {
            if (this.controls[i] == this.defaultControl) {
                this.controls[i].activate();
            }
        }    
        this.redraw();
    },
    deactivate: function() {
        OpenLayers.Control.prototype.deactivate.apply(this, arguments);
        for(var i = 0; i < this.controls.length; i++) {
            this.controls[i].deactivate();
        }    
        this.redraw();
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
                var element = document.createElement("div");
                var textNode = document.createTextNode(" ");
                if (this.controls[i].active) {
                    element.className = this.controls[i].displayClass + "ItemActive";
                } else {    
                    element.className = this.controls[i].displayClass + "ItemInactive";
                }    
                var onClick = function (ctrl, evt) {
                    OpenLayers.Event.stop(evt ? evt : window.event);
                    this.activateControl(ctrl);
                };
                var control = this.controls[i];
                OpenLayers.Event.observe(element, "click", 
                                         onClick.bind(this, control));
                OpenLayers.Event.observe(element, "mousedown", 
                                  OpenLayers.Event.stop.bindAsEventListener());
                OpenLayers.Event.observe(element, "mouseup", 
                                  OpenLayers.Event.stop.bindAsEventListener());
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
        if (this.map) { // map.addControl() has already been called on the panel
            for (var i = 0; i < controls.length; i++) {
                map.addControl(controls[i]);
                controls[i].deactivate();
            }
            this.redraw();
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.Panel"
});

