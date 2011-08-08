// Start with the map page
window.location.replace(window.location.href.split("#")[0] + "#mappage");

var selectedFeature = null;

$(document).ready(function() {

    // fix height of content
    function fixContentHeight() {
        var footer = $("div[data-role='footer']:visible"),
            content = $("div[data-role='content']:visible:visible"),
            viewHeight = $(window).height(),
            contentHeight = viewHeight - footer.outerHeight();

        if ((content.outerHeight() + footer.outerHeight()) !== viewHeight) {
            contentHeight -= (content.outerHeight() - content.height() + 1);
            content.height(contentHeight);
        }

        if (window.map) {
            map.updateSize();
        } else {
            // initialize map
            init(function(feature) { 
                selectedFeature = feature; 
                $.mobile.changePage("#popup", "pop"); 
            });
            initLayerList();
        }
    }
    $(window).bind("orientationchange resize pageshow", fixContentHeight);
    document.body.onload = fixContentHeight;

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
    
    $('#popup').live('pageshow',function(event, ui){
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
                            $.mobile.changePage('#mappage');
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

});

function initLayerList() {
    $('#layerspage').page();
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
}

function addLayerToList(layer) {
    var item = $('<li>', {
            "data-icon": "check",
            "class": layer.visibility ? "checked" : ""
        })
        .append($('<a />', {
            text: layer.name
        })
            .click(function() {
                $.mobile.changePage('#mappage');
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
