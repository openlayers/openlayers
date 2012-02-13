var options = {
    singleTile: true,
    ratio: 1,
    isBaseLayer: true,
    wrapDateLine: true,
    getURL: function() {
        var center = this.map.getCenter().transform("EPSG:3857", "EPSG:4326"),
            size = this.map.getSize();
        return [
            this.url, "&center=", center.lat, ",", center.lon,
            "&zoom=", this.map.getZoom(), "&size=", size.w, "x", size.h
        ].join("");
    }
};

var map = new OpenLayers.Map({
    div: "map",
    maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
    maxResolution: 156543.03390625,
    units: "m",
    projection: "EPSG:3857",
    numZoomLevels: 22,
    layers: [
        new OpenLayers.Layer.Grid(
            "Google Physical",
            "http://maps.googleapis.com/maps/api/staticmap?sensor=false&maptype=terrain", 
            null, options
        ),
        new OpenLayers.Layer.Grid(
            "Google Streets",
            "http://maps.googleapis.com/maps/api/staticmap?sensor=false&maptype=roadmap", 
            null, options
        ),
        new OpenLayers.Layer.Grid(
            "Google Hybrid",
            "http://maps.googleapis.com/maps/api/staticmap?sensor=false&maptype=hybrid", 
            null, options
        ),
        new OpenLayers.Layer.Grid(
            "Google Satellite",
            "http://maps.googleapis.com/maps/api/staticmap?sensor=false&maptype=satellite", 
            null, options
        )
    ],
    center: new OpenLayers.LonLat(10.2, 48.9).transform("EPSG:4326", "EPSG:3857"),
    zoom: 5
});
map.addControl(new OpenLayers.Control.LayerSwitcher());
