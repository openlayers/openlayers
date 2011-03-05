var map;
OpenLayers.ProxyHost = "proxy.cgi?url=";

function init() {
    map = new OpenLayers.Map("map");

    var base = new OpenLayers.Layer.WMS("OpenLayers WMS",
        "http://tilecache.osgeo.org/wms-c/Basic.py",
        {layers: "basic"} 
    );
    map.addLayer(base);

    // allow testing of specific renderers via "?renderer=Canvas", etc
    var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
    renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;

    var wfs = new OpenLayers.Layer.Vector("States", {
        strategies: [new OpenLayers.Strategy.BBOX()],
        protocol: new OpenLayers.Protocol.WFS({
            url: "http://demo.opengeo.org/geoserver/wfs",
            featureType: "states",
            featureNS: "http://www.openplans.org/topp"
        }),
        renderers: renderer
    });
    map.addLayer(wfs);

    map.zoomToExtent(new OpenLayers.Bounds(-140.4, 25.1, -44.4, 50.5));
}
