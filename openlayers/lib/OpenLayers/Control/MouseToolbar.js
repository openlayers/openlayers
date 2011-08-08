/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Control/MouseDefaults.js
 */

/**
 * Class: OpenLayers.Control.MouseToolbar
 * This class is DEPRECATED in 2.4 and will be removed by 3.0.
 * If you need this functionality, use <OpenLayers.Control.NavToolbar>
 * instead!!! 
 */
OpenLayers.Control.MouseToolbar = OpenLayers.Class(
                                            OpenLayers.Control.MouseDefaults, {
    
    /**
     * Property: mode
     */ 
    mode: null,
    /**
     * Property: buttons
     */
    buttons: null,
    
    /**
     * APIProperty: direction
     * {String} 'vertical' or 'horizontal'
     */
    direction: "vertical",
    
    /**
     * Property: buttonClicked
     * {String}
     */
    buttonClicked: null,
    
    /**
     * Constructor: OpenLayers.Control.MouseToolbar
     *
     * Parameters:
     * position - {<OpenLayers.Pixel>}
     * direction - {String}
     */
    initialize: function(position, direction) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.position = new OpenLayers.Pixel(OpenLayers.Control.MouseToolbar.X,
                                             OpenLayers.Control.MouseToolbar.Y);
        if (position) {
            this.position = position;
        }
        if (direction) {
            this.direction = direction; 
        }
        this.measureDivs = [];
    },
    
    /**
     * APIMethod: destroy 
     */
    destroy: function() {
        for( var btnId in this.buttons) {
            var btn = this.buttons[btnId];
            btn.map = null;
            btn.events.destroy();
        }
        OpenLayers.Control.MouseDefaults.prototype.destroy.apply(this, 
                                                                 arguments);
    },
    
    /**
     * Method: draw
     */
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments); 
        OpenLayers.Control.MouseDefaults.prototype.draw.apply(this, arguments);
        this.buttons = {};
        var sz = new OpenLayers.Size(28,28);
        var centered = new OpenLayers.Pixel(OpenLayers.Control.MouseToolbar.X,0);
        this._addButton("zoombox", "drag-rectangle-off.png", "drag-rectangle-on.png", centered, sz, "Shift->Drag to zoom to area");
        centered = centered.add((this.direction == "vertical" ? 0 : sz.w), (this.direction == "vertical" ? sz.h : 0));
        this._addButton("pan", "panning-hand-off.png", "panning-hand-on.png", centered, sz, "Drag the map to pan.");
        centered = centered.add((this.direction == "vertical" ? 0 : sz.w), (this.direction == "vertical" ? sz.h : 0));
        this.switchModeTo("pan");

        return this.div;
    },
    
    /**
     * Method: _addButton
     */
    _addButton:function(id, img, activeImg, xy, sz, title) {
        var imgLocation = OpenLayers.Util.getImagesLocation() + img;
        var activeImgLocation = OpenLayers.Util.getImagesLocation() + activeImg;
        // var btn = new ol.AlphaImage("_"+id, imgLocation, xy, sz);
        var btn = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_MouseToolbar_" + id, 
                                    xy, sz, imgLocation, "absolute");

        //we want to add the outer div
        this.div.appendChild(btn);
        btn.imgLocation = imgLocation;
        btn.activeImgLocation = activeImgLocation;
        
        btn.events = new OpenLayers.Events(this, btn, null, true);
        btn.events.on({
            "mousedown": this.buttonDown,
            "mouseup": this.buttonUp,
            "dblclick": OpenLayers.Event.stop,
            scope: this
        });
        btn.action = id;
        btn.title = title;
        btn.alt = title;
        btn.map = this.map;

        //we want to remember/reference the outer div
        this.buttons[id] = btn;
        return btn;
    },

    /**
     * Method: buttonDown
     *
     * Parameters:
     * evt - {Event} 
     */
    buttonDown: function(evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        this.buttonClicked = evt.element.action;
        OpenLayers.Event.stop(evt);
    },

    /**
     * Method: buttonUp
     *
     * Parameters:
     * evt - {Event} 
     */
    buttonUp: function(evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        if (this.buttonClicked != null) {
            if (this.buttonClicked == evt.element.action) {
                this.switchModeTo(evt.element.action);
            }
            OpenLayers.Event.stop(evt);
            this.buttonClicked = null;
        }
    },
    
    /**
     * Method: defaultDblClick 
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultDblClick: function (evt) {
        this.switchModeTo("pan");
        this.performedDrag = false;
        var newCenter = this.map.getLonLatFromViewPortPx( evt.xy ); 
        this.map.setCenter(newCenter, this.map.zoom + 1);
        OpenLayers.Event.stop(evt);
        return false;
    },

    /**
     * Method: defaultMouseDown
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultMouseDown: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        this.mouseDragStart = evt.xy.clone();
        this.performedDrag = false;
        this.startViaKeyboard = false;
        if (evt.shiftKey && this.mode !="zoombox") {
            this.switchModeTo("zoombox");
            this.startViaKeyboard = true;
        } else if (evt.altKey && this.mode !="measure") {
            this.switchModeTo("measure");
        } else if (!this.mode) {
            this.switchModeTo("pan");
        }
        
        switch (this.mode) {
            case "zoombox":
                this.map.div.style.cursor = "crosshair";
                this.zoomBox = OpenLayers.Util.createDiv('zoomBox',
                                                         this.mouseDragStart,
                                                         null,
                                                         null,
                                                         "absolute",
                                                         "2px solid red");
                this.zoomBox.style.backgroundColor = "white";
                this.zoomBox.style.filter = "alpha(opacity=50)"; // IE
                this.zoomBox.style.opacity = "0.50";
                this.zoomBox.style.fontSize = "1px";
                this.zoomBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
                this.map.eventsDiv.appendChild(this.zoomBox);
                this.performedDrag = true;
                break;
            case "measure":
                var distance = "";
                if (this.measureStart) {
                    var measureEnd = this.map.getLonLatFromViewPortPx(this.mouseDragStart);
                    distance = OpenLayers.Util.distVincenty(this.measureStart, measureEnd);
                    distance = Math.round(distance * 100) / 100;
                    distance = distance + "km";
                    this.measureStartBox = this.measureBox;
                }    
                this.measureStart = this.map.getLonLatFromViewPortPx(this.mouseDragStart);;
                this.measureBox = OpenLayers.Util.createDiv(null,
                                                         this.mouseDragStart.add(
                                                           -2-parseInt(this.map.layerContainerDiv.style.left),
                                                           -2-parseInt(this.map.layerContainerDiv.style.top)),
                                                         null,
                                                         null,
                                                         "absolute");
                this.measureBox.style.width="4px";
                this.measureBox.style.height="4px";
                this.measureBox.style.fontSize = "1px";
                this.measureBox.style.backgroundColor="red";
                this.measureBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
                this.map.layerContainerDiv.appendChild(this.measureBox);
                if (distance) {
                    this.measureBoxDistance = OpenLayers.Util.createDiv(null,
                                                         this.mouseDragStart.add(
                                                           -2-parseInt(this.map.layerContainerDiv.style.left),
                                                           2-parseInt(this.map.layerContainerDiv.style.top)),
                                                         null,
                                                         null,
                                                         "absolute");
                    
                    this.measureBoxDistance.innerHTML = distance;
                    this.measureBoxDistance.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
                    this.map.layerContainerDiv.appendChild(this.measureBoxDistance);
                    this.measureDivs.push(this.measureBoxDistance);
                }
                this.measureBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
                this.map.layerContainerDiv.appendChild(this.measureBox);
                this.measureDivs.push(this.measureBox);
                break;
            default:
                this.map.div.style.cursor = "move";
                break;
        }
        document.onselectstart = OpenLayers.Function.False;
        OpenLayers.Event.stop(evt);
    },

    /**
     * Method: switchModeTo 
     *
     * Parameters:
     * mode - {String} 
     */
    switchModeTo: function(mode) {
        if (mode != this.mode) {
            

            if (this.mode && this.buttons[this.mode]) {
                OpenLayers.Util.modifyAlphaImageDiv(this.buttons[this.mode], null, null, null, this.buttons[this.mode].imgLocation);
            }
            if (this.mode == "measure" && mode != "measure") {
                for(var i=0, len=this.measureDivs.length; i<len; i++) {
                    if (this.measureDivs[i]) { 
                        this.map.layerContainerDiv.removeChild(this.measureDivs[i]);
                    }
                }
                this.measureDivs = [];
                this.measureStart = null;
            }
            this.mode = mode;
            if (this.buttons[mode]) {
                OpenLayers.Util.modifyAlphaImageDiv(this.buttons[mode], null, null, null, this.buttons[mode].activeImgLocation);
            }
            switch (this.mode) {
                case "zoombox":
                    this.map.div.style.cursor = "crosshair";
                    break;
                default:
                    this.map.div.style.cursor = "";
                    break;
            }

        } 
    }, 

    /**
     * Method: leaveMode
     */
    leaveMode: function() {
        this.switchModeTo("pan");
    },
    
    /**
     * Method: defaultMouseMove
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultMouseMove: function (evt) {
        if (this.mouseDragStart != null) {
            switch (this.mode) {
                case "zoombox": 
                    var deltaX = Math.abs(this.mouseDragStart.x - evt.xy.x);
                    var deltaY = Math.abs(this.mouseDragStart.y - evt.xy.y);
                    this.zoomBox.style.width = Math.max(1, deltaX) + "px";
                    this.zoomBox.style.height = Math.max(1, deltaY) + "px";
                    if (evt.xy.x < this.mouseDragStart.x) {
                        this.zoomBox.style.left = evt.xy.x+"px";
                    }
                    if (evt.xy.y < this.mouseDragStart.y) {
                        this.zoomBox.style.top = evt.xy.y+"px";
                    }
                    break;
                default:
                    var deltaX = this.mouseDragStart.x - evt.xy.x;
                    var deltaY = this.mouseDragStart.y - evt.xy.y;
                    var size = this.map.getSize();
                    var newXY = new OpenLayers.Pixel(size.w / 2 + deltaX,
                                                     size.h / 2 + deltaY);
                    var newCenter = this.map.getLonLatFromViewPortPx( newXY ); 
                    this.map.setCenter(newCenter, null, true);
                    this.mouseDragStart = evt.xy.clone();
            }
            this.performedDrag = true;
        }
    },

    /**
     * Method: defaultMouseUp
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultMouseUp: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        switch (this.mode) {
            case "zoombox":
                this.zoomBoxEnd(evt);
                if (this.startViaKeyboard) {
                    this.leaveMode();
                }
                break;
            case "pan":
                if (this.performedDrag) {
                    this.map.setCenter(this.map.center);
                }        
        }
        document.onselectstart = null;
        this.mouseDragStart = null;
        this.map.div.style.cursor = "default";
    },

    /**
     * Method: defaultMouseOut
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultMouseOut: function (evt) {
        if (this.mouseDragStart != null
            && OpenLayers.Util.mouseLeft(evt, this.map.eventsDiv)) {
            if (this.zoomBox) {
                this.removeZoomBox();
                if (this.startViaKeyboard) {
                    this.leaveMode();
                }
            }
            this.mouseDragStart = null;
            this.map.div.style.cursor = "default";
        }
    },

    /**
     * Method: defaultClick
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultClick: function (evt) {
        if (this.performedDrag)  {
            this.performedDrag = false;
            return false;
        }
    },
    
    CLASS_NAME: "OpenLayers.Control.MouseToolbar"
});

OpenLayers.Control.MouseToolbar.X = 6;
OpenLayers.Control.MouseToolbar.Y = 300;
