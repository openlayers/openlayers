import {newEvaluationContext} from '../../../../../../src/ol/expr/cpu.js';
import {newParsingContext} from '../../../../../../src/ol/expr/expression.js';
import {
  buildRuleSet,
  buildStyle,
} from '../../../../../../src/ol/render/canvas/style.js';
import Fill from '../../../../../../src/ol/style/Fill.js';
import Icon from '../../../../../../src/ol/style/Icon.js';
import Image from '../../../../../../src/ol/style/Image.js';
import RegularShape from '../../../../../../src/ol/style/RegularShape.js';
import Stroke from '../../../../../../src/ol/style/Stroke.js';
import Style from '../../../../../../src/ol/style/Style.js';
import Text from '../../../../../../src/ol/style/Text.js';

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

  const gotText = style.getText();
  const expectedText = expected.getText();
  if (expectedText) {
    expectTextEquals(gotText, expectedText);
  } else {
    expect(gotText).to.be(null);
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

  const expectedLineCap = expected.getLineCap();
  expect(stroke.getLineCap()).to.eql(expectedLineCap);

  const expectedLineJoin = expected.getLineJoin();
  expect(stroke.getLineJoin()).to.eql(expectedLineJoin);

  const expectedMiterLimit = expected.getMiterLimit();
  expect(stroke.getMiterLimit()).to.eql(expectedMiterLimit);

  const expectedLineDash = expected.getLineDash();
  expect(stroke.getLineDash()).to.eql(expectedLineDash);

  const expectedLineDashOffset = expected.getLineDashOffset();
  expect(stroke.getLineDashOffset()).to.eql(expectedLineDashOffset);
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
  if (expected instanceof RegularShape) {
    if (!(image instanceof RegularShape)) {
      throw new Error('Expected image to be a RegularShape');
    }
    expect(image.getPoints()).to.eql(expected.getPoints());
    expect(image.getRadius()).to.eql(expected.getRadius());
    expect(image.getRadius2()).to.eql(expected.getRadius2());
    expect(image.getAngle()).to.eql(expected.getAngle());
    expect(image.getRotateWithView()).to.eql(expected.getRotateWithView());
    expect(image.getScale()).to.eql(expected.getScale());
    expect(image.getDisplacement()).to.eql(expected.getDisplacement());
    const expectedFill = expected.getFill();
    if (expectedFill) {
      expectFillEquals(image.getFill(), expectedFill);
    } else {
      expect(image.getFill()).to.be(null);
    }
    const expectedStroke = expected.getStroke();
    if (expectedStroke) {
      expectStrokeEquals(image.getStroke(), expectedStroke);
    } else {
      expect(image.getStroke()).to.be(null);
    }
    return;
  }

  throw new Error(
    `Comparison not implemented for ${expected.constructor.name}`,
  );
}

/**
 * @param {Text} text The text symbolizer to test.
 * @param {Text} expected The expected text symbolizer.
 */
