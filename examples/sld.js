var map, sld, waterBodies;
var format = new OpenLayers.Format.SLD();
function init() {

    map = new OpenLayers.Map('map', {allOverlays: true});
    var layers = createLayers();
    map.addLayers(layers);

    waterBodies = layers[2];
    map.addControl(new OpenLayers.Control.SelectFeature(
        waterBodies, {hover: true, autoActivate: true}
    ));
    map.addControl(new OpenLayers.Control.LayerSwitcher());

    OpenLayers.Request.GET({
        url: "tasmania/sld-tasmania.xml",
        success: complete
    });
}

// handler for the OpenLayers.Request.GET function in the init method
function complete(req) {
    sld = format.read(req.responseXML || req.responseText);
    buildStyleChooser();
    setLayerStyles();
    
    map.zoomToExtent(new OpenLayers.Bounds(143,-39,150,-45));
}

function createLayers() {
    // the name of each layer matches a NamedLayer name in the SLD document
    var layerData = [{
        name: "Land",
        url: "tasmania/TasmaniaStateBoundaries.xml"
    }, {
        name: "Roads",
        url: "tasmania/TasmaniaRoads.xml"
    }, {
        name: "WaterBodies",
        url: "tasmania/TasmaniaWaterBodies.xml"
    }, {
        name: "Cities",
        url: "tasmania/TasmaniaCities.xml"
    }];

    var layers = [];
    for (var i=0,ii=layerData.length; i<ii; ++i) {
        layers.push(new OpenLayers.Layer.Vector(
            layerData[i].name, {
                protocol: new OpenLayers.Protocol.HTTP({
                    url: layerData[i].url,
                    format: new OpenLayers.Format.GML.v2()
                }),
                strategies: [new OpenLayers.Strategy.Fixed()],
                // empty style map, will be populated in setLayerStyles
                styleMap: new OpenLayers.StyleMap()
            }
        ));
    }
    return layers;
}

function setLayerStyles() {
    // set the default style for each layer from sld
    for (var l in sld.namedLayers) {
        var styles = sld.namedLayers[l].userStyles, style;
        for (var i=0,ii=styles.length; i<ii; ++i) {
            style = styles[i];
            if (style.isDefault) {
                map.getLayersByName(l)[0].styleMap.styles["default"] = style;
                break;
            }
        }
    }
    // select style for mouseover on WaterBodies objects
    waterBodies.styleMap.styles.select = sld.namedLayers["WaterBodies"].userStyles[1];
}

// add a radio button for each userStyle
function buildStyleChooser() {
    var styles = sld.namedLayers["WaterBodies"].userStyles;
    var chooser = document.getElementById("style_chooser"), input, li;
    for (var i=0,ii=styles.length; i<ii; ++i) {
        input = document.createElement("input");
        input.type = "radio";
        input.name = "style";
        input.value = i;
        input.checked = i == 0;
        input.onclick = function() { setStyle(this.value); };
        li = document.createElement("li");
        li.appendChild(input);
        li.appendChild(document.createTextNode(styles[i].title));
        chooser.appendChild(li);
    }
}

// set a new style when the radio button changes
function setStyle(index) {
    waterBodies.styleMap.styles["default"] = sld.namedLayers["WaterBodies"].userStyles[index];
    // apply the new style of the features of the Water Bodies layer
    waterBodies.redraw();
}
