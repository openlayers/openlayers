(function () {
  'use strict';
  /* global info, jugl */
  let template, target;

  function listExamples(examples) {
    target.innerHTML = '';
    template.process({
      context: {examples: examples},
      clone: true,
      parent: target,
    });
    document.getElementById('count').innerHTML = '(' + examples.length + ')';
  }

  let timerId;
  function inputChange() {
    if (timerId) {
      window.clearTimeout(timerId);
    }
    const text = this.value;
    timerId = window.setTimeout(function () {
      filterList(text);
    }, 500);
  }

  function getMatchingExamples(text) {
    if (text.length < 2) {
      return info.examples;
    }
    const words = text.split(/\W+/);
    const scores = {};
    for (let i = 0; i < words.length; ++i) {
      const word = words[i].toLowerCase();
      let dict = info.index[word];
      const updateScores = function () {
        // eslint-disable-next-line prefer-const
        for (let exIndex in dict) {
          const count = dict[exIndex];
          if (scores[exIndex]) {
            if (scores[exIndex][word]) {
              scores[exIndex][word] += count;
            } else {
              scores[exIndex][word] = count;
            }
          } else {
            scores[exIndex] = {};
            scores[exIndex][word] = count;
          }
        }
      };
      if (dict) {
        updateScores();
      } else {
        const r = new RegExp(word);
        // eslint-disable-next-line prefer-const
        for (let idx in info.index) {
          if (r.test(idx)) {
            dict = info.index[idx];
            updateScores();
          }
        }
      }
    }
    const examples = [];
    // eslint-disable-next-line prefer-const
    for (let exIndex in scores) {
      const ex = info.examples[exIndex];
      ex.score = 0;
      ex.words = 0;
      // eslint-disable-next-line prefer-const
      for (let word in scores[exIndex]) {
        ex.score += scores[exIndex][word];
        ex.words++;
      }
      examples.push(ex);
    }
    // sort examples, first by number of words matched, then
    // by word frequency
    examples.sort(function (a, b) {
      return a.score - b.score || a.words - b.words;
    });
    return examples;
  }

  function filterList(text) {
    const examples = getMatchingExamples(text);
    listExamples(examples);
  }

  function parseParams() {
    const params = {};
    const list = window.location.search
      .substring(1)
      .replace(/\+/g, '%20')
      .split('&');
    for (let i = 0; i < list.length; ++i) {
      const pair = list[i].split('=');
      if (pair.length === 2) {
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
    }
    return params;
  }

  window.addEventListener('load', function () {
    for (let i = 0; i < info.examples.length; ++i) {
      info.examples[i].link += window.location.search;
    }
    template = new jugl.Template('template');
    target = document.getElementById('examples');
    const params = parseParams();
    const text = params['q'] || '';
    const input = document.getElementById('keywords');
    input.addEventListener('input', inputChange);
    input.value = text;
    filterList(text);
  });
})();
