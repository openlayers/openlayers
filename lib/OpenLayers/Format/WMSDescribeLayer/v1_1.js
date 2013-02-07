/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WMSDescribeLayer.js
 * @requires OpenLayers/Format/OGCExceptionReport.js
 */

/**
 * Class: OpenLayers.Format.WMSDescribeLayer.v1_1_1
 * Read SLD WMS DescribeLayer response for WMS 1.1.X
 * WMS 1.1.X is tightly coupled to SLD 1.0.0
 *
 * Example DescribeLayer request: 
 * http://demo.opengeo.org/geoserver/wms?request=DescribeLayer&version=1.1.1&layers=topp:states
 *
 * Inherits from:
 *  - <OpenLayers.Format.WMSDescribeLayer>
 */
OpenLayers.Format.WMSDescribeLayer.v1_1_1 = OpenLayers.Class(
    OpenLayers.Format.WMSDescribeLayer, {
    
    /**
     * Constructor: OpenLayers.Format.WMSDescribeLayer
     * Create a new parser for WMS DescribeLayer responses.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.WMSDescribeLayer.prototype.initialize.apply(this, 
            [options]);
    },

    /**
     * APIMethod: read
     * Read DescribeLayer data from a string, and return the response. 
     * The OGC defines 2 formats which are allowed for output,
     * so we need to parse these 2 types for version 1.1.X
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Object} Object with a layerDescriptions property, which holds an Array
     * of {<LayerDescription>} objects which have:
     * - {String} owsType: WFS/WCS
     * - {String} owsURL: the online resource
     * - {String} typeName: the name of the typename on the owsType service
     * - {String} layerName: the name of the WMS layer we did a lookup for
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var root = data.documentElement;
        var children = root.childNodes; 
        var describelayer = {layerDescriptions: []};
        var childNode, nodeName;
        for(var i=0; i<children.length; ++i) { 
            childNode = children[i];
            nodeName = childNode.nodeName; 
            if (nodeName == 'LayerDescription') {
                var layerName = childNode.getAttribute('name');
                var owsType = '';
                var owsURL = '';
                var typeName = '';
                // check for owsType and owsURL attributes
                if (childNode.getAttribute('owsType')) {
                  owsType = childNode.getAttribute('owsType');
                  owsURL = childNode.getAttribute('owsURL');
                } else {
                    // look for wfs or wcs attribute
                    if (childNode.getAttribute('wfs') != '') {
                        owsType = 'WFS';
                        owsURL = childNode.getAttribute('wfs');
                    } else if (childNode.getAttribute('wcs') != '') {
                        owsType = 'WCS';
                        owsURL = childNode.getAttribute('wcs');
                    }
                }
                // look for Query child
                var query = childNode.getElementsByTagName('Query');
                if(query.length > 0) {
                    typeName = query[0].getAttribute('typeName');
                    if (!typeName) {
                        // because of Ionic bug
                        typeName = query[0].getAttribute('typename');
                    }
                }
                var layerDescription = {
                    layerName: layerName, owsType: owsType, 
                    owsURL: owsURL, typeName: typeName
                };
                describelayer.layerDescriptions.push(layerDescription);
                
                //TODO do this in deprecated.js instead:
                // array style index for backwards compatibility
                describelayer.length = describelayer.layerDescriptions.length;
                describelayer[describelayer.length - 1] = layerDescription; 
                
            } else if (nodeName == 'ServiceException') {
                // an exception must have occurred, so parse it
                var parser = new OpenLayers.Format.OGCExceptionReport();
                return {
                    error: parser.read(data)
                };
            }
        }
        return describelayer;
    },
    
    CLASS_NAME: "OpenLayers.Format.WMSDescribeLayer.v1_1_1"

});

// Version alias - workaround for http://trac.osgeo.org/mapserver/ticket/2257
OpenLayers.Format.WMSDescribeLayer.v1_1_0 =
    OpenLayers.Format.WMSDescribeLayer.v1_1_1;
