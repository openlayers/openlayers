import {newEvaluationContext} from '../../../../../../src/ol/expr/cpu.js';
import {newParsingContext} from '../../../../../../src/ol/expr/expression.js';
import {
  buildRuleSet,
  buildStyle,
} from '../../../../../../src/ol/render/canvas/style.js';
import Fill from '../../../../../../src/ol/style/Fill.js';
import Icon from '../../../../../../src/ol/style/Icon.js';
import Image from '../../../../../../src/ol/style/Image.js';
import Stroke from '../../../../../../src/ol/style/Stroke.js';
import Style from '../../../../../../src/ol/style/Style.js';

/**
 * @param {Style} style The style to test.
 * @param {Style} expected The expected style.
 */
function expectStyleEquals(style, expected) {
  expect(style).to.be.a(Style);

  const gotFill = style.getFill();
  const expectedFill = expected.getFill();
  if (expectedFill) {
    expectFillEquals(gotFill, expectedFill);
  } else {
    expect(gotFill).to.be(null);
  }

  const gotStroke = style.getStroke();
  const expectedStroke = expected.getStroke();
  if (expectedStroke) {
    expectStrokeEquals(gotStroke, expectedStroke);
  } else {
    expect(gotStroke).to.be(null);
  }

  const gotImage = style.getImage();
  const expectedImage = expected.getImage();
  if (expectedImage) {
    expectImageEquals(gotImage, expectedImage);
  } else {
    expect(gotImage).to.be(null);
  }
}

/**
 * @param {Fill} fill The fill to test.
 * @param {Fill} expected The expected fill.
 */
function expectFillEquals(fill, expected) {
  expect(fill).to.be.a(Fill);

  const expectedColor = expected.getColor();
  expect(fill.getColor()).to.eql(expectedColor);
}

/**
 * @param {Stroke} stroke The stroke to test.
 * @param {Stroke} expected The expected stroke.
 */
function expectStrokeEquals(stroke, expected) {
  expect(stroke).to.be.a(Stroke);

  const expectedColor = expected.getColor();
  expect(stroke.getColor()).to.eql(expectedColor);

  const expectedWidth = expected.getWidth();
  expect(stroke.getWidth()).to.eql(expectedWidth);
}

/**
 * @param {Image} image The image symbolizer to test.
 * @param {Image} expected The expected image symbolizer.
 */
function expectImageEquals(image, expected) {
  expect(image).to.be.a(Image);

  const expectedScale = expected.getScale();
  expect(image.getScale()).to.eql(expectedScale);

  if (expected instanceof Icon) {
    if (!(image instanceof Icon)) {
      throw new Error('Expected image to be an Icon');
    }
    const expectedSrc = expected.getSrc();
    expect(image.getSrc()).to.eql(expectedSrc);
    return;
  }

  throw new Error(
    `Comparison not implemented for ${expected.constructor.name}`,
  );
}

