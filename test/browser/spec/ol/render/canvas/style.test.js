import Fill from '../../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../../src/ol/style/Stroke.js';
import Style from '../../../../../../src/ol/style/Style.js';
import {
  buildRuleSet,
  buildStyle,
} from '../../../../../../src/ol/render/canvas/style.js';
import {newEvaluationContext} from '../../../../../../src/ol/expr/cpu.js';
import {newParsingContext} from '../../../../../../src/ol/expr/expression.js';

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
              color: 'blue',
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
              color: 'green',
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
              color: 'green',
            }),
          }),
          new Style({
            stroke: new Stroke({
              color: 'green',
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
            color: 'blue',
          }),
        }),
      },
      {
        name: 'simple stroke style',
        style: {
          'stroke-color': 'red',
          'stroke-width': 5,
        },
        expected: new Style({
          stroke: new Stroke({
            color: 'red',
            width: 5,
          }),
        }),
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
            color: 'red',
            width: 5,
          }),
        }),
      },
    ];

    for (const c of cases) {
      it(c.name, () => {
        const evaluator = buildStyle(c.style, newParsingContext());

        const context = c.context || newEvaluationContext();
        expectStyleEquals(evaluator(context), c.expected);
      });
    }
  });
});
