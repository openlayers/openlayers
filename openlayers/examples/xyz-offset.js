var map, layer;

// if tiles are not available, hide images
//OpenLayers.Util.onImageLoadError = function() {
//    this.style.display = "none";
//}

// called on body load
function init() {

    var extent = new OpenLayers.Bounds(
        -13758743.4295939,  5591455.28887228, -13531302.3472101 , 5757360.4178881
    );

    map = new OpenLayers.Map({
        div: "map",
        maxExtent: new OpenLayers.Bounds(
            -128 * 156543.0339, -128 * 156543.0339,
            128 * 156543.0339, 128 * 156543.0339
        ),
        restrictedExtent: extent,
        maxResolution: 611.496226171875, // corresponds to level 8 in the cache
        numZoomLevels: 6,
        projection: new OpenLayers.Projection("EPSG:900913"),
        units: "m",
        layers: [
            new OpenLayers.Layer.XYZ(
                "ESRI",
                "http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Portland/ESRI_LandBase_WebMercator/MapServer/tile/${z}/${y}/${x}",
                {zoomOffset: 8} // since our map maxResolution differs from cache max resolution
            )
        ]
    });

    map.zoomToExtent(extent);

}
