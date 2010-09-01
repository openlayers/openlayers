/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer.js
 */

/**
 * Class: OpenLayers.Layer.FixedZoomLevels
 *   Some Layers will already have established zoom levels (like google 
 *    or ve). Instead of trying to determine them and populate a resolutions[]
 *    Array with those values, we will hijack the resolution functionality
 *    here.
 * 
 *   When you subclass FixedZoomLevels: 
 * 
 *   The initResolutions() call gets nullified, meaning no resolutions[] array 
 *    is set up. Which would be a big problem getResolution() in Layer, since 
 *    it merely takes map.zoom and indexes into resolutions[]... but....
 * 
 *   The getResolution() call is also overridden. Instead of using the 
 *    resolutions[] array, we simply calculate the current resolution based
 *    on the current extent and the current map size. But how will we be able
 *    to calculate the current extent without knowing the resolution...?
 *  
 *   The getExtent() function is also overridden. Instead of calculating extent
 *    based on the center point and the current resolution, we instead 
 *    calculate the extent by getting the lonlats at the top-left and 
 *    bottom-right by using the getLonLatFromViewPortPx() translation function,
 *    taken from the pixel locations (0,0) and the size of the map. But how 
 *    will we be able to do lonlat-px translation without resolution....?
 * 
 *   The getZoomForResolution() method is overridden. Instead of indexing into
 *    the resolutions[] array, we call OpenLayers.Layer.getExent(), passing in
 *    the desired resolution. With this extent, we then call getZoomForExtent() 
 * 
 * 
 *   Whenever you implement a layer using OpenLayers.Layer.FixedZoomLevels, 
 *    it is your responsibility to provide the following three functions:
 * 
 *   - getLonLatFromViewPortPx
 *   - getViewPortPxFromLonLat
 *   - getZoomForExtent
 * 
 *  ...those three functions should generally be provided by any reasonable 
 *  API that you might be working from.
 *
 */
