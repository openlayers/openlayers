/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/** 
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/BaseTypes.js
 * @requires OpenLayers/Events.js
 *
 * Class: OpenLayers.Control.OverviewMap
 * Create an overview map to display the extent of your main map and provide
 * additional navigation control.  Create a new overview map with the
 * <OpenLayers.Control.OverviewMap> constructor.
 *
 * Inerits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.OverviewMap = OpenLayers.Class(OpenLayers.Control, {

    /**
     * Property: id
     * {String} For div.id
     */
    id:  "OverviewMap",

    /**
     * Property: element
     * {DOMElement} The DOM element that contains the overview map
     */
    element: null,
    
    /**
     * APIProperty: ovmap
     * {<OpenLayers.Map>} A reference to the overvew map itself.
     */
    ovmap: null,
        
    /**
     * APIProperty: size
     * {<OpenLayers.Size>} The overvew map size in pixels.  Note that this is
     * the size of the map itself - the element that contains the map (default
     * class name olControlOverviewMapElement) may have padding or other style
     * attributes added via CSS.
     */
    size: new OpenLayers.Size(180, 90),

    /**
     * APIProperty: layers
     * {Array(<OpenLayers.Layer>)} Ordered list of layers in the overview map.
     * If none are sent at construction, the base layer for the main map is used.
     */
    layers: null,

    /**
     * APIProperty: minRatio
     * {Numver} The ratio of the overview map resolution to the main map
     * resolution at which to zoom farther out on the overview map.
     */
    minRatio: 8,

    /**
     * APIProperty: maxRatio
     * {Float} The ratio of the overview map resolution to the main map
     * resolution at which to zoom farther in on the overview map.
     */
    maxRatio: 32,

    /**
     * APIProperty: mapOptions
     * {Object} An object containing any non-default properties to be sent to
     * the overview map's map constructor.  These should include any non-default
     * options that the main map was constructed with.
     */
    mapOptions: null,

    /**
     * Constructor: OpenLayers.Control.OverviewMap
     * Create a new overview map
     *
     * Parameters:
     * object - {Object} Properties of this object will be set on the overview
     * map object.  Note, to set options on the map object contained in this
     * control, set <mapOptions> as one of the options properties.
     */
    initialize: function(options) {
        this.layers = new Array();
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * APIMethod: destroy
     * Deconstruct the control
     */
    destroy: function() {
        if (!this.mapDiv) { // we've already been destroyed
            return;
        }
        this.mapDiv.removeChild(this.extentRectangle);
        this.extentRectangle = null;
        this.rectEvents.destroy();
        this.rectEvents = null;

        this.ovmap.destroy();
        this.ovmap = null;
        
        this.element.removeChild(this.mapDiv);
        this.mapDiv = null;
        this.mapDivEvents.destroy(); 
        this.mapDivEvents = null;

        this.div.removeChild(this.element);
        this.element = null;
        this.elementEvents.destroy();
        this.elementEvents = null;

        if (this.maximizeDiv) {
            OpenLayers.Event.stopObservingElement(this.maximizeDiv);
            this.div.removeChild(this.maximizeDiv);
            this.maximizeDiv = null;
        }
        
        if (this.minimizeDiv) {
            OpenLayers.Event.stopObservingElement(this.minimizeDiv);
            this.div.removeChild(this.minimizeDiv);
            this.minimizeDiv = null;
        }
        
        this.map.events.unregister('moveend', this, this.update);
        this.map.events.unregister("changebaselayer", this, 
                                    this.baseLayerDraw);

        OpenLayers.Control.prototype.destroy.apply(this, arguments);    
    },

    /**
     * Method: draw
     * Render the control in the browser.
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        if(!(this.layers.length > 0)) {
            if (this.map.baseLayer) {
                var layer = this.map.baseLayer.clone();
                this.layers = [layer];
            } else {
                this.map.events.register("changebaselayer", this, this.baseLayerDraw);
                return this.div;
            }
        }

        // create overview map DOM elements
        this.element = document.createElement('div');
        this.element.className = this.displayClass + 'Element';
        this.element.style.display = 'none';

        this.mapDiv = document.createElement('div');
        this.mapDiv.style.width = this.size.w + 'px';
        this.mapDiv.style.height = this.size.h + 'px';
        this.mapDiv.style.position = 'relative';
        this.mapDiv.style.overflow = 'hidden';
        this.mapDiv.id = OpenLayers.Util.createUniqueID('overviewMap');
        
        this.extentRectangle = document.createElement('div');
        this.extentRectangle.style.position = 'absolute';
        this.extentRectangle.style.zIndex = 1000;  //HACK
        this.extentRectangle.style.overflow = 'hidden';
        this.extentRectangle.style.backgroundImage = 'url(' +
                                        OpenLayers.Util.getImagesLocation() +
                                        'blank.gif)';
        this.extentRectangle.className = this.displayClass+'ExtentRectangle';
        this.mapDiv.appendChild(this.extentRectangle);
                
        this.element.appendChild(this.mapDiv);  

        this.div.appendChild(this.element);

        this.map.events.register('moveend', this, this.update);
        
        // Set up events.  The image div recenters the map on click.
        // The extent rectangle can be dragged to recenter the map.
        // If the mousedown happened elsewhere, then mousemove and mouseup
        // should slip through.
        this.elementEvents = new OpenLayers.Events(this, this.element);
        this.elementEvents.register('mousedown', this, function(e) {
            OpenLayers.Event.stop(e);
        });
        this.elementEvents.register('click', this, function(e) {
            OpenLayers.Event.stop(e);
        });
        this.elementEvents.register('dblclick', this, function(e) {
            OpenLayers.Event.stop(e);
        });
        this.rectEvents = new OpenLayers.Events(this, this.extentRectangle,
                                                null, true);
        this.rectEvents.register('mouseout', this, this.rectMouseOut);
        this.rectEvents.register('mousedown', this, this.rectMouseDown);
        this.rectEvents.register('mousemove', this, this.rectMouseMove);
        this.rectEvents.register('mouseup', this, this.rectMouseUp);
        this.rectEvents.register('click', this, function(e) {
            OpenLayers.Event.stop(e);
        });
        this.rectEvents.register('dblclick', this, this.rectDblClick );
        this.mapDivEvents = new OpenLayers.Events(this, this.mapDiv);
        this.mapDivEvents.register('click', this, this.mapDivClick);

        // Optionally add min/max buttons if the control will go in the
        // map viewport.
        if(!this.outsideViewport) {
            this.div.className = this.displayClass + 'Container';
            var imgLocation = OpenLayers.Util.getImagesLocation();
            // maximize button div
            var img = imgLocation + 'layer-switcher-maximize.png';
            this.maximizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                        this.displayClass + 'MaximizeButton', 
                                        null, 
                                        new OpenLayers.Size(18,18), 
                                        img, 
                                        'absolute');
            this.maximizeDiv.style.display = 'none';
            this.maximizeDiv.className = this.displayClass + 'MaximizeButton';
            OpenLayers.Event.observe(this.maximizeDiv, 
                          'click', 
                          this.maximizeControl.bindAsEventListener(this));
            OpenLayers.Event.observe(this.maximizeDiv,
                          'dblclick',
                          function(e) {
                              OpenLayers.Event.stop(e);
                          });
            this.div.appendChild(this.maximizeDiv);
    
            // minimize button div
            var img = imgLocation + 'layer-switcher-minimize.png';
            this.minimizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                        'OpenLayers_Control_minimizeDiv', 
                                        null, 
                                        new OpenLayers.Size(18,18), 
                                        img, 
                                        'absolute');
            this.minimizeDiv.style.display = 'none';
            this.minimizeDiv.className = this.displayClass + 'MinimizeButton';
            OpenLayers.Event.observe(this.minimizeDiv, 
                          'click', 
                          this.minimizeControl.bindAsEventListener(this));
            OpenLayers.Event.observe(this.minimizeDiv,
                          'dblclick',
                          function(e) {
                              OpenLayers.Event.stop(e);
                          });
            this.div.appendChild(this.minimizeDiv);
            
            this.minimizeControl();
        } else {
            // show the overview map
            this.element.style.display = '';
        }
        if(this.map.getExtent()) {
            this.update();
        }
        return this.div;
    },
    
    /**
     * Method: baseLayerDraw
     * Draw the base layer - called if unable to complete in the initial draw
     */
    baseLayerDraw: function() {
        this.draw();
        this.map.events.unregister("changebaselayer", this, this.baseLayerDraw);
    },

    /**
     * Method: rectMouseOut
     * Handle browser events
     *
     * Parameters:
     * evt - {<OpenLayers.Event>} evt
     */
    rectMouseOut: function (evt) {
        if(this.rectDragStart != null) {
            if(this.performedRectDrag) {
                this.rectMouseMove(evt);
                var rectPxBounds = this.getRectPxBounds(); 
                // if we're off of the overview map, update the main map
                // otherwise, keep moving the rect
                if((rectPxBounds.top <= 0) || (rectPxBounds.left <= 0) || 
                   (rectPxBounds.bottom >= this.size.h - this.hComp) || 
                   (rectPxBounds.right >= this.size.w - this.wComp)) {
                    this.updateMapToRect();
                } else {
                    return; 
                }
            }
            document.onselectstart = null;
            this.rectDragStart = null;
        }
    },

    /**
     * Method: rectMouseDown
     * Handle browser events
     *
     * Parameters:
     * evt - {<OpenLayers.Event>} evt
     */
    rectMouseDown: function (evt) {
        if(!OpenLayers.Event.isLeftClick(evt)) return;
        this.rectDragStart = evt.xy.clone();
        this.performedRectDrag = false;
        OpenLayers.Event.stop(evt);
    },

    /**
     * Method: rectMouseMove
     * Handle browser events
     *
     * Parameters:
     * evt - {<OpenLayers.Event>} evt
     */
    rectMouseMove: function(evt) {
        if(this.rectDragStart != null) {
            var deltaX = this.rectDragStart.x - evt.xy.x;
            var deltaY = this.rectDragStart.y - evt.xy.y;
            var rectPxBounds = this.getRectPxBounds();
            var rectTop = rectPxBounds.top;
            var rectLeft = rectPxBounds.left;
            var rectHeight = Math.abs(rectPxBounds.getHeight());
            var rectWidth = rectPxBounds.getWidth();
            // don't allow dragging off of parent element
            var newTop = Math.max(0, (rectTop - deltaY));
            newTop = Math.min(newTop,
                              this.ovmap.size.h - this.hComp - rectHeight);
            var newLeft = Math.max(0, (rectLeft - deltaX));
            newLeft = Math.min(newLeft,
                               this.ovmap.size.w - this.wComp - rectWidth);
            this.setRectPxBounds(new OpenLayers.Bounds(newLeft,
                                                       newTop + rectHeight,
                                                       newLeft + rectWidth,
                                                       newTop));
            this.rectDragStart = evt.xy.clone();
            this.performedRectDrag = true;
            OpenLayers.Event.stop(evt);
        }
    },

    /**
     * Method: rectMouseUp
     * Handle browser events
     *
     * Parameters:
     * evt - {<OpenLayers.Event>} evt
     */
    rectMouseUp: function(evt) {
        if(!OpenLayers.Event.isLeftClick(evt)) return;
        if(this.performedRectDrag) {
            this.updateMapToRect();
            OpenLayers.Event.stop(evt);
        }        
        document.onselectstart = null;
        this.rectDragStart = null;
    },
    
    /**
     * Method: rectDblClick
     * Handle browser events
     *
     * Parameters:
     * evt - {<OpenLayers.Event>} evt
     */
    rectDblClick: function(evt) {
        this.performedRectDrag = false;
        OpenLayers.Event.stop(evt);
        this.updateOverview();
    },

    /**
     * Method: mapDivClick
     * Handle browser events
     *
     * Parameters:
     * evt - {<OpenLayers.Event>} evt
     */
    mapDivClick: function(evt) {
        var pxBounds = this.getRectPxBounds();
        var pxCenter = pxBounds.getCenterPixel();
        var deltaX = evt.xy.x - pxCenter.x;
        var deltaY = evt.xy.y - pxCenter.y;
        var top = pxBounds.top;
        var left = pxBounds.left;
        var height = Math.abs(pxBounds.getHeight());
        var width = pxBounds.getWidth();
        var newTop = Math.max(0, (top + deltaY));
        newTop = Math.min(newTop, this.ovmap.size.h - height);
        var newLeft = Math.max(0, (left + deltaX));
        newLeft = Math.min(newLeft, this.ovmap.size.w - width);
        this.setRectPxBounds(new OpenLayers.Bounds(newLeft,
                                                   newTop + height,
                                                   newLeft + width,
                                                   newTop));
        this.updateMapToRect();
        OpenLayers.Event.stop(evt);
    },

    /**
     * Method: maximizeControl
     * Unhide the control.  Called when the control is in the map viewport.
     *
     * Parameters:
     * e - {<OpenLayers.Event>}
     */
    maximizeControl: function(e) {
        this.element.style.display = '';
        this.showToggle(false);
        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },

    /**
     * Method: minimizeControl
     * Hide all the contents of the control, shrink the size, 
     * add the maximize icon
     * 
     * Parameters:
     * e - {<OpenLayers.Event>}
     */
    minimizeControl: function(e) {
        this.element.style.display = 'none';
        this.showToggle(true);
        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },

    /**
     * Method: showToggle
     * Hide/Show the toggle depending on whether the control is minimized
     *
     * Parameters:
     * minimize - {Boolean} 
     */
    showToggle: function(minimize) {
        this.maximizeDiv.style.display = minimize ? '' : 'none';
        this.minimizeDiv.style.display = minimize ? 'none' : '';
    },

    /**
     * Method: update
     * Update the overview map after layers move.
     */
    update: function() {
        if(this.ovmap == null) {
            this.createMap();
        }
        
        if(!this.isSuitableOverview()) {
            this.updateOverview();
        }
        
        // update extent rectangle
        this.updateRectToMap();
    },
    
    /**
     * Method: isSuitableOverview
     * Determines if the overview map is suitable given the extent and
     * resolution of the main map.
     */
    isSuitableOverview: function() {
        var mapExtent = this.map.getExtent();
        var maxExtent = this.map.maxExtent;
        var testExtent = new OpenLayers.Bounds(
                                Math.max(mapExtent.left, maxExtent.left),
                                Math.max(mapExtent.bottom, maxExtent.bottom),
                                Math.min(mapExtent.right, maxExtent.right),
                                Math.min(mapExtent.top, maxExtent.top));        
        var resRatio = this.ovmap.getResolution() / this.map.getResolution();
        return ((resRatio > this.minRatio) &&
                (resRatio <= this.maxRatio) &&
                (this.ovmap.getExtent().containsBounds(testExtent)));
    },
    
    /**
     * Method updateOverview
     * Called by <update> if <isSuitableOverview> returns true
     */
    updateOverview: function() {
        var mapRes = this.map.getResolution();
        var targetRes = this.ovmap.getResolution();
        var resRatio = targetRes / mapRes;
        if(resRatio > this.maxRatio) {
            // zoom in overview map
            targetRes = this.minRatio * mapRes;            
        } else if(resRatio <= this.minRatio) {
            // zoom out overview map
            targetRes = this.maxRatio * mapRes;
        }
        this.ovmap.setCenter(this.map.center,
                            this.ovmap.getZoomForResolution(targetRes));
        this.updateRectToMap();
    },
    
    /**
     * Method: createMap
     * Construct the map that this control contains
     */
    createMap: function() {
        // create the overview map
        var options = OpenLayers.Util.extend(
                        {controls: [], maxResolution: 'auto'}, this.mapOptions);
        this.ovmap = new OpenLayers.Map(this.mapDiv.id, options);
        this.ovmap.addLayers(this.layers);
        this.ovmap.zoomToMaxExtent();
        // check extent rectangle border width
        this.wComp = parseInt(OpenLayers.Element.getStyle(this.extentRectangle,
                                               'border-left-width')) +
                     parseInt(OpenLayers.Element.getStyle(this.extentRectangle,
                                               'border-right-width'));
        this.wComp = (this.wComp) ? this.wComp : 2;
        this.hComp = parseInt(OpenLayers.Element.getStyle(this.extentRectangle,
                                               'border-top-width')) +
                     parseInt(OpenLayers.Element.getStyle(this.extentRectangle,
                                               'border-bottom-width'));
        this.hComp = (this.hComp) ? this.hComp : 2;
    },
        
    /**
     * Method: updateRectToMap
     * Updates the extent rectangle position and size to match the map extent
     */
    updateRectToMap: function() {
        // The base layer for overview map needs to be in the same projection
        // as the base layer for the main map.  This should be made more robust.
        if(this.map.units != 'degrees') {
            if(this.ovmap.getProjection() && (this.map.getProjection() != this.ovmap.getProjection())) {
                alert('The overview map only works when it is in the same projection as the main map');
            }
        }
        var pxBounds = this.getRectBoundsFromMapBounds(this.map.getExtent());
        if (pxBounds) {
          this.setRectPxBounds(pxBounds);
        }
    },
    
    /**
     * Method: updateMapToRect
     * Updates the map extent to match the extent rectangle position and size
     */
    updateMapToRect: function() {
        var pxBounds = this.getRectPxBounds();
        var lonLatBounds = this.getMapBoundsFromRectBounds(pxBounds);
        this.map.setCenter(lonLatBounds.getCenterLonLat(), this.map.zoom);
    },
    
    /**
     * Method: getRectPxBounds
     * Get extent rectangle pixel bounds
     *
     * Return:
     * {<OpenLayers.Bounds>} A bounds which is the extent rectangle's pixel
     * bounds (relative to the parent element)
     */
    getRectPxBounds: function() {
        var top = parseInt(this.extentRectangle.style.top);
        var left = parseInt(this.extentRectangle.style.left);
        var height = parseInt(this.extentRectangle.style.height);
        var width = parseInt(this.extentRectangle.style.width);
        return new OpenLayers.Bounds(left, top + height, left + width, top);
    },

    /**
     * Method: setRectPxBounds
     * Set extent rectangle pixel bounds.
     *
     * Parameters:
     * pxBounds - {<OpenLayers.Bounds>}
     */
    setRectPxBounds: function(pxBounds) {
        var top = Math.max(pxBounds.top, 0);
        var left = Math.max(pxBounds.left, 0);
        var bottom = Math.min(pxBounds.top + Math.abs(pxBounds.getHeight()),
                              this.ovmap.size.h - this.hComp);
        var right = Math.min(pxBounds.left + pxBounds.getWidth(),
                             this.ovmap.size.w - this.wComp);
        this.extentRectangle.style.top = parseInt(top) + 'px';
        this.extentRectangle.style.left = parseInt(left) + 'px';
        this.extentRectangle.style.height = parseInt(Math.max(bottom - top, 0))+ 'px';
        this.extentRectangle.style.width = parseInt(Math.max(right - left, 0)) + 'px';
    },

    /**
     * Method: getRectBoundsFromMapBounds
     * Get the rect bounds from the map bounds.
     *
     * Parameters:
     * lonLatBounds - {<OpenLayers.Bounds>}
     *
     * Return:
     * {<OpenLayers.Bounds>}A bounds which is the passed-in map lon/lat extent
     * translated into pixel bounds for the overview map
     */
    getRectBoundsFromMapBounds: function(lonLatBounds) {
        var leftBottomLonLat = new OpenLayers.LonLat(lonLatBounds.left,
                                                     lonLatBounds.bottom);
        var rightTopLonLat = new OpenLayers.LonLat(lonLatBounds.right,
                                                   lonLatBounds.top);
        var leftBottomPx = this.getOverviewPxFromLonLat(leftBottomLonLat);
        var rightTopPx = this.getOverviewPxFromLonLat(rightTopLonLat);
        var bounds = null;
        if (leftBottomPx && rightTopPx) {
            bounds = new OpenLayers.Bounds(leftBottomPx.x, leftBottomPx.y,
                                           rightTopPx.x, rightTopPx.y);
        }
        return bounds;
    },

    /**
     * Method: getMapBoundsFromRectBounds
     * Get the map bounds from the rect bounds.
     *
     * Parameters:
     * pxBounds - {<OpenLayers.Bounds>}
     *
     * Return:
     * {<OpenLayers.Bounds>} Bounds which is the passed-in overview rect bounds
     * translated into lon/lat bounds for the overview map
     */
    getMapBoundsFromRectBounds: function(pxBounds) {
        var leftBottomPx = new OpenLayers.Pixel(pxBounds.left,
                                                pxBounds.bottom);
        var rightTopPx = new OpenLayers.Pixel(pxBounds.right,
                                              pxBounds.top);
        var leftBottomLonLat = this.getLonLatFromOverviewPx(leftBottomPx);
        var rightTopLonLat = this.getLonLatFromOverviewPx(rightTopPx);
        return new OpenLayers.Bounds(leftBottomLonLat.lon, leftBottomLonLat.lat,
                                     rightTopLonLat.lon, rightTopLonLat.lat);
    },

    /**
     * Method: getLonLatFromOverviewPx
     * Get a map location from a pixel location
     *
     * Parameters:
     * overviewMapPx - {<OpenLayers.Pixel>}
     *
     * Return:
     * {<OpenLayers.LonLat>} Location which is the passed-in overview map
     * OpenLayers.Pixel, translated into lon/lat by the overview map
     */
    getLonLatFromOverviewPx: function(overviewMapPx) {
        var size = this.ovmap.size;
        var res  = this.ovmap.getResolution();
        var center = this.ovmap.getExtent().getCenterLonLat();
    
        var delta_x = overviewMapPx.x - (size.w / 2);
        var delta_y = overviewMapPx.y - (size.h / 2);
        
        return new OpenLayers.LonLat(center.lon + delta_x * res ,
                                     center.lat - delta_y * res); 
    },

    /**
     * Method: getOverviewPxFromLonLat
     * Get a pixel location from a map location
     *
     * Parameters:
     * lonlat - {<OpenLayers.LonLat>}
     *
     * Return:
     * {<OpenLayers.Pixel>} Location which is the passed-in OpenLayers.LonLat, 
     * translated into overview map pixels
     */
    getOverviewPxFromLonLat: function(lonlat) {
        var res  = this.ovmap.getResolution();
        var extent = this.ovmap.getExtent();
        var px = null;
        if (extent) {
            px = new OpenLayers.Pixel(
                        Math.round(1/res * (lonlat.lon - extent.left)),
                        Math.round(1/res * (extent.top - lonlat.lat)));
        } 
        return px;
    },

    /** @final @type String */
    CLASS_NAME: 'OpenLayers.Control.OverviewMap'
    
});
