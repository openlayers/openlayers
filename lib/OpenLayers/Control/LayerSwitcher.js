OpenLayers.Control.LayerSwitcher = Class.create();
OpenLayers.Control.LayerSwitcher.prototype = 
  Object.extend( new OpenLayers.Control(), {
    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },
    
    draw: function() {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this);
        var pixel = new OpenLayers.Pixel(this.map.div.clientWidth-200,4);
        for(i=0; i<this.map.layers.length; i++) {
            var div = OpenLayers.Util.createDiv("LayerControl_layer"+i,pixel,new OpenLayers.Size(200,20));
            div.innerHTML = this.map.layers[i].name;
            div.style.backgroundColor="white";
            div.style.padding="5px";
            div.layerid = i;
            div.map = this.map;
            div.ondblclick = this.doubleClick.bindAsEventListener(div);
            div.onmousedown = this.singleClick.bindAsEventListener(div);
            this.div.appendChild(div);
            pixel = pixel.addY(35);
        }
        return this.div;
    },
    singleClick: function(evt) {
        var status = this.map.layers[this.layerid].getVisibility();
        this.map.layers[this.layerid].setVisibility(!status);
        if (status) {
            this.style.backgroundColor="black";
            this.style.color="white";
        } else {
            this.style.backgroundColor="white";
            this.style.color="black";
        }
        Event.stop(evt);
    },
    doubleClick: function(evt) {
        Event.stop(evt);
    }
});
