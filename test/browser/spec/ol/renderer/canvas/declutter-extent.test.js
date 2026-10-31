import {assert} from 'chai';
import Feature from '../../../../../../src/ol/Feature.js';
import Map from '../../../../../../src/ol/Map.js';
import TileState from '../../../../../../src/ol/TileState.js';
import VectorTile from '../../../../../../src/ol/VectorTile.js';
import View from '../../../../../../src/ol/View.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import {fromExtent} from '../../../../../../src/ol/geom/Polygon.js';
import LayerGroup from '../../../../../../src/ol/layer/Group.js';
import VectorLayer from '../../../../../../src/ol/layer/Vector.js';
import VectorTileLayer from '../../../../../../src/ol/layer/VectorTile.js';
import Projection from '../../../../../../src/ol/proj/Projection.js';
import RenderFeature from '../../../../../../src/ol/render/Feature.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import VectorTileSource from '../../../../../../src/ol/source/VectorTile.js';
import Circle from '../../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../../src/ol/style/Fill.js';
import Style from '../../../../../../src/ol/style/Style.js';
import Text from '../../../../../../src/ol/style/Text.js';
import TileGrid from '../../../../../../src/ol/tilegrid/TileGrid.js';
import {apply} from '../../../../../../src/ol/transform.js';

let font;
beforeAll(async () => {
  font = new FontFace(
    'Ubuntu Extent Test',
    'url(/spec/ol/data/fonts/ubuntu-regular-webfont.woff2)',
  );
  document.fonts.add(await font.load());
});
afterAll(() => document.fonts.delete(font));

