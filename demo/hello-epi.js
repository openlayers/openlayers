/* This is a code which is going to be compiled together with the library */

function init() {
    var map = new ol.Map()
        // .render('map')
    map.setLayers( [ new ol.layer.OSM() ] );
    map.setCenter( new ol.Loc(45, 5));
    map.setZoom(10);
}
window['init'] = init;
