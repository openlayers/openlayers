import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import Circle from '../../../../src/ol/geom/Circle.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';


describe('ol.rendering.layer.Vector', function() {

  const center = [1825927.7316762917, 6143091.089223046];

  let map;
  function createMap(renderer) {
    map = new Map({
      pixelRatio: 1,
      target: createMapDiv(80, 80),
      renderer: renderer,
      view: new View({
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

  let source;

  function addCircle(r) {
    source.addFeature(new Feature(new Circle(center, r)));
  }

  function addPolygon(r) {
    source.addFeature(new Feature(new Polygon([
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
    source.addFeature(new Feature(new LineString([
      [center[0] - r, center[1] - r],
      [center[0] + r, center[1] - r],
      [center[0] + r, center[1] + r],
      [center[0] - r, center[1] + r],
      [center[0] - r, center[1] - r]
    ])));
  }

  describe('vector layer', function() {

    beforeEach(function() {
      source = new VectorSource();
    });

    it('renders opacity correctly with the canvas renderer', function(done) {
      createMap('canvas');
      const smallLine = new Feature(new LineString([
        [center[0], center[1] - 1],
        [center[0], center[1] + 1]
      ]));
      smallLine.setStyle(new Style({
        zIndex: -99,
        stroke: new Stroke({width: 75, color: 'red'})
      }));
      source.addFeature(smallLine);
      addPolygon(100);
      addCircle(200);
      addPolygon(250);
      addCircle(500);
      addPolygon(600);
      addPolygon(720);
      map.addLayer(new VectorLayer({
        source: source
      }));
      map.once('postrender', function() {
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas.png',
          17, done);
      });
    });

    it('renders opacity correctly with renderMode: \'image\'', function(done) {
      createMap('canvas');
      const smallLine = new Feature(new LineString([
        [center[0], center[1] - 1],
        [center[0], center[1] + 1]
      ]));
      smallLine.setStyle(new Style({
        zIndex: -99,
        stroke: new Stroke({width: 75, color: 'red'})
      }));
      source.addFeature(smallLine);
      addPolygon(100);
      addCircle(200);
      addPolygon(250);
      addCircle(500);
      addPolygon(600);
      addPolygon(720);
      map.addLayer(new VectorLayer({
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
      const smallLine = new Feature(new LineString([
        [center[0], center[1] - 1],
        [center[0], center[1] + 1]
      ]));
      smallLine.setStyle([
        new Style({
          stroke: new Stroke({width: 75, color: 'red'})
        }),
        new Style({
          stroke: new Stroke({width: 45, color: 'white'})
        })
      ]);
      source.addFeature(smallLine);
      const smallLine2 = new Feature(new LineString([
        [center[0], center[1] - 1000],
        [center[0], center[1] + 1000]
      ]));
      smallLine2.setStyle([
        new Style({
          stroke: new Stroke({width: 35, color: 'blue'})
        }),
        new Style({
          stroke: new Stroke({width: 15, color: 'green'})
        })
      ]);
      source.addFeature(smallLine2);

      map.addLayer(new VectorLayer({
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
      const smallLine = new Feature(new LineString([
        [center[0], center[1] - 1],
        [center[0], center[1] + 1]
      ]));
      smallLine.setStyle([
        new Style({
          stroke: new Stroke({width: 75, color: 'red'})
        }),
        new Style({
          stroke: new Stroke({width: 45, color: 'white'})
        })
      ]);
      source.addFeature(smallLine);
      const smallLine2 = new Feature(new LineString([
        [center[0], center[1] - 1000],
        [center[0], center[1] + 1000]
      ]));
      smallLine2.setStyle([
        new Style({
          stroke: new Stroke({width: 35, color: 'blue'})
        }),
        new Style({
          stroke: new Stroke({width: 15, color: 'green'})
        })
      ]);
      source.addFeature(smallLine2);

      map.addLayer(new VectorLayer({
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
      map.addLayer(new VectorLayer({
        source: source,
        style: new Style({
          stroke: new Stroke({
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
      map.addLayer(new VectorLayer({
        renderMode: 'image',
        source: source,
        style: new Style({
          stroke: new Stroke({
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
      map.addLayer(new VectorLayer({
        renderMode: 'image',
        source: source,
        style: new Style({
          fill: new Fill({
            color: 'rgba(255,0,0,0.5)'
          }),
          stroke: new Stroke({
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
      source = new VectorSource({
        overlaps: false
      });
      addPolygon(100);
      addCircle(200);
      addPolygon(250);
      addCircle(500);
      addPolygon(600);
      addPolygon(720);
      map.addLayer(new VectorLayer({
        source: source,
        style: new Style({
          stroke: new Stroke({
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
      source = new VectorSource({
        overlaps: false
      });
      addLineString(100);
      addLineString(250);
      addLineString(600);
      addLineString(720);
      map.addLayer(new VectorLayer({
        source: source,
        style: new Style({
          stroke: new Stroke({
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
      let color;
      function createSource(overlaps) {
        color = '#3399CC';
        source = new VectorSource({
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
      const layer = new VectorLayer({
        source: createSource(true),
        style: function(feature) {
          alternateColor();
          return new Style({
            stroke: new Stroke({
              color: alternateColor(),
              width: 1.25
            }),
            fill: new Fill({
              color: alternateColor()
            })
          });
        }
      });
      map.addLayer(layer);
      map.once('postrender', function() {
        const canvas = map.getRenderer().canvas_;
        // take a snapshot of this `overlaps: true` image
        const referenceImage = canvas.toDataURL('image/png');
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
      let color;
      function createSource(overlaps) {
        color = '#3399CC';
        source = new VectorSource({
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
      const layer = new VectorLayer({
        source: createSource(true),
        style: function(feature) {
          alternateColor();
          return new Style({
            stroke: new Stroke({
              color: alternateColor(),
              width: 1.25
            }),
            fill: new Fill({
              color: alternateColor()
            })
          });
        }
      });
      map.addLayer(layer);
      map.once('postrender', function() {
        const canvas = map.getRenderer().canvas_;
        // take a snapshot of this `overlaps: true` image
        const referenceImage = canvas.toDataURL('image/png');
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

    let map2;
    beforeEach(function() {
      map2 = new Map({
        pixelRatio: 1,
        target: createMapDiv(128, 128),
        view: new View({
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
      const json = {
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

      const format = new GeoJSON({featureProjection: 'EPSG:3857'});
      const feature = format.readFeature(json);

      const layer = new VectorLayer({
        source: new VectorSource({
          features: [feature]
        }),
        style: new Style({
          fill: new Fill({
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

    let layer, map3;

    beforeEach(function() {
      const src = new VectorSource({
        features: [
          new Feature(new Polygon([[
            [-22, 58],
            [-22, 78],
            [-9, 78],
            [-9, 58],
            [-22, 58]
          ]])),
          new Feature(new Polygon([[
            [-9, 58],
            [-9, 78],
            [4, 78],
            [4, 58],
            [-9, 58]
          ]]))
        ]
      });
      layer = new VectorLayer({
        renderBuffer: 0,
        source: src
      });
      const view = new View({
        center: [-9.5, 78],
        zoom: 2,
        projection: 'EPSG:4326'
      });

      map3 = new Map({
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
      layer.setStyle(new Style({
        stroke: new Stroke({
          color: [0, 0, 0, 1],
          width: 2
        }),
        fill: new Fill({
          color: [255, 0, 0, 1]
        })
      }));
      map3.once('postrender', function() {
        expectResemble(map3, 'rendering/ol/layer/expected/vector-canvas-simplified.png',
          IMAGE_TOLERANCE, done);
      });
    });

    it('renders partially out-of-view polygons with a fill', function(done) {
      layer.setStyle(new Style({
        fill: new Fill({
          color: [0, 0, 0, 1]
        })
      }));
      map3.once('postrender', function() {
        expectResemble(map3, 'rendering/ol/layer/expected/vector-canvas-simplified-fill.png',
          IMAGE_TOLERANCE, done);
      });
    });

    it('renders partially out-of-view polygons with a stroke', function(done) {
      layer.setStyle(new Style({
        stroke: new Stroke({
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
      source = new VectorSource();
    });

    it('declutters text', function(done) {
      createMap('canvas');
      const layer = new VectorLayer({
        source: source
      });
      map.addLayer(layer);

      const centerFeature = new Feature({
        geometry: new Point(center),
        text: 'center'
      });
      source.addFeature(centerFeature);
      source.addFeature(new Feature({
        geometry: new Point([center[0] - 540, center[1]]),
        text: 'west'
      }));
      source.addFeature(new Feature({
        geometry: new Point([center[0] + 540, center[1]]),
        text: 'east'
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new Style({
          text: new Text({
            text: feature.get('text'),
            font: '12px sans-serif'
          })
        });
      });

      map.once('postrender', function() {
        const hitDetected = map.getFeaturesAtPixel([42, 42]);
        expect(hitDetected).to.have.length(1);
        expect(hitDetected[0]).to.equal(centerFeature);
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter.png',
          2.2, done);
      });
    });

    it('declutters text with renderMode: \'image\'', function(done) {
      createMap('canvas');
      const layer = new VectorLayer({
        renderMode: 'image',
        source: source
      });
      map.addLayer(layer);

      const centerFeature = new Feature({
        geometry: new Point(center),
        text: 'center'
      });
      source.addFeature(centerFeature);
      source.addFeature(new Feature({
        geometry: new Point([center[0] - 540, center[1]]),
        text: 'west'
      }));
      source.addFeature(new Feature({
        geometry: new Point([center[0] + 540, center[1]]),
        text: 'east'
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new Style({
          text: new Text({
            text: feature.get('text'),
            font: '12px sans-serif'
          })
        });
      });

      map.once('postrender', function() {
        const hitDetected = map.getFeaturesAtPixel([42, 42]);
        expect(hitDetected).to.have.length(1);
        expect(hitDetected[0]).to.equal(centerFeature);
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter.png',
          2.2, done);
      });
    });

    it('declutters text and respects z-index', function(done) {
      createMap('canvas');
      const layer = new VectorLayer({
        source: source
      });
      map.addLayer(layer);

      source.addFeature(new Feature({
        geometry: new Point(center),
        text: 'center',
        zIndex: 2
      }));
      source.addFeature(new Feature({
        geometry: new Point([center[0] - 540, center[1]]),
        text: 'west',
        zIndex: 3
      }));
      source.addFeature(new Feature({
        geometry: new Point([center[0] + 540, center[1]]),
        text: 'east',
        zIndex: 1
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new Style({
          zIndex: feature.get('zIndex'),
          text: new Text({
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
      const layer = new VectorLayer({
        source: source
      });
      map.addLayer(layer);

      const centerFeature = new Feature({
        geometry: new Point(center)
      });
      source.addFeature(centerFeature);
      source.addFeature(new Feature({
        geometry: new Point([center[0] - 540, center[1]])
      }));
      source.addFeature(new Feature({
        geometry: new Point([center[0] + 540, center[1]])
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new Style({
          image: new CircleStyle({
            radius: 15,
            stroke: new Stroke({
              color: 'blue'
            })
          })
        });
      });

      map.once('postrender', function() {
        const hitDetected = map.getFeaturesAtPixel([40, 40]);
        expect(hitDetected).to.have.length(1);
        expect(hitDetected[0]).to.equal(centerFeature);
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter-image.png',
          IMAGE_TOLERANCE, done);
      });
    });

    it('declutters images with renderMode: \'image\'', function(done) {
      createMap('canvas');
      const layer = new VectorLayer({
        renderMode: 'image',
        source: source
      });
      map.addLayer(layer);

      const centerFeature = new Feature({
        geometry: new Point(center)
      });
      source.addFeature(centerFeature);
      source.addFeature(new Feature({
        geometry: new Point([center[0] - 540, center[1]])
      }));
      source.addFeature(new Feature({
        geometry: new Point([center[0] + 540, center[1]])
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new Style({
          image: new CircleStyle({
            radius: 15,
            stroke: new Stroke({
              color: 'blue'
            })
          })
        });
      });

      map.once('postrender', function() {
        const hitDetected = map.getFeaturesAtPixel([40, 40]);
        expect(hitDetected).to.have.length(1);
        expect(hitDetected[0]).to.equal(centerFeature);
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter-image.png',
          IMAGE_TOLERANCE, done);
      });
    });

    it('declutters images and respects z-index', function(done) {
      createMap('canvas');
      const layer = new VectorLayer({
        source: source
      });
      map.addLayer(layer);

      source.addFeature(new Feature({
        geometry: new Point(center),
        zIndex: 2
      }));
      source.addFeature(new Feature({
        geometry: new Point([center[0] - 540, center[1]]),
        zIndex: 3
      }));
      source.addFeature(new Feature({
        geometry: new Point([center[0] + 540, center[1]]),
        zIndex: 1
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new Style({
          zIndex: feature.get('zIndex'),
          image: new CircleStyle({
            radius: 15,
            stroke: new Stroke({
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
      const layer = new VectorLayer({
        source: source
      });
      map.addLayer(layer);

      source.addFeature(new Feature({
        geometry: new Point(center),
        text: 'center'
      }));
      source.addFeature(new Feature({
        geometry: new Point([center[0] - 540, center[1]]),
        text: 'west'
      }));
      source.addFeature(new Feature({
        geometry: new Point([center[0] + 540, center[1]]),
        text: 'east'
      }));

      layer.setDeclutter(true);
      layer.setStyle(function(feature) {
        return new Style({
          image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({
              color: 'blue'
            })
          }),
          text: new Text({
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
      const layer = new VectorLayer({
        source: source
      });
      map.addLayer(layer);

      const point = new Feature(new Point(center));
      point.setStyle(new Style({
        image: new CircleStyle({
          radius: 8,
          stroke: new Stroke({
            color: 'blue'
          })
        })
      }));
      const line = new Feature(new LineString([
        [center[0] - 650, center[1] - 200],
        [center[0] + 650, center[1] - 200]
      ]));
      line.setStyle(new Style({
        stroke: new Stroke({
          color: '#CCC',
          width: 12
        }),
        text: new Text({
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
      const layer = new VectorLayer({
        source: source
      });
      map.addLayer(layer);

      const point = new Feature(new Point(center));
      point.setStyle(new Style({
        image: new CircleStyle({
          radius: 8,
          stroke: new Stroke({
            color: 'blue'
          })
        })
      }));
      const line = new Feature(new LineString([
        [center[0] - 650, center[1] - 200],
        [center[0] + 650, center[1] - 200]
      ]));
      line.setStyle(new Style({
        stroke: new Stroke({
          color: '#CCC',
          width: 12
        }),
        text: new Text({
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
      const layer = new VectorLayer({
        source: source
      });
      map.addLayer(layer);

      const point = new Feature(new Point(center));
      point.setStyle(new Style({
        zIndex: 2,
        image: new CircleStyle({
          radius: 8,
          stroke: new Stroke({
            color: 'blue'
          })
        })
      }));
      const line = new Feature(new LineString([
        [center[0] - 650, center[1] - 200],
        [center[0] + 650, center[1] - 200]
      ]));
      line.setStyle(new Style({
        zIndex: 1,
        stroke: new Stroke({
          color: '#CCC',
          width: 12
        }),
        text: new Text({
          placement: 'line',
          text: 'east-west',
          font: '12px sans-serif'
        })
      }));

      source.addFeature(point);
      source.addFeature(line);

      layer.setDeclutter(true);

      map.once('postrender', function() {
        const hitDetected = map.getFeaturesAtPixel([35, 46]);
        expect(hitDetected).to.have.length(1);
        expect(hitDetected[0]).to.equal(line);
        expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-declutter-line-zindex.png',
          4.1, done);
      });
    });
  });

});
