/* This is a code which is going to be compiled together with the library */

function init() {
    var map = ol.map()
        .render('map')
        .layers([ol.layer.osm()])
        .center([45, 5])
        .zoom(10);
}
window['init'] = init;