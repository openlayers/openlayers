/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.MouseDefaults
 * This class is DEPRECATED in 2.4 and will be removed by 3.0.
 * If you need this functionality, use <OpenLayers.Control.Navigation> 
 * instead!!!
 *
 * This class is DEPRECATED in 2.4 and will be removed by 3.0.
 *     If you need this functionality, use Control.Navigation instead!!!
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.MouseDefaults = OpenLayers.Class(OpenLayers.Control, {

    /** WARNING WARNING WARNING!!!
        This class is DEPRECATED in 2.4 and will be removed by 3.0.
        If you need this functionality, use Control.Navigation instead!!! */

    /** 
     * Property: performedDrag
     * {Boolean}
     */
    performedDrag: false,

    /** 
     * Property: wheelObserver 
     * {Function}
     */
    wheelObserver: null,

    /** 
     * Constructor: OpenLayers.Control.MouseDefaults
     */
    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /**
     * APIMethod: destroy
     */    
    destroy: function() {
        
        if (this.handler) {
            this.handler.destroy();
        }
        this.handler = null;

        this.map.events.un({
            "click": this.defaultClick,
            "dblclick": this.defaultDblClick,
            "mousedown": this.defaultMouseDown,
            "mouseup": this.defaultMouseUp,
            "mousemove": this.defaultMouseMove,
            "mouseout": this.defaultMouseOut,
            scope: this
        });

        //unregister mousewheel events specifically on the window and document
        OpenLayers.Event.stopObserving(window, "DOMMouseScroll", 
                                        this.wheelObserver);
        OpenLayers.Event.stopObserving(window, "mousewheel", 
                                        this.wheelObserver);
        OpenLayers.Event.stopObserving(document, "mousewheel", 
                                        this.wheelObserver);
        this.wheelObserver = null;
                      
        OpenLayers.Control.prototype.destroy.apply(this, arguments);        
    },

    /**
     * Method: draw
     */
    draw: function() {
        this.map.events.on({
            "click": this.defaultClick,
            "dblclick": this.defaultDblClick,
            "mousedown": this.defaultMouseDown,
            "mouseup": this.defaultMouseUp,
            "mousemove": this.defaultMouseMove,
            "mouseout": this.defaultMouseOut,
            scope: this
        });

        this.registerWheelEvents();

    },

    /**
     * Method: registerWheelEvents
     */
    registerWheelEvents: function() {

        this.wheelObserver = OpenLayers.Function.bindAsEventListener(
            this.onWheelEvent, this
        );
        
        //register mousewheel events specifically on the window and document
        OpenLayers.Event.observe(window, "DOMMouseScroll", this.wheelObserver);
        OpenLayers.Event.observe(window, "mousewheel", this.wheelObserver);
        OpenLayers.Event.observe(document, "mousewheel", this.wheelObserver);
    },

    /**
     * Method: defaultClick
     * 
     * Parameters:
     * evt - {Event} 
     *
     * Returns:
     * {Boolean}
     */
    defaultClick: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        var notAfterDrag = !this.performedDrag;
        this.performedDrag = false;
        return notAfterDrag;
    },

    /**
     * Method: defaultDblClick
     * 
     * Parameters:
     * evt - {Event} 
     */
    defaultDblClick: function (evt) {
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
        document.onselectstart = OpenLayers.Function.False;
        OpenLayers.Event.stop(evt);
    },

    /**
     * Method: defaultMouseMove
     *
     * Parameters:
     * evt - {Event} 
     */
    defaultMouseMove: function (evt) {
        // record the mouse position, used in onWheelEvent
        this.mousePosition = evt.xy.clone();

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
     * Method: defaultMouseUp
     * 
     * Parameters:
     * evt - {<OpenLayers.Event>} 
     */
    defaultMouseUp: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        if (this.zoomBox) {
            this.zoomBoxEnd(evt);    
        } else {
            if (this.performedDrag) {
                this.map.setCenter(this.map.center);
            }
        }
        document.onselectstart=null;
        this.mouseDragStart = null;
        this.map.div.style.cursor = "";
    },

    /**
     * Method: defaultMouseOut
     * 
     * Parameters:
     * evt - {Event} 
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


    /** 
     * Method: defaultWheelUp
     * User spun scroll wheel up
     * 
     */
    defaultWheelUp: function(evt) {
        if (this.map.getZoom() <= this.map.getNumZoomLevels()) {
            this.map.setCenter(this.map.getLonLatFromPixel(evt.xy),
                               this.map.getZoom() + 1);
        }
    },

    /**
     * Method: defaultWheelDown
     * User spun scroll wheel down
     */
    defaultWheelDown: function(evt) {
        if (this.map.getZoom() > 0) {
            this.map.setCenter(this.map.getLonLatFromPixel(evt.xy),
                               this.map.getZoom() - 1);
        }
    },

    /**
     * Method: zoomBoxEnd
     * Zoombox function. 
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
                this.map.zoomToExtent(bounds);
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
     * Method: removeZoomBox
     * Remove the zoombox from the screen and nullify our reference to it.
     */
    removeZoomBox: function() {
        this.map.viewPortDiv.removeChild(this.zoomBox);
        this.zoomBox = null;
    },


/**
 *  Mouse ScrollWheel code thanks to http://adomas.org/javascript-mouse-wheel/
 */


    /**
     * Method: onWheelEvent
     * Catch the wheel event and handle it xbrowserly
     *
     * Parameters: 
     * e - {Event} 
     */
    onWheelEvent: function(e){
    
        // first determine whether or not the wheeling was inside the map
        var inMap = false;
        var elem = OpenLayers.Event.element(e);
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
                if (window.opera && window.opera.version() < 9.2) {
                    delta = -delta;
                }
            } else if (e.detail) {
                delta = -e.detail / 3;
            }
            if (delta) {
                // add the mouse position to the event because mozilla has a bug
                // with clientX and clientY (see https://bugzilla.mozilla.org/show_bug.cgi?id=352179)
                // getLonLatFromViewPortPx(e) returns wrong values
                e.xy = this.mousePosition;

                if (delta < 0) {
                   this.defaultWheelDown(e);
                } else {
                   this.defaultWheelUp(e);
                }
            }
            
            //only wheel the map, not the window
            OpenLayers.Event.stop(e);
        }
    },

    CLASS_NAME: "OpenLayers.Control.MouseDefaults"
});
