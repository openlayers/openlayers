/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */
/**
 * @fileoverview Locator Map Control
 * @author Tim Schaub
 */

/** 
 * @class
 * 
 * @requires OpenLayers/Control.js
 */
OpenLayers.Control.OverviewMap = OpenLayers.Class.create();

OpenLayers.Control.OverviewMap.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control, {

    /** For div.id
     * @type String */
    id:  "OverviewMap",

    /** @type DOMElement */
    element: null,
    
    /**
     * The overvew map itself.
     * @type OpenLayers.Map
     */
    ovmap: null,
        
    /**
     * The overvew map size in pixels.  Note that this is the size of the map
     * itself - the element that contains the map (class name
     * olControlOverviewMapElement) may have padding or other style attributes
     * added via CSS.
     * @type OpenLayers.Size
     */
    size: new OpenLayers.Size(180, 90),

    /**
     * Ordered list of layers in the overview map.  If none are sent at
     * construction, then the default below is used.
     * 
     * @type Array(OpenLayers.Layer)
     */
    layers: [],

    /**
     * The ratio of the overview map resolution to the main map resolution
     * at which to zoom farther out on the overview map.
     * @type Float
     */
    minRatio: 8,

    /**
     * The ratio of the overview map resolution to the main map resolution
     * at which to zoom farther in on the overview map.
     * @type Float
     */
    maxRatio: 32,

    /**
     * An object containing any non-default properties to be sent to the
     * overview map's map constructor.  These should include any non-default
     * options that the main map was constructed with.
     * @type: Object
     */
    mapOptions: {},

    /**
     * @constructor
     * @param {Object} options Hashtable of options to set on the overview map
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
    },

    /**
     * @type DOMElement
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
        this.element.className = 'olControlOverviewMapElement';
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
                                        '/blank.png)';
        this.extentRectangle.className = 'olControlOverviewMapExtentRectangle';
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
        this.rectEvents = new OpenLayers.Events(this, this.extentRectangle);
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
            this.div.className = 'olControlOverviewMapContainer';
            var imgLocation = OpenLayers.Util.getImagesLocation();
            // maximize button div
            var img = imgLocation + 'layer-switcher-maximize.png';
            this.maximizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                        'olControlOverviewMapMaximizeButton', 
                                        null, 
                                        new OpenLayers.Size(18,18), 
                                        img, 
                                        'absolute');
            this.maximizeDiv.style.display = 'none';
            this.maximizeDiv.className = 'olControlOverviewMapMaximizeButton';
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
            this.minimizeDiv.className = 'olControlOverviewMapMinimizeButton';
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
    
    baseLayerDraw: function() {
        this.draw();
        this.map.events.unregister("changebaselayer", this, this.baseLayerDraw);
    },

    /**
    * @param {OpenLayers.Event} evt
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
    * @param {OpenLayers.Event} evt
    */
    rectMouseDown: function (evt) {
        if(!OpenLayers.Event.isLeftClick(evt)) return;
        this.rectDragStart = evt.xy.clone();
        this.performedRectDrag = false;
        OpenLayers.Event.stop(evt);
    },

    /**
    * @param {OpenLayers.Event} evt
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
    * @param {OpenLayers.Event} evt
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
    * @param {OpenLayers.Event} evt
    */
    rectDblClick: function(evt) {
        this.performedRectDrag = false;
        OpenLayers.Event.stop(evt);
        this.updateOverview();
    },

    /**
    * @param {OpenLayers.Event} evt
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

    /** Set up the labels and divs for the control
     * 
     * @param {OpenLayers.Event} e
     */
    maximizeControl: function(e) {
        this.element.style.display = '';
        this.showToggle(false);
        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },

    /** Hide all the contents of the control, shrink the size, 
     *   add the maximize icon
     * 
     * @param {OpenLayers.Event} e
     */
    minimizeControl: function(e) {
        this.element.style.display = 'none';
        this.showToggle(true);
        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },

    /** Hide/Show all LayerSwitcher controls depending on whether we are
     *   minimized or not
     * 
     * @private
     * 
     * @param {Boolean} minimize
     */
    showToggle: function(minimize) {
        this.maximizeDiv.style.display = minimize ? '' : 'none';
        this.minimizeDiv.style.display = minimize ? 'none' : '';
    },

    /**
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
     * Updates the map extent to match the extent rectangle position and size
     */
    updateMapToRect: function() {
        var pxBounds = this.getRectPxBounds();
        var lonLatBounds = this.getMapBoundsFromRectBounds(pxBounds);
        this.map.setCenter(lonLatBounds.getCenterLonLat(), this.map.zoom);
    },
    
    /**
     * Get extent rectangle pixel bounds
     * @returns An OpenLayers.Bounds wich is the extent rectangle's pixel
     *          bounds (relative to the parent element)
     */
    getRectPxBounds: function() {
        var top = parseInt(this.extentRectangle.style.top);
        var left = parseInt(this.extentRectangle.style.left);
        var height = parseInt(this.extentRectangle.style.height);
        var width = parseInt(this.extentRectangle.style.width);
        return new OpenLayers.Bounds(left, top + height, left + width, top);
    },

    /**
     * Set extent rectangle pixel bounds.  
     * @param {OpenLayers.Bounds} pxBounds
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
        this.extentRectangle.style.height = parseInt(bottom - top)+ 'px';
        this.extentRectangle.style.width = parseInt(right - left) + 'px';
    },

    /**
    * @param {OpenLayers.Bounds} lonLatBounds
    *
    * @returns An OpenLayers.Bounds which is the passed-in map lon/lat extent
    *          translated into pixel bounds for the overview map
    * @type OpenLayers.Bounds
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
    * @param {OpenLayers.Bounds} pxBounds
    *
    * @returns An OpenLayers.Bounds which is the passed-in overview rect bounds
    *          translated into lon/lat bounds for the overview map
    * @type OpenLayers.Bounds
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
    * @param {OpenLayers.Pixel} overviewMapPx
    *
    * @returns An OpenLayers.LonLat which is the passed-in overview map
    *          OpenLayers.Pixel, translated into lon/lat by the overview map
    * @type OpenLayers.LonLat
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
    * @param {OpenLayers.LonLat} lonlat
    *
    * @returns An OpenLayers.Pixel which is the passed-in OpenLayers.LonLat, 
    *          translated into overview map pixels
    * @type OpenLayers.Pixel
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
