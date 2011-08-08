/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer.js
 * @requires OpenLayers/Projection.js
 */

/**
 * Class: OpenLayers.Layer.SphericalMercator
 * A mixin for layers that wraps up the pieces neccesary to have a coordinate
 *     conversion for working with commercial APIs which use a spherical
 *     mercator projection.  Using this layer as a base layer, additional
 *     layers can be used as overlays if they are in the same projection.
 *
 * A layer is given properties of this object by setting the sphericalMercator
 *     property to true.
 *
 * More projection information:
 *  - http://spatialreference.org/ref/user/google-projection/
 *
 * Proj4 Text:
 *     +proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0
 *     +k=1.0 +units=m +nadgrids=@null +no_defs
 *
 * WKT:
 *     900913=PROJCS["WGS84 / Simple Mercator", GEOGCS["WGS 84",
 *     DATUM["WGS_1984", SPHEROID["WGS_1984", 6378137.0, 298.257223563]], 
 *     PRIMEM["Greenwich", 0.0], UNIT["degree", 0.017453292519943295], 
 *     AXIS["Longitude", EAST], AXIS["Latitude", NORTH]],
 *     PROJECTION["Mercator_1SP_Google"], 
 *     PARAMETER["latitude_of_origin", 0.0], PARAMETER["central_meridian", 0.0], 
 *     PARAMETER["scale_factor", 1.0], PARAMETER["false_easting", 0.0], 
 *     PARAMETER["false_northing", 0.0], UNIT["m", 1.0], AXIS["x", EAST],
 *     AXIS["y", NORTH], AUTHORITY["EPSG","900913"]]
 */
OpenLayers.Layer.SphericalMercator = {

    /**
     * Method: getExtent
     * Get the map's extent.
     *
     * Returns:
     * {<OpenLayers.Bounds>} The map extent.
     */
    getExtent: function() {
        var extent = null;
        if (this.sphericalMercator) {
            extent = this.map.calculateBounds();
        } else {
            extent = OpenLayers.Layer.FixedZoomLevels.prototype.getExtent.apply(this);
        }
        return extent;
    },

    /**
     * Method: getLonLatFromViewPortPx
     * Get a map location from a pixel location
     * 
     * Parameters:
     * viewPortPx - {<OpenLayers.Pixel>}
     *
     * Returns:
     *  {<OpenLayers.LonLat>} An OpenLayers.LonLat which is the passed-in view
     *  port OpenLayers.Pixel, translated into lon/lat by map lib
     *  If the map lib is not loaded or not centered, returns null
     */
    getLonLatFromViewPortPx: function (viewPortPx) {
        return OpenLayers.Layer.prototype.getLonLatFromViewPortPx.apply(this, arguments);
    },
    
    /**
     * Method: getViewPortPxFromLonLat
     * Get a pixel location from a map location
     *
     * Parameters:
     * lonlat - {<OpenLayers.LonLat>}
     *
     * Returns:
     * {<OpenLayers.Pixel>} An OpenLayers.Pixel which is the passed-in
     * OpenLayers.LonLat, translated into view port pixels by map lib
     * If map lib is not loaded or not centered, returns null
     */
    getViewPortPxFromLonLat: function (lonlat) {
        return OpenLayers.Layer.prototype.getViewPortPxFromLonLat.apply(this, arguments);
    },

    /** 
     * Method: initMercatorParameters 
     * Set up the mercator parameters on the layer: resolutions,
     *     projection, units.
     */
    initMercatorParameters: function() {
        // set up properties for Mercator - assume EPSG:900913
        this.RESOLUTIONS = [];
        var maxResolution = 156543.03390625;
        for(var zoom=0; zoom<=this.MAX_ZOOM_LEVEL; ++zoom) {
            this.RESOLUTIONS[zoom] = maxResolution / Math.pow(2, zoom);
        }
        this.units = "m";
        this.projection = this.projection || "EPSG:900913";
    },

    /**
     * APIMethod: forwardMercator
     * Given a lon,lat in EPSG:4326, return a point in Spherical Mercator.
     *
     * Parameters:
     * lon - {float} 
     * lat - {float}
     * 
     * Returns:
     * {<OpenLayers.LonLat>} The coordinates transformed to Mercator.
     */
    forwardMercator: function(lon, lat) {
        var x = lon * 20037508.34 / 180;
        var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);

        y = y * 20037508.34 / 180;
        
        return new OpenLayers.LonLat(x, y);
    },

    /**
     * APIMethod: inverseMercator
     * Given a x,y in Spherical Mercator, return a point in EPSG:4326.
     *
     * Parameters:
     * x - {float} A map x in Spherical Mercator.
     * y - {float} A map y in Spherical Mercator.
     * 
     * Returns:
     * {<OpenLayers.LonLat>} The coordinates transformed to EPSG:4326.
     */
    inverseMercator: function(x, y) {

        var lon = (x / 20037508.34) * 180;
        var lat = (y / 20037508.34) * 180;

        lat = 180/Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
        
        return new OpenLayers.LonLat(lon, lat);
    },

    /**
     * Method: projectForward 
     * Given an object with x and y properties in EPSG:4326, modify the x,y
     * properties on the object to be the Spherical Mercator projected
     * coordinates.
     *
     * Parameters:
     * point - {Object} An object with x and y properties. 
     * 
     * Returns:
     * {Object} The point, with the x and y properties transformed to spherical
     * mercator.
     */
    projectForward: function(point) {
        var lonlat = OpenLayers.Layer.SphericalMercator.forwardMercator(point.x, point.y);
        point.x = lonlat.lon;
        point.y = lonlat.lat;
        return point;
    },
    
    /**
     * Method: projectInverse
     * Given an object with x and y properties in Spherical Mercator, modify
     * the x,y properties on the object to be the unprojected coordinates.
     *
     * Parameters:
     * point - {Object} An object with x and y properties. 
     * 
     * Returns:
     * {Object} The point, with the x and y properties transformed from
     * spherical mercator to unprojected coordinates..
     */
    projectInverse: function(point) {
        var lonlat = OpenLayers.Layer.SphericalMercator.inverseMercator(point.x, point.y);
        point.x = lonlat.lon;
        point.y = lonlat.lat;
        return point;
    }

};

/**
 * Note: Transforms for web mercator <-> EPSG:4326
 * OpenLayers recognizes EPSG:3857, EPSG:900913, EPSG:102113 and EPSG:102100.
 * OpenLayers originally started referring to EPSG:900913 as web mercator.
 * The EPSG has declared EPSG:3857 to be web mercator.  
 * ArcGIS 10 recognizes the EPSG:3857, EPSG:102113, and EPSG:102100 as 
 * equivalent.  See http://blogs.esri.com/Dev/blogs/arcgisserver/archive/2009/11/20/ArcGIS-Online-moving-to-Google-_2F00_-Bing-tiling-scheme_3A00_-What-does-this-mean-for-you_3F00_.aspx#12084
 */
(function() {
    
    // list of equivalent codes for web mercator
    var codes = ["EPSG:900913", "EPSG:3857", "EPSG:102113", "EPSG:102100"];
    
    var add = OpenLayers.Projection.addTransform;
    var merc = OpenLayers.Layer.SphericalMercator;
    var same = OpenLayers.Projection.nullTransform;
    
    var i, len, code, other, j;
    for (i=0, len=codes.length; i<len; ++i) {
        code = codes[i];
        add("EPSG:4326", code, merc.projectForward);
        add(code, "EPSG:4326", merc.projectInverse);
        for (j=i+1; j<len; ++j) {
            other = codes[j];
            add(code, other, same);
            add(other, code, same);
        }
    }
    
})();
