/* ======================================================================
    OpenLayers/Protocol/WCS/v1_1_0.js
   ====================================================================== */

/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Protocol/WCS/v1.js
 */

/**
 * Class: OpenLayers.Protocol.WCS.v1_1_0
 * A WCS v1.1.0 protocol for vector layers.  Create a new instance with the
 *     <OpenLayers.Protocol.WCS.v1_1_0> constructor.
 *
 * Differences from the v1.0.0 protocol:
 *  - uses Filter Encoding 1.1.0 instead of 1.0.0
 *  - uses GML 3 instead of 2 if no format is provided
 *  
 * Inherits from:
 *  - <OpenLayers.Protocol.WCS.v1>
 */
OpenLayers.Protocol.WCS.v1_1_0 = OpenLayers.Class(OpenLayers.Protocol.WCS.v1, {
    
    /**
     * Property: version
     * {String} WCS version number.
     */
    version: "1.1.0",
    
   
   
    CLASS_NAME: "OpenLayers.Protocol.WCS.v1_1_0"
});
