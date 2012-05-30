var map, vector;

function init(){
    map = new OpenLayers.Map('map', {
        projection: 'EPSG:31467',
        maxResolution: 3457.03125,
        units: 'm',
        numZoomLevels: 1,
        controls: [
            new OpenLayers.Control.Attribution({
                div: document.getElementById('attribution')
            }),
            new OpenLayers.Control.MousePosition({
                div: document.getElementById('mouse-position-31467'),
                prefix: 'Coordinates: ',
                suffix: ' (in <a href="http://spatialreference.org/ref/epsg/' 
                    + '31467/">EPSG:31467</a>)'
            }),
            new OpenLayers.Control.MousePosition({
                div: document.getElementById('mouse-position-4326'),
                displayProjection: new OpenLayers.Projection('EPSG:4326'),
                prefix: 'Coordinates: ',
                suffix: ' (in <a href="http://spatialreference.org/ref/epsg/' 
                    + '4326/">EPSG:4326</a>)'
            })
        ],
        maxExtent: new OpenLayers.Bounds(3146150, 5223600, 4031150, 6108600)
    });
    var germany_gk3 = new OpenLayers.Layer.WMS(
        'Germany (MetaSpatial)', 
        'http://www.metaspatial.net/cgi-bin/germany-wms', 
        {
            layers: 'germany'
        }, 
        {
            singleTile: true,
            ratio: 1.0,
            attribution: 'Background WMS offered without restrictions by '
                + '<a href="http://www.metaspatial.net/">MetaSpatial</a>'
        }
    );
    
    vector = new OpenLayers.Layer.Vector();
    map.addLayers( [ germany_gk3, vector ] );
    
    map.zoomToMaxExtent();
}

function addVector(x, y, btn){
    var status = "Transformed ",
        geometry = new OpenLayers.Geometry.Point(x, y);
    
    status += '<br /><code class="emph">  ' 
        + geometry.toString() + '</code> to';
    
    geometry.transform(
        new OpenLayers.Projection('EPSG:4326'), 
        new OpenLayers.Projection('EPSG:31467')
    );
    
    status += '<br /><code class="emph">  ' 
        + geometry.toString() + '</code>.';
    document.getElementById('status').innerHTML = status;
    
    var feature = new OpenLayers.Feature.Vector(geometry, {}, {
        strokeColor: '#333333',
        strokeOpacity: 1,
        strokeWidth: 2,
        fillColor: '#9966cc',
        fillOpacity: 0.9,
        pointRadius: 12,
        graphicName: 'star'
    });
    vector.addFeatures([feature]);
    btn.disabled = true;
}
function addOutline(btn) {
    var wkt = 'POLYGON(('
        + ' 9.921906 54.983104, 9.939580 54.596642,' 
        + '10.950112 54.363607,10.939467 54.008693,11.956252 54.196486,'
        + '12.518440 54.470371,13.647467 54.075511,14.119686 53.757029,'
        + '14.353315 53.248171,14.074521 52.981263,14.437600 52.624850,'
        + '14.685026 52.089947,14.607098 51.745188,15.016996 51.106674,'
        + '14.570718 51.002339,14.307013 51.117268,14.056228 50.926918,'
        + '13.338132 50.733234,12.966837 50.484076,12.240111 50.266338,'
        + '12.415191 49.969121,12.521024 49.547415,13.031329 49.307068,'
        + '13.595946 48.877172,13.243357 48.416115,12.884103 48.289146,'
        + '13.025851 47.637584,12.932627 47.467646,12.620760 47.672388,'
        + '12.141357 47.703083,11.426414 47.523766,10.544504 47.566399,'
        + '10.402084 47.302488, 9.896068 47.580197, 9.594226 47.525058,'
        + ' 8.522612 47.830828, 8.317301 47.613580, 7.466759 47.620582,'
        + ' 7.593676 48.333019, 8.099279 49.017784, 6.658230 49.201958,'
        + ' 6.186320 49.463803, 6.242751 49.902226, 6.043073 50.128052,'
        + ' 6.156658 50.803721, 5.988658 51.851616, 6.589397 51.852029,'
        + ' 6.842870 52.228440, 7.092053 53.144043, 6.905140 53.482162,'
        + ' 7.100425 53.693932, 7.936239 53.748296, 8.121706 53.527792,'
        + ' 8.800734 54.020786, 8.572118 54.395646, 8.526229 54.962744,'
        + ' 9.282049 54.830865, 9.921906 54.983104))',
        feature = new OpenLayers.Format.WKT().read(wkt),
        geometry = feature.geometry.transform(
            new OpenLayers.Projection('EPSG:4326'), 
            new OpenLayers.Projection('EPSG:31467')
        ),
        style = {
            strokeColor: '#9966cc',
            strokeOpacity: 1,
            strokeWidth: 5,
            fillColor: '#ffffff',
            fill: false
        },
        transformedFeature = new OpenLayers.Feature.Vector(geometry, {}, style);
    
    vector.addFeatures([transformedFeature]);
    document.getElementById('status').innerHTML = 'Transformed polygon';
    btn.disabled = true;
}

function clearVectors(){
    vector.removeAllFeatures();
    var ids = [
        'btnCologne',
        'btnBerlin',
        'btnHamburg',
        'btnMunich',
        'btnGermany'
    ];
    for (var i = 0, len = ids.length; i < len; i++) {
        var elem = document.getElementById(ids[i]);
        elem.disabled = false;
    }
    document.getElementById('status').innerHTML = '';
}
