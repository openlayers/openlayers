// make map available for easy debugging
var map;

// if your application transforms coordinates to and from EPSG:102113 then
// you must uncomment the lines below

// OpenLayers.Projection.addTransform("EPSG:4326", "EPSG:102113",
//     OpenLayers.Layer.SphericalMercator.projectForward);
// OpenLayers.Projection.addTransform("EPSG:102113", "EPSG:4326",
//     OpenLayers.Layer.SphericalMercator.projectInverse);

function init() {

    var options = {
        projection: new OpenLayers.Projection("EPSG:102113"),
        units: "m",
        numZoomLevels: 18,
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(-20037508, -20037508,
                                         20037508, 20037508.34)
    };
    map = new OpenLayers.Map('map', options);

    // create Google layer with EPSG:102113 code
    var gsat = new OpenLayers.Layer.Google("Google Imagery", {
        type: G_SATELLITE_MAP, 
        sphericalMercator: true,
        projection: "EPSG:102113"
    });

    // create WMS layer
    var wms = new OpenLayers.Layer.WMS(
        "Highways",
        "http://sampleserver1.arcgisonline.com/arcgis/services/Specialty/ESRI_StateCityHighway_USA/MapServer/WMSServer",
        {layers: "2", format: "image/gif", transparent: "true"},
        {
            isBaseLayer: false,
            wrapDateLine: true
        }
    );

    map.addLayers([gsat, wms]);
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.setCenter(new OpenLayers.LonLat(-10723197, 4500612), 3);
}
