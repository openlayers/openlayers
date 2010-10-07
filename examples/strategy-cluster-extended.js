/**
 * Class: OpenLayers.Strategy.AttributeCluster
 * Strategy for vector feature clustering based on feature attributes.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy.Cluster>
 */
OpenLayers.Strategy.AttributeCluster = OpenLayers.Class(OpenLayers.Strategy.Cluster, {
    /**
     * the attribute to use for comparison
     */
    attribute: null,
    /**
     * Method: shouldCluster
     * Determine whether to include a feature in a given cluster.
     *
     * Parameters:
     * cluster - {<OpenLayers.Feature.Vector>} A cluster.
     * feature - {<OpenLayers.Feature.Vector>} A feature.
     *
     * Returns:
     * {Boolean} The feature should be included in the cluster.
     */
    shouldCluster: function(cluster, feature) {
        var cc_attrval = cluster.cluster[0].attributes[this.attribute];
        var fc_attrval = feature.attributes[this.attribute];
        var superProto = OpenLayers.Strategy.Cluster.prototype;
        return cc_attrval === fc_attrval && 
               superProto.shouldCluster.apply(this, arguments);
    },
    CLASS_NAME: "OpenLayers.Strategy.AttributeCluster"
});

/**
 * Class: OpenLayers.Strategy.RuleCluster
 * Strategy for vector feature clustering according to a given rule.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy.Cluster>
 */
OpenLayers.Strategy.RuleCluster = OpenLayers.Class(OpenLayers.Strategy.Cluster, {
    /**
     * the rule to use for comparison
     */
    rule: null,
    /**
     * Method: shouldCluster
     * Determine whether to include a feature in a given cluster.
     *
     * Parameters:
     * cluster - {<OpenLayers.Feature.Vector>} A cluster.
     * feature - {<OpenLayers.Feature.Vector>} A feature.
     *
     * Returns:
     * {Boolean} The feature should be included in the cluster.
     */
    shouldCluster: function(cluster, feature) {
        var superProto = OpenLayers.Strategy.Cluster.prototype;
        return this.rule.evaluate(cluster.cluster[0]) &&
               this.rule.evaluate(feature) &&
               superProto.shouldCluster.apply(this, arguments);
    },
    CLASS_NAME: "OpenLayers.Strategy.RuleCluster"
});


// global variables
var map, vectorlayer, features, stylemap, select;

