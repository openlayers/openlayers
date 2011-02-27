var selectedFeature = null;

$(document).ready(function() {

    // Start with the map page
    if (window.location.hash && window.location.hash!='#mappage') {
        $.mobile.changePage('mappage');
    }

    // fix height of content
    function fixContentHeight() {
        var footer = $("div[data-role='footer']:visible"),
        content = $("div[data-role='content']:visible:visible"),
        viewHeight = $(window).height(),
        contentHeight = viewHeight - footer.outerHeight();

        if ((content.outerHeight() + footer.outerHeight()) !== viewHeight) {
            contentHeight -= (content.outerHeight() - content.height());
            content.height(contentHeight);
        }
        if (window.map) {
            map.updateSize();
        } else {
            // initialize map
            init();
        }
    }
    $(window).bind("orientationchange resize pageshow", fixContentHeight);
    fixContentHeight(); 
    //init();

    // Map zoom  
    $("#plus").click(function(){
        map.zoomIn();
    });
    $("#minus").click(function(){
        map.zoomOut();
    });
    $("#locate").click(function(){
        var control = map.getControlsBy("id", "locate-control")[0];
        if (control.active) {
            control.getCurrentLocation();
        } else {
            control.activate();
        }
    });

    var sprintersLayer = new OpenLayers.Layer.Vector("Sprinters", {
        styleMap: new OpenLayers.StyleMap({
            externalGraphic: "img/mobile-loc.png",
            graphicOpacity: 1.0,
            graphicWith: 16,
            graphicHeight: 26,
            graphicYOffset: -26
        })
    });
    
    var sprinters = getFeatures();
    sprintersLayer.addFeatures(sprinters);
    
    map.addLayer(sprintersLayer);
    
    var selectControl = new OpenLayers.Control.SelectFeature(sprintersLayer, {onSelect: function(feature){
        selectedFeature = feature;
        $.mobile.changePage($("#popup"), "pop");
    }});
    
    map.addControl(selectControl);
    selectControl.activate();
    
    $('div#popup').live('pageshow',function(event, ui){
        var li = "";
        for(var attr in selectedFeature.attributes){
            li += "<li><div style='width:25%;float:left'>" + attr + "</div><div style='width:75%;float:right'>" 
            + selectedFeature.attributes[attr] + "</div></li>";
        }
        $("ul#details-list").empty().append(li).listview("refresh");
    });

    $('#searchpage').live('pageshow',function(event, ui){
        $('#query').bind('change', function(e){
            $('#search_results').empty();
            if ($('#query')[0].value === '') {
                return;
            }
            $.mobile.pageLoading();

            // Prevent form send
            e.preventDefault();

            var searchUrl = 'http://ws.geonames.org/searchJSON?featureClass=P&maxRows=10';
            searchUrl += '&name_startsWith=' + $('#query')[0].value;
            $.getJSON(searchUrl, function(data) {
                $.each(data.geonames, function() {
                    var place = this;
                    $('<li>')
                        .hide()
                        .append($('<h2 />', {
                            text: place.name
                        }))
                        .append($('<p />', {
                            html: '<b>' + place.countryName + '</b> ' + place.fcodeName
                        }))
                        .appendTo('#search_results')
                        .click(function() {
                            $.mobile.changePage('mappage');
                            var lonlat = new OpenLayers.LonLat(place.lng, place.lat);
                            map.setCenter(lonlat.transform(gg, sm), 10);
                        })
                        .show();
                });
                $('#search_results').listview('refresh');
                $.mobile.pageLoading(true);
            });
        });
        // only listen to the first event triggered
        $('#searchpage').die('pageshow', arguments.callee);
    });

    $('#layerslist').listview();
    $('<li>', {
            "data-role": "list-divider",
            text: "Base Layers"
        })
        .appendTo('#layerslist');
    var baseLayers = map.getLayersBy("isBaseLayer", true);
    $.each(baseLayers, function() {
        addLayerToList(this);
    });

    $('<li>', {
            "data-role": "list-divider",
            text: "Overlay Layers"
        })
        .appendTo('#layerslist');
    var overlayLayers = map.getLayersBy("isBaseLayer", false);
    $.each(overlayLayers, function() {
        addLayerToList(this);
    });
    $('#layerslist').listview('refresh');
    
    map.events.register("addlayer", this, function(e) {
        addLayerToList(e.layer);
    });
});

function addLayerToList(layer) {
    var item = $('<li>', {
            "data-icon": "check",
            "class": layer.visibility ? "checked" : ""
        })
        .append($('<a />', {
            text: layer.name
        })
            .click(function() {
                $.mobile.changePage('mappage');
                if (layer.isBaseLayer) {
                    layer.map.setBaseLayer(layer);
                } else {
                    layer.setVisibility(!layer.getVisibility());
                }
            })
        )
        .appendTo('#layerslist');
    layer.events.on({
        'visibilitychanged': function() {
            $(item).toggleClass('checked');
        }
    });
}

function getFeatures(){
    var features = {
      "type": "FeatureCollection", 
      "features": [
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [1332700, 7906300]}, 
            "properties": {"Name": "Igor Tihonov", "Country":"Sweden", "City":"Gothenburg"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [790300, 6573900]}, 
            "properties": {"Name": "Marc Jansen", "Country":"Germany", "City":"Bonn"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [568600, 6817300]}, 
            "properties": {"Name": "Bart van den Eijnden", "Country":"Netherlands", "City":"Utrecht"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [-7909900, 5215100]}, 
            "properties": {"Name": "Christopher Schmidt", "Country":"United States of America", "City":"Boston"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [-937400, 5093200]}, 
            "properties": {"Name": "Jorge Gustavo Rocha", "Country":"Portugal", "City":"Braga"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [-355300, 7547800]}, 
            "properties": {"Name": "Jennie Fletcher ", "Country":"Scotland", "City":"Edinburgh"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [657068.53608487, 5712321.2472725]}, 
            "properties": {"Name": "Bruno Binet ", "Country":"France", "City":"Chambéry"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [667250.8958124, 5668048.6072737]}, 
            "properties": {"Name": "Eric Lemoine", "Country":"France", "City":"Theys"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [653518.03606319, 5721118.5122914]}, 
            "properties": {"Name": "Antoine Abt", "Country":"France", "City":"La Motte Servolex"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [657985.78042416, 5711862.6251028]}, 
            "properties": {"Name": "Pierre Giraud", "Country":"France", "City":"Chambéry"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [742941.93818208, 5861818.9477535]}, 
            "properties": {"Name": "Stéphane Brunner", "Country":"Switzerland", "City":"Paudex"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [736082.61064069, 5908165.4649505]},
            "properties": {"Name": "Frédéric Junod", "Country":"Switzerland", "City":"Montagny-près-Yverdon"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [771595.97057525, 5912284.7041793]},
            "properties": {"Name": "Cédric Moullet", "Country":"Switzerland", "City":"Payerne"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [744205.23922364, 5861277.319748]},
            "properties": {"Name": "Benoit Quartier", "Country":"Switzerland", "City":"Lutry"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [1717430.147101, 5954568.7127565]}, 
            "properties": {"Name": "Andreas Hocevar", "Country":"Austria", "City":"Graz"}},
            { "type": "Feature", "geometry": {"type": "Point", "coordinates": [-12362007.067301,5729082.2365672]}, 
            "properties": {"Name": "Tim Schaub", "Country":"United States of America", "City":"Bozeman"}}
       ]
    };

    var reader = new OpenLayers.Format.GeoJSON();
    
    return reader.read(features);
}
