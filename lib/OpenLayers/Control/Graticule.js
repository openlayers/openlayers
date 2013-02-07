/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Lang.js
 * @requires OpenLayers/Rule.js
 * @requires OpenLayers/StyleMap.js
 * @requires OpenLayers/Layer/Vector.js
 */

/**
 * Class: OpenLayers.Control.Graticule
 * The Graticule displays a grid of latitude/longitude lines reprojected on
 * the map.  
 * 
 * Inherits from:
 *  - <OpenLayers.Control>
 *  
 */
OpenLayers.Control.Graticule = OpenLayers.Class(OpenLayers.Control, {

    /**
     * APIProperty: autoActivate
     * {Boolean} Activate the control when it is added to a map. Default is
     *     true. 
     */
    autoActivate: true,
    
    /**
    * APIProperty: intervals
    * {Array(Float)} A list of possible graticule widths in degrees.
    */
    intervals: [ 45, 30, 20, 10, 5, 2, 1,
                 0.5, 0.2, 0.1, 0.05, 0.01, 
                 0.005, 0.002, 0.001 ],

    /**
     * APIProperty: displayInLayerSwitcher
     * {Boolean} Allows the Graticule control to be switched on and off by 
     *     LayerSwitcher control. Defaults is true.
     */
    displayInLayerSwitcher: true,

    /**
     * APIProperty: visible
     * {Boolean} should the graticule be initially visible (default=true)
     */
    visible: true,

    /**
     * APIProperty: numPoints
     * {Integer} The number of points to use in each graticule line.  Higher
     * numbers result in a smoother curve for projected maps 
     */
    numPoints: 50,

    /**
     * APIProperty: targetSize
     * {Integer} The maximum size of the grid in pixels on the map
     */
    targetSize: 200,

    /**
     * APIProperty: layerName
     * {String} The name to be displayed in the layer switcher, default is set 
     *     by {<OpenLayers.Lang>}.
     */
    layerName: null,

    /**
     * APIProperty: labelled
     * {Boolean} Should the graticule lines be labelled?. default=true
     */
    labelled: true,

    /**
     * APIProperty: labelFormat
     * {String} the format of the labels, default = 'dm'. See
     * <OpenLayers.Util.getFormattedLonLat> for other options.
     */
    labelFormat: 'dm',

    /**
     * APIProperty: lineSymbolizer
     * {symbolizer} the symbolizer used to render lines
     */
    lineSymbolizer: {
                strokeColor: "#333",
                strokeWidth: 1,
                strokeOpacity: 0.5
            },

    /**
     * APIProperty: labelSymbolizer
     * {symbolizer} the symbolizer used to render labels
     */
     labelSymbolizer: {},

    /**
     * Property: gratLayer
     * {<OpenLayers.Layer.Vector>} vector layer used to draw the graticule on
     */
    gratLayer: null,

    /**
     * Constructor: OpenLayers.Control.Graticule
     * Create a new graticule control to display a grid of latitude longitude
     * lines.
     * 
     * Parameters:
     * options - {Object} An optional object whose properties will be used
     *     to extend the control.
     */
    initialize: function(options) {
        options = options || {};
        options.layerName = options.layerName || OpenLayers.i18n("Graticule");
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        
        this.labelSymbolizer.stroke = false;
        this.labelSymbolizer.fill = false;
        this.labelSymbolizer.label = "${label}";
        this.labelSymbolizer.labelAlign = "${labelAlign}";
        this.labelSymbolizer.labelXOffset = "${xOffset}";
        this.labelSymbolizer.labelYOffset = "${yOffset}";
    },

    /**
     * APIMethod: destroy
     */
    destroy: function() {
        this.deactivate();        
        OpenLayers.Control.prototype.destroy.apply(this, arguments);        
        if (this.gratLayer) {
            this.gratLayer.destroy();
            this.gratLayer = null;
        }
    },
    
    /**
     * Method: draw
     *
     * initializes the graticule layer and does the initial update
     * 
     * Returns:
     * {DOMElement}
     */
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        if (!this.gratLayer) {
            var gratStyle = new OpenLayers.Style({},{
                rules: [new OpenLayers.Rule({'symbolizer':
                    {"Point":this.labelSymbolizer,
                     "Line":this.lineSymbolizer}
                })]
            });
            this.gratLayer = new OpenLayers.Layer.Vector(this.layerName, {
                styleMap: new OpenLayers.StyleMap({'default':gratStyle}),
                visibility: this.visible,
                displayInLayerSwitcher: this.displayInLayerSwitcher
            });
        }
        return this.div;
    },

     /**
     * APIMethod: activate
     */
    activate: function() {
        if (OpenLayers.Control.prototype.activate.apply(this, arguments)) {
            this.map.addLayer(this.gratLayer);
            this.map.events.register('moveend', this, this.update);     
            this.update();
            return true;            
        } else {
            return false;
        }
    },
    
    /**
     * APIMethod: deactivate
     */
    deactivate: function() {
        if (OpenLayers.Control.prototype.deactivate.apply(this, arguments)) {
            this.map.events.unregister('moveend', this, this.update);
            this.map.removeLayer(this.gratLayer);
            return true;
        } else {
            return false;
        }
    },
    /**
     * Method: update
     *
     * calculates the grid to be displayed and actually draws it
     * 
     * Returns:
     * {DOMElement}
     */
    update: function() {
        //wait for the map to be initialized before proceeding
        var mapBounds = this.map.getExtent();
        if (!mapBounds) {
            return;
        }
        
        //clear out the old grid
        this.gratLayer.destroyFeatures();
        
        //get the projection objects required
        var llProj = new OpenLayers.Projection("EPSG:4326");
        var mapProj = this.map.getProjectionObject();
        var mapRes = this.map.getResolution();
        
        //if the map is in lon/lat, then the lines are straight and only one
        //point is required
        if (mapProj.proj && mapProj.proj.projName == "longlat") {
            this.numPoints = 1;
        }
        
        //get the map center in EPSG:4326
        var mapCenter = this.map.getCenter(); //lon and lat here are really map x and y
        var mapCenterLL = new OpenLayers.Pixel(mapCenter.lon, mapCenter.lat);
        OpenLayers.Projection.transform(mapCenterLL, mapProj, llProj);
        
        /* This block of code determines the lon/lat interval to use for the
         * grid by calculating the diagonal size of one grid cell at the map
         * center.  Iterates through the intervals array until the diagonal
         * length is less than the targetSize option.
         */
        //find lat/lon interval that results in a grid of less than the target size
        var testSq = this.targetSize*mapRes;
        testSq *= testSq;   //compare squares rather than doing a square root to save time
        var llInterval;
        for (var i=0; i<this.intervals.length; ++i) {
            llInterval = this.intervals[i];   //could do this for both x and y??
            var delta = llInterval/2;  
            var p1 = mapCenterLL.offset({x: -delta, y: -delta});  //test coords in EPSG:4326 space
            var p2 = mapCenterLL.offset({x: delta, y: delta});
            OpenLayers.Projection.transform(p1, llProj, mapProj); // convert them back to map projection
            OpenLayers.Projection.transform(p2, llProj, mapProj);
            var distSq = (p1.x-p2.x)*(p1.x-p2.x) + (p1.y-p2.y)*(p1.y-p2.y);
            if (distSq <= testSq) {
                break;
            }
        }
        //alert(llInterval);
        
        //round the LL center to an even number based on the interval
        mapCenterLL.x = Math.floor(mapCenterLL.x/llInterval)*llInterval;
        mapCenterLL.y = Math.floor(mapCenterLL.y/llInterval)*llInterval;
        //TODO adjust for minutses/seconds?
        
        /* The following 2 blocks calculate the nodes of the grid along a 
         * line of constant longitude (then latitiude) running through the
         * center of the map until it reaches the map edge.  The calculation
         * goes from the center in both directions to the edge.
         */
        //get the central longitude line, increment the latitude
        var iter = 0;
        var centerLonPoints = [mapCenterLL.clone()];
        var newPoint = mapCenterLL.clone();
        var mapXY;
        do {
            newPoint = newPoint.offset({x: 0, y: llInterval});
            mapXY = OpenLayers.Projection.transform(newPoint.clone(), llProj, mapProj);
            centerLonPoints.unshift(newPoint);
        } while (mapBounds.containsPixel(mapXY) && ++iter<1000);
        newPoint = mapCenterLL.clone();
        do {          
            newPoint = newPoint.offset({x: 0, y: -llInterval});
            mapXY = OpenLayers.Projection.transform(newPoint.clone(), llProj, mapProj);
            centerLonPoints.push(newPoint);
        } while (mapBounds.containsPixel(mapXY) && ++iter<1000);
        
        //get the central latitude line, increment the longitude
        iter = 0;
        var centerLatPoints = [mapCenterLL.clone()];
        newPoint = mapCenterLL.clone();
        do {
            newPoint = newPoint.offset({x: -llInterval, y: 0});
            mapXY = OpenLayers.Projection.transform(newPoint.clone(), llProj, mapProj);
            centerLatPoints.unshift(newPoint);
        } while (mapBounds.containsPixel(mapXY) && ++iter<1000);
        newPoint = mapCenterLL.clone();
        do {          
            newPoint = newPoint.offset({x: llInterval, y: 0});
            mapXY = OpenLayers.Projection.transform(newPoint.clone(), llProj, mapProj);
            centerLatPoints.push(newPoint);
        } while (mapBounds.containsPixel(mapXY) && ++iter<1000);
        
        //now generate a line for each node in the central lat and lon lines
        //first loop over constant longitude
        var lines = [];
        for(var i=0; i < centerLatPoints.length; ++i) {
            var lon = centerLatPoints[i].x;
            var pointList = [];
            var labelPoint = null;
            var latEnd = Math.min(centerLonPoints[0].y, 90);
            var latStart = Math.max(centerLonPoints[centerLonPoints.length - 1].y, -90);
            var latDelta = (latEnd - latStart)/this.numPoints;
            var lat = latStart;
            for(var j=0; j<= this.numPoints; ++j) {
                var gridPoint = new OpenLayers.Geometry.Point(lon,lat);
                gridPoint.transform(llProj, mapProj);
                pointList.push(gridPoint);
                lat += latDelta;
                if (gridPoint.y >= mapBounds.bottom && !labelPoint) {
                    labelPoint = gridPoint;
                }
            }
            if (this.labelled) {
                //keep track of when this grid line crosses the map bounds to set
                //the label position
                //labels along the bottom, add 10 pixel offset up into the map
                //TODO add option for labels on top
                var labelPos = new OpenLayers.Geometry.Point(labelPoint.x,mapBounds.bottom);
                var labelAttrs = {
                    value: lon,
                    label: this.labelled?OpenLayers.Util.getFormattedLonLat(lon, "lon", this.labelFormat):"",
                    labelAlign: "cb",
                    xOffset: 0,
                    yOffset: 2
                }; 
                this.gratLayer.addFeatures(new OpenLayers.Feature.Vector(labelPos,labelAttrs));
            }
            var geom = new OpenLayers.Geometry.LineString(pointList);
            lines.push(new OpenLayers.Feature.Vector(geom));
        }
        
        //now draw the lines of constant latitude
        for (var j=0; j < centerLonPoints.length; ++j) {
            lat = centerLonPoints[j].y;
            if (lat<-90 || lat>90) {  //latitudes only valid between -90 and 90
                continue;
            }
            var pointList = [];
            var lonStart = centerLatPoints[0].x;
            var lonEnd = centerLatPoints[centerLatPoints.length - 1].x;
            var lonDelta = (lonEnd - lonStart)/this.numPoints;
            var lon = lonStart;
            var labelPoint = null;
            for(var i=0; i <= this.numPoints ; ++i) {
                var gridPoint = new OpenLayers.Geometry.Point(lon,lat);
                gridPoint.transform(llProj, mapProj);
                pointList.push(gridPoint);
                lon += lonDelta;
                if (gridPoint.x < mapBounds.right) {
                    labelPoint = gridPoint;
                }
            }
            if (this.labelled) {
                //keep track of when this grid line crosses the map bounds to set
                //the label position
                //labels along the right, 30 pixel offset left into the map
                //TODO add option for labels on left
                var labelPos = new OpenLayers.Geometry.Point(mapBounds.right, labelPoint.y); 
                var labelAttrs = {
                    value: lat,
                    label: this.labelled?OpenLayers.Util.getFormattedLonLat(lat, "lat", this.labelFormat):"",
                    labelAlign: "rb",
                    xOffset: -2,
                    yOffset: 2
                }; 
                this.gratLayer.addFeatures(new OpenLayers.Feature.Vector(labelPos,labelAttrs));
            }
            var geom = new OpenLayers.Geometry.LineString(pointList);
            lines.push(new OpenLayers.Feature.Vector(geom));
          }
          this.gratLayer.addFeatures(lines);
    },
    
    CLASS_NAME: "OpenLayers.Control.Graticule"
});

