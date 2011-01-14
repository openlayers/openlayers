var map = new OpenLayers.Map({
    div: "map",
    maxExtent: new OpenLayers.Bounds(-130, 30, -80, 55),
    maxResolution: 360 / 256 / Math.pow(2, 4),
    numZoomLevels: 12,
    layers: [
        new OpenLayers.Layer.WMS(
            "Global Imagery",
            "http://maps.opengeo.org/geowebcache/service/wms",
            {layers: "bluemarble"},
            {tileOrigin: new OpenLayers.LonLat(-180, -90)}
        )
    ],
    center: new OpenLayers.LonLat(-110, 45),
    zoom: 0
});
