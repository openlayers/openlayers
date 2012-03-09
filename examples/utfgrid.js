var osm = new OpenLayers.Layer.OSM();

var utfgrid = new OpenLayers.Layer.UTFGrid({
    url: "utfgrid/world_utfgrid/${z}/${x}/${y}.json",
    utfgridResolution: 4, // default is 2
    displayInLayerSwitcher: false
});

var map = new OpenLayers.Map({
    div: "map", 
    projection: "EPSG:900913",
    controls: [],
    layers: [osm, utfgrid],
    center: [0, 0],
    zoom: 1
});

var callback = function(infoLookup) {
    var msg = "";
    if (infoLookup) {
        var info;
        for (var idx in infoLookup) {
            // idx can be used to retrieve layer from map.layers[idx]
            info = infoLookup[idx];
            if (info && info.data) {
                msg += "[" + info.id + "] <strong>In 2005, " + 
                    info.data.NAME + " had a population of " +
                    info.data.POP2005 + " people.</strong> ";
            }
        }
    }
    document.getElementById("attrs").innerHTML = msg;
};
    
var controls = {
    move: new OpenLayers.Control.UTFGrid({
        callback: callback,
        handlerMode: "move"
    }),
    hover: new OpenLayers.Control.UTFGrid({
        callback: callback,
        handlerMode: "hover"
    }),
    click: new OpenLayers.Control.UTFGrid({
        callback: callback,
        handlerMode: "click"
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

// activate the control that responds to mousemove
toggleControl({value: "move"});
