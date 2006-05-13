// @require: core/util.js
// @require: core/alphaImage.js

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
        this._addButton("panright", "east-mini.png", xy.addX(sz.w), sz);
        this._addButton("pandown", "south-mini.png", centered.addY(sz.h*2), sz);
        this._addButton("zoomin", "zoom-plus-mini.png", centered.addY(sz.h*3), sz);
        centered = centered.addY(sz.h*3);
        for (var i=this.map.getZoomLevels(); i--; i>=0) {
		centered = centered.addY(sz.h);
        	this._addButton("zoomLevel"+i, "zoom-world-mini.png", centered, sz);
        }
        this._addButton("zoomout", "zoom-minus-mini.png", centered.addY(sz.h), sz);
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
        if (this.action.startsWith("zoomLevel")) {
            this.map.zoomTo(parseInt(this.action.substr(9,this.action.length)));
        }
        switch (this.action) {
            case "zoomLevel0":
                this.map.zoomExtent();
                break;
            case "panup": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LatLon(center.lat + (resolution * 50), 
                                        center.lon
                                       )
                                  );
                break;
            case "pandown": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LatLon(center.lat - (resolution * 50), 
                                        center.lon
                                       )
                                  );
                break;
            case "panleft": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LatLon(center.lat, 
                                        center.lon - (resolution * 50)
                                       )
                                  );
                break;
            case "panright": 
                var resolution = this.map.getResolution();
                var center = this.map.getCenter();
                this.map.setCenter(
                  new OpenLayers.LatLon(center.lat, 
                                        center.lon + (resolution * 50)
                                       )
                                  );
                break;
            case "zoomin": this.map.zoomIn(); break;
            case "zoomout": this.map.zoomOut(); break;
            case "zoomextents": this.map.zoomExtent(); break;
        }
        Event.stop(evt);
    }
});
