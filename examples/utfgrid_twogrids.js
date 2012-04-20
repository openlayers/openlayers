var osm = new OpenLayers.Layer.OSM();

var population = new OpenLayers.Layer.UTFGrid({
    name: "World Population",
    url: "utfgrid/world_utfgrid/${z}/${x}/${y}.json",
    utfgridResolution: 4 // default is 2
});
var bioregions = new OpenLayers.Layer.UTFGrid({
    name: "World Bioregions",
    url: "utfgrid/bio_utfgrid/${z}/${x}/${y}.json",
    utfgridResolution: 4 // default is 2
});

var map = new OpenLayers.Map({
    div: "map",
    projection: "EPSG:900913",
    controls: [],
    layers: [osm, population, bioregions],
    center: [0, 0],
    zoom: 1
});

var callback = function(infoLookup) {
    var msg = "";
    if (infoLookup) {
        var layer, info;
        for (var idx in infoLookup) {
            layer = map.layers[idx];
            info = infoLookup[idx];
            if (info && info.data) {
                msg += "<strong>" + layer.name + "</strong><br>";
                msg += "feature id: " + info.id + "<br>";
                for (var key in info.data) {
                    msg += key + ": " + info.data[key] + "<br>";
                }
            }
        }
    }
    document.getElementById("attrsdiv").innerHTML = msg;
};

var controls = {
    move_pop: new OpenLayers.Control.UTFGrid({
        callback: callback,
        layers: [population],
        handlerMode: "move"
    }),
    move_bio: new OpenLayers.Control.UTFGrid({
        callback: callback,
        layers: [bioregions],
        handlerMode: "move"
    }),
    move_both: new OpenLayers.Control.UTFGrid({
        callback: callback,
        layers: null, // same as all map.layers
        handlerMode: "move"
    })
};

for (var key in controls) {
    map.addControl(controls[key]);
}

function toggleControl(el) {
    for (var c in controls) {
        controls[c].deactivate();
    }
    controls[el.value].activate();
}
toggleControl({value: "move_pop"});
