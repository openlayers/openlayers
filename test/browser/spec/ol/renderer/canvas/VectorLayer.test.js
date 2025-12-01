import {spy as sinonSpy} from 'sinon';
import Feature from '../../../../../../src/ol/Feature.js';
import Map from '../../../../../../src/ol/Map.js';
import View from '../../../../../../src/ol/View.js';
import {
  buffer as bufferExtent,
  getCenter,
  getWidth,
} from '../../../../../../src/ol/extent.js';
import GeoJSON from '../../../../../../src/ol/format/GeoJSON.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../../../src/ol/layer/Vector.js';
import {bbox as bboxStrategy} from '../../../../../../src/ol/loadingstrategy.js';
import {get as getProjection} from '../../../../../../src/ol/proj.js';
import {checkedFonts} from '../../../../../../src/ol/render/canvas.js';
import CanvasVectorLayerRenderer from '../../../../../../src/ol/renderer/canvas/VectorLayer.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import Style from '../../../../../../src/ol/style/Style.js';
import Text from '../../../../../../src/ol/style/Text.js';
import {createFontStyle} from '../../../util.js';

describe('ol/renderer/canvas/VectorLayer', function () {
  describe('constructor', function () {
    const fontFamily = 'Ubuntu - VectorLayerTest';
    const font = createFontStyle({
      fontFamily: fontFamily,
      src: {
        url: '/spec/ol/data/fonts/ubuntu-regular-webfont.woff2',
        format: 'woff2',
      },
    });

    let map;

    beforeEach(function () {
      map = new Map({
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
        target: createMapDiv(256, 256),
      });
    });

    afterEach(function () {
      disposeMap(map);
    });

    it('creates a new instance', function () {
      const layer = new VectorLayer({
        source: new VectorSource(),
      });
      const renderer = new CanvasVectorLayerRenderer(layer);
      expect(renderer).to.be.a(CanvasVectorLayerRenderer);
    });

    it('gives precedence to feature styles over layer styles', function () {
      const layerStyle = [
        new Style({
          text: new Text({
            text: 'layer',
          }),
        }),
      ];
      const featureStyle = [
        new Style({
          text: new Text({
            text: 'feature',
          }),
        }),
      ];
      const feature1 = new Feature(new Point([0, 0]));
      const feature2 = new Feature(new Point([0, 0]));
      feature2.setStyle(featureStyle);
      const layer = new VectorLayer({
        source: new VectorSource({
          features: [feature1, feature2],
        }),
        style: layerStyle,
      });
      map.addLayer(layer);
      const spy = sinonSpy(layer.getRenderer(), 'renderFeature');
      map.renderSync();
      expect(spy.getCall(0).args[2]).to.eql(layerStyle);
      expect(spy.getCall(1).args[2]).to.be(featureStyle);

      disposeMap(map);
    });

    it('does not re-render for unavailable fonts', function (done) {
      const layerStyle = new Style({
        text: new Text({
          text: 'layer',
          font: '12px "Unavailable Font",sans-serif',
        }),
      });

      const feature = new Feature(new Point([0, 0]));
      const layer = new VectorLayer({
        source: new VectorSource({
          features: [feature],
        }),
        style: layerStyle,
      });
      map.addLayer(layer);
      const revision = layer.getRevision();
      setTimeout(function () {
        try {
          expect(layer.getRevision()).to.be(revision);
          done();
        } catch (e) {
          done(e);
        }
      }, 1000);
    });

    it('does not re-render for available fonts', function (done) {
      const layerStyle = new Style({
        text: new Text({
          text: 'layer',
          font: '12px sans-serif',
        }),
      });

      const feature = new Feature(new Point([0, 0]));
      const layer = new VectorLayer({
        source: new VectorSource({
          features: [feature],
        }),
        style: layerStyle,
      });
      map.addLayer(layer);
      const revision = layer.getRevision();
      setTimeout(function () {
        try {
          expect(layer.getRevision()).to.be(revision);
          done();
        } catch (e) {
          done(e);
        }
      }, 1000);
    });

    it('re-renders for fonts that become available', function (done) {
      font.add();
      const layerStyle = new Style({
        text: new Text({
          text: 'layer',
          font: `12px "${fontFamily}",sans-serif`,
        }),
      });

      const feature = new Feature(new Point([0, 0]));
      const layer = new VectorLayer({
        source: new VectorSource({
          features: [feature],
        }),
        style: layerStyle,
      });
      map.addLayer(layer);
      const revision = layer.getRevision();
      checkedFonts.addEventListener(
        'propertychange',
        function onPropertyChange() {
          checkedFonts.removeEventListener('propertychange', onPropertyChange);
          try {
            font.remove();
            expect(layer.getRevision()).to.be(revision + 1);
            done();
          } catch (e) {
            done(e);
          }
        },
      );
    });
  });

  describe('numeric labels', function () {
    let map;
    this.beforeEach(function () {
      map = new Map({
        target: createMapDiv(100, 100),
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });
    });

    this.afterEach(function () {
      checkedFonts.getListeners('propertychange').forEach((listener) => {
        checkedFonts.removeEventListener('propertychange', listener);
      });
      checkedFonts.setProperties({}, true);
      disposeMap(map);
    });

    it('supports numbers for texts', function () {
      const layer = new VectorLayer({
        source: new VectorSource({
          features: [new Feature(new Point([0, 0]))],
        }),
        style: new Style({
          text: new Text({
            text: 5,
          }),
        }),
      });
      map.addLayer(layer);
      expect(() => map.renderSync()).to.not.throwException();
    });
  });

  describe('#forEachFeatureAtCoordinate', function () {
    /** @type {VectorLayer} */ let layer;
    /** @type {CanvasVectorLayerRenderer} */ let renderer;

    beforeEach(function () {
      layer = new VectorLayer({
        source: new VectorSource(),
      });
      renderer = new CanvasVectorLayerRenderer(layer);
      const replayGroup = {};
      renderer.replayGroup_ = replayGroup;
      replayGroup.forEachFeatureAtCoordinate = function (
        coordinate,
        resolution,
        rotation,
        hitTolerance,
        callback,
      ) {
        const feature = new Feature(new Point([0, 0]));
        const distanceSq = 0;
        callback(feature, feature.getGeometry(), distanceSq);
        callback(feature, feature.getGeometry(), distanceSq);
      };
    });

    it('calls callback once per feature with a layer as 2nd arg', function () {
      const spy = sinonSpy();
      const coordinate = [0, 0];
      const matches = [];
      const frameState = {
        layerStatesArray: [{}],
        viewState: {
          center: [0, 0],
          resolution: 1,
          rotation: 0,
        },
      };
      renderer.forEachFeatureAtCoordinate(
        coordinate,
        frameState,
        0,
        spy,
        matches,
      );
      expect(spy.callCount).to.be(1);
      expect(spy.getCall(0).args[1]).to.be(layer);
      expect(matches).to.be.empty();
    });

    it('works with declutter: true when source has no features', () => {
      layer.setDeclutter(true);
      const spy = sinonSpy();
      const coordinate = [0, 0];
      const matches = [];
      const frameState = {
        layerStatesArray: [{}],
        viewState: {
          center: [0, 0],
          resolution: 1,
          rotation: 0,
        },
      };
      expect(() =>
        renderer.forEachFeatureAtCoordinate(
          coordinate,
          frameState,
          0,
          spy,
          matches,
        ),
      ).to.not.throwException();
    });
  });

  describe('#prepareFrame and #compose', function () {
    /** @type {import("../../../../../../src/ol/Map").FrameState} */ let frameState;
    /** @type {import("../../../../../../src/ol/extent").Extent} */ let projExtent;
    /** @type {CanvasVectorLayerRenderer} */ let renderer;
    /** @type {number} */ let worldWidth;
    /** @type {number} */ let buffer;
    /** @type {Array<import("../../../../../../src/ol/extent").Extent>} */ let loadExtents;

    function loader(extent) {
      loadExtents.push(extent);
    }

    beforeEach(function () {
      const layer = new VectorLayer({
        source: new VectorSource({
          wrapX: true,
          loader: loader,
          strategy: bboxStrategy,
        }),
      });
      renderer = new CanvasVectorLayerRenderer(layer);
      const projection = getProjection('EPSG:3857');
      projExtent = projection.getExtent();
      worldWidth = getWidth(projExtent);
      buffer = layer.getRenderBuffer();
      loadExtents = [];
      frameState = {
        pixelRatio: 1,
        viewHints: [],
        viewState: {
          projection: projection,
          resolution: 1,
          rotation: 0,
        },
      };
    });

    function setExtent(extent) {
      frameState.extent = extent;
      frameState.viewState.center = getCenter(extent);
    }

    it('sets correct extent for small viewport near dateline', function () {
      setExtent([projExtent[0] - 10000, -10000, projExtent[0] + 10000, 10000]);
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroup_.maxExtent_).to.eql(
        bufferExtent(
          [
            projExtent[0] - worldWidth + buffer,
            -10000,
            projExtent[2] + worldWidth - buffer,
            10000,
          ],
          buffer,
        ),
      );
      expect(loadExtents.length).to.be(2);
      expect(loadExtents[0]).to.eql(bufferExtent(frameState.extent, buffer));
      const otherExtent = [
        projExtent[2] - 10000,
        -10000,
        projExtent[2] + 10000,
        10000,
      ];
      expect(loadExtents[1]).to.eql(bufferExtent(otherExtent, buffer));
    });

    it('sets correct extent for viewport less than 1 world wide', function () {
      setExtent([projExtent[0] - 10000, -10000, projExtent[2] - 10000, 10000]);
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroup_.maxExtent_).to.eql(
        bufferExtent(
          [
            projExtent[0] - worldWidth + buffer,
            -10000,
            projExtent[2] + worldWidth - buffer,
            10000,
          ],
          buffer,
        ),
      );
      expect(loadExtents.length).to.be(2);
      expect(loadExtents[0]).to.eql(bufferExtent(frameState.extent, buffer));
      const otherExtent = [
        projExtent[0] - 10000 + worldWidth,
        -10000,
        projExtent[2] - 10000 + worldWidth,
        10000,
      ];
      expect(loadExtents[1]).to.eql(bufferExtent(otherExtent, buffer));
    });

    it('sets correct extent for viewport more than 1 world wide', function () {
      setExtent([
        2 * projExtent[0] + 10000,
        -10000,
        2 * projExtent[2] - 10000,
        10000,
      ]);
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroup_.maxExtent_).to.eql(
        bufferExtent(
          [
            projExtent[0] - worldWidth + buffer,
            -10000,
            projExtent[2] + worldWidth - buffer,
            10000,
          ],
          buffer,
        ),
      );
      expect(loadExtents.length).to.be(1);
      expect(loadExtents[0]).to.eql(bufferExtent(frameState.extent, buffer));
    });

    it('sets correct extent for viewport more than 2 worlds wide, one world away', function () {
      setExtent([
        projExtent[0] - 2 * worldWidth - 10000,
        -10000,
        projExtent[0] + 2 * worldWidth + 10000,
        10000,
      ]);
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroup_.maxExtent_).to.eql(
        bufferExtent(
          [
            projExtent[0] - 2 * worldWidth - 10000,
            -10000,
            projExtent[2] + 2 * worldWidth + 10000,
            10000,
          ],
          buffer,
        ),
      );
      expect(loadExtents.length).to.be(1);
      const normalizedExtent = [
        projExtent[0] - 2 * worldWidth + worldWidth - 10000,
        -10000,
        projExtent[0] + 2 * worldWidth + worldWidth + 10000,
        10000,
      ];
      expect(loadExtents[0]).to.eql(bufferExtent(normalizedExtent, buffer));
    });

    it('sets correct extent for small viewport, one world away', function () {
      setExtent([-worldWidth - 10000, -10000, -worldWidth + 10000, 10000]);
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroup_.maxExtent_).to.eql(
        bufferExtent(
          [
            projExtent[0] - worldWidth + buffer,
            -10000,
            projExtent[2] + worldWidth - buffer,
            10000,
          ],
          buffer,
        ),
      );
      expect(loadExtents.length).to.be(1);
      const normalizedExtent = [-10000, -10000, 10000, 10000];
      expect(loadExtents[0]).to.eql(bufferExtent(normalizedExtent, buffer));
    });

    it('sets replayGroupChanged correctly', function () {
      setExtent([-10000, -10000, 10000, 10000]);
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroupChanged).to.be(true);
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroupChanged).to.be(false);
      frameState.declutter = {};
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroupChanged).to.be(true);
      frameState.pixelRatio = 2;
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroupChanged).to.be(true);
    });

    it('dispatches a postrender event when rendering', function () {
      const layer = renderer.getLayer();
      layer.getSource().addFeature(new Feature(new Point([0, 0])));
      const postrenderSpy = sinonSpy();
      layer.once('postrender', postrenderSpy);
      frameState.layerStatesArray = [layer.getLayerState()];
      frameState.layerIndex = 0;
      frameState.size = [100, 100];
      setExtent([-10000, -10000, 10000, 10000]);
      let container = null;
      if (renderer.prepareFrame(frameState)) {
        container = renderer.renderFrame(frameState, null);
      }
      expect(postrenderSpy.callCount).to.be(1);
      expect(container).to.not.be(null);
    });
    it('renders an empty source if a postrender event listener is added', function () {
      const layer = renderer.getLayer();
      const postrenderSpy = sinonSpy();
      layer.once('postrender', postrenderSpy);
      frameState.layerStatesArray = [layer.getLayerState()];
      frameState.layerIndex = 0;
      frameState.size = [100, 100];
      setExtent([-10000, -10000, 10000, 10000]);
      let container = null;
      if (renderer.prepareFrame(frameState)) {
        container = renderer.renderFrame(frameState, null);
      }
      expect(container).to.not.be(null);
    });
  });

  describe('hit detection', function () {
    it('invalidates hitdetection image when map is moved horizontally', function (done) {
      const layer = new VectorLayer({
        source: new VectorSource({
          wrapX: true,
        }),
      });
      const renderer = new CanvasVectorLayerRenderer(layer);
      const projection = getProjection('EPSG:3857');
      const projExtent = projection.getExtent();
      const worldWidth = getWidth(projExtent);
      /** @type {import("../../../../../../src/ol/Map").FrameState} */
      const frameState = {
        viewHints: [],
        pixelRatio: 1,
        layerStatesArray: [layer.getLayerState()],
        layerIndex: 0,
        size: [100, 100],
        viewState: {
          projection: projection,
          resolution: 200,
          rotation: 0,
        },
      };

      function setExtent(extent) {
        frameState.extent = extent;
        frameState.viewState.center = getCenter(extent);
      }

      layer.getSource().addFeature(new Feature(new Point([0, 0])));
      setExtent([-10000 - worldWidth, -10000, 10000 - worldWidth, 10000]);
      if (renderer.prepareFrame(frameState)) {
        renderer.renderFrame(frameState, null);
        renderer.getFeatures([50, 50]).then((features) => {
          const imageData = renderer.hitDetectionImageData_;
          expect(imageData).to.be.an(ImageData);
          expect(features).to.have.length(1);

          setExtent([
            5e8 - worldWidth,
            -10000,
            5e8 + 20000 - worldWidth,
            10000,
          ]);
          if (renderer.prepareFrame(frameState)) {
            renderer.renderFrame(frameState);
            renderer.getFeatures([50, 50]).then((features) => {
              expect(renderer.hitDetectionImageData_).to.be.an(ImageData);
              expect(renderer.hitDetectionImageData_ !== imageData).to.be(true);
              expect(features).to.have.length(0);
              done();
            });
          }
        });
      }
    });
  });

  describe('renderFrame', function () {
    const projection = getProjection('EPSG:3857');
    let renderer;
    function createLayerFrameState(extent) {
      const layer = new VectorLayer({
        source: new VectorSource({
          features: [new Feature(new Point(getCenter(extent)))],
        }),
        extent: extent,
      });
      renderer = layer.getRenderer();
      renderer.renderWorlds = sinonSpy();
      renderer.clipUnrotated = sinonSpy();
      return {
        pixelRatio: 1,
        time: 1000000000000,
        viewState: {
          center: [0, 0],
          projection: projection,
          resolution: 1,
          rotation: 0,
        },
        animate: false,
        coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
        extent: [-50, -50, 50, 50],
        index: 0,
        layerStatesArray: [layer.getLayerState()],
        layerIndex: 0,
        pixelToCoordinateTransform: [1, 0, 0, 1, 0, 0],
        size: [100, 100],
        viewHints: [],
      };
    }
    it('does not render if layer extent does not intersect view extent', function () {
      const frameState = createLayerFrameState([100, 100, 200, 200]);
      if (renderer.prepareFrame(frameState)) {
        renderer.renderFrame(frameState, null);
      }
      expect(renderer.renderWorlds.callCount).to.be(0);
      expect(renderer.clipUnrotated.callCount).to.be(0);
    });
    it('renders if layer extent partially intersects view extent', function () {
      const frameState = createLayerFrameState([0, 0, 100, 100]);
      if (renderer.prepareFrame(frameState)) {
        renderer.renderFrame(frameState, null);
      }
      expect(renderer.renderWorlds.callCount).to.be(1);
      expect(renderer.clipUnrotated.callCount).to.be(1);
    });
    it('renders withoutt clipping when layer extent covers view', function () {
      const frameState = createLayerFrameState([-200, -200, 200, 200]);
      if (renderer.prepareFrame(frameState)) {
        renderer.renderFrame(frameState, null);
      }
      expect(renderer.renderWorlds.callCount).to.be(1);
      expect(renderer.clipUnrotated.callCount).to.be(0);
    });
  });

  describe('#renderDeclutter', () => {
    it('does not throw on decluttered layer with postrender listener entering zoom range without loaded data', (done) => {
      const vectorLayer = new VectorLayer({
        background: '#1a2b39',
        source: new VectorSource({
          url: 'data:application/json;utf-8,{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[0,0]}}]}',
          format: new GeoJSON(),
        }),
        minZoom: 3,
        declutter: true,
      });
      const map = new Map({
        layers: [vectorLayer],
        target: document.createElement('div'),
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
      });
      vectorLayer.on('postrender', function postrender() {
        if (map.getView().getZoom() > vectorLayer.getMinZoom()) {
          vectorLayer.un('postrender', postrender);
          done();
        }
      });
      map.setSize([100, 100]);
      map.getView().animate({zoom: 3.01});
    });
  });
});
