var map, layer, styleMap;
OpenLayers.ProxyHost = "proxy.cgi?url=";

function init() {
    map = new OpenLayers.Map({
        div: "map",
        projection: new OpenLayers.Projection("EPSG:900913"),
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
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
    
    // create a vector layer using the canvas renderer (where available)
    var wfs = new OpenLayers.Layer.Vector("States", {
        strategies: [new OpenLayers.Strategy.BBOX()],
        protocol: new OpenLayers.Protocol.WFS({
            version: "1.1.0",
            srsName: "EPSG:900913",
            url:  "http://demo.opengeo.org/geoserver/wfs",
            featureType: "states",
            featureNS: "http://www.openplans.org/topp"
        }),
        styleMap: styleMap,
        renderers: ["Canvas", "SVG", "VML"]
    });
    map.addLayer(wfs);

    // if you want to use Geographic coords, transform to ESPG:900913
    var ddBounds = new OpenLayers.Bounds(
        -73.839111,40.287907,-68.214111,44.441624
    );
    map.zoomToExtent(
        ddBounds.transform(map.displayProjection, map.getProjectionObject())
    );
}
