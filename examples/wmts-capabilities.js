OpenLayers.ProxyHost = "proxy.cgi/?url=";

var map, format;

function init() {

    format = new OpenLayers.Format.WMTSCapabilities({
        /**
         * This particular service is not in compliance with the WMTS spec and
         * is providing coordinates in y, x order regardless of the CRS.  To
         * work around this, we can provide the format a table of CRS URN that
         * should be considered y, x order.  These will extend the defaults on
         * the format.
         */
        yx: {
            "urn:ogc:def:crs:EPSG::900913": true
        }
    });

    OpenLayers.Request.GET({
        url: "http://v2.suite.opengeo.org/geoserver/gwc/service/wmts",
        params: {
            SERVICE: "WMTS",
            VERSION: "1.0.0",
            REQUEST: "GetCapabilities"
        },
        success: function(request) {
            var doc = request.responseXML;
            if (!doc || !doc.documentElement) {
                doc = request.responseText;
            }
            var capabilities = format.read(doc);
            var layer = format.createLayer(capabilities, {
                layer: "medford:buildings",
                matrixSet: "EPSG:900913",
                format: "image/png",
                opacity: 0.7,
                isBaseLayer: false
            });
            map.addLayer(layer);
        },
        failure: function() {
            alert("Trouble getting capabilities doc");
            OpenLayers.Console.error.apply(OpenLayers.Console, arguments);
        }
    });

    map = new OpenLayers.Map({
        div: "map",
        projection: "EPSG:900913"
    });

    var osm = new OpenLayers.Layer.OSM();

    map.addLayer(osm);
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.setCenter(new OpenLayers.LonLat(-13677832, 5213272), 13);
}
