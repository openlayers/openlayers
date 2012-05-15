var map;

function init() {
    map = new OpenLayers.Map("map",{projection:"EPSG:3857"});

    var osm = new OpenLayers.Layer.OSM();
    var toMercator = OpenLayers.Projection.transforms['EPSG:4326']['EPSG:3857'];
    var center = toMercator({x:-0.05,y:51.5});
    
    /**
     * Create 5 random vector features.  Your features would typically be fetched
     * from the server. The features are given an attribute named "foo".
     * The value of this attribute is an integer that ranges from 0 to 100.
     */   
    var features = [];    
    for(var i = 0; i < 5; i++) {
        features[i] = new OpenLayers.Feature.Vector(
                toMercator(new OpenLayers.Geometry.Point(
                    -0.040 - 0.05*Math.random(),
                    51.49 + 0.02*Math.random())), 
                {
                    foo : 100 * Math.random() | 0
                }, {
                    fillColor : '#008040',
                    fillOpacity : 0.8,                    
                    strokeColor : "#ee9900",
                    strokeOpacity : 1,
                    strokeWidth : 1,
                    pointRadius : 8
                });
    }
        
    // create the layer with listeners to create and destroy popups
    var vector = new OpenLayers.Layer.Vector("Points",{
        eventListeners:{
            'featureselected':function(evt){
                var feature = evt.feature;
                var popup = new OpenLayers.Popup.FramedCloud("popup",
                    OpenLayers.LonLat.fromString(feature.geometry.toShortString()),
                    null,
                    "<div style='font-size:.8em'>Feature: " + feature.id +"<br>Foo: " + feature.attributes.foo+"</div>",
                    null,
                    true
                );
                feature.popup = popup;
                map.addPopup(popup);
            },
            'featureunselected':function(evt){
                var feature = evt.feature;
                map.removePopup(feature.popup);
                feature.popup.destroy();
                feature.popup = null;
            }
        }
    });
    vector.addFeatures(features);

    // create the select feature control
    var selector = new OpenLayers.Control.SelectFeature(vector,{
        hover:true,
        autoActivate:true
    }); 
    
    map.addLayers([osm, vector]);
    map.addControl(selector);
    map.setCenter(new OpenLayers.LonLat(center.x,center.y), 13);
}
