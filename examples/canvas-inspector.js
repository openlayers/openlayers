
var features = [

    new OpenLayers.Feature.Vector(
        OpenLayers.Geometry.fromWKT(
            "LINESTRING(-90 90, 90 -90)"
        ),
        {color: "#0f0000"}
    ),
    
    new OpenLayers.Feature.Vector(
        OpenLayers.Geometry.fromWKT(
            "LINESTRING(100 50, -100 -50)"
        ),
        {color: "#00ff00"}
    )

];

var layer = new OpenLayers.Layer.Vector(null, {
    styleMap: new OpenLayers.StyleMap({
        strokeWidth: 3,
        strokeColor: "${color}"
    }),
    isBaseLayer: true,
    renderers: ["Canvas"],
    rendererOptions: {hitDetection: true}
});
layer.addFeatures(features);

var map = new OpenLayers.Map({
    div: "map",
    layers: [layer],
    center: new OpenLayers.LonLat(0, 0),
    zoom: 0
});

var xOff = 2, yOff = 2;

var rows = 1 + (2 * yOff);
var cols = 1 + (2 * xOff);

var template = new jugl.Template("template");
template.process({
    clone: true,
    parent: "inspector",
    context: {
        rows: rows,
        cols: cols
    }
});

function isDark(r, g, b, a) {
    a = a / 255;
    var da = 1 - a;
    // convert color values to decimal (assume white background)
    r = (a * r / 255) + da;
    g = (a * g / 255) + da;
    b = (a * b / 255) + da;
    // use w3C brightness measure
    var brightness = (r * 0.299) + (g * 0.587) + (b * 0.144);
    return brightness < 0.5;
}

var context = layer.renderer.canvas; //layer.renderer.hitContext;
var size = map.getSize();
map.events.on({
    mousemove: function(event) {
        var x = event.xy.x - 1; // TODO: fix this elsewhere
        var y = event.xy.y;
        if ((x >= xOff) && (x < size.w - xOff) && (y >= yOff) && (y < size.h - yOff)) {
            var data = context.getImageData(x - xOff, y - yOff, rows, cols).data;
            var offset, red, green, blue, alpha, cell;
            for (var i=0; i<cols; ++i) {
                for (var j=0; j<rows; ++j) {
                    offset = (i * 4) + (j * 4 * cols);
                    red = data[offset];
                    green = data[offset + 1];
                    blue = data[offset + 2];
                    alpha = data[offset + 3];
                    cell = document.getElementById("c" + i + "r" + j);
                    cell.innerHTML = "R: " + red + "<br>G: " + green + "<br>B: " + blue + "<br>A: " + alpha;
                    cell.style.backgroundColor = "rgba(" + red + ", " + green + ", " + blue + ", " + (alpha / 255) + ")";
                    cell.style.color = isDark(red, green, blue, alpha) ? "#ffffff" : "#000000";
                }
            }
        }
    }
});


