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
        var pixel = new OpenLayers.Pixel(this.map.div.clientWidth - 200, 4);
        this.div.innerHTML = "";
        for(i=0; i < this.map.layers.length; i++) {
            var div = $('LayerControl_layer' + i);
            if (!div) {
                div = OpenLayers.Util.createDiv("LayerControl_layer" + i,
                                                pixel,
                                                new OpenLayers.Size(200, 20));
                
                div.innerHTML = this.map.layers[i].name;
                var visible = this.map.layers[i].getVisibility();
                if (!visible) {
                    div.style.backgroundColor = 
                        OpenLayers.Control.LayerSwitcher.NONACTIVE_COLOR;
                    div.style.color = 
                        OpenLayers.Control.LayerSwitcher.ACTIVE_COLOR;
                } else {
                    div.style.backgroundColor = 
                        OpenLayers.Control.LayerSwitcher.ACTIVE_COLOR;
                    div.style.color = 
                        OpenLayers.Control.LayerSwitcher.NONACTIVE_COLOR;
                }
                div.style.padding = "5px";
                
                //tag references onto the div for use in event handlers
                div.layerid = i;
                div.map = this.map;

                div.ondblclick = this.doubleClick.bindAsEventListener(div);
                div.onmousedown = this.singleClick.bindAsEventListener(div);
                this.div.appendChild(div);
            }
            pixel = pixel.add(0, 35);
        }
        return this.div;
    },
    
    /** 
    * @param {event} evt
    */
    singleClick: function(evt) {
        var visible = this.map.layers[this.layerid].getVisibility();
        if (visible) {
            this.style.backgroundColor = 
                OpenLayers.Control.LayerSwitcher.NONACTIVE_COLOR;
            this.style.color = 
                OpenLayers.Control.LayerSwitcher.ACTIVE_COLOR;
        } else {
            this.style.backgroundColor = 
                OpenLayers.Control.LayerSwitcher.ACTIVE_COLOR;
            this.style.color = 
                OpenLayers.Control.LayerSwitcher.NONACTIVE_COLOR;
        }
        this.map.layers[this.layerid].setVisibility(!visible);
        Event.stop(evt);
    },
    
    /** 
    * @param {event} evt
    */
    doubleClick: function(evt) {
        Event.stop(evt);
    },

    /** @type String */
    CLASS_NAME: "OpenLayers.Control.LayerSwitcher"
});
