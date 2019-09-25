import LinkedList from '../../../../src/ol/structs/LinkedList.js';

describe('ol.structs.LinkedList', () => {
  let ll;
  const item = {};
  const item2 = {};
  beforeEach(() => {
    ll = new LinkedList();
  });

  test('defaults to circular', () => {
    expect(ll.circular_).toBe(true);
  });

  test('creates an empty list', () => {
    expect(ll.length_).toBe(0);
    expect(ll.first_).toBe(undefined);
    expect(ll.last_).toBe(undefined);
    expect(ll.head_).toBe(undefined);
  });

  describe('#insertItem', () => {
    beforeEach(() => {
      ll.insertItem(item);
    });

    test('inserts an item into the list', () => {
      expect(ll.length_).toBe(1);
    });

    test('sets the cursor to the inserted item', () => {
      expect(ll.head_.data).toBe(item);
    });

    test('links the previous item to the new one', () => {
      ll.insertItem(item2);
      expect(ll.head_.prev.data).toBe(item);
      expect(ll.head_.prev.next.data).toBe(item2);
    });
  });

  describe('#removeItem', () => {
    const item3 = {};
    beforeEach(() => {
      ll.insertItem(item);
      ll.insertItem(item2);
      ll.insertItem(item3);
    });

    test('removes the current item', () => {
      ll.removeItem();
      expect(ll.length_).toBe(2);
      expect(ll.head_.data).not.toBe(item3);
    });

    test('sets the cursor to the next item if possible', () => {
      ll.removeItem();
      expect(ll.head_.data).toBe(item);
    });

    test('otherwise sets the cursor to the previous item', () => {
      ll = new LinkedList(false);
      ll.insertItem(item);
      ll.insertItem(item2);
      ll.insertItem(item3);
      ll.removeItem();
      expect(ll.head_.data).toBe(item2);
    });

    test('empties a list with only one item', () => {
      ll = new LinkedList();
      ll.insertItem(item);
      ll.removeItem();
      expect(ll.length_).toBe(0);
      expect(ll.head_).toBe(undefined);
      expect(ll.first_).toBe(undefined);
      expect(ll.last_).toBe(undefined);
    });
  });

  describe('#firstItem', () => {
    test('sets the cursor to the first item and returns its data', () => {
      ll.insertItem(item);
      ll.insertItem(item2);
      const i = ll.firstItem();
      expect(i).toBe(item);
      expect(ll.head_.data).toBe(item);
    });

    test('returns undefined on empty list', () => {
      const i = ll.firstItem();
      expect(i).toBe(undefined);
    });
  });

  describe('#lastItem', () => {
    test('sets the cursor to the last item and returns its data', () => {
      ll.insertItem(item);
      ll.insertItem(item2);
      ll.firstItem();
      const i = ll.lastItem();
      expect(i).toBe(item2);
      expect(ll.head_.data).toBe(item2);
    });

    test('returns undefined on empty list', () => {
      const i = ll.lastItem();
      expect(i).toBe(undefined);
    });
  });

  describe('#nextItem', () => {
    test('sets the cursor to the next item and returns its data', () => {
      ll.insertItem(item);
      ll.insertItem(item2);
      ll.firstItem();
      const i = ll.nextItem();
      expect(i).toBe(item2);
      expect(ll.head_.data).toBe(item2);
    });

    test('returns undefined on empty list', () => {
      const i = ll.nextItem();
      expect(i).toBe(undefined);
    });
  });

  describe('#prevItem', () => {
    test('sets the cursor to the previous item and returns its data', () => {
      ll.insertItem(item);
      ll.insertItem(item2);
      const i = ll.prevItem();
      expect(i).toBe(item);
      expect(ll.head_.data).toBe(item);
    });

    test('returns undefined on empty list', () => {
      const i = ll.prevItem();
      expect(i).toBe(undefined);
    });
  });

  describe('#getNextItem', () => {
    test(
      'returns the data of the next item without stepping the cursor',
      () => {
        ll.insertItem(item);
        ll.insertItem(item2);
        ll.firstItem();
        const i = ll.getNextItem();
        expect(i).toBe(item2);
        expect(ll.head_.data).toBe(item);
      }
    );

    test('returns undefined on empty list', () => {
      const i = ll.getNextItem();
      expect(i).toBe(undefined);
    });
  });

  describe('#getPrevItem', () => {
    test(
      'returns the data of the previous item without stepping the cursor',
      () => {
        ll.insertItem(item);
        ll.insertItem(item2);
        const i = ll.getPrevItem();
        expect(i).toBe(item);
        expect(ll.head_.data).toBe(item2);
      }
    );

    test('returns undefined on empty list', () => {
      const i = ll.getPrevItem();
      expect(i).toBe(undefined);
    });
  });

  describe('#getCurrItem', () => {
    test('returns the data of the current item', () => {
      const item3 = {};
      ll.insertItem(item);
      ll.insertItem(item2);
      ll.insertItem(item3);
      ll.prevItem();
      const i = ll.getCurrItem();
      expect(i).toBe(item2);
      expect(ll.head_.data).toBe(item2);
    });

    test('returns undefined on empty list', () => {
      const i = ll.getCurrItem();
      expect(i).toBe(undefined);
    });
  });

  describe('#getLength', () => {
    test('returns the length of the list', () => {
      ll.insertItem(item);
      ll.insertItem(item2);
      const l = ll.getLength();
      expect(l).toBe(2);
    });
  });

  describe('#concat', () => {
    let ll2, item3;
    beforeEach(() => {
      item3 = {};
      ll2 = new LinkedList();
      ll2.insertItem(item);
      ll2.insertItem(item2);
      ll2.insertItem(item3);
    });

    test('concatenates a second list with the current one', () => {
      const item4 = {};
      const item5 = {};
      const item6 = {};
      ll.insertItem(item4);
      ll.insertItem(item5);
      ll.insertItem(item6);
      ll.prevItem();
      ll.concat(ll2);
      expect(ll.length_).toBe(6);
      expect(ll.head_.data).toBe(item5);
      expect(ll.head_.next.data).toBe(item);
      expect(ll.head_.next.next.next.next.data).toBe(item6);
    });

    test('receives the second list if the current one is empty', () => {
      ll.concat(ll2);
      expect(ll.length_).toBe(3);
      expect(ll.first_.data).toBe(item);
      expect(ll.last_.data).toBe(item3);
      expect(ll.head_.data).toBe(item3);
    });

    test('destroys the second list', () => {
      ll.concat(ll2);
      expect(ll2.length_).toBe(0);
      expect(ll2.first_).toBe(undefined);
      expect(ll2.last_).toBe(undefined);
      expect(ll2.head_).toBe(undefined);
    });
  });

  describe('when circular', () => {
    beforeEach(() => {
      ll = new LinkedList();
      ll.insertItem(item);
    });

    describe('#insertItem', () => {
      test('initializes the list in a circular way', () => {
        expect(ll.head_.prev.data).toBe(item);
        expect(ll.head_.next.data).toBe(item);
      });
    });

    describe('#setFirstItem', () => {
      test('resets the first item to the current one', () => {
        ll.insertItem(item2);
        ll.setFirstItem();
        expect(ll.first_.data).toBe(item2);
        expect(ll.last_.data).toBe(item);
      });
    });
  });
});
