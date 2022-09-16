import BaseEvent from '../../../../src/ol/events/Event.js';
import Layer from '../../../../src/ol/layer/Layer.js';
import Source from '../../../../src/ol/source/Source.js';
import expect from '../../expect.js';

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('ol/layer/Layer.js', () => {
  describe('sourceready event', () => {
    it('is dispatched when the source is ready', (done) => {
      const source = new Source({state: 'loading'});
      const layer = new Layer({source: source});

      function handler(event) {
        expect(event).to.be.a(BaseEvent);
        expect(event.target).to.be(layer);
        done();
      }
      layer.on('sourceready', handler);

      source.setState('ready');
    });

    it('is dispatched even if the source is ready at construction', (done) => {
      const source = new Source({});
      const layer = new Layer({source: source});

      function handler(event) {
        expect(event).to.be.a(BaseEvent);
        expect(event.target).to.be(layer);
        done();
      }
      layer.on('sourceready', handler);
    });

    it('is not dispatched twice', async () => {
      const source = new Source({state: 'loading'});
      const layer = new Layer({source: source});

      let calls = 0;
      function handler(event) {
        calls += 1;
      }
      layer.on('sourceready', handler);

      layer.changed();
      await delay(5);

      source.setState('ready');
      await delay(5);

      source.changed();
      await delay(5);

      expect(calls).to.be(1);
    });

    it('is not dispatched after source is removed', async () => {
      const source = new Source({state: 'loading'});
      const layer = new Layer({source: source});

      let calls = 0;
      function handler(event) {
        calls += 1;
      }
      layer.on('sourceready', handler);

      layer.setSource(null);
      source.setState('ready');
      await delay(5);

      expect(calls).to.be(0);
    });

    it('is dispatched if source is added later', async () => {
      const layer = new Layer({});

      let calls = 0;
      function handler(event) {
        calls += 1;
      }
      layer.on('sourceready', handler);

      const source = new Source({state: 'ready'});
      layer.setSource(source);
      await delay(5);

      expect(calls).to.be(1);
    });

    it('is dispatched if new source is set', async () => {
      const layer = new Layer({source: new Source({})});

      let calls = 0;
      function handler(event) {
        calls += 1;
      }
      layer.on('sourceready', handler);

      await delay(5);
      expect(calls).to.be(1);

      const source = new Source({state: 'ready'});
      layer.setSource(source);
      await delay(5);

      expect(calls).to.be(2);
    });
  });
});
