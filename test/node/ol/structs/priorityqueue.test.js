import {assert} from 'chai';
import PriorityQueue, {DROP} from '../../../../src/ol/structs/PriorityQueue.js';

describe('ol/structs/PriorityQueue.js', function () {
  const identity = function (a) {
    return a;
  };

  describe('when empty', function () {
    let pq;
    beforeEach(function () {
      pq = new PriorityQueue(identity, identity);
    });

    it('is empty', function () {
      assert.strictEqual(pq.isEmpty(), true);
    });

    it('enqueue adds an element', function () {
      const added = pq.enqueue(0);
      assert.strictEqual(added, true);
      assert.deepEqual(pq.elements_, [0]);
      assert.deepEqual(pq.priorities_, [0]);
    });

    it('do not enqueue element with DROP priority', function () {
      const added = pq.enqueue(Infinity);
      assert.strictEqual(added, false);
      assert.deepEqual(pq.elements_, []);
      assert.deepEqual(pq.priorities_, []);
    });
  });

  describe('when populated', function () {
    let elements, pq;
    beforeEach(function () {
      elements = [];
      pq = new PriorityQueue(identity, identity);
      let element, i;
      for (i = 0; i < 32; ++i) {
        element = Math.random();
        pq.enqueue(element);
        elements.push(element);
      }
    });

    it('dequeues elements in the correct order', function () {
      elements.sort();
      let i;
      for (i = 0; i < elements.length; ++i) {
        assert.strictEqual(pq.dequeue(), elements[i]);
      }
      assert.strictEqual(pq.isEmpty(), true);
    });
  });

  describe('with an impure priority function', function () {
    let pq, target;
    beforeEach(function () {
      target = 0.5;
      pq = new PriorityQueue(function (element) {
        return Math.abs(element - target);
      }, identity);
      let i;
      for (i = 0; i < 32; ++i) {
        pq.enqueue(Math.random());
      }
    });

    it('dequeue elements in the correct order', function () {
      let lastDelta = 0;
      let delta;
      while (!pq.isEmpty()) {
        delta = Math.abs(pq.dequeue() - target);
        assert.strictEqual(lastDelta <= delta, true);
        lastDelta = delta;
      }
    });

    it('allows reprioritization', function () {
      const target = 0.5;
      pq.reprioritize();
      let lastDelta = 0;
      let delta;
      while (!pq.isEmpty()) {
        delta = Math.abs(pq.dequeue() - target);
        assert.strictEqual(lastDelta <= delta, true);
        lastDelta = delta;
      }
    });

    it('allows dropping during reprioritization', function () {
      const target = 0.5;
      let i = 0;
      pq.priorityFunction_ = function (element) {
        if (i++ % 2 === 0) {
          return Math.abs(element - target);
        }
        return DROP;
      };
      pq.reprioritize();
      assert.strictEqual(pq.getCount(), 16);
      let lastDelta = 0;
      let delta;
      while (!pq.isEmpty()) {
        delta = Math.abs(pq.dequeue() - target);
        assert.strictEqual(lastDelta <= delta, true);
        lastDelta = delta;
      }
    });
  });

  describe('tracks elements in the queue', function () {
    let pq;
    beforeEach(function () {
      pq = new PriorityQueue(identity, identity);
      pq.enqueue('a');
      pq.enqueue('b');
      pq.enqueue('c');
    });

    it('tracks which elements have been queued', function () {
      assert.strictEqual(pq.isQueued('a'), true);
      assert.strictEqual(pq.isQueued('b'), true);
      assert.strictEqual(pq.isQueued('c'), true);
    });

    it('tracks which elements have not been queued', function () {
      assert.strictEqual(pq.isQueued('d'), false);
    });

    it('raises an error when an queued element is re-queued', function () {
      assert.throws(function () {
        pq.enqueue('a');
      });
    });

    it('tracks which elements have be dequeued', function () {
      assert.strictEqual(pq.isQueued('a'), true);
      assert.strictEqual(pq.isQueued('b'), true);
      assert.strictEqual(pq.isQueued('c'), true);
      assert.strictEqual(pq.dequeue(), 'a');
      assert.strictEqual(pq.isQueued('a'), false);
      assert.strictEqual(pq.isQueued('b'), true);
      assert.strictEqual(pq.isQueued('c'), true);
      assert.strictEqual(pq.dequeue(), 'b');
      assert.strictEqual(pq.isQueued('a'), false);
      assert.strictEqual(pq.isQueued('b'), false);
      assert.strictEqual(pq.isQueued('c'), true);
      assert.strictEqual(pq.dequeue(), 'c');
      assert.strictEqual(pq.isQueued('a'), false);
      assert.strictEqual(pq.isQueued('b'), false);
      assert.strictEqual(pq.isQueued('c'), false);
    });
  });
});
