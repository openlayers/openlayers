// initialize map when page ready
var map;

var init = function () {
    // create map
    console.log("Initialize MAP!!!");
    map = new OpenLayers.Map({
        div: "map",
        theme: null,
        controls: [
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.TouchNavigation({
                dragPanOptions: {
                    enableKinetic: true
                },
                defaultClick: addPin
            }),
            new OpenLayers.Control.Zoom()
        ],
        layers: [
            new OpenLayers.Layer.OSM("OpenStreetMap", null, {
                transitionEffect: 'resize'
            })
        ],
        center: new OpenLayers.LonLat(742000, 5861000),
        zoom: 3
    });
    var markers = new OpenLayers.Layer.Markers( "Markers" );
    map.addLayer(markers);

    var size = new OpenLayers.Size(21,25);
    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
    var icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png',size,offset);
    
    
    function addPin(e) {
        var pointMapProj = map.getLonLatFromViewPortPx(e.xy);
        markers.addMarker(new OpenLayers.Marker(pointMapProj,icon));
    }
};
