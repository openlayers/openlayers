import Circle from '../../../../../../src/ol/style/Circle.js';
import Feature from '../../../../../../src/ol/Feature.js';
import {Fill, Stroke, Style} from '../../../../../../src/ol/style.js';
import {
  GeometryCollection,
  LineString,
  Point,
  Polygon,
} from '../../../../../../src/ol/geom.js';
import {create} from '../../../../../../src/ol/transform.js';
import {createCanvasContext2D} from '../../../../../../src/ol/dom.js';
import {
  createHitDetectionImageData,
  hitDetect,
} from '../../../../../../src/ol/render/canvas/hitdetect.js';

describe('hitdetect', function () {
  let features, styleFunction;

  beforeEach(function () {
    features = [
      new Feature(new Point([0, 75])),
      new Feature(new Point([0, 50])),
      new Feature(new Point([0, 25])),
      new Feature(new Point([0, 0])),
    ];
    styleFunction = function () {
      return new Style({
        image: new Circle({
          radius: 5,
        }),
      });
    };
  });

  it('does not exceed the color range', function () {
    const imageData = createHitDetectionImageData(
      [2, 2],
      [create()],
      features,
      styleFunction,
      [0, 0, 0, 0],
      1,
      0
    );
    expect(Array.prototype.slice.call(imageData.data, 0, 3)).to.eql([
      255, 255, 252,
    ]);
  });
  it('detects hit at the correct position', function () {
    const context = createCanvasContext2D(3, 3);
    context.fillStyle = '#ffffff';
    context.fillRect(1, 1, 1, 1);
    const features = [new Feature()];
    const imageData = context.getImageData(0, 0, 3, 3);
    expect(hitDetect([2, 2], features, imageData)).to.have.length(1);
    expect(hitDetect([2, 3], features, imageData)).to.have.length(1);
    expect(hitDetect([3, 2], features, imageData)).to.have.length(1);
    expect(hitDetect([3, 3], features, imageData)).to.have.length(1);

    expect(hitDetect([1.5, 1.5], features, imageData)).to.have.length(1);
    expect(hitDetect([3.4, 3.4], features, imageData)).to.have.length(1);

    expect(hitDetect([1.4, 1], features, imageData)).to.have.length(0);
    expect(hitDetect([1, 2.4], features, imageData)).to.have.length(0);
    expect(hitDetect([2.4, 1], features, imageData)).to.have.length(0);

    expect(hitDetect([3.5, 4.5], features, imageData)).to.have.length(0);
    expect(hitDetect([5, 4], features, imageData)).to.have.length(0);
    expect(hitDetect([4.5, 5], features, imageData)).to.have.length(0);

    expect(hitDetect([1.4, 3.5], features, imageData)).to.have.length(0);
    expect(hitDetect([1, 4.5], features, imageData)).to.have.length(0);
    expect(hitDetect([1.5, 5], features, imageData)).to.have.length(0);
  });
  it('correctly detects hit for pixel exceeding canvas dimension', function () {
    const features = [new Feature()];
    const context = createCanvasContext2D(2, 2);
    context.fillStyle = '#ffffff';

    context.fillRect(1, 1, 1, 1);
    let imageData = context.getImageData(0, 0, 2, 2);
    expect(hitDetect([4, 2], features, imageData)).to.have.length(1);
    expect(hitDetect([2, 4], features, imageData)).to.have.length(1);

    expect(hitDetect([-2, 4], features, imageData)).to.have.length(0);
    expect(hitDetect([4, -2], features, imageData)).to.have.length(0);

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    context.fillRect(0, 0, 1, 1);
    imageData = context.getImageData(0, 0, 2, 2);
    expect(hitDetect([-2, 0], features, imageData)).to.have.length(1);
    expect(hitDetect([0, -2], features, imageData)).to.have.length(1);

    expect(hitDetect([-2, 4], features, imageData)).to.have.length(0);
    expect(hitDetect([4, -2], features, imageData)).to.have.length(0);
  });
  it('finds correct geometry when overlapping', function () {
    const bottomPoint = new Feature(new Point([90, 100]));
    const bottomLineString = new Feature(
      new LineString([
        [0, 140],
        [200, 140],
      ])
    );
    const bottomPolygon = new Feature(
      new Polygon([
        [
          [0, 0],
          [0, 200],
          [200, 200],
          [200, 0],
          [0, 0],
        ],
      ])
    );
    const geometryCollection = new Feature(
      new GeometryCollection([
        new Point([100, 100]),
        new LineString([
          [0, 160],
          [200, 160],
        ]),
        new Polygon([
          [
            [66, 0],
            [66, 200],
            [200, 200],
            [200, 0],
            [66, 0],
          ],
        ]),
      ])
    );
    const topPoint = new Feature(new Point([110, 100]));
    const topLineString = new Feature(
      new LineString([
        [0, 180],
        [200, 180],
      ])
    );
    const topPolygon = new Feature(
      new Polygon([
        [
          [133, 0],
          [133, 200],
          [200, 200],
          [200, 0],
          [133, 0],
        ],
      ])
    );

    features = [
      bottomPoint,
      bottomLineString,
      bottomPolygon,
      geometryCollection,
      topPoint,
      topLineString,
      topPolygon,
    ];

    styleFunction = function (feature) {
      const index = features.indexOf(feature);
      const color = [
        index & 4 ? 200 : 0,
        index & 2 ? 200 : 0,
        index & 1 ? 200 : 0,
      ];
      const geometry = feature.getGeometry();
      const geometries =
        geometry instanceof GeometryCollection
          ? geometry.getGeometriesArrayRecursive()
          : [geometry];
      return geometries.map(function (geometry) {
        const type = geometry.getType();
        return new Style({
          geometry: geometry,
          fill: new Fill({
            color: color,
          }),
          stroke:
            type === 'LineString'
              ? new Stroke({
                  color: color,
                  width: 150,
                })
              : undefined,
          image: new Circle({
            radius: 40,
            fill: new Fill({
              color: color,
            }),
          }),
        });
      });
    };

    const imageData = createHitDetectionImageData(
      [200, 200],
      [[0.5, 0, 0, -0.5, 0, 100]],
      features,
      styleFunction,
      [0, 0, 200, 200],
      1,
      0
    );

    expect(hitDetect([55, 100], features, imageData)[0]).to.be(bottomPoint);
    expect(hitDetect([65, 100], features, imageData)[0]).to.be(
      geometryCollection
    );
    expect(hitDetect([75, 100], features, imageData)[0]).to.be(topPoint);

    expect(hitDetect([33, 190], features, imageData)[0]).to.be(bottomPolygon);
    expect(hitDetect([100, 190], features, imageData)[0]).to.be(
      geometryCollection
    );
    expect(hitDetect([166, 190], features, imageData)[0]).to.be(topPolygon);

    expect(hitDetect([10, 130], features, imageData)[0]).to.be(
      bottomLineString
    );
    expect(hitDetect([10, 110], features, imageData)[0]).to.be(
      geometryCollection
    );
    expect(hitDetect([10, 90], features, imageData)[0]).to.be(topLineString);
  });
});
