/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */


/** 
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
 *   - getLonLatFromViewPortPx()
 *   - getViewPortPxFromLonLat()
 *   - getZoomForExtent()
 * 
 *  ...those three functions should generally be provided by any reasonable 
 *  API that you might be working from.
 * 
 * @class
 */
OpenLayers.Layer.FixedZoomLevels = OpenLayers.Class.create();
OpenLayers.Layer.FixedZoomLevels.prototype = {
      
  /********************************************************/
  /*                                                      */
  /*                 Baselayer Functions                  */
  /*                                                      */
  /*    The following functions must all be implemented   */
  /*                  by all base layers                  */
  /*                                                      */
  /********************************************************/
    
    /**
     * @constructor
     */
    initialize: function() {
        //this class is only just to add the following functions... 
        // nothing to actually do here... but it is probably a good
        // idea to have layers that use these functions call this 
        // inititalize() anyways, in case at some point we decide we 
        // do want to put some functionality or state in here. 
    },
    
    initResolutions: function() {
        // resolutions are set automatically in the black-box. this is the 
        // definition of a fixed-zoom-levels layer
    },
    
    /** 
     * @returns Degrees per Pixel
     * @type float
     */
    getResolution: function() {
        var resolution = null;
        
        var viewSize = this.map.getSize();
        var extent = this.getExtent();
        
        if ((viewSize != null) && (extent != null)) {
            resolution = Math.max( extent.getWidth()  / viewSize.w,
                                   extent.getHeight() / viewSize.h );
        }
        return resolution;
     },

    /** Calculates using px-> lonlat translation functions on tl and br 
     *   corners of viewport
     * 
     * @returns A Bounds object which represents the lon/lat bounds of the 
     *          current viewPort.
     * @type OpenLayers.Bounds
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
     * @param {float} resolution
     *
     * @returns A suitable zoom level for the specified resolution.
     *          If no baselayer is set, returns null.
     * @type int
     */
    getZoomForResolution: function(resolution) {
      
        var extent = OpenLayers.Layer.prototype.getExtent.apply(this, 
                                                                [resolution]);
                                                                
        return this.getZoomForExtent(extent);
    },

    /** @final @type String */
    CLASS_NAME: "FixedZoomLevels.js"
};