describe('ol/render/canvas/style.js', () => {
  describe('buildRuleSet()', () => {
    const cases = [
      {
        name: 'one rule, no filter',
        rules: [
          {
            style: {'fill-color': 'blue'},
          },
        ],
        expected: [
          new Style({
            fill: new Fill({
              color: [0, 0, 255, 1],
            }),
          }),
        ],
      },
      {
        name: 'several rules, one applies',
        rules: [
          {
            filter: ['get', 'no'],
            style: {'fill-color': 'red'},
          },
          {
            filter: ['get', 'yes'],
            style: {'fill-color': 'green'},
          },
          {
            filter: ['get', 'no'],
            style: {'fill-color': 'red'},
          },
        ],
        context: {
          properties: {
            yes: true,
            no: false,
          },
          variables: {},
        },
        expected: [
          new Style({
            fill: new Fill({
              color: [0, 128, 0, 1],
            }),
          }),
        ],
      },
      {
        name: 'several rules, two apply',
        rules: [
          {
            filter: ['get', 'yes'],
            style: {'fill-color': 'green'},
          },
          {
            filter: ['get', 'no'],
            style: {'fill-color': 'red'},
          },
          {
            filter: ['get', 'yes'],
            style: {'stroke-color': 'green', 'stroke-width': 5},
          },
        ],
        context: {
          properties: {
            yes: true,
            no: false,
          },
          variables: {},
        },
        expected: [
          new Style({
            fill: new Fill({
              color: [0, 128, 0, 1],
            }),
          }),
          new Style({
            stroke: new Stroke({
              color: [0, 128, 0, 1],
              width: 5,
            }),
          }),
        ],
      },
    ];

    for (const c of cases) {
      it(c.name, () => {
        const evaluator = buildRuleSet(c.rules, newParsingContext());

        const context = c.context || newEvaluationContext();
        const styles = evaluator(context);
        expect(styles).to.have.length(c.expected.length);
        for (let i = 0; i < styles.length; ++i) {
          try {
            expectStyleEquals(styles[i], c.expected[i]);
          } catch (err) {
            err.message += ` (style ${i})`;
            throw err;
          }
        }
      });
    }
  });

  describe('buildStyle()', () => {
    const cases = [
      {
        name: 'simple fill style',
        style: {
          'fill-color': 'blue',
        },
        expected: new Style({
          fill: new Fill({
            color: [0, 0, 255, 1],
          }),
        }),
      },
      {
        name: '"none" fill',
        style: {
          'fill-color': 'none',
          'stroke-width': 1,
        },
        expected: new Style({stroke: new Stroke({width: 1})}),
      },
      {
        name: 'simple stroke style',
        style: {
          'stroke-color': 'red',
          'stroke-width': 5,
        },
        expected: new Style({
          stroke: new Stroke({
            color: [255, 0, 0, 1],
            width: 5,
          }),
        }),
      },
      {
        name: 'scaled icon (number)',
        style: {
          'icon-src': 'icon.svg',
          'icon-scale': 2,
        },
        expected: new Style({
          image: new Icon({
            src: 'icon.svg',
            scale: 2,
          }),
        }),
      },
      {
        name: 'scaled icon (array)',
        style: {
          'icon-src': 'icon.svg',
          'icon-scale': [2, 3],
        },
        expected: new Style({
          image: new Icon({
            src: 'icon.svg',
            scale: [2, 3],
          }),
        }),
      },
      {
        name: 'scaled icon (string)',
        style: {
          'icon-src': 'icon.svg',
          'icon-scale': 'oops',
        },
        error: 'got a string, but expected number or number[]',
      },
      {
        name: 'get and var expressions',
        style: {
          'fill-color': ['get', 'color'],
          'stroke-color': 'red',
          'stroke-width': ['var', 'width'],
        },
        context: {
          properties: {
            color: 'blue',
          },
          variables: {
            width: 5,
          },
        },
        expected: new Style({
          fill: new Fill({
            color: 'blue',
          }),
          stroke: new Stroke({
            color: [255, 0, 0, 1],
            width: 5,
          }),
        }),
      },
      {
        name: 'Text style',
        style: {
          'text-value': 'test',
          'text-keep-upright': false,
        },
        expected: new Style({
          text: new Text({
            text: 'test',
            keepTextUpright: false,
          }),
        }),
      },
      {
        name: 'missing circle-radius',
        style: {
          'circle-stroke-color': 'red',
          'circle-size': 10,
        },
        error: 'No fill, stroke, point, or text symbolizer properties in style',
      },
      {
        name: 'missing fill-color or stroke-color',
        style: {
          'fill': 'red',
          'stroke': 'white',
        },
        error: 'No fill, stroke, point, or text symbolizer properties in style',
      },
    ];

    for (const c of cases) {
      it(c.name, () => {
        let error, evaluator;
        try {
          evaluator = buildStyle(c.style, newParsingContext());
        } catch (err) {
          error = err;
        }

        if (c.error) {
          expect(error).to.be.an(Error);
          expect(error.message).to.contain(c.error);
          return;
        }
        if (error) {
          throw error;
        }

        const context = c.context || newEvaluationContext();
        expectStyleEquals(evaluator(context), c.expected);
      });
    }
  });
});
