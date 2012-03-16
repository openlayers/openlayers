
// use a CQL parser for easy filter creation
var format = new OpenLayers.Format.CQL();

// this rule will get a filter from the CQL text in the form
var rule = new OpenLayers.Rule({
    // We could also set a filter here.  E.g.
    // filter: format.read("STATE_ABBR >= 'B' AND STATE_ABBR <= 'O'"),
    symbolizer: {
        fillColor: "#ff0000",
        strokeColor: "#ffcccc",
        fillOpacity: "0.5"
    }    
});

var states = new OpenLayers.Layer.Vector("States", {
    styleMap: new OpenLayers.StyleMap({
        "default": new OpenLayers.Style(null, {rules: [rule]})
    })
});

var map = new OpenLayers.Map({
    div: "map",
    layers: [
        new OpenLayers.Layer.WMS(
            "OpenLayers WMS",
            "http://maps.opengeo.org/geowebcache/service/wms",
            {layers: "openstreetmap", format: "image/png"}
        ),
        states
    ],
    center: new OpenLayers.LonLat(-101, 39),
    zoom: 3
});

// called when features are fetched
function loadFeatures(data) {
    var features = new OpenLayers.Format.GeoJSON().read(data);
    states.addFeatures(features);
}

// update filter and redraw when form is submitted
var cql = document.getElementById("cql");
var output = document.getElementById("output");
function updateFilter() {
    var filter;
    try {
        filter = format.read(cql.value);
    } catch (err) {
        output.value = err.message;
    }
    if (filter) {
        output.value = "";
        rule.filter = filter;
        states.redraw();
    }
    return false;
}
updateFilter();
var form = document.getElementById("cql_form");
form.onsubmit = updateFilter;
