import {assert} from 'chai';
import {spy as sinonSpy, stub as sinonStub} from 'sinon';
import Collection from '../../../../src/ol/Collection.js';
import Feature from '../../../../src/ol/Feature.js';
import ImageState from '../../../../src/ol/ImageState.js';
import Map from '../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../src/ol/MapBrowserEvent.js';
import MapEvent from '../../../../src/ol/MapEvent.js';
import Overlay from '../../../../src/ol/Overlay.js';
import View from '../../../../src/ol/View.js';
import Control from '../../../../src/ol/control/Control.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import {TRUE} from '../../../../src/ol/functions.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import DoubleClickZoom from '../../../../src/ol/interaction/DoubleClickZoom.js';
import DragPan from '../../../../src/ol/interaction/DragPan.js';
import Interaction from '../../../../src/ol/interaction/Interaction.js';
import MouseWheelZoom from '../../../../src/ol/interaction/MouseWheelZoom.js';
import PinchZoom from '../../../../src/ol/interaction/PinchZoom.js';
import Select from '../../../../src/ol/interaction/Select.js';
import {defaults as defaultInteractions} from '../../../../src/ol/interaction/defaults.js';
import LayerGroup from '../../../../src/ol/layer/Group.js';
import ImageLayer from '../../../../src/ol/layer/Image.js';
import Layer from '../../../../src/ol/layer/Layer.js';
import Property from '../../../../src/ol/layer/Property.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import {tile as tileStrategy} from '../../../../src/ol/loadingstrategy.js';
import {
  clearUserProjection,
  fromLonLat,
  get as getProjection,
  transform,
  useGeographic,
} from '../../../../src/ol/proj.js';
import ImageStatic from '../../../../src/ol/source/ImageStatic.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import Icon from '../../../../src/ol/style/Icon.js';
import {shared as iconImageCache} from '../../../../src/ol/style/IconImageCache.js';
import Style from '../../../../src/ol/style/Style.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

