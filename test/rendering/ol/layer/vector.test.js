

goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.GeoJSON');
goog.require('ol.geom.Circle');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');


describe('ol.rendering.layer.Vector', function() {

  var center = [1825927.7316762917, 6143091.089223046];

  var map;
  function createMap(renderer) {
    map = new ol.Map({
      pixelRatio: 1,
      target: createMapDiv(80, 80),
      renderer: renderer,
      view: new ol.View({
        center: center,
        zoom: 13
      })
    });
  }

  afterEach(function() {
    if (map) {
      disposeMap(map);
    }
    map = null;
  });

  var source;

  function addCircle(r) {
    source.addFeature(new ol.Feature(new ol.geom.Circle(center, r)));
  }

  function addPolygon(r) {
    source.addFeature(new ol.Feature(new ol.geom.Polygon([
      [
        [center[0] - r, center[1] - r],
        [center[0] + r, center[1] - r],
        [center[0] + r, center[1] + r],
        [center[0] - r, center[1] + r],
        [center[0] - r, center[1] - r]
      ]
    ])));
  }

  function addLineString(r) {
    source.addFeature(new ol.Feature(new ol.geom.LineString([
      [center[0] - r, center[1] - r],
      [center[0] + r, center[1] - r],
      [center[0] + r, center[1] + r],
      [center[0] - r, center[1] + r],
      [center[0] - r, center[1] - r]
    ])));
  }

  describe('vector layer', function() {

    beforeEach(function() {
      source = new ol.source.Vector();
    });

    it('renders opacity correctly with the canvas renderer', function(done) {
      createMap('canvas');
      var smallLine = new ol.Feature(new ol.geom.LineString([
        [center[0], center[1] - 1],
        [center[0], center[1] + 1]
      ]));
      smallLine.setStyle(new ol.style.Style({
        zIndex: -99,
        stroke: new ol.style.Stroke({width: 75, color: 'red'})
      }));
      source.addFeature(smallLine);
      addPolygon(100);
      addCircle(200);
      addPolygon(250);
      addCircle(500);
      addPolygon(600);
      addPolygon(720);
      map.addLayer(new ol.layer.Vector({
        source: source
      }));
      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas.png',
            17, done);
      });
    });

    it('renders opacity correctly with renderMode: \'image\'', function(done) {
      createMap('canvas');
      var smallLine = new ol.Feature(new ol.geom.LineString([
        [center[0], center[1] - 1],
        [center[0], center[1] + 1]
      ]));
      smallLine.setStyle(new ol.style.Style({
        zIndex: -99,
        stroke: new ol.style.Stroke({width: 75, color: 'red'})
      }));
      source.addFeature(smallLine);
      addPolygon(100);
      addCircle(200);
      addPolygon(250);
      addCircle(500);
      addPolygon(600);
      addPolygon(720);
      map.addLayer(new ol.layer.Vector({
        renerMode: 'image',
        source: source
      }));
      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas.png',
            17, done);
      });
    });

    it('renders transparent layers correctly with the canvas renderer', function(done) {
      createMap('canvas');
      var smallLine = new ol.Feature(new ol.geom.LineString([
        [center[0], center[1] - 1],
        [center[0], center[1] + 1]
      ]));
      smallLine.setStyle([
        new ol.style.Style({
          stroke: new ol.style.Stroke({width: 75, color: 'red'})
        }),
        new ol.style.Style({
          stroke: new ol.style.Stroke({width: 45, color: 'white'})
        })
      ]);
      source.addFeature(smallLine);
      var smallLine2 = new ol.Feature(new ol.geom.LineString([
        [center[0], center[1] - 1000],
        [center[0], center[1] + 1000]
      ]));
      smallLine2.setStyle([
        new ol.style.Style({
          stroke: new ol.style.Stroke({width: 35, color: 'blue'})
        }),
        new ol.style.Style({
          stroke: new ol.style.Stroke({width: 15, color: 'green'})
        })
      ]);
      source.addFeature(smallLine2);

      map.addLayer(new ol.layer.Vector({
        source: source,
        opacity: 0.5
      }));
      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-transparent.png',
            7, done);
      });
    });

    it('renders transparent layers correctly with renderMode: \'image\'', function(done) {
      createMap('canvas');
      var smallLine = new ol.Feature(new ol.geom.LineString([
        [center[0], center[1] - 1],
        [center[0], center[1] + 1]
      ]));
      smallLine.setStyle([
        new ol.style.Style({
          stroke: new ol.style.Stroke({width: 75, color: 'red'})
        }),
        new ol.style.Style({
          stroke: new ol.style.Stroke({width: 45, color: 'white'})
        })
      ]);
      source.addFeature(smallLine);
      var smallLine2 = new ol.Feature(new ol.geom.LineString([
        [center[0], center[1] - 1000],
        [center[0], center[1] + 1000]
      ]));
      smallLine2.setStyle([
        new ol.style.Style({
          stroke: new ol.style.Stroke({width: 35, color: 'blue'})
        }),
        new ol.style.Style({
          stroke: new ol.style.Stroke({width: 15, color: 'green'})
        })
      ]);
      source.addFeature(smallLine2);

      map.addLayer(new ol.layer.Vector({
        renderMode: 'image',
        source: source,
        opacity: 0.5
      }));
      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-transparent.png',
            7, done);
      });
    });

    it('renders rotation correctly with the canvas renderer', function(done) {
      createMap('canvas');
      map.getView().setRotation(Math.PI + Math.PI / 4);
      addPolygon(300);
      addCircle(500);
      map.addLayer(new ol.layer.Vector({
        source: source,
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            width: 2,
            color: 'black'
          })
        })
      }));
      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-rotated.png',
            1.7, done);
      });
    });

    it('renders rotation correctly with renderMode: \'image\'', function(done) {
      createMap('canvas');
      map.getView().setRotation(Math.PI + Math.PI / 4);
      addPolygon(300);
      addCircle(500);
      map.addLayer(new ol.layer.Vector({
        renderMode: 'image',
        source: source,
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            width: 2,
            color: 'black'
          })
        })
      }));
      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-rotated.png',
            2.9, done);
      });
    });

    it('unskips features correctly with renderMode: \'image\'', function(done) {
      createMap('canvas');
      addCircle(500);
      addPolygon(300);
      map.skipFeature(source.getFeatures()[1]);
      map.addLayer(new ol.layer.Vector({
        renderMode: 'image',
        source: source,
        style: new ol.style.Style({
          fill: new ol.style.Fill({
            color: 'rgba(255,0,0,0.5)'
          }),
          stroke: new ol.style.Stroke({
            width: 2,
            color: 'black'
          })
        })
      }));
      map.renderSync();
      map.unskipFeature(source.getFeatures()[1]);
      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('renders fill/stroke batches correctly with the canvas renderer', function(done) {
      createMap('canvas');
      source = new ol.source.Vector({
        overlaps: false
      });
      addPolygon(100);
      addCircle(200);
      addPolygon(250);
      addCircle(500);
      addPolygon(600);
      addPolygon(720);
      map.addLayer(new ol.layer.Vector({
        source: source,
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: '#3399CC',
            width: 1.25
          })
        })
      }));
      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-opaque.png',
            24.34, done);
      });
    });

    it('renders stroke batches correctly with the canvas renderer', function(done) {
      createMap('canvas');
      source = new ol.source.Vector({
        overlaps: false
      });
      addLineString(100);
      addLineString(250);
      addLineString(600);
      addLineString(720);
      map.addLayer(new ol.layer.Vector({
        source: source,
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: '#3399CC',
            width: 1.25
          })
        })
      }));
      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-stroke.png',
            7, done);
      });
    });

    it('interrupts fill/stroke batches correctly with the canvas renderer', function(done) {
      createMap('canvas');
      var color;
      function createSource(overlaps) {
        color = '#3399CC';
        source = new ol.source.Vector({
          overlaps: overlaps
        });
        addPolygon(720);
        addPolygon(600);
        addCircle(500);
        addPolygon(250);
        addCircle(200);
        addPolygon(100);
        return source;
      }
      function alternateColor() {
        if (color == '#3399CC') {
          color = '#CC9933';
        } else {
          color = '#3399CC';
        }
        return color;
      }
      var layer = new ol.layer.Vector({
        source: createSource(true),
        style: function(feature) {
          alternateColor();
          return new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: alternateColor(),
              width: 1.25
            }),
            fill: new ol.style.Fill({
              color: alternateColor()
            })
          });
        }
      });
      map.addLayer(layer);
      map.once('postrender', function() {
        var canvas = map.getRenderer().canvas_;
        // take a snapshot of this `overlaps: true` image
        var referenceImage = canvas.toDataURL('image/png');
        // now render the same with `overlaps: false`
        layer.setSource(createSource(false));
        // result should be the same as with `overlaps: true`
        map.once('postrender', function(e) {
          expectResemble(map, referenceImage, 1e-9, done);
        });
      });
    });

    it('interrupts stroke batches correctly with the canvas renderer', function(done) {
      createMap('canvas');
      var color;
      function createSource(overlaps) {
        color = '#3399CC';
        source = new ol.source.Vector({
          overlaps: overlaps
        });
        addLineString(720);
        addLineString(600);
        addLineString(250);
        addLineString(100);
        return source;
      }
      function alternateColor() {
        if (color == '#3399CC') {
          color = '#CC9933';
        } else {
          color = '#3399CC';
        }
        return color;
      }
      var layer = new ol.layer.Vector({
        source: createSource(true),
        style: function(feature) {
          alternateColor();
          return new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: alternateColor(),
              width: 1.25
            }),
            fill: new ol.style.Fill({
              color: alternateColor()
            })
          });
        }
      });
      map.addLayer(layer);
      map.once('postrender', function() {
        var canvas = map.getRenderer().canvas_;
        // take a snapshot of this `overlaps: true` image
        var referenceImage = canvas.toDataURL('image/png');
        // now render the same with `overlaps: false`
        layer.setSource(createSource(false));
        // result should be exactly the same as with `overlaps: true`
        map.once('postrender', function() {
          expectResemble(map, referenceImage, 1e-9, done);
        });
      });
    });
  });

  describe('polygon rendering', function() {

    var map2;
    beforeEach(function() {
      map2 = new ol.Map({
        pixelRatio: 1,
        target: createMapDiv(128, 128),
        view: new ol.View({
          center: [0, 0],
          zoom: 0
        })
      });
    });

    afterEach(function() {
      disposeMap(map2);
      map2 = null;
    });

    it('renders a feature that spans the world', function(done) {
      var json = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]
            ],
            [
              [0, 60], [-17.6336, 24.2705], [-57.0634, 18.5410], [-28.5317, -9.2705], [-35.2671, -48.5410], [0, -30], [35.2671, -48.5410], [28.5317, -9.2705], [57.0634, 18.5410], [17.6336, 24.2705], [0, 60]
            ]
          ]
        },
        properties: {}
      };

      var format = new ol.format.GeoJSON({featureProjection: 'EPSG:3857'});
      var feature = format.readFeature(json);

      var layer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: [feature]
        }),
        style: new ol.style.Style({
          fill: new ol.style.Fill({
            color: 'blue'
          })
        })
      });

      map2.addLayer(layer);

      map2.once('postrender', function() {
        expectResemble(map2, 'rendering/ol/layer/expected/inverted-star.png', 1, done);
      });

    });

  });

  describe('Polygon simplification', function() {

    var layer, map3;

    beforeEach(function() {
      var src = new ol.source.Vector({
        features: [
          new ol.Feature(new ol.geom.Polygon([[
            [-22, 58],
            [-22, 78],
            [-9, 78],
            [-9, 58],
            [-22, 58]
          ]])),
          new ol.Feature(new ol.geom.Polygon([[
            [-9, 58],
            [-9, 78],
            [4, 78],
            [4, 58],
            [-9, 58]
          ]]))
        ]
      });
      layer = new ol.layer.Vector({
        renderBuffer: 0,
        source: src
      });
      var view = new ol.View({
        center: [-9.5, 78],
        zoom: 2,
        projection: 'EPSG:4326'
      });

      map3 = new ol.Map({
        pixelRatio: 1,
        layers: [layer],
        target: createMapDiv(100, 100),
        view: view
      });
    });

    afterEach(function() {
      disposeMap(map3);
      map3 = null;
    });

    it('renders partially out-of-view polygons with a fill and stroke', function(done) {
      layer.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: [0, 0, 0, 1],
          width: 2
        }),
        fill: new ol.style.Fill({
          color: [255, 0, 0, 1]
        })
      }));
      map3.once('postrender', function() {
        expectResemble(map3, 'rendering/ol/layer/expected/vector-canvas-simplified.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('renders partially out-of-view polygons with a fill', function(done) {
      layer.setStyle(new ol.style.Style({
        fill: new ol.style.Fill({
          color: [0, 0, 0, 1]
        })
      }));
      map3.once('postrender', function() {
        expectResemble(map3, 'rendering/ol/layer/expected/vector-canvas-simplified-fill.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('renders partially out-of-view polygons with a stroke', function(done) {
      layer.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: [0, 0, 0, 1],
          width: 2
        })
      }));
      map3.once('postrender', function() {
        expectResemble(map3, 'rendering/ol/layer/expected/vector-canvas-simplified-stroke.png',
            IMAGE_TOLERANCE, done);
      });
    });

  });

  describe('decluttering', function() {

    beforeEach(function() {
      source = new ol.source.Vector();
    });

    it('declutters text', function(done) {
      createMap('canvas');
      var layer = new ol.layer.Vector({
        source: source
      });
      map.addLayer(layer);

      var centerFeature = new ol.Feature({
        geometry: new ol.geom.Point(center),
        text: 'center'
      });
      source.addFeature(centerFeature);
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] - 550, center[1]]),
        text: 'west'
      }));
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] + 550, center[1]]),
        text: 'east'
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new ol.style.Style({
          text: new ol.style.Text({
            text: feature.get('text'),
            font: '12px sans-serif'
          })
        });
      });

      map.once('postrender', function() {
        var hitDetected = map.getFeaturesAtPixel([42, 42]);
        expect(hitDetected).to.have.length(1);
        expect(hitDetected[0]).to.equal(centerFeature);
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter.png',
            2.2, done);
      });
    });

    it('declutters text with renderMode: \'image\'', function(done) {
      createMap('canvas');
      var layer = new ol.layer.Vector({
        renderMode: 'image',
        source: source
      });
      map.addLayer(layer);

      var centerFeature = new ol.Feature({
        geometry: new ol.geom.Point(center),
        text: 'center'
      });
      source.addFeature(centerFeature);
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] - 550, center[1]]),
        text: 'west'
      }));
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] + 550, center[1]]),
        text: 'east'
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new ol.style.Style({
          text: new ol.style.Text({
            text: feature.get('text'),
            font: '12px sans-serif'
          })
        });
      });

      map.once('postrender', function() {
        var hitDetected = map.getFeaturesAtPixel([42, 42]);
        expect(hitDetected).to.have.length(1);
        expect(hitDetected[0]).to.equal(centerFeature);
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter.png',
            2.2, done);
      });
    });

    it('declutters text and respects z-index', function(done) {
      createMap('canvas');
      var layer = new ol.layer.Vector({
        source: source
      });
      map.addLayer(layer);

      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point(center),
        text: 'center',
        zIndex: 2
      }));
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] - 550, center[1]]),
        text: 'west',
        zIndex: 3
      }));
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] + 550, center[1]]),
        text: 'east',
        zIndex: 1
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new ol.style.Style({
          zIndex: feature.get('zIndex'),
          text: new ol.style.Text({
            text: feature.get('text'),
            font: '12px sans-serif'
          })
        });
      });

      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter-zindex.png',
            3.9, done);
      });
    });

    it('declutters images', function(done) {
      createMap('canvas');
      var layer = new ol.layer.Vector({
        source: source
      });
      map.addLayer(layer);

      var centerFeature = new ol.Feature({
        geometry: new ol.geom.Point(center)
      });
      source.addFeature(centerFeature);
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] - 550, center[1]])
      }));
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] + 550, center[1]])
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new ol.style.Style({
          image: new ol.style.Circle({
            radius: 15,
            stroke: new ol.style.Stroke({
              color: 'blue'
            })
          })
        });
      });

      map.once('postrender', function() {
        var hitDetected = map.getFeaturesAtPixel([40, 40]);
        expect(hitDetected).to.have.length(1);
        expect(hitDetected[0]).to.equal(centerFeature);
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter-image.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('declutters images with renderMode: \'image\'', function(done) {
      createMap('canvas');
      var layer = new ol.layer.Vector({
        renderMode: 'image',
        source: source
      });
      map.addLayer(layer);

      var centerFeature = new ol.Feature({
        geometry: new ol.geom.Point(center)
      });
      source.addFeature(centerFeature);
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] - 550, center[1]])
      }));
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] + 550, center[1]])
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new ol.style.Style({
          image: new ol.style.Circle({
            radius: 15,
            stroke: new ol.style.Stroke({
              color: 'blue'
            })
          })
        });
      });

      map.once('postrender', function() {
        var hitDetected = map.getFeaturesAtPixel([40, 40]);
        expect(hitDetected).to.have.length(1);
        expect(hitDetected[0]).to.equal(centerFeature);
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter-image.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('declutters images and respects z-index', function(done) {
      createMap('canvas');
      var layer = new ol.layer.Vector({
        source: source
      });
      map.addLayer(layer);

      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point(center),
        zIndex: 2
      }));
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] - 550, center[1]]),
        zIndex: 3
      }));
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] + 550, center[1]]),
        zIndex: 1
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new ol.style.Style({
          zIndex: feature.get('zIndex'),
          image: new ol.style.Circle({
            radius: 15,
            stroke: new ol.style.Stroke({
              color: 'blue'
            })
          })
        });
      });

      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter-image-zindex.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('declutters image & text groups', function(done) {
      createMap('canvas');
      var layer = new ol.layer.Vector({
        source: source
      });
      map.addLayer(layer);

      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point(center),
        text: 'center'
      }));
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] - 550, center[1]]),
        text: 'west'
      }));
      source.addFeature(new ol.Feature({
        geometry: new ol.geom.Point([center[0] + 550, center[1]]),
        text: 'east'
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new ol.style.Style({
          image: new ol.style.Circle({
            radius: 5,
            stroke: new ol.style.Stroke({
              color: 'blue'
            })
          }),
          text: new ol.style.Text({
            text: feature.get('text'),
            font: '12px sans-serif',
            textBaseline: 'bottom',
            offsetY: -5
          })
        });
      });

      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter-group.png',
            2.2, done);
      });
    });

    it('declutters text along lines and images', function(done) {
      createMap('canvas');
      var layer = new ol.layer.Vector({
        source: source
      });
      map.addLayer(layer);

      var point = new ol.Feature(new ol.geom.Point(center));
      point.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          stroke: new ol.style.Stroke({
            color: 'blue'
          })
        })
      }));
      var line = new ol.Feature(new ol.geom.LineString([
        [center[0] - 650, center[1] - 200],
        [center[0] + 650, center[1] - 200]
      ]));
      line.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#CCC',
          width: 12
        }),
        text: new ol.style.Text({
          placement: 'line',
          text: 'east-west',
          font: '12px sans-serif'
        })
      }));

      source.addFeature(point);
      source.addFeature(line);

      layer.setDeclutter(true);

      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter-line.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('declutters text along lines and images with renderMode: \'image\'', function(done) {
      createMap('canvas');
      var layer = new ol.layer.Vector({
        source: source
      });
      map.addLayer(layer);

      var point = new ol.Feature(new ol.geom.Point(center));
      point.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          stroke: new ol.style.Stroke({
            color: 'blue'
          })
        })
      }));
      var line = new ol.Feature(new ol.geom.LineString([
        [center[0] - 650, center[1] - 200],
        [center[0] + 650, center[1] - 200]
      ]));
      line.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#CCC',
          width: 12
        }),
        text: new ol.style.Text({
          placement: 'line',
          text: 'east-west',
          font: '12px sans-serif'
        })
      }));

      source.addFeature(point);
      source.addFeature(line);

      layer.setDeclutter(true);

      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter-line.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('declutters text along lines and images with z-index', function(done) {
      createMap('canvas');
      var layer = new ol.layer.Vector({
        source: source
      });
      map.addLayer(layer);

      var point = new ol.Feature(new ol.geom.Point(center));
      point.setStyle(new ol.style.Style({
        zIndex: 2,
        image: new ol.style.Circle({
          radius: 8,
          stroke: new ol.style.Stroke({
            color: 'blue'
          })
        })
      }));
      var line = new ol.Feature(new ol.geom.LineString([
        [center[0] - 650, center[1] - 200],
        [center[0] + 650, center[1] - 200]
      ]));
      line.setStyle(new ol.style.Style({
        zIndex: 1,
        stroke: new ol.style.Stroke({
          color: '#CCC',
          width: 12
        }),
        text: new ol.style.Text({
          placement: 'line',
          text: 'east-west',
          font: '12px sans-serif'
        })
      }));

      source.addFeature(point);
      source.addFeature(line);

      layer.setDeclutter(true);

      map.once('postrender', function() {
        var hitDetected = map.getFeaturesAtPixel([35, 46]);
        expect(hitDetected).to.have.length(1);
        expect(hitDetected[0]).to.equal(line);
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter-line-zindex.png',
            4.1, done);
      });
    });
  });

});
