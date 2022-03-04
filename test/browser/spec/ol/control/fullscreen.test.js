import FullScreen from '../../../../../src/ol/control/FullScreen.js';

describe('ol.control.FullScreen', function () {
  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const instance = new FullScreen();
      expect(instance).to.be.an(FullScreen);
    });
  });

  describe('the fullscreen button', function () {
    describe('when inactiveClassName is not set', function () {
      it('is created with the default inactive classname set on the button', function () {
        const instance = new FullScreen();
        const button = instance.button_;
        expect(button.className).to.equal('ol-full-screen-false');
      });
    });
    describe('when inactiveClassName is set', function () {
      it('is created with the desired inactive classnames set on the button', function () {
        const instance = new FullScreen({
          inactiveClassName: 'foo bar',
        });
        const button = instance.button_;
        expect(button.className).to.equal('foo bar');
      });
    });
  });
});