describe('ol/Map', function () {
  describe('constructor', function () {
    it('creates a new map', function () {
      const map = new Map({});
      assert.instanceOf(map, Map);
    });

    it('accepts a promise for view options', (done) => {
      let resolve;

      const map = new Map({
        view: new Promise((r) => {
          resolve = r;
        }),
      });

      assert.instanceOf(map.getView(), View);
      assert.strictEqual(map.getView().isDef(), false);

      map.once('change:view', () => {
        const view = map.getView();
        assert.instanceOf(view, View);
        assert.strictEqual(view.isDef(), true);
        assert.deepEqual(view.getCenter(), [1, 2]);
        assert.strictEqual(view.getZoom(), 3);
        done();
      });

      resolve({
        center: [1, 2],
        zoom: 3,
      });
    });

    it('allows the view to be set with a promise later after construction', (done) => {
      const map = new Map({
        view: new View({zoom: 1, center: [0, 0]}),
      });

      assert.instanceOf(map.getView(), View);
      assert.strictEqual(map.getView().isDef(), true);

      let resolve;
      map.setView(
        new Promise((r) => {
          resolve = r;
        }),
      );

      assert.instanceOf(map.getView(), View);
      assert.strictEqual(map.getView().isDef(), false);

      map.once('change:view', () => {
        const view = map.getView();
        assert.instanceOf(view, View);
        assert.strictEqual(view.isDef(), true);
        assert.deepEqual(view.getCenter(), [1, 2]);
        assert.strictEqual(view.getZoom(), 3);
        done();
      });

      resolve({
        center: [1, 2],
        zoom: 3,
      });
    });

    it('creates a set of default interactions', function () {
      const map = new Map({});
      const interactions = map.getInteractions();
      const length = interactions.getLength();
      assert.isAbove(length, 0);

      for (let i = 0; i < length; ++i) {
        assert.strictEqual(interactions.item(i).getMap(), map);
      }
    });

    it('creates the viewport', function () {
      const map = new Map({});
      const viewport = map.getViewport();
      const className =
        'ol-viewport' + ('ontouchstart' in window ? ' ol-touch' : '');
      assert.strictEqual(viewport.className, className);
    });

    it('creates the overlay containers', function () {
      const map = new Map({});
      const container = map.getOverlayContainer();
      assert.strictEqual(container.className, 'ol-overlaycontainer');

      const containerStop = map.getOverlayContainerStopEvent();
      assert.strictEqual(
        containerStop.className,
        'ol-overlaycontainer-stopevent',
      );
    });

    it('calls setMap for controls added by other controls', function () {
      let subSetMapCalled = false;
      class SubControl extends Control {
        setMap(map) {
          super.setMap(map);
          subSetMapCalled = true;
        }
      }
      class MainControl extends Control {
        setMap(map) {
          super.setMap(map);
          map.addControl(
            new SubControl({
              element: document.createElement('div'),
            }),
          );
        }
      }
      new Map({
        target: document.createElement('div'),
        controls: [
          new MainControl({
            element: document.createElement('div'),
          }),
        ],
      });
      assert.strictEqual(subSetMapCalled, true);
    });
  });

  describe('#addLayer()', function () {
    it('adds a layer to the map', function () {
      const map = new Map({});
      const layer = new TileLayer();
      map.addLayer(layer);

      assert.strictEqual(map.getLayers().item(0), layer);
      assert.strictEqual(layer.get(Property.MAP), map);
    });

    it('throws if a layer is added twice', function () {
      const map = new Map({});
      const layer = new TileLayer();
      map.addLayer(layer);

      const call = function () {
        map.addLayer(layer);
      };
      assert.throws(call);
    });
  });

  describe('#removeLayer()', function () {
    it('removes a layer from the map', function () {
      const map = new Map({});
      const layer = new TileLayer();
      map.addLayer(layer);

      assert.strictEqual(layer.get(Property.MAP), map);
      map.removeLayer(layer);
      assert.strictEqual(layer.get(Property.MAP), null);
    });

    it('removes a layer group from the map', function () {
      const map = new Map({});
      const layer = new TileLayer();
      const group = new LayerGroup({layers: [layer]});
      map.addLayer(group);
      assert.strictEqual(layer.get(Property.MAP), map);

      map.removeLayer(group);
      assert.strictEqual(layer.get(Property.MAP), null);
    });
  });

  describe('#setLayerGroup()', function () {
    it('sets the layer group', function () {
      const map = new Map({});

      const layer = new Layer({});
      const group = new LayerGroup({layers: [layer]});
      map.setLayerGroup(group);

      assert.strictEqual(map.getLayerGroup(), group);
      assert.strictEqual(layer.get(Property.MAP), map);
    });

    it('removes the map property from old layers', function () {
      const oldLayer = new Layer({});
      const map = new Map({layers: [oldLayer]});
      assert.strictEqual(oldLayer.get(Property.MAP), map);

      const layer = new Layer({});
      const group = new LayerGroup({layers: [layer]});
      map.setLayerGroup(group);

      assert.strictEqual(layer.get(Property.MAP), map);
      assert.strictEqual(oldLayer.get(Property.MAP), null);
    });
  });

  describe('#getAllLayers()', function () {
    it('returns all layers, also from inside groups', function () {
      const map = new Map({});
      const layer = new TileLayer();
      const group = new LayerGroup({layers: [layer]});
      map.addLayer(group);

      const allLayers = map.getAllLayers();
      assert.strictEqual(allLayers.length, 1);
      assert.strictEqual(allLayers[0], layer);
    });
  });

  describe('#setLayers()', function () {
    it('adds an array of layers to the map', function () {
      const map = new Map({});

      const layer0 = new TileLayer();
      const layer1 = new TileLayer();
      map.setLayers([layer0, layer1]);

      const collection = map.getLayers();
      assert.strictEqual(collection.getLength(), 2);
      assert.strictEqual(collection.item(0), layer0);
      assert.strictEqual(collection.item(1), layer1);
      assert.strictEqual(layer0.get(Property.MAP), map);
      assert.strictEqual(layer1.get(Property.MAP), map);
    });

    it('clears any existing layers', function () {
      const oldLayer = new TileLayer();
      const map = new Map({layers: [oldLayer]});
      assert.strictEqual(oldLayer.get(Property.MAP), map);

      const newLayer1 = new TileLayer();
      const newLayer2 = new TileLayer();
      map.setLayers([newLayer1, newLayer2]);
      assert.strictEqual(newLayer1.get(Property.MAP), map);
      assert.strictEqual(newLayer2.get(Property.MAP), map);
      assert.strictEqual(oldLayer.get(Property.MAP), null);

      assert.strictEqual(map.getLayers().getLength(), 2);
    });

    it('also works with collections', function () {
      const map = new Map({});

      const layer0 = new TileLayer();
      const layer1 = new TileLayer();
      map.setLayers(new Collection([layer0, layer1]));

      const collection = map.getLayers();
      assert.strictEqual(collection.getLength(), 2);
      assert.strictEqual(collection.item(0), layer0);
      assert.strictEqual(collection.item(1), layer1);
    });
  });

  describe('#addInteraction()', function () {
    it('adds an interaction to the map', function () {
      const map = new Map({});
      const interaction = new Interaction({});

      const before = map.getInteractions().getLength();
      map.addInteraction(interaction);
      const after = map.getInteractions().getLength();
      assert.strictEqual(after, before + 1);
      assert.strictEqual(interaction.getMap(), map);
    });
  });

  describe('#removeInteraction()', function () {
    it('removes an interaction from the map', function () {
      const map = new Map({});
      const interaction = new Interaction({});

      const before = map.getInteractions().getLength();
      map.addInteraction(interaction);

      map.removeInteraction(interaction);
      assert.strictEqual(map.getInteractions().getLength(), before);

      assert.strictEqual(interaction.getMap(), null);
    });
  });

  describe('movestart/moveend event', function () {
    let target, view, map;

    beforeEach(function () {
      target = document.createElement('div');

      const style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = '360px';
      style.height = '180px';
      document.body.appendChild(target);

      view = new View({
        projection: 'EPSG:4326',
      });
      map = new Map({
        target: target,
        view: view,
        layers: [
          new TileLayer({
            source: new XYZ({
              url: '#{x}/{y}/{z}',
            }),
          }),
        ],
      });
    });

    afterEach(function () {
      disposeMap(map);
    });

    it('are fired only once after view changes', function (done) {
      const center = [10, 20];
      const zoom = 3;
      let startCalls = 0;
      let endCalls = 0;
      map.on('movestart', function () {
        ++startCalls;
        assert.strictEqual(startCalls, 1);
      });
      map.on('moveend', function () {
        ++endCalls;
        assert.strictEqual(endCalls, 1);
        assert.deepEqual(view.getCenter(), center);
        assert.strictEqual(view.getZoom(), zoom);
        window.setTimeout(done, 1000);
      });

      view.setCenter(center);
      view.setZoom(zoom);
    });

    it('are fired in sequence', function (done) {
      view.setCenter([0, 0]);
      view.setResolution(0.703125);
      map.renderSync();
      const center = [10, 20];
      const zoom = 3;
      const calls = [];
      map.on('movestart', function (e) {
        calls.push('start');
        assert.deepEqual(calls, ['start']);
        assert.deepEqual(e.frameState.viewState.center, [0, 0]);
        assert.strictEqual(e.frameState.viewState.resolution, 0.703125);
      });
      map.on('moveend', function () {
        calls.push('end');
        assert.deepEqual(calls, ['start', 'end']);
        assert.deepEqual(view.getCenter(), center);
        assert.strictEqual(view.getZoom(), zoom);
        done();
      });

      view.setCenter(center);
      view.setZoom(zoom);
    });
  });

  describe('rendercomplete event', function () {
    let map, target;

    beforeEach(function () {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
    });

    afterEach(function () {
      disposeMap(map);
      map.getLayers().forEach((layer) => layer.dispose());
    });

    describe('renderer ready property', function () {
      beforeEach(function () {
        map = new Map({
          target: target,
          layers: [
            new TileLayer({
              opacity: 0.5,
              source: new XYZ({
                url: 'spec/ol/data/osm-{z}-{x}-{y}.png',
              }),
            }),
            new ImageLayer({
              source: new ImageStatic({
                url: 'spec/ol/data/osm-0-0-0.png',
                imageExtent: getProjection('EPSG:3857').getExtent(),
                projection: 'EPSG:3857',
              }),
            }),
            new VectorLayer({
              source: new VectorSource({
                url: 'spec/ol/data/point.json',
                format: new GeoJSON(),
              }),
            }),
            new VectorLayer({
              source: new VectorSource({
                url: 'spec/ol/data/point.json',
                format: new GeoJSON(),
                strategy: tileStrategy(createXYZ()),
              }),
            }),
            new VectorLayer({
              source: new VectorSource({
                features: [new Feature(new Point([0, 0]))],
              }),
            }),
            new VectorLayer({
              source: new VectorSource({
                loader: function (extent, resolution, projection) {
                  this.addFeature(new Feature(new Point([0, 0])));
                },
              }),
            }),
            new WebGLVectorLayer({
              source: new VectorSource({
                features: [new Feature(new Point([0, 0]))],
              }),
              style: {
                'circle-radius': 4,
              },
            }),
          ],
        });
      });

      it('triggers when all tiles and sources are loaded and faded in', function (done) {
        const layers = map.getLayers().getArray();
        map.once('rendercomplete', function () {
          assert.strictEqual(map.tileQueue_.getTilesLoading(), 0);
          assert.strictEqual(
            layers[1]
              .getSource()
              .getImage(
                map.getView().calculateExtent(),
                map.getView().getResolution(),
                1,
                map.getView().getProjection(),
              )
              .getState(),
            ImageState.LOADED,
          );
          assert.strictEqual(layers[2].getSource().getFeatures().length, 1);
          assert.strictEqual(layers[6].getRenderer().ready, true);
          done();
        });
        map.setView(
          new View({
            center: [0, 0],
            zoom: 0,
          }),
        );
      });

      it('ignores invisible layers', function (done) {
        map.getLayers().forEach((layer, i) => layer.setVisible(i === 4));
        map.setView(
          new View({
            center: [0, 0],
            zoom: 0,
          }),
        );
        map.once('rendercomplete', () => done());
      });
    });

    describe('with icons', function () {
      /** @type {Icon} */
      let icon;
      beforeEach(function () {
        iconImageCache.clear();
        icon = new Icon({
          src: 'spec/ol/data/dot.png?delayed',
        });

        const delay = 100;
        // Delay icon change events
        let states = [{state: icon.getImageState()}];
        icon.listenImageChange = function (listener) {
          if (!listener._delay) {
            listener._delay = (e) => {
              const key = setTimeout(() => {
                states.shift();
                listener.call(this, e);
              }, delay);
              Object.assign(states[states.length - 1], {key, listener});
              states.push({
                state: Icon.prototype.getImageState.call(this),
              });
            };
          }
          return Icon.prototype.listenImageChange.call(this, listener._delay);
        };
        icon.unlistenImageChange = function (listener) {
          states = states.filter((state) => {
            if (state.listener !== listener) {
              return true;
            }
            clearTimeout(listener.key);
            return false;
          });
          const addedListener = listener._delay;
          delete listener._delay;
          return Icon.prototype.unlistenImageChange.call(this, addedListener);
        };
        icon.getImageState = function () {
          return states[0].state;
        };
      });

      it('waits for icons to be loaded with ol/renderer/canvas/VectorTileLayer', function (done) {
        const delayIconAtTile = 1;
        let tilesRequested = 0;
        const tileSize = 64;
        const tileGrid = createXYZ({tileSize: tileSize});
        map = new Map({
          target: target,
          view: new View({
            center: [0, 0],
            resolution: 1,
          }),
          layers: [
            new VectorTileLayer({
              source: new VectorTileSource({
                tileSize: tileSize,
                tileUrlFunction: (tileCoord) => tileCoord.join('/'),
                tileLoadFunction: function (tile, url) {
                  const coordinate = tileGrid.getTileCoordCenter(
                    tile.getTileCoord(),
                  );
                  const feature = new Feature(new Point(coordinate));
                  tile.setFeatures([feature]);
                  if (tilesRequested++ === delayIconAtTile) {
                    feature.setStyle(new Style({image: icon}));
                  }
                },
              }),
              style: new Style({
                image: new Icon({
                  src: 'spec/ol/data/dot.png',
                }),
              }),
            }),
          ],
        });
        let iconLoaded = false;
        icon.listenImageChange(function (e) {
          if (e.target.getImageState() === ImageState.LOADED) {
            iconLoaded = true;
          }
        });
        map.once('rendercomplete', function () {
          try {
            assert.isAbove(tilesRequested, delayIconAtTile);
            assert.strictEqual(iconLoaded, true);
            done();
          } catch (e) {
            done(e);
          }
        });
      });

      it('waits for icons to be loaded with ol/renderer/canvas/VectorLayer', function (done) {
        map = new Map({
          target: target,
          view: new View({
            center: [0, 0],
            resolution: 1,
          }),
          layers: [
            new VectorLayer({
              source: new VectorSource({
                features: [new Feature(new Point([0, 0]))],
              }),
              style: new Style({
                image: icon,
              }),
            }),
          ],
        });
        let iconLoaded = false;
        icon.listenImageChange(function (e) {
          if (e.target.getImageState() === ImageState.LOADED) {
            iconLoaded = true;
          }
        });
        map.once('rendercomplete', function () {
          try {
            assert.strictEqual(iconLoaded, true);
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });

  describe('loadstart/loadend event sequence', function () {
    let map;
    beforeEach(function () {
      const target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        layers: [
          new TileLayer({
            opacity: 0.5,
            source: new XYZ({
              url: 'spec/ol/data/osm-{z}-{x}-{y}.png',
            }),
          }),
          new ImageLayer({
            source: new ImageStatic({
              url: 'spec/ol/data/osm-0-0-0.png',
              imageExtent: getProjection('EPSG:3857').getExtent(),
              projection: 'EPSG:3857',
            }),
          }),
          new VectorLayer({
            source: new VectorSource({
              url: 'spec/ol/data/point.json',
              format: new GeoJSON(),
            }),
          }),
          new VectorLayer({
            source: new VectorSource({
              url: 'spec/ol/data/point.json',
              format: new GeoJSON(),
              strategy: tileStrategy(createXYZ()),
            }),
          }),
          new VectorLayer({
            source: new VectorSource({
              features: [new Feature(new Point([0, 0]))],
            }),
          }),
          new VectorLayer({
            source: new VectorSource({
              loader: function (extent, resolution, projection) {
                this.addFeature(new Feature(new Point([0, 0])));
              },
            }),
          }),
          new WebGLVectorLayer({
            source: new VectorSource({
              features: [new Feature(new Point([0, 0]))],
            }),
            style: {
              'circle-radius': 4,
              'circle-fill-color': 'red',
            },
          }),
        ],
      });
    });

    afterEach(function () {
      disposeMap(map);
      map.getLayers().forEach((layer) => layer.dispose());
    });

    it('is a reliable start-end sequence', function (done) {
      let loading = 0;
      map.on('loadstart', () => {
        map.getView().setZoom(0.1);
        loading++;
      });
      map.on('loadend', () => {
        assert.strictEqual(loading, 1);
        done();
      });
      map.setView(
        new View({
          center: [0, 0],
          zoom: 0,
        }),
      );
    });
  });

  describe('#getFeaturesAtPixel', function () {
    let target, map, layer;
    beforeEach(function () {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      layer = new VectorLayer({
        source: new VectorSource({
          features: [
            new Feature(
              new LineString([
                [-50, 0],
                [50, 0],
              ]),
            ),
          ],
        }),
      });
      map = new Map({
        target: target,
        layers: [layer],
        view: new View({
          center: [0, 0],
          zoom: 17,
        }),
      });
      map.renderSync();
    });
    afterEach(function () {
      disposeMap(map);
    });

    it('returns an empty array if no feature was found', function () {
      const features = map.getFeaturesAtPixel([0, 0]);
      assert.instanceOf(features, Array);
      assert.isEmpty(features);
    });

    it('returns an array of found features', function () {
      const features = map.getFeaturesAtPixel([50, 50]);
      assert.instanceOf(features, Array);
      assert.instanceOf(features[0], Feature);
    });

    it('returns an array of found features with declutter: true', function () {
      const layer = map.getLayers().item(0);
      map.removeLayer(layer);
      const otherLayer = new VectorLayer({
        declutter: true,
        source: layer.getSource(),
      });
      map.addLayer(otherLayer);
      map.renderSync();
      const features = map.getFeaturesAtPixel([50, 50]);
      assert.instanceOf(features, Array);
      assert.instanceOf(features[0], Feature);
    });

    it('respects options', function () {
      const otherLayer = new VectorLayer({
        source: new VectorSource(),
      });
      map.addLayer(otherLayer);
      map.renderSync();
      const features = map.getFeaturesAtPixel([50, 50], {
        layerFilter: function (layer) {
          return layer === otherLayer;
        },
      });
      assert.instanceOf(features, Array);
      assert.isEmpty(features);
    });

    it('finds off-world geometries', function () {
      const line1 = new LineString([
        [130, 0],
        [230, 0],
      ]);
      line1.transform('EPSG:4326', 'EPSG:3857');
      const line2 = new LineString([
        [-230, 0],
        [-130, 0],
      ]);
      line2.transform('EPSG:4326', 'EPSG:3857');
      layer.getSource().addFeature(new Feature(line1));
      layer.getSource().addFeature(new Feature(line2));
      map.getView().setCenter(fromLonLat([180, 0]));
      map.renderSync();

      let features = map.getFeaturesAtPixel([60, 50]);
      assert.instanceOf(features, Array);
      assert.strictEqual(features.length, 2);

      features = map.getFeaturesAtPixel([60, 50], {checkWrapped: false});
      assert.instanceOf(features, Array);
      assert.strictEqual(features.length, 1);

      map.getView().setCenter(fromLonLat([-180, 0]));
      map.renderSync();

      features = map.getFeaturesAtPixel([40, 50]);
      assert.instanceOf(features, Array);
      assert.strictEqual(features.length, 2);

      features = map.getFeaturesAtPixel([40, 50], {checkWrapped: false});
      assert.instanceOf(features, Array);
      assert.strictEqual(features.length, 1);
    });
  });

  describe('#getFeaturesAtPixel - useGeographic', function () {
    let target, map;
    const size = 256;
    beforeEach(function () {
      useGeographic();

      target = document.createElement('div');
      target.style.width = size + 'px';
      target.style.height = size + 'px';
      document.body.appendChild(target);

      map = new Map({
        target: target,
        layers: [
          new VectorLayer({
            source: new VectorSource({
              features: [
                new Feature(
                  new Polygon([
                    [
                      [-100, 40],
                      [-90, 40],
                      [-90, 50],
                      [-100, 50],
                      [-100, 40],
                    ],
                  ]),
                ),
              ],
            }),
          }),
        ],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });
      map.renderSync();
    });

    afterEach(function () {
      disposeMap(map);
      clearUserProjection();
    });

    it('returns an empty array if no feature was found', function () {
      const features = map.getFeaturesAtPixel([size / 2, size / 2]);
      assert.instanceOf(features, Array);
      assert.isEmpty(features);
    });

    it('returns an array of found features', function () {
      const coordinate = [-95, 45];
      const pixel = map.getPixelFromCoordinate(coordinate);
      const features = map.getFeaturesAtPixel(pixel);
      assert.instanceOf(features, Array);
      assert.instanceOf(features[0], Feature);
    });
  });

  describe('#hasFeatureAtPixel - useGeographic', function () {
    let target, map;
    const size = 256;
    beforeEach(function () {
      useGeographic();

      target = document.createElement('div');
      target.style.width = size + 'px';
      target.style.height = size + 'px';
      document.body.appendChild(target);

      map = new Map({
        target: target,
        layers: [
          new VectorLayer({
            source: new VectorSource({
              features: [
                new Feature(
                  new Polygon([
                    [
                      [-100, 40],
                      [-90, 40],
                      [-90, 50],
                      [-100, 50],
                      [-100, 40],
                    ],
                  ]),
                ),
              ],
            }),
          }),
        ],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });
      map.renderSync();
    });

    afterEach(function () {
      disposeMap(map);
      clearUserProjection();
    });

    it('returns false if no feature was found', function () {
      const has = map.hasFeatureAtPixel([size / 2, size / 2]);
      assert.strictEqual(has, false);
    });

    it('returns true if there are features found', function () {
      const coordinate = [-95, 45];
      const pixel = map.getPixelFromCoordinate(coordinate);
      const has = map.hasFeatureAtPixel(pixel);
      assert.strictEqual(has, true);
    });
  });

  describe('#forEachFeatureAtPixel', function () {
    let map, target;

    beforeEach(function () {
      target = document.createElement('div');
      target.style.width = '360px';
      target.style.height = '180px';
      document.body.appendChild(target);
    });

    afterEach(function () {
      disposeMap(map);
      map = undefined;
    });
    it('does hitdetection with image offset', function (done) {
      const svg = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect x="32" y="32" width="32" height="32" />
      </svg>`;

      const feature = new Feature(new Point([0, 0]));
      feature.setStyle(
        new Style({
          image: new Icon({
            src: 'data:image/svg+xml;base64,' + window.btoa(svg),
            color: [255, 0, 0, 1],
            offset: [32, 32],
            size: [32, 32],
          }),
        }),
      );

      map = new Map({
        pixelRatio: 2,
        controls: [],
        interactions: [],
        target: target,
        layers: [
          new VectorLayer({
            source: new VectorSource({
              features: [feature],
            }),
          }),
        ],
        view: new View({
          projection: 'EPSG:4326',
          center: [0, 0],
          resolution: 1,
        }),
      });
      map.once('rendercomplete', function () {
        const hit = map.forEachFeatureAtPixel(
          map.getPixelFromCoordinate([0, 0]),
          () => true,
        );
        try {
          assert.strictEqual(hit, true);
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  describe('#render()', function () {
    let target, map;

    beforeEach(function () {
      target = document.createElement('div');
      const style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = '360px';
      style.height = '180px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        view: new View({
          projection: 'EPSG:4326',
          center: [0, 0],
          resolution: 1,
        }),
      });
    });

    afterEach(function () {
      disposeMap(map, target);
    });

    it('is called when the view.changed() is called', function () {
      const view = map.getView();

      const spy = sinonSpy(map, 'render');
      view.changed();
      assert.strictEqual(spy.callCount, 1);
    });

    it('is not called on view changes after the view has been removed', function () {
      const view = map.getView();
      map.setView(null);

      const spy = sinonSpy(map, 'render');
      view.changed();
      assert.strictEqual(spy.callCount, 0);
    });

    it('calls renderFrame_ and results in a postrender event', function (done) {
      const spy = sinonSpy(map, 'renderFrame_');
      map.render();
      map.once('postrender', function (event) {
        assert.instanceOf(event, MapEvent);
        assert.strictEqual(typeof spy.firstCall.args[0], 'number');
        spy.restore();
        assert.notEqual(event.frameState, null);
        done();
      });
    });

    it('layers dispatch prerender and postrender when not decluttering', function (done) {
      const layer = new VectorLayer({source: new VectorSource()});
      let prerender = false;
      let postrender = false;
      const renderDeferredSpy = sinonSpy(layer.getRenderer(), 'renderDeferred');
      layer.on('prerender', () => (prerender = true));
      layer.on('postrender', () => {
        assert.strictEqual(renderDeferredSpy.callCount, 0);
        renderDeferredSpy.restore();
        postrender = true;
      });
      map.addLayer(layer);
      map.once('postrender', () => {
        try {
          assert.strictEqual(prerender, true);
          assert.strictEqual(postrender, true);
          done();
        } catch (e) {
          done(e);
        }
      });
      map.render();
    });

    it('layers dispatch prerender and postrender when decluttering', function (done) {
      const layer = new VectorLayer({
        source: new VectorSource(),
        declutter: true,
      });
      let prerender = false;
      let postrender = false;
      const renderDeferredSpy = sinonSpy(layer.getRenderer(), 'renderDeferred');
      layer.on('prerender', () => (prerender = true));
      layer.on('postrender', () => {
        assert.strictEqual(renderDeferredSpy.callCount, 1);
        renderDeferredSpy.restore();
        postrender = true;
      });
      map.addLayer(layer);
      map.once('postrender', () => {
        try {
          assert.strictEqual(prerender, true);
          assert.strictEqual(postrender, true);
          done();
        } catch (e) {
          done(e);
        }
      });
      map.render();
    });

    it('uses the same render frame for subsequent calls', function () {
      map.render();
      const id1 = map.animationDelayKey_;
      map.render();
      const id2 = map.animationDelayKey_;
      assert.strictEqual(id1, id2);
    });

    it('creates a new render frame after renderSync()', function () {
      map.render();
      assert.notEqual(map.animationDelayKey_, undefined);

      map.renderSync();
      assert.strictEqual(map.animationDelayKey_, undefined);
    });

    it('results in an postrender event (for zero height map)', function (done) {
      target.style.height = '0px';
      map.updateSize();

      map.render();
      map.once('postrender', function (event) {
        assert.instanceOf(event, MapEvent);
        const frameState = event.frameState;
        assert.strictEqual(frameState, null);
        done();
      });
    });

    it('results in an postrender event (for zero width map)', function (done) {
      target.style.width = '0px';
      map.updateSize();

      map.render();
      map.once('postrender', function (event) {
        assert.instanceOf(event, MapEvent);
        const frameState = event.frameState;
        assert.strictEqual(frameState, null);
        done();
      });
    });
  });

  describe('#handlePostRender()', function () {
    let map, target;

    beforeEach(function () {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        view: new View({center: [0, 0], zoom: 1}),
      });
      map.renderSync();
    });

    afterEach(function () {
      disposeMap(map, target);
    });

    it('loads tiles when animating with calling reprioritize', function () {
      const reprioritizeSpy = sinonSpy(map.tileQueue_, 'reprioritize');
      const loadSpy = sinonSpy(map.tileQueue_, 'loadMoreTiles');
      sinonStub(map.tileQueue_, 'isEmpty').returns(false);
      sinonStub(map.tileQueue_, 'getTilesLoading').returns(0);

      map.frameState_.viewHints = [1, 0];
      map.frameState_.time = Infinity; // guarantee lowOnFrameBudget is false
      map.handlePostRender();

      assert.strictEqual(loadSpy.callCount, 1);
      assert.strictEqual(reprioritizeSpy.callCount, 1);
    });

    it('loads tiles after animation ends without calling reprioritize', function () {
      const reprioritizeSpy = sinonSpy(map.tileQueue_, 'reprioritize');
      const loadSpy = sinonSpy(map.tileQueue_, 'loadMoreTiles');
      sinonStub(map.tileQueue_, 'isEmpty').returns(false);
      sinonStub(map.tileQueue_, 'getTilesLoading').returns(0);

      map.frameState_.viewHints = [0, 0];
      map.frameState_.time = Infinity; // guarantee lowOnFrameBudget is false
      map.handlePostRender();

      assert.strictEqual(loadSpy.callCount, 1);
      assert.strictEqual(reprioritizeSpy.callCount, 0);
    });
  });

  describe('dispose', function () {
    let map;

    beforeEach(function () {
      map = new Map({
        target: document.createElement('div'),
      });
    });

    it('removes the viewport from its parent', function () {
      map.dispose();
      assert.strictEqual(map.getViewport().parentNode, null);
    });

    it('removes window listeners', function () {
      map.dispose();
      assert.strictEqual(map.targetChangeHandlerKeys_, null);
    });
  });

  describe('#setTarget', function () {
    /** @type {Map|undefined} */
    let map;

    beforeEach(function () {
      map = new Map({
        target: document.createElement('div'),
      });
      assert.isOk(map.targetChangeHandlerKeys_);
    });

    afterEach(() => {
      disposeMap(map);
    });

    describe('map with target not attached to dom', function () {
      it('has undefined as size with target not in document', function () {
        assert.strictEqual(map.getSize(), undefined);
      });
    });

    describe('map container with negative width and heigth due to borders', () => {
      it('does not try to set a negative map size', () => {
        const target = map.getTargetElement();
        document.body.appendChild(target);
        target.style.border = '1px solid black';
        target.style.display = 'none';
        map.updateSize();
        document.body.removeChild(target);
        assert.deepEqual(map.getSize(), [0, 0]);
      });
    });

    describe('call setTarget with null', function () {
      it('unregisters the viewport resize listener', function () {
        map.setTarget(null);
        assert.strictEqual(map.targetChangeHandlerKeys_, null);
      });
    });

    describe('call setTarget with an element', function () {
      it('registers a viewport resize listener', function () {
        map.setTarget(null);
        map.setTarget(document.createElement('div'));
        assert.isOk(map.targetChangeHandlerKeys_);
      });
    });

    it('detach and re-attach', function (done) {
      const target = map.getTargetElement();
      map.setTarget(null);
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map.setTarget(target);
      map.addLayer(
        new VectorLayer({
          source: new VectorSource({
            features: [new Feature(new Point([0, 0]))],
          }),
        }),
      );
      map.getView().setCenter([0, 0]);
      map.getView().setZoom(0);
      map.renderSync();
      try {
        assert.instanceOf(target.querySelector('canvas'), HTMLCanvasElement);
        map.setTarget(null);
        assert.strictEqual(target.querySelector('canvas'), null);
        map.setTarget(target);
        map.once('rendercomplete', () => {
          try {
            assert.instanceOf(
              target.querySelector('canvas'),
              HTMLCanvasElement,
            );
            done();
          } catch (e) {
            done(e);
          }
        });
      } finally {
        target.remove();
      }
    });
  });

  describe('#getPixelRatio() and #setPixelRatio()', function () {
    let map;

    beforeEach(function () {
      map = new Map({
        target: document.createElement('div'),
      });
    });

    afterEach(function () {
      disposeMap(map);
    });

    it('gets the pixel ratio', function () {
      assert.strictEqual(map.getPixelRatio(), window.devicePixelRatio || 1);
    });

    it('sets the pixel ratio and re-renders the map', function () {
      const spy = sinonSpy(map, 'render');
      map.setPixelRatio(2);
      assert.strictEqual(map.getPixelRatio(), 2);
      assert.strictEqual(spy.called, true);
      spy.restore();
    });
  });

  describe('create interactions', function () {
    let options;

    function createEvent(
      type,
      {altKey, button, hasTabIndex, hasFocus, isPrimary} = {},
    ) {
      if (altKey === undefined) {
        altKey = false;
      }
      if (button === undefined) {
        button = 0;
      }
      if (hasTabIndex === undefined) {
        hasTabIndex = true;
      }
      if (hasFocus === undefined) {
        hasFocus = true;
      }
      if (isPrimary === undefined) {
        isPrimary = true;
      }
      const originalEvent = new PointerEvent(type, {
        altKey,
        button,
        isPrimary,
      });
      Object.defineProperty(originalEvent, 'target', {
        writable: false,
        value: {
          getTargetElement: function () {
            return {
              contains: function () {
                return hasFocus;
              },
            };
          },
        },
      });
      return new MapBrowserEvent(
        type,
        {
          getTargetElement: function () {
            return {
              hasAttribute: function (attribute) {
                return hasTabIndex;
              },
              contains: function () {
                return hasFocus;
              },
              getRootNode: function () {
                return {};
              },
            };
          },
          getOwnerDocument: function () {
            return {};
          },
        },
        originalEvent,
      );
    }

    beforeEach(function () {
      options = {
        altShiftDragRotate: false,
        doubleClickZoom: false,
        keyboard: false,
        mouseWheelZoom: false,
        shiftDragZoom: false,
        dragPan: false,
        pinchRotate: false,
        pinchZoom: false,
      };
    });

    describe('create mousewheel interaction', function () {
      it('creates mousewheel interaction', function () {
        options.mouseWheelZoom = true;
        const interactions = defaultInteractions(options);
        assert.deepEqual(interactions.getLength(), 1);
        assert.instanceOf(interactions.item(0), MouseWheelZoom);
        assert.deepEqual(interactions.item(0).useAnchor_, true);
        interactions.item(0).setMouseAnchor(false);
        assert.deepEqual(interactions.item(0).useAnchor_, false);
        assert.strictEqual(interactions.item(0).condition_, TRUE);
      });
      it('does not use the default condition when onFocusOnly option is set', function () {
        options.onFocusOnly = true;
        options.mouseWheelZoom = true;
        const interactions = defaultInteractions(options);
        assert.notEqual(interactions.item(0).condition_, TRUE);
        let event = createEvent('pointerdown');
        assert.strictEqual(interactions.item(0).condition_(event), true);
        event = createEvent('pointerdown', {hasFocus: false});
        assert.strictEqual(interactions.item(0).condition_(event), false);
        event = createEvent('pointerdown', {
          hasTabIndex: false,
          hasFocus: false,
        });
        assert.strictEqual(interactions.item(0).condition_(event), true);
      });
    });

    describe('create dragpan interaction', function () {
      it('creates dragpan interaction', function () {
        options.dragPan = true;
        const interactions = defaultInteractions(options);
        assert.deepEqual(interactions.getLength(), 1);
        assert.instanceOf(interactions.item(0), DragPan);
        let event = createEvent('pointerdown');
        assert.strictEqual(interactions.item(0).condition_(event), true);
        event = createEvent('pointerdown', {hasFocus: false});
        assert.strictEqual(interactions.item(0).condition_(event), true);
        event = createEvent('pointerdown', {altKey: true, hasFocus: false});
        assert.strictEqual(interactions.item(0).condition_(event), false);
        event = createEvent('pointerdown', {button: 1, hasFocus: false});
        assert.strictEqual(interactions.item(0).condition_(event), false);
      });
      it('does not use the default condition when onFocusOnly option is set', function () {
        options.onFocusOnly = true;
        options.dragPan = true;
        const interactions = defaultInteractions(options);
        let event = createEvent('pointerdown');
        assert.strictEqual(interactions.item(0).condition_(event), true);
        event = createEvent('pointerdown', {hasFocus: false});
        assert.strictEqual(interactions.item(0).condition_(event), false);
        event = createEvent('pointerdown', {
          hasTabIndex: false,
          hasFocus: false,
        });
        assert.strictEqual(interactions.item(0).condition_(event), true);
      });
    });

    describe('create pinchZoom interaction', function () {
      it('creates pinchZoom interaction', function () {
        options.pinchZoom = true;
        const interactions = defaultInteractions(options);
        assert.deepEqual(interactions.getLength(), 1);
        assert.instanceOf(interactions.item(0), PinchZoom);
      });
    });

    describe('create double click interaction', function () {
      beforeEach(function () {
        options.doubleClickZoom = true;
      });

      describe('default zoomDelta', function () {
        it('create double click interaction with default delta', function () {
          const interactions = defaultInteractions(options);
          assert.deepEqual(interactions.getLength(), 1);
          assert.instanceOf(interactions.item(0), DoubleClickZoom);
          assert.deepEqual(interactions.item(0).delta_, 1);
        });
      });

      describe('set zoomDelta', function () {
        it('create double click interaction with set delta', function () {
          options.zoomDelta = 7;
          const interactions = defaultInteractions(options);
          assert.deepEqual(interactions.getLength(), 1);
          assert.instanceOf(interactions.item(0), DoubleClickZoom);
          assert.deepEqual(interactions.item(0).delta_, 7);
        });
      });
    });

    describe('#getEventPixel', function () {
      let target;

      beforeEach(function () {
        target = document.createElement('div');
        target.style.position = 'absolute';
        target.style.top = '10px';
        target.style.left = '20px';
        target.style.width = '800px';
        target.style.height = '400px';

        document.body.appendChild(target);
      });
      afterEach(function () {
        target.remove();
      });

      it('works with touchend events', function () {
        const map = new Map({
          target: target,
        });

        const browserEvent = {
          type: 'touchend',
          target: target,
          changedTouches: [
            {
              clientX: 100,
              clientY: 200,
            },
          ],
        };
        const position = map.getEventPixel(browserEvent);
        assert.deepEqual(position[0], 80);
        assert.deepEqual(position[1], 190);

        disposeMap(map);
      });
    });

    describe('#getOverlayById()', function () {
      let target, map, overlay, overlay_target;

      beforeEach(function () {
        target = document.createElement('div');
        const style = target.style;
        style.position = 'absolute';
        style.left = '-1000px';
        style.top = '-1000px';
        style.width = '360px';
        style.height = '180px';
        document.body.appendChild(target);
        map = new Map({
          target: target,
          view: new View({
            projection: 'EPSG:4326',
            center: [0, 0],
            resolution: 1,
          }),
        });
        overlay_target = document.createElement('div');
      });

      afterEach(function () {
        disposeMap(map);
      });

      it('returns an overlay by id', function () {
        overlay = new Overlay({
          id: 'foo',
          element: overlay_target,
          position: [0, 0],
        });
        map.addOverlay(overlay);
        assert.strictEqual(map.getOverlayById('foo'), overlay);
      });

      it('returns null when no overlay is found', function () {
        overlay = new Overlay({
          id: 'foo',
          element: overlay_target,
          position: [0, 0],
        });
        map.addOverlay(overlay);
        assert.strictEqual(map.getOverlayById('bar'), null);
      });

      it('returns null after removing overlay', function () {
        overlay = new Overlay({
          id: 'foo',
          element: overlay_target,
          position: [0, 0],
        });
        map.addOverlay(overlay);
        assert.strictEqual(map.getOverlayById('foo'), overlay);
        map.removeOverlay(overlay);
        assert.strictEqual(map.getOverlayById('foo'), null);
      });
    });

    describe('getCoordinateFromPixel() and getPixelFromCoordinate()', function () {
      let target, view, map;
      const centerGeographic = [2.460938, 48.850258];
      const centerMercator = transform(
        centerGeographic,
        getProjection('EPSG:4326'),
        getProjection('EPSG:3857'),
      );
      const screenCenter = [500, 500];

      beforeEach(function () {
        target = document.createElement('div');

        const style = target.style;
        style.position = 'absolute';
        style.left = '-1000px';
        style.top = '-1000px';
        style.width = `${screenCenter[0] * 2}px`;
        style.height = `${screenCenter[1] * 2}px`;
        document.body.appendChild(target);

        useGeographic();

        view = new View({
          center: centerGeographic,
          zoom: 3,
        });
        map = new Map({
          target: target,
          view: view,
          layers: [
            new TileLayer({
              source: new XYZ({
                url: '#{x}/{y}/{z}',
              }),
            }),
          ],
        });
      });

      afterEach(function () {
        disposeMap(map);
        clearUserProjection();
      });

      it('gets coordinates in user projection', function (done) {
        map.renderSync();
        const coordinateGeographic = map.getCoordinateFromPixel(screenCenter);
        assert.approximately(
          coordinateGeographic[0],
          centerGeographic[0],
          1e-5,
        );
        assert.approximately(
          coordinateGeographic[1],
          centerGeographic[1],
          1e-5,
        );
        done();
      });

      it('gets coordinates in view projection', function (done) {
        map.renderSync();
        const coordinateMercator =
          map.getCoordinateFromPixelInternal(screenCenter);
        assert.approximately(coordinateMercator[0], centerMercator[0], 1e-5);
        assert.approximately(coordinateMercator[1], centerMercator[1], 1e-5);
        done();
      });

      it('gets pixel from coordinates in user projection', function (done) {
        map.renderSync();
        const pixel = map.getPixelFromCoordinate(centerGeographic);
        assert.deepEqual(pixel, screenCenter);
        done();
      });

      it('gets pixel from coordinates in view projection', function (done) {
        map.renderSync();
        const pixel = map.getPixelFromCoordinateInternal(centerMercator);
        assert.deepEqual(pixel, screenCenter);
        done();
      });
    });

    describe('getCoordinateFromPixel() and getPixelFromCoordinate() with wrapX', function () {
      let target, map;

      beforeEach(function () {
        target = document.createElement('div');
        target.style.width = '100px';
        target.style.height = '100px';
        document.body.appendChild(target);

        useGeographic();

        map = new Map({
          target: target,
          view: new View({
            center: [200, 0],
            zoom: 1,
          }),
          layers: [],
        });
      });

      afterEach(function () {
        disposeMap(map);
        clearUserProjection();
      });

      it('getPixelFromCoordinate with wrapX returns screen pixel for wrapped coordinate', function (done) {
        map.renderSync();
        const size = map.getSize();
        const centerPixel = [size[0] / 2, size[1] / 2];
        // lon=-160 is one world (360°) to the left of view center lon=200
        // without wrapX the pixel is far off-screen; with wrapX it maps to center
        const coordinate = [-160, 0];
        const pixelWithoutWrap = map.getPixelFromCoordinate(coordinate);
        const pixelWithWrap = map.getPixelFromCoordinate(coordinate, {
          wrapX: true,
        });
        expect(pixelWithoutWrap[0]).to.not.roughlyEqual(centerPixel[0], 1);
        expect(pixelWithWrap[0]).to.roughlyEqual(centerPixel[0], 1);
        expect(pixelWithWrap[1]).to.roughlyEqual(centerPixel[1], 1);
        done();
      });

      it('getCoordinateFromPixel with wrapX returns canonical coordinate', function (done) {
        map.renderSync();
        const size = map.getSize();
        const centerPixel = [size[0] / 2, size[1] / 2];
        // center pixel maps to lon=200 (extended); wrapX wraps it to lon=-160
        const coordinateWithoutWrap = map.getCoordinateFromPixel(centerPixel);
        const coordinateWithWrap = map.getCoordinateFromPixel(centerPixel, {
          wrapX: true,
        });
        expect(coordinateWithoutWrap[0]).to.roughlyEqual(200, 1e-5);
        expect(coordinateWithWrap[0]).to.roughlyEqual(-160, 1e-5);
        done();
      });
    });
  });

  describe('#handleMapBrowserEvent()', function () {
    let map, target, dragpan;
    beforeEach(function () {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      dragpan = new DragPan();
      map = new Map({
        target: target,
        interactions: [dragpan],
        layers: [
          new TileLayer({
            source: new XYZ({
              url: 'spec/ol/data/osm-{z}-{x}-{y}.png',
            }),
          }),
        ],
        view: new View({
          zoom: 0,
          center: [0, 0],
        }),
      });
      map.renderSync();
    });

    afterEach(function () {
      disposeMap(map, target);
    });

    it('calls handleEvent on interaction', function () {
      const spy = sinonSpy(dragpan, 'handleEvent');
      map.handleMapBrowserEvent(
        new MapBrowserEvent(
          'pointermove',
          map,
          new PointerEvent('pointermove'),
        ),
      );
      assert.strictEqual(spy.callCount, 1);
      spy.restore();
    });

    it('does not call handleEvent on interaction when map has no target', function () {
      map.setTarget(null);
      const spy = sinonSpy(dragpan, 'handleEvent');
      map.handleMapBrowserEvent(
        new MapBrowserEvent(
          'pointermove',
          map,
          new PointerEvent('pointermove'),
        ),
      );
      assert.strictEqual(spy.callCount, 0);
      spy.restore();
    });

    it('does not call handleEvent on interaction that has been removed', function () {
      const spy = sinonSpy(dragpan, 'handleEvent');
      let callCount = 0;
      const interaction = new Interaction({
        handleEvent: function () {
          ++callCount;
          map.removeInteraction(dragpan);
          return true;
        },
      });
      map.addInteraction(interaction);
      map.handleMapBrowserEvent(
        new MapBrowserEvent(
          'pointermove',
          map,
          new PointerEvent('pointermove'),
        ),
      );
      assert.strictEqual(callCount, 1);
      assert.strictEqual(spy.callCount, 0);
      spy.restore();
    });

    it('does not call handleEvent on interaction when MapBrowserEvent propagation stopped', function () {
      const select = new Select();
      const selectStub = sinonStub(select, 'handleEvent');
      selectStub.callsFake(function (e) {
        e.stopPropagation();
        return true;
      });
      map.addInteraction(select);
      const spy = sinonSpy(dragpan, 'handleEvent');
      map.handleMapBrowserEvent(
        new MapBrowserEvent(
          'pointermove',
          map,
          new PointerEvent('pointermove'),
        ),
      );
      assert.strictEqual(spy.callCount, 0);
      assert.strictEqual(selectStub.callCount, 1);
      spy.restore();
      selectStub.restore();
    });

    describe('external map', () => {
      let iframe, spy;

      beforeEach(() => {
        iframe = document.createElement('iframe');
        iframe.width = '100';
        iframe.height = '100';
        iframe.src = 'spec/ol/data/external-map.html';
        document.body.appendChild(iframe);
        spy = sinonSpy(dragpan, 'handleDownEvent');
      });
      afterEach(() => {
        map.setTarget(null);
        document.body.removeChild(iframe);
        spy.restore();
      });
      it('handles events from a map in a separate window', (done) => {
        document.body.removeChild(map.getTargetElement());
        map.setTarget(null);
        const win = iframe.contentWindow;
        win.addEventListener('DOMContentLoaded', () => {
          map.setTarget(iframe.contentDocument.getElementById('map'));
          win.postMessage('test');
          setTimeout(() => {
            assert.strictEqual(spy.callCount, 1);
            assert.strictEqual(spy.firstCall.returnValue, true);
            done();
          }, 100);
        });
      });
      it('observes size changes of a map in a separate window', (done) => {
        document.body.removeChild(map.getTargetElement());
        map.setTarget(null);
        const win = iframe.contentWindow;
        win.addEventListener('DOMContentLoaded', () => {
          const externalTarget = iframe.contentDocument.getElementById('map');
          map.setTarget(externalTarget);
          map.once('change:size', () => {
            assert.deepEqual(map.getSize(), [50, 50]);
            done();
          });
          // Trigger a resize in the external window; the ResizeObserver must
          // pick this up even though the target belongs to another realm.
          iframe.width = '50';
          iframe.height = '50';
        });
      });
    });
  });

  describe('resize', function () {
    const width = 256;
    const height = 256;
    /** @type {Map} */
    let map;
    /** @type {HTMLElement} */
    let target;

    beforeEach(function () {
      target = document.createElement('div');
      target.style.height = `${width}px`;
      target.style.width = `${height}px`;
    });
    afterEach(function () {
      disposeMap(map, target);
    });

    it('has updated the viewport when the change:size event is being dispatched', function (done) {
      map = new Map({
        target: target,
        view: new View(),
        layers: [],
        controls: [],
        interactions: [],
      });
      map.on('change:size', () => {
        assert.deepEqual(map.getView().getViewportSize_(), [width, height]);
        done();
      });
      document.body.appendChild(target);
    });
  });
});
