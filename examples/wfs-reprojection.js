var map, layer, styleMap;
OpenLayers.ProxyHost = "proxy.cgi?url=";

function init() {

    var geographic = new OpenLayers.Projection("EPSG:4326");
    var mercator = new OpenLayers.Projection("EPSG:900913");

    map = new OpenLayers.Map('map', {
        projection: mercator,
        units: "m",
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(
            -20037508, -20037508, 20037508, 20037508
        )
    });

    var g = new OpenLayers.Layer.Google("Google Layer", {
        sphericalMercator: true
    });
    map.addLayers([g]);

    // prepare to style the data
    styleMap = new OpenLayers.StyleMap({
        strokeColor: "black",
        strokeWidth: 2,
        strokeOpacity: 0.5,
        fillOpacity: 0.2
    });
    // create a color table for state FIPS code
    var colors = ["red", "orange", "yellow", "green", "blue", "purple"];
    var code, fips = {};
    for(var i=1; i<=66; ++i) {
        code = "0" + i;
        code = code.substring(code.length - 2);
        fips[code] = {fillColor: colors[i % colors.length]};
    }
    // add unique value rules with your color lookup
    styleMap.addUniqueValueRules("default", "STATE_FIPS", fips);

    // This server supports server-side reprojection, but we're using WFS 1.0 
    // here (which doesn't support reprojection) to illustrate client-side 
    // reprojection.
    var wfs = new OpenLayers.Layer.Vector("States", {
        strategies: [new OpenLayers.Strategy.BBOX()],
        protocol: new OpenLayers.Protocol.WFS({
            version: "1.0.0",
            srsName: "EPSG:4326", // this is the default
            url:  "http://demo.opengeo.org/geoserver/wfs",
            featureType: "states",
            featureNS: "http://www.openplans.org/topp"
        }),
        projection: geographic, // specified because it is different than the map 
        styleMap: styleMap
    });
    map.addLayer(wfs);
    
    // if you want to use Geographic coords, transform to ESPG:900913
    var ddBounds = new OpenLayers.Bounds(
        -73.839111,40.287907,-68.214111,44.441624
    );
    map.zoomToExtent(
        ddBounds.transform(geographic, mercator)
    );
}
