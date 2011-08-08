OpenLayers.ProxyHost= "proxy.cgi?url=";
var map = new OpenLayers.Map('map');
var wms = new OpenLayers.Layer.WMS(
    "OpenLayers WMS", "http://vmap0.tiles.osgeo.org/wms/vmap0",
    {layers: "basic"}
);

var layer = new OpenLayers.Layer.Vector("WFS", {
    strategies: [new OpenLayers.Strategy.BBOX()],
    protocol: new OpenLayers.Protocol.WFS({
        url:  "http://demo.opengeo.org/geoserver/wfs",
        featureType: "tasmania_roads",
        featureNS: "http://www.openplans.org/topp"
    })
});

map.addLayers([wms, layer]);
map.setCenter(new OpenLayers.LonLat(146.7, -41.8), 6);

var drawings = new OpenLayers.Layer.Vector();
map.addLayer(drawings);
var draw = new OpenLayers.Control.DrawFeature(drawings, OpenLayers.Handler.Polygon);
map.addControl(draw);
draw.activate();

drawings.events.on({
    beforefeatureadded: function(event) {
        var geometry = event.feature.geometry;
        layer.filter = new OpenLayers.Filter.Spatial({
            type: OpenLayers.Filter.Spatial.INTERSECTS,
            value: event.feature.geometry
        });
        layer.refresh({force: true});
        return false;
    }
});
