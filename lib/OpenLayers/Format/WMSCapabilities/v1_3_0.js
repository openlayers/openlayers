/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WMSCapabilities/v1_3.js
 */

/**
 * Class: OpenLayers.Format.WMSCapabilities/v1_3_0
 * Read WMS Capabilities version 1.3.0. 
 * SLD 1.1.0 adds in the extra operations DescribeLayer and GetLegendGraphic, 
 * see: http://schemas.opengis.net/sld/1.1.0/sld_capabilities.xsd
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WMSCapabilities.v1_3>
 */
OpenLayers.Format.WMSCapabilities.v1_3_0 = OpenLayers.Class(
    OpenLayers.Format.WMSCapabilities.v1_3, {
    
    /**
     * Property: version
     * {String} The specific parser version.
     */
    version: "1.3.0",
    
    CLASS_NAME: "OpenLayers.Format.WMSCapabilities.v1_3_0" 

});
