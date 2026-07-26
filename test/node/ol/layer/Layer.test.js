import {assert} from 'chai';
import BaseEvent from '../../../../src/ol/events/Event.js';
import Layer from '../../../../src/ol/layer/Layer.js';
import Source from '../../../../src/ol/source/Source.js';

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('ol/layer/Layer.js', () => {
  describe('sourceready event', () => {
    it('is dispatched when the source is ready', async () => {
      const source = new Source({state: 'loading'});
      const layer = new Layer({source: source});

      const event = await new Promise((resolve) => {
        layer.on('sourceready', resolve);
        source.setState('ready');
      });
      assert.instanceOf(event, BaseEvent);
      assert.strictEqual(event.target, layer);
    });

    it('is dispatched even if the source is ready at construction', async () => {
      const source = new Source({});
      const layer = new Layer({source: source});

      const event = await new Promise((resolve) => {
        layer.on('sourceready', resolve);
      });
      assert.instanceOf(event, BaseEvent);
      assert.strictEqual(event.target, layer);
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

      assert.strictEqual(calls, 1);
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

      assert.strictEqual(calls, 0);
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

      assert.strictEqual(calls, 1);
    });

    it('is dispatched if new source is set', async () => {
      const layer = new Layer({source: new Source({})});

      let calls = 0;
      function handler(event) {
        calls += 1;
      }
      layer.on('sourceready', handler);

      await delay(5);
      assert.strictEqual(calls, 1);

      const source = new Source({state: 'ready'});
      layer.setSource(source);
      await delay(5);

      assert.strictEqual(calls, 2);
    });
  });
});
