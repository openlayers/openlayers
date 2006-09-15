/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Control.js
 */
OpenLayers.Control.MouseDefaults = Class.create();
OpenLayers.Control.MouseDefaults.prototype = 
  Object.extend( new OpenLayers.Control(), {

    /** @type Boolean */
    performedDrag: false,

    /** 
     * @constructor
     */
    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);

        //register mousewheel events specifically on the window and document
        Event.observe(window, "DOMMouseScroll", 
                      this.onWheelEvent.bindAsEventListener(this));
        Event.observe(window, "mousewheel", 
                      this.onWheelEvent.bindAsEventListener(this));
        Event.observe(document, "mousewheel", 
                      this.onWheelEvent.bindAsEventListener(this));
    },

    /**
     * 
     */    
    draw: function() {
        this.map.events.register( "click", this, this.defaultClick );
        this.map.events.register( "dblclick", this, this.defaultDblClick );
        this.map.events.register( "mousedown", this, this.defaultMouseDown );
        this.map.events.register( "mouseup", this, this.defaultMouseUp );
        this.map.events.register( "mousemove", this, this.defaultMouseMove );
        this.map.events.register( "mouseout", this, this.defaultMouseOut );
    },

    /**
     * @param {Event} evt
     * 
     * @type Boolean
     */
    defaultClick: function (evt) {
        if (!Event.isLeftClick(evt)) return;
        var notAfterDrag = !this.performedDrag;
        this.performedDrag = false;
        return notAfterDrag;
    },

    /**
    * @param {Event} evt
    */
    defaultDblClick: function (evt) {
        var newCenter = this.map.getLonLatFromViewPortPx( evt.xy ); 
        this.map.setCenter(newCenter, this.map.zoom + 1);
        Event.stop(evt);
        return false;
    },

    /**
    * @param {Event} evt
    */
    defaultMouseDown: function (evt) {
        if (!Event.isLeftClick(evt)) return;
        this.mouseDragStart = evt.xy.clone();
        this.performedDrag  = false;
        if (evt.shiftKey) {
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
            this.map.viewPortDiv.appendChild(this.zoomBox);
        }
        document.onselectstart=function() { return false; }
        Event.stop(evt);
    },

    /**
    * @param {Event} evt
    */
    defaultMouseMove: function (evt) {
        if (this.mouseDragStart != null) {
            if (this.zoomBox) {
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
            } else {
                var deltaX = this.mouseDragStart.x - evt.xy.x;
                var deltaY = this.mouseDragStart.y - evt.xy.y;
                var size = this.map.getSize();
                var newXY = new OpenLayers.Pixel(size.w / 2 + deltaX,
                                                 size.h / 2 + deltaY);
                var newCenter = this.map.getLonLatFromViewPortPx( newXY ); 
                this.map.setCenter(newCenter, null, true);
                this.mouseDragStart = evt.xy.clone();
                this.map.div.style.cursor = "move";
            }
            this.performedDrag = true;
        }
    },

    /**
    * @param {Event} evt
    */
    defaultMouseUp: function (evt) {
        if (!Event.isLeftClick(evt)) return;
        if (this.zoomBox) {
            this.zoomBoxEnd(evt);    
        } else {
            if (this.performedDrag) {
                this.map.setCenter(this.map.center);
            }
        }
        document.onselectstart=null;
        this.mouseDragStart = null;
        this.map.div.style.cursor = "default";
    },

    /**
    * @param {Event} evt
    */
    defaultMouseOut: function (evt) {
        if (this.mouseDragStart != null && 
            OpenLayers.Util.mouseLeft(evt, this.map.div)) {
            if (this.zoomBox) {
                this.removeZoomBox();
            }
            this.mouseDragStart = null;
        }
    },


    /** User spun scroll wheel up
     * 
     */
    defaultWheelUp: function()  {
        this.map.zoomIn();
    },

    /** User spun scroll wheel down
     * 
     */
    defaultWheelDown: function()  {
        this.map.zoomOut();
    },

    /** Zoombox function. 
     *
     */
    zoomBoxEnd: function(evt) {
        if (this.mouseDragStart != null) {
            if (Math.abs(this.mouseDragStart.x - evt.xy.x) > 5 ||    
                Math.abs(this.mouseDragStart.y - evt.xy.y) > 5) {   
                var start = this.map.getLonLatFromViewPortPx( this.mouseDragStart ); 
                var end = this.map.getLonLatFromViewPortPx( evt.xy );
                var top = Math.max(start.lat, end.lat);
                var bottom = Math.min(start.lat, end.lat);
                var left = Math.min(start.lon, end.lon);
                var right = Math.max(start.lon, end.lon);
                var bounds = new OpenLayers.Bounds(left, bottom, right, top);
                var zoom = this.map.getZoomForExtent(bounds);
                this.map.setCenter(new OpenLayers.LonLat(
                  (start.lon + end.lon) / 2,
                  (start.lat + end.lat) / 2
                 ), zoom);
            } else {
                var end = this.map.getLonLatFromViewPortPx( evt.xy );
                this.map.setCenter(new OpenLayers.LonLat(
                  (end.lon),
                  (end.lat)
                 ), this.map.getZoom() + 1);
            }    
            this.removeZoomBox();
       }
    },

    /**
     * Remove the zoombox from the screen and nullify our reference to it.
     */
    removeZoomBox: function() {
        this.map.viewPortDiv.removeChild(this.zoomBox);
        this.zoomBox = null;
    },


/**
 *  Mouse ScrollWheel code thanks to http://adomas.org/javascript-mouse-wheel/
 */


    /** Catch the wheel event and handle it xbrowserly
     * 
     * @param {Event} e
     */
    onWheelEvent: function(e){
    
        // first determine whether or not the wheeling was inside the map
        var inMap = false;
        var elem = Event.element(e);
        while(elem != null) {
            if (this.map && elem == this.map.div) {
                inMap = true;
                break;
            }
            elem = elem.parentNode;
        }
        
        if (inMap) {
            
            var delta = 0;
            if (!e) {
                e = window.event;
            }
            if (e.wheelDelta) {
                delta = e.wheelDelta/120; 
                if (window.opera) {
                    delta = -delta;
                }
            } else if (e.detail) {
                delta = -e.detail / 3;
            }
            if (delta) {
                if (delta < 0) {
                   this.defaultWheelDown();
                } else {
                   this.defaultWheelUp();
                }
            }
            
            //only wheel the map, not the window
            Event.stop(e);
        }
    },
    
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.MouseDefaults"
});

