import {assert} from 'chai';
import FullScreen from '../../../../../src/ol/control/FullScreen.js';

describe('ol.control.FullScreen', function () {
  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const instance = new FullScreen();
      assert.instanceOf(instance, FullScreen);
    });
  });

  describe('the fullscreen button', function () {
    describe('when inactiveClassName is not set', function () {
      it('is created with the default inactive classname set on the button', function () {
        const instance = new FullScreen();
        const button = instance.button_;
        assert.equal(button.className, 'ol-full-screen-false');
      });
    });
    describe('when inactiveClassName is set', function () {
      it('is created with the desired inactive classnames set on the button', function () {
        const instance = new FullScreen({
          inactiveClassName: 'foo bar',
        });
        const button = instance.button_;
        assert.equal(button.className, 'foo bar');
      });
    });
  });

  describe('the default label', function () {
    it('uses the U+26F6 expand glyph instead of the font-dependent U+2922', function () {
      const instance = new FullScreen();
      const label = instance.labelNode_;
      assert.instanceOf(label, Text);
      assert.equal(label.data, '\u26F6');
      assert.notEqual(label.data, '\u2922');
    });
  });

  describe('custom labels', function () {
    it('renders a string label as a text node', function () {
      const instance = new FullScreen({label: 'F'});
      assert.equal(instance.labelNode_.data, 'F');
    });

    it('accepts an HTMLElement label', function () {
      const span = document.createElement('span');
      span.textContent = 'custom';
      const instance = new FullScreen({label: span});
      assert.strictEqual(instance.labelNode_, span);
    });

    it('accepts an HTMLElement labelActive', function () {
      const span = document.createElement('span');
      span.textContent = 'close';
      const instance = new FullScreen({labelActive: span});
      assert.strictEqual(instance.labelActiveNode_, span);
    });
  });
});