for (const mode of ['vector layer', 'hybrid', 'vector']) {
  for (const rotation of [0, Math.PI / 4]) {
    describe(`declutter extent: ${mode}, rotation ${rotation}`, () => {
      let map;
      const style = new Style({
        image: new Circle({radius: 10, fill: new Fill({color: 'red'})}),
        text: new Text({
          text: 'label',
          font: '10px "Ubuntu Extent Test"',
          offsetY: -20,
        }),
      });

      function createLayer(features, options = {}, wrapX = true, projection) {
        const common = {
          declutter: 'shared',
          extent: [0, -50, 50, 50],
          renderBuffer: 100,
          style,
          ...options,
        };
        if (mode === 'vector layer') {
          return new VectorLayer({
            ...common,
            source: new VectorSource({features, wrapX}),
          });
        }
        class LoadedTile extends VectorTile {
          constructor(...args) {
            super(...args);
            this.setFeatures(features);
            this.setState(TileState.LOADED);
          }
        }
        return new VectorTileLayer({
          ...common,
          renderMode: mode,
          source: new VectorTileSource({
            tileClass: LoadedTile,
            tileGrid: new TileGrid({
              extent: [-128, -128, 128, 128],
              resolutions: [1],
              tileSize: 256,
            }),
            url: '{z}/{x}/{y}',
            wrapX,
            projection,
          }),
        });
      }

      async function render(layers, viewOptions = {}) {
        map = new Map({
          target: createMapDiv(128, 128),
          pixelRatio: 2,
          layers,
          view: new View({
            center: [0, 0],
            resolution: 1,
            rotation,
            ...viewOptions,
          }),
        });
        await new Promise((resolve) => {
          map.once('rendercomplete', resolve);
          map.renderSync();
        });
      }

      function declutteredFeatures() {
        return map.frameState_.declutter.shared.all().map((item) => item.value);
      }

      function pixel(layer, coordinate) {
        const renderer = layer.getRenderer();
        const position = apply(
          renderer.inversePixelTransform,
          map.getPixelFromCoordinate(coordinate),
        );
        return Array.from(
          renderer.context.getImageData(...position.map(Math.round), 1, 1).data,
        );
      }

      afterEach(() => disposeMap(map));

      it('rejects outside points before collision testing and hit detection', async () => {
        // The outside symbol overlaps the inside point and is rendered first.
        const outside = new Feature(new Point([-5, 0]));
        const inside = new Feature(new Point([5, 0]));
        const layer = createLayer([outside, inside]);
        await render([layer]);
        assert.include(declutteredFeatures(), inside);
        assert.notInclude(declutteredFeatures(), outside);
        assert.deepEqual(pixel(layer, [5, 0]), [255, 0, 0, 255]);
        assert.deepEqual(pixel(layer, [-2, 0]), [0, 0, 0, 0]);
        assert.deepEqual(
          map.getFeaturesAtPixel(map.getPixelFromCoordinate([5, 0])),
          [inside],
        );
      });

      it('uses each layer extent within a shared declutter group', async () => {
        const inside = new Feature(new Point([5, 0]));
        const outside = new Feature(new Point([8, 0]));
        const lower = createLayer([inside]);
        const upper = createLayer([outside], {extent: [10, -40, 40, 40]});
        await render([lower, upper]);
        assert.include(declutteredFeatures(), inside);
        assert.notInclude(declutteredFeatures(), outside);
        assert.deepEqual(pixel(lower, [5, 0]), [255, 0, 0, 255]);
        assert.deepEqual(
          map.getFeaturesAtPixel(map.getPixelFromCoordinate([2, 0])),
          [inside],
        );
      });

      it('does not hit a rejected copy of a feature shared by two layers', async () => {
        const feature = new Feature(new Point([5, 0]));
        const lower = createLayer([feature]);
        const upper = createLayer([feature], {extent: [10, -40, 40, 40]});
        await render([lower, upper]);
        const hitLayers = [];
        map.forEachFeatureAtPixel(
          map.getPixelFromCoordinate([12, 0]),
          (feature, layer) => {
            hitLayers.push(layer);
          },
        );
        assert.deepEqual(hitLayers, [lower]);
      });

      it('filters lightweight point render features', async () => {
        const inside = new RenderFeature('Point', [5, 0], [], 2, {}, 1);
        const outside = new RenderFeature('Point', [-5, 0], [], 2, {}, 2);
        const layer = createLayer([outside, inside]);
        await render([layer]);
        assert.include(declutteredFeatures(), inside);
        assert.notInclude(declutteredFeatures(), outside);
        assert.deepEqual(pixel(layer, [5, 0]), [255, 0, 0, 255]);
        assert.deepEqual(
          map.getFeaturesAtPixel(map.getPixelFromCoordinate([5, 0])),
          [inside],
        );
      });

      it('keeps boundary points and skips labels anchored outside', async () => {
        const boundary = new Feature(new Point([0, -30]));
        // The polygon crosses the extent, but its label anchor is outside.
        const crossing = new Feature(fromExtent([-40, 15, 5, 35]));
        const layer = createLayer([boundary, crossing]);
        await render([layer]);
        assert.include(declutteredFeatures(), boundary);
        assert.notInclude(declutteredFeatures(), crossing);
      });

      it('updates when the layer extent changes', async () => {
        const point = new Feature(new Point([-5, 0]));
        const polygon = new Feature(fromExtent([-40, -40, -20, -20]));
        polygon.setStyle(new Style({fill: new Fill({color: 'blue'})}));
        const layer = createLayer([point, polygon]);
        await render([layer]);
        assert.notInclude(declutteredFeatures(), point);
        layer.setExtent([-50, -50, 50, 50]);
        await new Promise((resolve) => {
          map.once('rendercomplete', resolve);
          map.renderSync();
        });
        assert.include(declutteredFeatures(), point);
        assert.deepEqual(pixel(layer, [-5, 0]), [255, 0, 0, 255]);
        assert.deepEqual(pixel(layer, [-30, -30]), [0, 0, 255, 255]);
      });

      for (const declutterMode of ['none', 'obstacle']) {
        it(`rejects outside symbols with declutterMode ${declutterMode}`, async () => {
          const outside = new Feature(new Point([-5, 0]));
          const layer = createLayer([outside], {
            style: new Style({
              image: new Circle({
                radius: 10,
                fill: new Fill({color: 'red'}),
                declutterMode,
              }),
            }),
          });
          await render([layer]);
          assert.deepEqual(pixel(layer, [2, 0]), [0, 0, 0, 0]);
          assert.isEmpty(
            map.getFeaturesAtPixel(map.getPixelFromCoordinate([2, 0])),
          );
        });
      }

      it('uses the inherited group extent', async () => {
        const inside = new Feature(new Point([5, 0]));
        const outside = new Feature(new Point([-5, 0]));
        const lower = createLayer([inside], {extent: undefined});
        const upper = createLayer([outside], {extent: undefined});
        await render([
          new LayerGroup({
            extent: [0, -50, 50, 50],
            layers: [lower, upper],
          }),
        ]);
        assert.include(declutteredFeatures(), inside);
        assert.notInclude(declutteredFeatures(), outside);
        assert.deepEqual(
          map.getFeaturesAtPixel(map.getPixelFromCoordinate([2, 0])),
          [inside],
        );
      });

      describe('wrapped worlds', () => {
        const projection = new Projection({
          code: 'declutter-extent',
          units: 'm',
          extent: [-128, -128, 128, 128],
          global: true,
        });
        const wrappedStyle = new Style({
          image: new Circle({radius: 5, fill: new Fill({color: 'red'})}),
        });

        it('filters with an extent inside the projection extent', async () => {
          // Rendered at 110, inside the extent
          const inside = new Feature(new Point([110, 0]));
          // Rendered at 146, outside the extent
          const outside = new Feature(new Point([-110, 0]));
          const layer = createLayer(
            [outside, inside],
            {extent: [96, -50, 127, 50], style: wrappedStyle},
            true,
            projection,
          );
          await render([layer], {projection, center: [128, 0]});
          assert.include(declutteredFeatures(), inside);
          assert.notInclude(declutteredFeatures(), outside);
        });

        if (mode === 'vector layer') {
          it('filters when only the vertical bounds exceed the projection extent', async () => {
            const inside = new Feature(new Point([110, 0]));
            const outside = new Feature(new Point([-110, 0]));
            const layer = createLayer(
              [outside, inside],
              {extent: [96, -256, 127, 256], style: wrappedStyle},
              true,
              projection,
            );
            await render([layer], {projection, center: [128, 0]});
            assert.include(declutteredFeatures(), inside);
            assert.notInclude(declutteredFeatures(), outside);
          });

          it('keeps a wrapped symbol on the antimeridian boundary', async () => {
            const feature = new Feature(new Point([-128, 0]));
            const layer = createLayer(
              [feature],
              {extent: [96, -50, 128, 50], style: wrappedStyle},
              true,
              projection,
            );
            await render([layer], {projection, center: [128, 0]});
            assert.include(declutteredFeatures(), feature);
            assert.deepEqual(pixel(layer, [126, 0]), [255, 0, 0, 255]);
          });

          it('keeps features stored outside the projection extent', async () => {
            const feature = new Feature(new Point([366, 0]));
            const layer = createLayer(
              [feature],
              {extent: [96, -50, 127, 50], style: wrappedStyle},
              true,
              projection,
            );
            await render([layer], {projection, center: [128, 0]});
            assert.include(declutteredFeatures(), feature);
            assert.deepEqual(pixel(layer, [110, 0]), [255, 0, 0, 255]);
          });
        }

        it('renders other worlds in an extent crossing the antimeridian', async () => {
          // Rendered at 110 and 146, inside the extent
          const inside = new Feature(new Point([110, 0]));
          const insideWrapped = new Feature(new Point([-110, 0]));
          // Rendered at 70 and 186, outside the extent
          const outside = new Feature(new Point([70, 0]));
          const outsideWrapped = new Feature(new Point([-70, 0]));
          const layer = createLayer(
            [outside, outsideWrapped, inside, insideWrapped],
            {extent: [96, -50, 160, 50], style: wrappedStyle},
            true,
            projection,
          );
          await render([layer], {projection, center: [128, 0]});
          assert.includeMembers(declutteredFeatures(), [inside, insideWrapped]);
          if (mode !== 'vector layer') {
            // Unlike vector layer replays, each tile is rendered in one world.
            assert.notInclude(declutteredFeatures(), outside);
            assert.notInclude(declutteredFeatures(), outsideWrapped);
          }
          assert.deepEqual(pixel(layer, [146, 0]), [255, 0, 0, 255]);
          assert.deepEqual(
            map.getFeaturesAtPixel(map.getPixelFromCoordinate([146, 0])),
            [insideWrapped],
          );
        });
      });

      it('keeps buffered candidates when no layer extent is set', async () => {
        const feature = new Feature(new Point([-5, 0]));
        const layer = createLayer([feature], {extent: undefined});
        await render([layer]);
        assert.include(declutteredFeatures(), feature);
        assert.deepEqual(pixel(layer, [-5, 0]), [255, 0, 0, 255]);
      });
    });
  }
}
