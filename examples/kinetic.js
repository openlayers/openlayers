var map = new OpenLayers.Map({
    div: "map",
    resolutions: [0.087890625, 0.0439453125, 0.02197265625, 0.010986328125],
    controls: [
        new OpenLayers.Control.Navigation(
            {dragPanOptions: {enableKinetic: true}}
        )
    ]
});
var layer = new OpenLayers.Layer.TileCache("TileCache Layer",
    ["http://c0.tilecache.osgeo.org/wms-c/cache/",
     "http://c1.tilecache.osgeo.org/wms-c/cache/",
     "http://c2.tilecache.osgeo.org/wms-c/cache/",
     "http://c3.tilecache.osgeo.org/wms-c/cache/",
     "http://c4.tilecache.osgeo.org/wms-c/cache/"],
    "basic",
    {
        serverResolutions: [0.703125, 0.3515625, 0.17578125, 0.087890625,
                            0.0439453125, 0.02197265625, 0.010986328125,
                            0.0054931640625, 0.00274658203125, 0.001373291015625,
                            0.0006866455078125, 0.00034332275390625, 0.000171661376953125,
                            0.0000858306884765625, 0.00004291534423828125, 0.000021457672119140625],
        buffer: 4
    }
);
map.addLayer(layer);
map.setCenter(new OpenLayers.LonLat(0, 0), 0);