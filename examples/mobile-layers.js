// initialize map when page ready
var map;

// Get rid of address bar on iphone/ipod
var fixSize = function() {
    window.scrollTo(0, 0);
    document.body.style.height = '100%';
    if (!(/(iphone|ipod)/.test(navigator.userAgent.toLowerCase()))) {
        if (document.body.parentNode) {
            document.body.parentNode.style.height = '100%';
        }
    }
};
setTimeout(fixSize, 700);
setTimeout(fixSize, 1500);

// allow testing of specific renderers via "?renderer=Canvas", etc
var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;

OpenLayers.ProxyHost = "proxy.cgi?url=";

function init() {

    map = new OpenLayers.Map({
        div: "map",
        theme: null,
        controls: [
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.TouchNavigation({
                dragPanOptions: {
                    enableKinetic: true
                }
            }),
            new OpenLayers.Control.Zoom()
        ]
    });

    var wms = new OpenLayers.Layer.WMS("OpenLayers WMS",
        "http://vmap0.tiles.osgeo.org/wms/vmap0",
        {layers: 'basic'},
        {isBaseLayer: true, transitionEffect: 'resize'}
    );

    var kml = new OpenLayers.Layer.Vector("KML", {
        projection: map.displayProjection,
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP({
            url: "kml/sundials.kml",
            format: new OpenLayers.Format.KML({
                extractStyles: true,
                extractAttributes: true
            })
        }),
        renderers: renderer
    });

    var wfs = new OpenLayers.Layer.Vector("States", {
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.WFS({
            url: "http://demo.opengeo.org/geoserver/wfs",
            featureType: "states",
            featureNS: "http://www.openplans.org/topp"
        }),
        renderers: renderer
    });

    map.addLayers([wms, wfs, kml]);

    map.setCenter(new OpenLayers.LonLat(-104, 42), 3);
};
