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
    
        var ulCoord = new OpenLayers.Pixel(this.map.div.clientWidth - 200, 4);
        for( var i = 0; i < this.map.layers.length; i++) {
            var tab = this.createTab(i, ulCoord);
            this.div.appendChild(tab);
            ulCoord = ulCoord.add(0, 35);
        }
        return this.div;
    },
    
    /** 
    * @param {event} evt
    */
    singleClick: function(evt) {
        var visible = this.map.layers[this.layerindex].getVisibility();
        OpenLayers.Control.LayerSwitcher.setTabActivation(this, !visible);
        this.map.layers[this.layerindex].setVisibility(!visible);
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
    * @param {int} index
    * @param {OpenLayers.Pixel} ulCoord
    * 
    * @returns New tab (div) with layer information inside
    * @type DOMElement
    */            
    createTab: function(index, ulCoord) {
    
        var layer = this.map.layers[index];
    
        var divID = "LayerSwitcher_" + layer.name + "_Tab";
        var div = OpenLayers.Util.createDiv(divID, 
                                            ulCoord,
                                            new OpenLayers.Size(200, 20));
        
        div.innerHTML = layer.name;
        div.style.padding = "5px";
        
        //add references onto the div for use in event handlers
        div.layerindex = index;
        div.map = this.map;

        div.ondblclick = this.doubleClick.bindAsEventListener(div);
        div.onmousedown = this.singleClick.bindAsEventListener(div);
        
        OpenLayers.Control.LayerSwitcher.setTabActivation(div, 
                                                        layer.getVisibility());
                                                        
        return div;
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

    div.style.backgroundColor = (activate) ?
        OpenLayers.Control.LayerSwitcher.ACTIVE_COLOR
        : OpenLayers.Control.LayerSwitcher.NONACTIVE_COLOR;

    div.style.color = (activate) ?
        OpenLayers.Control.LayerSwitcher.NONACTIVE_COLOR
        : OpenLayers.Control.LayerSwitcher.ACTIVE_COLOR;
};

