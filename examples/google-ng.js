var map;

function init() {
    map = new OpenLayers.Map('map');
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    
    var gphy = new OpenLayers.Layer.GoogleNG(
        {type: google.maps.MapTypeId.TERRAIN}
    );
    var gmap = new OpenLayers.Layer.GoogleNG(
        // ROADMAP, the default
    );
    var ghyb = new OpenLayers.Layer.GoogleNG(
        {type: google.maps.MapTypeId.HYBRID}
    );
    var gsat = new OpenLayers.Layer.GoogleNG(
        {type: google.maps.MapTypeId.SATELLITE}
    );

    map.addLayers([gphy, gmap, ghyb, gsat]);

    // GoogleNG uses EPSG:900913 as projection, so we have to
    // transform our coordinates
    map.setCenter(new OpenLayers.LonLat(10.2, 48.9).transform(
        new OpenLayers.Projection("EPSG:4326"),
        map.getProjectionObject()
    ), 5);
}