OpenLayers.Layer.FixedZoomLevels = OpenLayers.Class({
      
  /********************************************************/
  /*                                                      */
  /*                 Baselayer Functions                  */
  /*                                                      */
  /*    The following functions must all be implemented   */
  /*                  by all base layers                  */
  /*                                                      */
  /********************************************************/
    
    /**
     * Constructor: OpenLayers.Layer.FixedZoomLevels
     * Create a new fixed zoom levels layer.
     */
    initialize: function() {
        //this class is only just to add the following functions... 
        // nothing to actually do here... but it is probably a good
        // idea to have layers that use these functions call this 
        // inititalize() anyways, in case at some point we decide we 
        // do want to put some functionality or state in here. 
    },
    
    /**
     * Method: initResolutions
     * Populate the resolutions array
     */
    initResolutions: function() {

        var props = new Array('minZoomLevel', 'maxZoomLevel', 'numZoomLevels');
          
        for(var i=0, len=props.length; i<len; i++) {
            var property = props[i];
            this[property] = (this.options[property] != null)  
                                     ? this.options[property] 
                                     : this.map[property];
        }

        if ( (this.minZoomLevel == null) ||
             (this.minZoomLevel < this.MIN_ZOOM_LEVEL) ){
            this.minZoomLevel = this.MIN_ZOOM_LEVEL;
        }        

        //
        // At this point, we know what the minimum desired zoom level is, and
        //  we must calculate the total number of zoom levels. 
        //  
        //  Because we allow for the setting of either the 'numZoomLevels'
        //   or the 'maxZoomLevel' properties... on either the layer or the  
        //   map, we have to define some rules to see which we take into
        //   account first in this calculation. 
        //
        // The following is the precedence list for these properties:
        // 
        // (1) numZoomLevels set on layer
        // (2) maxZoomLevel set on layer
        // (3) numZoomLevels set on map
        // (4) maxZoomLevel set on map*
        // (5) none of the above*
        //
        // *Note that options (4) and (5) are only possible if the user 
        //  _explicitly_ sets the 'numZoomLevels' property on the map to 
        //  null, since it is set by default to 16. 
        //

        //
        // Note to future: In 3.0, I think we should remove the default 
        // value of 16 for map.numZoomLevels. Rather, I think that value 
        // should be set as a default on the Layer.WMS class. If someone
        // creates a 3rd party layer and does not specify any 'minZoomLevel', 
        // 'maxZoomLevel', or 'numZoomLevels', and has not explicitly 
        // specified any of those on the map object either.. then I think
        // it is fair to say that s/he wants all the zoom levels available.
        // 
        // By making map.numZoomLevels *null* by default, that will be the 
        // case. As it is, I don't feel comfortable changing that right now
        // as it would be a glaring API change and actually would probably
        // break many peoples' codes. 
        //

        //the number of zoom levels we'd like to have.
        var desiredZoomLevels;

        //this is the maximum number of zoom levels the layer will allow, 
        // given the specified starting minimum zoom level.
        var limitZoomLevels = this.MAX_ZOOM_LEVEL - this.minZoomLevel + 1;

        if ( ((this.options.numZoomLevels == null) && 
              (this.options.maxZoomLevel != null)) // (2)
              ||
             ((this.numZoomLevels == null) &&
              (this.maxZoomLevel != null)) // (4)
           ) {
            //calculate based on specified maxZoomLevel (on layer or map)
            desiredZoomLevels = this.maxZoomLevel - this.minZoomLevel + 1;
        } else {
            //calculate based on specified numZoomLevels (on layer or map)
            // this covers cases (1) and (3)
            desiredZoomLevels = this.numZoomLevels;
        }

        if (desiredZoomLevels != null) {
            //Now that we know what we would *like* the number of zoom levels
            // to be, based on layer or map options, we have to make sure that
            // it does not conflict with the actual limit, as specified by 
            // the constants on the layer itself (and calculated into the
            // 'limitZoomLevels' variable). 
            this.numZoomLevels = Math.min(desiredZoomLevels, limitZoomLevels);
        } else {
            // case (5) -- neither 'numZoomLevels' not 'maxZoomLevel' was 
            // set on either the layer or the map. So we just use the 
            // maximum limit as calculated by the layer's constants.
            this.numZoomLevels = limitZoomLevels;
        }

        //now that the 'numZoomLevels' is appropriately, safely set, 
        // we go back and re-calculate the 'maxZoomLevel'.
        this.maxZoomLevel = this.minZoomLevel + this.numZoomLevels - 1;

        if (this.RESOLUTIONS != null) {
            var resolutionsIndex = 0;
            this.resolutions = [];
            for(var i= this.minZoomLevel; i <= this.maxZoomLevel; i++) {
                this.resolutions[resolutionsIndex++] = this.RESOLUTIONS[i];            
            }
            this.maxResolution = this.resolutions[0];
            this.minResolution = this.resolutions[this.resolutions.length - 1];
        }       
    },
    
    /**
     * APIMethod: getResolution
     * Get the current map resolution
     * 
     * Returns:
     * {Float} Map units per Pixel
     */
    getResolution: function() {

        if (this.resolutions != null) {
            return OpenLayers.Layer.prototype.getResolution.apply(this, arguments);
        } else {
            var resolution = null;
            
            var viewSize = this.map.getSize();
            var extent = this.getExtent();
            
            if ((viewSize != null) && (extent != null)) {
                resolution = Math.max( extent.getWidth()  / viewSize.w,
                                       extent.getHeight() / viewSize.h );
            }
            return resolution;
        }
     },

    /**
     * APIMethod: getExtent
     * Calculates using px-> lonlat translation functions on tl and br 
     *     corners of viewport
     * 
     * Returns:
     * {<OpenLayers.Bounds>} A Bounds object which represents the lon/lat 
     *                       bounds of the current viewPort.
     */
    getExtent: function () {
        var extent = null;
        
        
        var size = this.map.getSize();
        
        var tlPx = new OpenLayers.Pixel(0,0);
        var tlLL = this.getLonLatFromViewPortPx(tlPx);

        var brPx = new OpenLayers.Pixel(size.w, size.h);
        var brLL = this.getLonLatFromViewPortPx(brPx);
        
        if ((tlLL != null) && (brLL != null)) {
            extent = new OpenLayers.Bounds(tlLL.lon, 
                                       brLL.lat, 
                                       brLL.lon, 
                                       tlLL.lat);
        }

        return extent;
    },

    /**
     * Method: getZoomForResolution
     * Get the zoom level for a given resolution
     *
     * Parameters:
     * resolution - {Float}
     *
     * Returns:
     * {Integer} A suitable zoom level for the specified resolution.
     *           If no baselayer is set, returns null.
     */
    getZoomForResolution: function(resolution) {
      
        if (this.resolutions != null) {
            return OpenLayers.Layer.prototype.getZoomForResolution.apply(this, arguments);
        } else {
            var extent = OpenLayers.Layer.prototype.getExtent.apply(this, []);
            return this.getZoomForExtent(extent);
        }
    },



    
    /********************************************************/
    /*                                                      */
    /*             Translation Functions                    */
    /*                                                      */
    /*    The following functions translate GMaps and OL    */ 
    /*     formats for Pixel, LonLat, Bounds, and Zoom      */
    /*                                                      */
    /********************************************************/
    
    
    //
    // TRANSLATION: MapObject Zoom <-> OpenLayers Zoom
    //
  
    /**
     * Method: getOLZoomFromMapObjectZoom
     * Get the OL zoom index from the map object zoom level
     *
     * Parameters:
     * moZoom - {Integer}
     * 
     * Returns:
     * {Integer} An OpenLayers Zoom level, translated from the passed in zoom
     *           Returns null if null value is passed in
     */
    getOLZoomFromMapObjectZoom: function(moZoom) {
        var zoom = null;
        if (moZoom != null) {
            zoom = moZoom - this.minZoomLevel;
        }
        return zoom;
    },
    
    /**
     * Method: getMapObjectZoomFromOLZoom
     * Get the map object zoom level from the OL zoom level
     *
     * Parameters:
     * olZoom - {Integer}
     * 
     * Returns:
     * {Integer} A MapObject level, translated from the passed in olZoom
     *           Returns null if null value is passed in
     */
    getMapObjectZoomFromOLZoom: function(olZoom) {
        var zoom = null; 
        if (olZoom != null) {
            zoom = olZoom + this.minZoomLevel;
        }
        return zoom;
    },

    CLASS_NAME: "OpenLayers.Layer.FixedZoomLevels"
});

