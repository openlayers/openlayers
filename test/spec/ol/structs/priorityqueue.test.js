import PriorityQueue, {DROP} from '../../../../src/ol/structs/PriorityQueue.js';


describe('ol.structs.PriorityQueue', () => {

  const identity = function(a) {
    return a;
  };

  describe('when empty', () => {

    let pq;
    beforeEach(() => {
      pq = new PriorityQueue(identity, identity);
    });

    test('is empty', () => {
      expect(pq.isEmpty()).toBe(true);
    });

    test('enqueue adds an element', () => {
      const added = pq.enqueue(0);
      expect(added).toBe(true);
      expect(pq.elements_).toEqual([0]);
      expect(pq.priorities_).toEqual([0]);
    });

    test('do not enqueue element with DROP priority', () => {
      const added = pq.enqueue(Infinity);
      expect(added).toBe(false);
      expect(pq.elements_).toEqual([]);
      expect(pq.priorities_).toEqual([]);
    });

  });

  describe('when populated', () => {

    let elements, pq;
    beforeEach(() => {
      elements = [];
      pq = new PriorityQueue(identity, identity);
      let element, i;
      for (i = 0; i < 32; ++i) {
        element = Math.random();
        pq.enqueue(element);
        elements.push(element);
      }
    });

    test('dequeues elements in the correct order', () => {
      elements.sort();
      let i;
      for (i = 0; i < elements.length; ++i) {
        expect(pq.dequeue()).toBe(elements[i]);
      }
      expect(pq.isEmpty()).toBe(true);
    });

  });

  describe('with an impure priority function', () => {

    let pq, target;
    beforeEach(() => {
      target = 0.5;
      pq = new PriorityQueue(function(element) {
        return Math.abs(element - target);
      }, identity);
      let i;
      for (i = 0; i < 32; ++i) {
        pq.enqueue(Math.random());
      }
    });

    test('dequeue elements in the correct order', () => {
      let lastDelta = 0;
      let delta;
      while (!pq.isEmpty()) {
        delta = Math.abs(pq.dequeue() - target);
        expect(lastDelta <= delta).toBe(true);
        lastDelta = delta;
      }
    });

    test('allows reprioritization', () => {
      const target = 0.5;
      pq.reprioritize();
      let lastDelta = 0;
      let delta;
      while (!pq.isEmpty()) {
        delta = Math.abs(pq.dequeue() - target);
        expect(lastDelta <= delta).toBe(true);
        lastDelta = delta;
      }
    });

    test('allows dropping during reprioritization', () => {
      const target = 0.5;
      let i = 0;
      pq.priorityFunction_ = function(element) {
        if (i++ % 2 === 0) {
          return Math.abs(element - target);
        } else {
          return DROP;
        }
      };
      pq.reprioritize();
      expect(pq.getCount()).toBe(16);
      let lastDelta = 0;
      let delta;
      while (!pq.isEmpty()) {
        delta = Math.abs(pq.dequeue() - target);
        expect(lastDelta <= delta).toBe(true);
        lastDelta = delta;
      }
    });

  });

  describe('tracks elements in the queue', () => {

    let pq;
    beforeEach(() => {
      pq = new PriorityQueue(identity, identity);
      pq.enqueue('a');
      pq.enqueue('b');
      pq.enqueue('c');
    });

    test('tracks which elements have been queued', () => {
      expect(pq.isQueued('a')).toBe(true);
      expect(pq.isQueued('b')).toBe(true);
      expect(pq.isQueued('c')).toBe(true);
    });

    test('tracks which elements have not been queued', () => {
      expect(pq.isQueued('d')).toBe(false);
    });

    test('raises an error when an queued element is re-queued', () => {
      expect(function() {
        pq.enqueue('a');
      }).toThrow();
    });

    test('tracks which elements have be dequeued', () => {
      expect(pq.isQueued('a')).toBe(true);
      expect(pq.isQueued('b')).toBe(true);
      expect(pq.isQueued('c')).toBe(true);
      expect(pq.dequeue()).toBe('a');
      expect(pq.isQueued('a')).toBe(false);
      expect(pq.isQueued('b')).toBe(true);
      expect(pq.isQueued('c')).toBe(true);
      expect(pq.dequeue()).toBe('b');
      expect(pq.isQueued('a')).toBe(false);
      expect(pq.isQueued('b')).toBe(false);
      expect(pq.isQueued('c')).toBe(true);
      expect(pq.dequeue()).toBe('c');
      expect(pq.isQueued('a')).toBe(false);
      expect(pq.isQueued('b')).toBe(false);
      expect(pq.isQueued('c')).toBe(false);
    });

  });

});
