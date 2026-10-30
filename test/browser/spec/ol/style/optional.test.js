import {assert} from 'chai';
import CircleStyle from '../../../../../src/ol/style/Circle.js';
import Icon from '../../../../../src/ol/style/Icon.js';
import ImageStyle from '../../../../../src/ol/style/Image.js';
import RegularShape from '../../../../../src/ol/style/RegularShape.js';
import Style from '../../../../../src/ol/style/Style.js';
import Text from '../../../../../src/ol/style/Text.js';

const factories = [
  [
    'ImageStyle',
    (optional) =>
      new ImageStyle({
        opacity: 1,
        rotation: 0,
        rotateWithView: false,
        scale: 1,
        displacement: [0, 0],
        optional,
      }),
  ],
  ['Icon', (optional) => new Icon({src: 'data:image/png;base64,', optional})],
  ['Circle', (optional) => new CircleStyle({radius: 5, optional})],
  [
    'RegularShape',
    (optional) => new RegularShape({points: 4, radius: 5, optional}),
  ],
  ['Text', (optional) => new Text({text: '39', optional})],
];

describe('symbol optional settings', function () {
  for (const [name, create] of factories) {
    describe(name, function () {
      for (const optional of [undefined, false, true]) {
        it(`preserves ${optional} in constructors and clones`, function () {
          const symbol = create(optional);
          assert.strictEqual(symbol.getOptional(), optional);
          assert.strictEqual(symbol.clone().getOptional(), optional);
        });
      }

      it('allows changing and resetting optional without changing a clone', function () {
        const symbol = create(false);
        const clone = symbol.clone();
        symbol.setOptional(true);
        assert.isTrue(symbol.getOptional());
        symbol.setOptional(undefined);
        assert.isUndefined(symbol.getOptional());
        assert.isFalse(clone.getOptional());
      });
    });
  }

  it('preserves both settings when cloning a parent Style', function () {
    const style = new Style({
      image: new CircleStyle({radius: 5, optional: false}),
      text: new Text({text: '39', optional: true}),
    });
    const clone = style.clone();
    assert.isFalse(clone.getImage().getOptional());
    assert.isTrue(clone.getText().getOptional());
    clone.getImage().setOptional(true);
    clone.getText().setOptional(false);
    assert.isFalse(style.getImage().getOptional());
    assert.isTrue(style.getText().getOptional());
  });
});