// wrap the instanciation code in an anonymous function that gets executed
// immeadeately
(function(){

    // The function that gets called on feature selection: shows information 
    // about the feature/cluser in a div on the page 
	var showInformation = function(evt){
        var feature = evt.feature;
		var info = 'Last hovered feature:<br>';
		if (feature.cluster) {
			info += '&nbsp;&nbsp;Cluster of ' + feature.attributes.count + ' features:';
			var clazzes = {
				'1': 0,
				'2': 0,
				'3': 0,
				'4': 0
			};
			for (var i = 0; i < feature.attributes.count; i++) {
				var feat = feature.cluster[i];
				clazzes[feat.attributes.clazz]++;
			}
			for (var j=1; j<=4; j++) {
				var plural_s = (clazzes[j] !== 1) ? 's' : '';
				info += '<br>&nbsp;&nbsp;&nbsp;&nbsp;&bull;&nbsp;clazz ' + j + ': ' + clazzes[j] + ' feature' + plural_s;
			}
		} else {
			info += '&nbsp;&nbsp;Single feature of clazz = ' + feature.attributes.clazz;
		}
		$('info').innerHTML = info;
    };

	// The function that gets called on feature selection. Shows information 
    // about the number of "points" on the map.
	var updateGeneralInformation = function() {
		var info = 'Currently ' + vectorlayer.features.length + ' points are shown on the map.';
		$('generalinfo').innerHTML = info;
	};
	
	// instanciate the map
	map = new OpenLayers.Map("map");
    
	// background WMS
    var ol_wms = new OpenLayers.Layer.WMS("OpenLayers WMS", "http://vmap0.tiles.osgeo.org/wms/vmap0", {
        layers: "basic"
    });
    
	// context to style the vectorlayer
    var context = {
        getColor: function(feature){
            var color = '#aaaaaa';
			if (feature.attributes.clazz && feature.attributes.clazz === 4) {
				color = '#ee0000';
			} else if(feature.cluster) {
				var onlyFour = true;
				for (var i = 0; i < feature.cluster.length; i++) {
					if (onlyFour && feature.cluster[i].attributes.clazz !== 4) {
						onlyFour = false;
					}
				}
				if (onlyFour === true) {
					color = '#ee0000';
				}
			}
			return color;
        }
    };
	
    // style the vectorlayer
    stylemap = new OpenLayers.StyleMap({
        'default': new OpenLayers.Style({
            pointRadius: 5,
            fillColor: "${getColor}",
            fillOpacity: 0.7,
            strokeColor: "#666666",
            strokeWidth: 1,
            strokeOpacity: 1,
			graphicZIndex: 1
        }, {
            context: context
        }),
		'select' : new OpenLayers.Style({
            pointRadius: 5,
            fillColor: "#ffff00",
            fillOpacity: 1,
            strokeColor: "#666666",
            strokeWidth: 1,
            strokeOpacity: 1,
			graphicZIndex: 2
        })
    });
    
    // the vectorlayer
    vectorlayer = new OpenLayers.Layer.Vector('Vectorlayer', {styleMap: stylemap, strategies: []});
    
	// the select control
	select = new OpenLayers.Control.SelectFeature(
        vectorlayer, {hover: true}
    );
    map.addControl(select);
    select.activate();
    vectorlayer.events.on({"featureselected": showInformation});
	
    map.addLayers([ol_wms, vectorlayer]);
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.zoomToMaxExtent();
    
    features = [];
    // adding lots of features:
    for (var i = 0; i < 700; i++) {
        var r1 = Math.random();
        var r2 = Math.random();
        var r3 = Math.random();
        var r4 = Math.random();
        var px = r1 * 180 * ((r2 < 0.5) ? -1 : 1); 
        var py = r3 * 90 * ((r4 < 0.5) ? -1 : 1);
        var p = new OpenLayers.Geometry.Point(px, py);
        var clazz = (i % 10 === 0) ? 4 : Math.ceil(r4 * 3);
        var f = new OpenLayers.Feature.Vector(p, {clazz: clazz});
        features.push(f);
    }
    vectorlayer.addFeatures(features);
    updateGeneralInformation();

    // the behaviour and methods for the radioboxes    
    var changeStrategy = function() {
        var strategies = [];
        // this is the checkbox
        switch(this.value) {
            case 'cluster':
                // standard clustering
				strategies.push(new OpenLayers.Strategy.Cluster());
                break;
            case 'attribute-cluster':
                // use the custom class: only cluster features of the same clazz
				strategies.push(new OpenLayers.Strategy.AttributeCluster({
                    attribute:'clazz'
                }));
                break;
            case 'rule-cluster':
                // use the custom class: only cluster features that have a 
				// clazz smaller than 4
				strategies.push(new OpenLayers.Strategy.RuleCluster({
                    rule: new OpenLayers.Rule({
                        filter: new OpenLayers.Filter.Comparison({
                            type: OpenLayers.Filter.Comparison.LESS_THAN,
                            property: "clazz",
                            value: 4
                        })
                    })
                }));
                break;
        }
		// remove layer and control
        map.removeLayer(vectorlayer);
		map.removeControl(select);
		// rebuild layer
        vectorlayer = new OpenLayers.Layer.Vector('Vectorlayer', {styleMap: stylemap, strategies: strategies});
        map.addLayer( vectorlayer );
        vectorlayer.addFeatures(features);
        // rebuild select control
		select = new OpenLayers.Control.SelectFeature(
	        vectorlayer, {hover: true}
	    );
	    map.addControl(select);
	    select.activate();
	    vectorlayer.events.on({"featureselected": showInformation});
		// update meta information
		updateGeneralInformation();
    };
	// bind the behviour to the radios
    var inputs = document.getElementsByTagName('input');
    for( var cnt = 0; cnt < inputs.length; cnt++) {
      var input = inputs[cnt];
      if (input.name === 'strategy') {
         input.onclick = changeStrategy;
      }
    }
})();
