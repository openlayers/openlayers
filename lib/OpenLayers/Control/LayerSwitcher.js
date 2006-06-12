// @require: OpenLayers/Control.js
/** 
* @class
*/
OpenLayers.Control.LayerSwitcher = Class.create();

/** color used in the UI to show a layer is active/displayed
*
* @final
* @type String 
*/
OpenLayers.Control.LayerSwitcher.ACTIVE_COLOR = "darkblue";

/** color used in the UI to show a layer is deactivated/hidden
*
* @final
* @type String 
*/
OpenLayers.Control.LayerSwitcher.NONACTIVE_COLOR = "lightblue";


OpenLayers.Control.LayerSwitcher.prototype = 
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
        this.activeColor = OpenLayers.Control.LayerSwitcher.ACTIVE_COLOR;
        this.nonActiveColor = OpenLayers.Control.LayerSwitcher.NONACTIVE_COLOR;
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

        //clear out previous incarnation of LayerSwitcher tabs
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
    * @param {event} evt
    */
    singleClick: function(evt) {
        var div = Event.element(evt);
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
    * @param {event} evt
    */
    doubleClick: function(evt) {
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
        backdropLabelOuter.id = "LayerSwitcher_" + layer.name + "_Tab";
        backdropLabelOuter.style.marginTop = "4px";
        backdropLabelOuter.style.marginBottom = "4px";
        
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
        backdropLabelOuter.onclick = this.doubleClick.bindAsEventListener(this);
        backdropLabelOuter.ondblclick = this.doubleClick.bindAsEventListener(this);
        backdropLabelOuter.onmousedown = this.singleClick.bindAsEventListener(this);

        // add label to div
        backdropLabelOuter.appendChild(backdropLabel);
        
        this.backdrops.append(backdropLabel); 
        
        // add div to main LayerSwitcher Div
        this.div.appendChild(backdropLabelOuter);

        Rico.Corner.round(backdropLabelOuter, {corners: "tl bl",
                                      bgColor: "transparent",
                                      color: "white",
                                      blend: false});

        this.setTabActivation(backdropLabel, layer.getVisibility());
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
    CLASS_NAME: "OpenLayers.Control.LayerSwitcher"
});

