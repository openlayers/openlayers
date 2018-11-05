import Circle from '../../../../src/ol/geom/Circle.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import Feature from '../../../../src/ol/Feature.js';
import Fill from '../../../../src/ol/style/Fill.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';
import VectorImageLayer from '../../../../src/ol/layer/VectorImage.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';

describe('ol.rendering.layer.VectorImage', function() {

  const center = [1825927.7316762917, 6143091.089223046];

  let map, source;
  function createMap() {
    source = new VectorSource();
    map = new Map({
      pixelRatio: 1,
      target: createMapDiv(80, 80),
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

  it('renders opacity correctly', function(done) {
    createMap();
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
    map.addLayer(new VectorImageLayer({
      source: source
    }));
    map.once('postrender', function() {
      expectResemble(map, 'rendering/ol/layer/expected/vector-canvas.png',
        17, done);
    });
  });

  it('renders transparent layers correctly', function(done) {
    createMap();
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

    map.addLayer(new VectorImageLayer({
      source: source,
      opacity: 0.5
    }));
    map.once('postrender', function() {
      expectResemble(map, 'rendering/ol/layer/expected/vector-canvas-transparent.png',
        7, done);
    });
  });

  it('renders rotation correctly', function(done) {
    createMap();
    map.getView().setRotation(Math.PI + Math.PI / 4);
    addPolygon(300);
    addCircle(500);
    map.addLayer(new VectorImageLayer({
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

  it('unskips features correctly', function(done) {
    createMap();
    addCircle(500);
    addPolygon(300);
    map.skipFeature(source.getFeatures()[1]);
    map.addLayer(new VectorImageLayer({
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

  it('declutters text', function(done) {
    createMap();
    const layer = new VectorImageLayer({
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

  it('declutters images', function(done) {
    createMap();
    const layer = new VectorImageLayer({
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

  it('declutters text along lines and images', function(done) {
    createMap();
    const layer = new VectorImageLayer({
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

});
