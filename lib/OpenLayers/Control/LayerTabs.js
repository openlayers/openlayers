/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/** 
 * @class
 * 
 * @requires OpenLayers/Control.js
 */
OpenLayers.Control.LayerTabs = Class.create();

/** color used in the UI to show a layer is active/displayed
*
* @final
* @type String 
*/
OpenLayers.Control.LayerTabs.ACTIVE_COLOR = "darkblue";

/** color used in the UI to show a layer is deactivated/hidden
*
* @final
* @type String 
*/
OpenLayers.Control.LayerTabs.NONACTIVE_COLOR = "lightblue";


OpenLayers.Control.LayerTabs.prototype = 
  Object.extend( new OpenLayers.Control(), {

    /** @type String */
    activeColor: "",
    
    /** @type String */
    nonActiveColor: "",
    
    /** @type String */
    mode: "checkbox",

    /**
    * @constructor
    */
    initialize: function(options) {
        this.activeColor = OpenLayers.Control.LayerTabs.ACTIVE_COLOR;
        this.nonActiveColor = OpenLayers.Control.LayerTabs.NONACTIVE_COLOR;
        this.backdrops = [];
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /**
    * @returns A reference to the DIV DOMElement containing the switcher tabs
    * @type DOMElement
    */  
    draw: function() {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this);

        this.div.style.position = "absolute";
        this.div.style.top = "10px";
        this.div.style.right = "0px";
        this.div.style.left = "";
        this.div.style.fontFamily = "sans-serif";
        this.div.style.color = "white";
        this.div.style.fontWeight = "bold";
        this.div.style.marginTop = "3px";
        this.div.style.marginLeft = "3px";
        this.div.style.marginBottom = "3px";
        this.div.style.fontSize="smaller";   
        this.div.style.width = "10em";

        this.map.events.register("addlayer", this, this.redraw);
        this.map.events.register("removelayer", this, this.redraw);
        return this.redraw();    
    },

    /**
    * @returns A reference to the DIV DOMElement containing the switcher tabs
    * @type DOMElement
    */  
    redraw: function() {

        //clear out previous incarnation of LayerTabs tabs
        this.div.innerHTML = "";
        var visible = false;
        for( var i = 0; i < this.map.layers.length; i++) {
            if (visible && this.mode == "radio") {
                this.map.layers[i].setVisibility(false);
            } else {
                visible = this.map.layers[i].getVisibility();
            }
            this.addTab(this.map.layers[i]);
        }
            
        return this.div;
    },
    
    /** 
    * @param {Event} evt
    */
    singleClick: function(evt) {
        var div = Event.element(evt);

        // See comment about OL #57 fix below.
        // If the click occurred on the corner spans we need
        // to make sure we act on the actual label tab instead.
        div = div.labelElement || div;

        var layer = div.layer;
        if (this.mode == "radio") {
            for(var i=0; i < this.backdrops.length; i++) {
                this.setTabActivation(this.backdrops[i], false);
                this.backdrops[i].layer.setVisibility(false);
            }
            this.setTabActivation(div, true);
            layer.setVisibility(true);
        } else {
            var visible = layer.getVisibility();
            
            this.setTabActivation(div, !visible);
            layer.setVisibility(!visible);
        }
        Event.stop(evt);
    },
    
    /** 
    * @private
    *
    * @param {Event} evt
    */
    ignoreEvent: function(evt) {
        Event.stop(evt);
        return false;
    },

    /** 
    * @private
    * 
    * @param {OpenLayers.Layer} layer
    */            
    addTab: function(layer) {

        // Outer DIV - for Rico Corners
        //
        var backdropLabelOuter = document.createElement('div');
        backdropLabelOuter.id = "LayerTabs_" + layer.name + "_Tab";
        backdropLabelOuter.style.marginTop = "4px";
        backdropLabelOuter.style.marginBottom = "4px";
        
        this._setEventHandlers(backdropLabelOuter);

        // Inner Label - for Rico Corners
        //
        var backdropLabel = document.createElement('p');
        backdropLabel.innerHTML = layer.name;
        backdropLabel.style.marginTop = "0px";
        backdropLabel.style.marginBottom = "0px";
        backdropLabel.style.paddingLeft = "10px";
        backdropLabel.style.paddingRight = "10px";
        
        // add reference to layer onto the div for use in event handlers
        backdropLabel.layer = layer;

        // set event handlers
        this._setEventHandlers(backdropLabel);

        // add label to div
        backdropLabelOuter.appendChild(backdropLabel);
        
        this.backdrops.push(backdropLabel); 
        
        // add div to main LayerTabs Div
        this.div.appendChild(backdropLabelOuter);

        Rico.Corner.round(backdropLabelOuter, {corners: "tl bl",
                                      bgColor: "transparent",
                                      color: "white",
                                      blend: false});

        // extend the event handlers to operate on the
        // rounded corners as well. (Fixes OL #57.)
        var spanElements=backdropLabel.parentNode.getElementsByTagName("span");
        
        for (var currIdx = 0; currIdx < spanElements.length; currIdx++) {
            this._setEventHandlers(spanElements[currIdx], backdropLabel);
        }

        this.setTabActivation(backdropLabel, layer.getVisibility());
    },

    /*
      @private
    
      @param {DOMElement} div
      @param {Boolean} activate
    */
    _setEventHandlers : function(element, labelDiv) {

        // We only want to respond to a mousedown event.
        element.onclick = this.singleClick.bindAsEventListener(this);
        element.ondblclick = this.singleClick.bindAsEventListener(this);
        element.onmouseup = this.ignoreEvent.bindAsEventListener(this);
        element.onmousedown = this.ignoreEvent.bindAsEventListener(this);

        // If we are operating on a corner span we need to store a
        // reference to the actual tab. (See comment about OL #57 fix above.)
        if (labelDiv) {
            element.labelElement = labelDiv;
        }
    },

    /**
    * @private
    *
    * @param {DOMElement} div
    * @param {Boolean} activate
    */
    setTabActivation:function(div, activate) {
        var color = (activate) ? this.activeColor : this.nonActiveColor;
        Rico.Corner.changeColor(div, color);
    },



    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.LayerTabs"
});

