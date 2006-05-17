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


    /**
    * @constructor
    */
    initialize: function() {
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
        this.div.style.left="";
        this.div.style.fontFamily = "sans-serif";
        this.div.style.color = "white";
        this.div.style.fontWeight = "bold";
        this.div.style.marginTop = "3px";
        this.div.style.marginLeft = "3px";
        this.div.style.marginBottom = "3px";
        this.div.style.fontSize="smaller";   
        this.div.style.width = "10em";

        this.map.events.register("addlayer", this, this.redraw);
        return this.redraw();    
    },

    /**
    * @returns A reference to the DIV DOMElement containing the switcher tabs
    * @type DOMElement
    */  
    redraw: function() {

        //clear out previous incarnation of LayerSwitcher tabs
        this.div.innerHTML = "";
    
        for( var i = 0; i < this.map.layers.length; i++) {
            this.addTab(this.map.layers[i]);
        }
        return this.div;
    },
    
    /** 
    * @param {event} evt
    */
    singleClick: function(evt) {
        var visible = this.layer.getVisibility();
        OpenLayers.Control.LayerSwitcher.setTabActivation(this, !visible);
        this.layer.setVisibility(!visible);
        Event.stop(evt);
    },
    
    /** 
    * @param {event} evt
    */
    doubleClick: function(evt) {
        Event.stop(evt);
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
        backdropLabel.ondblclick = 
            this.doubleClick.bindAsEventListener(backdropLabel);
        backdropLabel.onmousedown = 
            this.singleClick.bindAsEventListener(backdropLabel);

        
        // add label to div
        backdropLabelOuter.appendChild(backdropLabel);
        
        // add div to main LayerSwitcher Div
        this.div.appendChild(backdropLabelOuter);

        Rico.Corner.round(backdropLabelOuter, {corners: "tl bl",
                                      bgColor: "transparent",
                                      color: "white",
                                      blend: false});

        OpenLayers.Control.LayerSwitcher.setTabActivation(backdropLabel, 
                                                        layer.getVisibility());
    },


    /** @type String */
    CLASS_NAME: "OpenLayers.Control.LayerSwitcher"
});


/**
* @private
*
* @param {bool}
*/
OpenLayers.Control.LayerSwitcher.setTabActivation = function(div, activate) {

    var color = (activate) ? OpenLayers.Control.LayerSwitcher.ACTIVE_COLOR
                           : OpenLayers.Control.LayerSwitcher.NONACTIVE_COLOR;

    Rico.Corner.changeColor(div, color);
};