function expectTextEquals(text, expected) {
  expect(text).to.be.a(Text);

  expect(text.getText()).to.eql(expected.getText());
  expect(text.getScale()).to.eql(expected.getScale());
  expect(text.getRotation()).to.eql(expected.getRotation());
  expect(text.getRotateWithView()).to.eql(expected.getRotateWithView());
  expect(text.getOffsetX()).to.eql(expected.getOffsetX());
  expect(text.getOffsetY()).to.eql(expected.getOffsetY());
  expect(text.getPadding()).to.eql(expected.getPadding());
  expect(text.getKeepUpright()).to.eql(expected.getKeepUpright());
  expect(text.getTextAlign()).to.eql(expected.getTextAlign());
  expect(text.getJustify()).to.eql(expected.getJustify());
  expect(text.getTextBaseline()).to.eql(expected.getTextBaseline());

  const expectedFill = expected.getFill();
  if (expectedFill) {
    expectFillEquals(text.getFill(), expectedFill);
  } else {
    expect(text.getFill()).to.be(null);
  }

  const expectedStroke = expected.getStroke();
  if (expectedStroke) {
    expectStrokeEquals(text.getStroke(), expectedStroke);
  } else {
    expect(text.getStroke()).to.be(null);
  }
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
            keepUpright: false,
          }),
        }),
      },
      {
        name: 'dynamic stroke-color',
        style: {
          'stroke-color': ['get', 'color'],
          'stroke-width': 2,
        },
        context: {
          properties: {
            color: [1, 2, 3, 0.5],
          },
        },
        expected: new Style({
          stroke: new Stroke({
            color: [1, 2, 3, 0.5],
            width: 2,
          }),
        }),
      },
      {
        name: 'dynamic stroke-width',
        style: {
          'stroke-color': [0, 0, 0, 1],
          'stroke-width': ['*', ['var', 'width'], 4],
        },
        context: {
          variables: {
            width: 1.5,
          },
        },
        expected: new Style({
          stroke: new Stroke({
            color: [0, 0, 0, 1],
            width: 6,
          }),
        }),
      },
      {
        name: 'dynamic stroke-line-join',
        style: {
          'stroke-color': [0, 0, 0, 1],
          'stroke-width': 2,
          'stroke-line-join': ['var', 'joinType'],
        },
        context: {
          variables: {
            joinType: 'bevel',
          },
        },
        expected: new Style({
          stroke: new Stroke({
            color: [0, 0, 0, 1],
            width: 2,
            lineJoin: 'bevel',
          }),
        }),
      },
      {
        name: 'dynamic stroke-line-cap',
        style: {
          'stroke-color': [0, 0, 0, 1],
          'stroke-width': 2,
          'stroke-line-cap': ['var', 'capType'],
        },
        context: {
          variables: {
            capType: 'square',
          },
        },
        expected: new Style({
          stroke: new Stroke({
            color: [0, 0, 0, 1],
            width: 2,
            lineCap: 'square',
          }),
        }),
      },
      {
        name: 'dynamic stroke-miter-limit',
        style: {
          'stroke-color': [0, 0, 0, 1],
          'stroke-width': 2,
          'stroke-miter-limit': ['+', ['get', 'limit'], 2],
        },
        context: {
          properties: {
            limit: 4,
          },
        },
        expected: new Style({
          stroke: new Stroke({
            color: [0, 0, 0, 1],
            width: 2,
            miterLimit: 6,
          }),
        }),
      },
      {
        name: 'dynamic stroke-line-dash',
        style: {
          'stroke-color': [0, 0, 0, 1],
          'stroke-width': 2,
          'stroke-line-dash': [
            ['*', ['var', 'factor'], 2],
            10,
            ['+', ['get', 'extra'], 1],
          ],
        },
        context: {
          properties: {
            extra: 4,
          },
          variables: {
            factor: 3,
          },
        },
        expected: new Style({
          stroke: new Stroke({
            color: [0, 0, 0, 1],
            width: 2,
            lineDash: [6, 10, 5],
          }),
        }),
      },
      {
        name: 'dynamic stroke-line-dash-offset',
        style: {
          'stroke-color': [0, 0, 0, 1],
          'stroke-width': 2,
          'stroke-line-dash': [1, 2],
          'stroke-line-dash-offset': ['+', ['get', 'offset'], 0.5],
        },
        context: {
          properties: {
            offset: 1.5,
          },
        },
        expected: new Style({
          stroke: new Stroke({
            color: [0, 0, 0, 1],
            width: 2,
            lineDash: [1, 2],
            lineDashOffset: 2,
          }),
        }),
      },
      {
        name: 'stroke-line-dash undefined value',
        style: {
          'stroke-color': 'black',
          'stroke-width': 2,
          'stroke-line-dash': undefined,
        },
        expected: new Style({
          stroke: new Stroke({
            color: [0, 0, 0, 1],
            width: 2,
          }),
        }),
      },
      {
        name: 'stroke-width undefined value',
        style: {
          'stroke-color': 'black',
          'stroke-width': undefined,
        },
        expected: new Style({
          stroke: new Stroke({
            color: [0, 0, 0, 1],
          }),
        }),
      },
      {
        name: 'stroke-line-cap undefined value',
        style: {
          'stroke-color': 'black',
          'stroke-width': 3,
          'stroke-line-cap': undefined,
        },
        expected: new Style({
          stroke: new Stroke({
            color: [0, 0, 0, 1],
            width: 3,
          }),
        }),
      },
      {
        name: 'text-keep-upright undefined value',
        style: {
          'text-value': 'test',
          'text-keep-upright': undefined,
        },
        expected: new Style({
          text: new Text({
            text: 'test',
          }),
        }),
      },
      {
        name: 'text-padding undefined value',
        style: {
          'text-value': 'test',
          'text-padding': undefined,
        },
        expected: new Style({
          text: new Text({
            text: 'test',
          }),
        }),
      },
      {
        name: 'shape-rotate-with-view undefined value',
        style: {
          'shape-points': 3,
          'shape-radius': 4,
          'shape-rotate-with-view': undefined,
        },
        expected: new Style({
          image: new RegularShape({
            points: 3,
            radius: 4,
          }),
        }),
      },
      {
        name: 'shape-displacement undefined value',
        style: {
          'shape-points': 3,
          'shape-radius': 4,
          'shape-displacement': undefined,
        },
        expected: new Style({
          image: new RegularShape({
            points: 3,
            radius: 4,
            displacement: [0, 0],
          }),
        }),
      },
      {
        name: 'icon-scale undefined value',
        style: {
          'icon-src': 'icon.svg',
          'icon-scale': undefined,
        },
        expected: new Style({
          image: new Icon({
            src: 'icon.svg',
            scale: 1,
          }),
        }),
      },
      {
        name: 'dynamic shape-radius',
        style: {
          'shape-points': 4,
          'shape-radius': ['*', ['get', 'size'], 2],
          'shape-fill-color': 'red',
        },
        context: {
          properties: {
            size: 3,
          },
        },
        expected: new Style({
          image: new RegularShape({
            points: 4,
            radius: 6,
            fill: new Fill({
              color: [255, 0, 0, 1],
            }),
          }),
        }),
      },
      {
        name: 'dynamic shape-radius2',
        style: {
          'shape-points': 5,
          'shape-radius': 6,
          'shape-radius2': ['get', 'ratio'],
          'shape-stroke-color': 'blue',
          'shape-stroke-width': 2,
        },
        context: {
          properties: {
            ratio: 4,
          },
        },
        expected: new Style({
          image: new RegularShape({
            points: 5,
            radius: 6,
            radius2: 4,
            stroke: new Stroke({
              color: [0, 0, 255, 1],
              width: 2,
            }),
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
