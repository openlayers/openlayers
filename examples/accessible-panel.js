var lon = 5;
var lat = 40;
var zoom = 5;
var map, layer;

function init() {
    map = new OpenLayers.Map( 'map', { controls: [] } );
    layer = new OpenLayers.Layer.WMS( "OpenLayers WMS", 
            "http://vmap0.tiles.osgeo.org/wms/vmap0", {layers: 'basic'} );
    map.addLayer(layer);

    vlayer = new OpenLayers.Layer.Vector( "Editable" );
    map.addLayer(vlayer);
    
    zb = new OpenLayers.Control.ZoomBox({
        title: "Zoom box: zoom clicking and dragging",
        text: "Zoom"
    });

    var panel = new OpenLayers.Control.Panel({
        defaultControl: zb,
        createControlMarkup: function(control) {
            var button = document.createElement('button'),
                iconSpan = document.createElement('span'),
                textSpan = document.createElement('span');
            iconSpan.innerHTML = '&nbsp;';
            button.appendChild(iconSpan);
            if (control.text) {
                textSpan.innerHTML = control.text;
            }
            button.appendChild(textSpan);
            return button;
        }
    });

    panel.addControls([
        zb,
        new OpenLayers.Control.DrawFeature(vlayer, OpenLayers.Handler.Path,
            {title:'Draw a feature', text: 'Draw'}),
        new OpenLayers.Control.ZoomToMaxExtent({
            title:"Zoom to the max extent",
            text: "World"
        }) 
    ]);
    
    nav = new OpenLayers.Control.NavigationHistory({
        previousOptions: {
            title: "Go to previous map position",
            text: "Prev"
        },
        nextOptions: {
            title: "Go to next map position",
            text: "Next"
        },
        displayClass: "navHistory"
    });
    // parent control must be added to the map
    map.addControl(nav);
    panel.addControls([nav.next, nav.previous]);
    
    map.addControl(panel);

    map.setCenter(new OpenLayers.LonLat(lon, lat), zoom);
}
