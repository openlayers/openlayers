var style = {
    fillOpacity: 0.1,
    fillColor: '#000',
    strokeColor: '#f00',
    strokeOpacity: 0.6
}

var map = new OpenLayers.Map('map');
var layer = new OpenLayers.Layer.OSM( "Simple OSM Map");
var vector = new OpenLayers.Layer.Vector('vector');
map.addLayers([layer, vector]);

map.setCenter(
    new OpenLayers.LonLat(-71.147, 42.472).transform(
        new OpenLayers.Projection("EPSG:4326"),
        map.getProjectionObject()
    ), 12
);

var geolocate = new OpenLayers.Control.Geolocate({
    geolocationOptions: {
        enableHighAccuracy: false,
        maximumAge: 0,
        timeout: 7000
    }
});
map.addControl(geolocate);
geolocate.events.register("locationupdated",this,function(e) {
    vector.removeAllFeatures();
    vector.addFeatures([
        new OpenLayers.Feature.Vector(
            e.point,
            {},
            {
                graphicName: 'cross',
                strokeColor: '#f00',
                strokeWidth: 2,
                fillOpacity: 0,
                pointRadius: 10
            }
        ),
        new OpenLayers.Feature.Vector(
            OpenLayers.Geometry.Polygon.createRegularPolygon(
                new OpenLayers.Geometry.Point(e.point.x, e.point.y),
                e.position.coords.accuracy/2,
                50,
                0
            ),
            {},
            style
        )
    ]);
    map.zoomToExtent(vector.getDataExtent());
});
geolocate.events.register("locationfailed",this,function() {
    OpenLayers.Console.log('Location detection failed');
});

$('locate').onclick = function() {
    geolocate.deactivate();
    $('track').checked = false;
    geolocate.watch = false;
    geolocate.activate();
};
$('track').onclick = function() {
    geolocate.deactivate();
    if (this.checked) {
        geolocate.watch = true;
        geolocate.activate();
    }
};
$('track').checked = false;