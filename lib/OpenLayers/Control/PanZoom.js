//
// default zoom/pan controls
//
OpenLayers.Control.PanZoom = Class.create();
OpenLayers.Control.PanZoom.prototype = 
  Object.extend( new OpenLayers.Control(), {
    // Array(...)
    buttons: null,

    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    draw: function() {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this);

        // place the controls
        this.buttons = new Array();

        var sz = new OpenLayers.Size(18,18);
        var xy = new OpenLayers.Pixel(4,4);
        var centered = new OpenLayers.Pixel(xy.x+sz.w/2, xy.y);

        this._addButton("panup", "north-mini.png", centered, sz);
        xy.y = centered.y+sz.h;
        this._addButton("panleft", "west-mini.png", xy, sz);
        this._addButton("panright", "east-mini.png", xy.add(sz.w, 0), sz);
        this._addButton("pandown", "south-mini.png", centered.add(0, sz.h*2), sz);
        this._addButton("zoomin", "zoom-plus-mini.png", centered.add(0, sz.h*3), sz);
        centered = centered.add(0, sz.h*4);
        this._addButton("zoomout", "zoom-minus-mini.png", centered, sz);
        return this.div;
    },
    _addButton:function(id, img, xy, sz) {
        var imgLocation = OpenLayers.Util.getImagesLocation() + img;
        // var btn = new ol.AlphaImage("_"+id, imgLocation, xy, sz);
        var btn = OpenLayers.Util.createImage(
                    imgLocation, sz, xy, "absolute", 
                    "OpenLayers_Control_PanZoom_" + id );

        //we want to add the outer div
        this.div.appendChild(btn);

        btn.onmousedown = this.buttonDown.bindAsEventListener(btn);
        btn.ondblclick  = this.doubleClick.bindAsEventListener(btn);
        btn.action = id;
        btn.map = this.map;

        //we want to remember/reference the outer div
        this.buttons.push(btn);
        return btn;
    },
    
    doubleClick: function (evt) {
        Event.stop(evt);
    },
    
    buttonDown: function (evt) {
        switch (this.action) {
            case "panup": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LonLat(center.lon, 
                                        center.lat + (resolution * 50))
                                       );
                break;
            case "pandown": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LonLat(center.lon,
                                        center.lat - (resolution * 50))
                                       );
                break;
            case "panleft": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LonLat(center.lon - (resolution * 50), 
                                        center.lat)
                                       );
                break;
            case "panright": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LonLat(center.lon + (resolution * 50),
                                        center.lat)
                                       );
                break;
            case "zoomin": this.map.zoomIn(); break;
            case "zoomout": this.map.zoomOut(); break;
            case "zoomextents": this.map.zoomExtent(); break;
        }
        Event.stop(evt);
    },
    destroy: function() {
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
        for(i=0; i<this.buttons.length; i++) {
            this.buttons[i].map = null;
        }
    }
});
