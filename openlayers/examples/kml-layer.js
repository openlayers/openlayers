var map = new OpenLayers.Map({
    div: "map",
    layers: [
        new OpenLayers.Layer.WMS(
            "WMS", "http://vmap0.tiles.osgeo.org/wms/vmap0",
            {layers: "basic"}
        ),
        new OpenLayers.Layer.Vector("KML", {
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url: "kml/lines.kml",
                format: new OpenLayers.Format.KML({
                    extractStyles: true, 
                    extractAttributes: true,
                    maxDepth: 2
                })
            })
        })
    ],
    center: new OpenLayers.LonLat(-112.169, 36.099),
    zoom: 11
});
