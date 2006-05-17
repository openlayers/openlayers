/** 
* @class
*/
OpenLayers.Control.LayerSwitcher = Class.create();
OpenLayers.Control.LayerSwitcher.prototype = 
  Object.extend( new OpenLayers.Control(), {

    /** color used in the UI to show a layer is active/displayed
    * @type String */
    ACTIVE_COLOR: "darkblue",

    /** color used in the UI to show a layer is deactivated/hidden
    * @type String */
    NONACTIVE_COLOR: "lightblue",

    /**
    * @constructor
    */
    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /**
    * @type DOMElement
    */  
    draw: function() {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this);
        this.map.events.register("addlayer", this, this.redraw);
        return this.redraw();    
    },

    /**
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
                var status = this.map.layers[i].getVisibility();
                if (!status) {
                    div.style.backgroundColor = this.NONACTIVE_COLOR;
                    div.style.color = this.ACTIVE_COLOR;
                } else {
                    div.style.backgroundColor = this.ACTIVE_COLOR;
                    div.style.color = this.NONACTIVE_COLOR;
                }
                div.style.padding = "5px";
                div.layerid = i;
                div.map = this.map;
                div.ondblclick = this.doubleClick.bindAsEventListener(div);
                div.onmousedown = this.singleClick.bindAsEventListener(div);
            }
            this.div.appendChild(div);
            pixel = pixel.add(0, 35);
        }
        return this.div;
    },
    
    /** 
    * @param {event} evt
    */
    singleClick: function(evt) {
        var status = this.map.layers[this.layerid].getVisibility();
        this.map.layers[this.layerid].setVisibility(!status);
        if (status) {
            this.style.backgroundColor = this.NONACTIVE_COLOR;
            this.style.color = this.ACTIVE_COLOR;
        } else {
            this.style.backgroundColor = this.ACTIVE_COLOR;
            this.style.color = this.NONACTIVE_COLOR;
        }
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
