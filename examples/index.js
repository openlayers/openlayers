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

  function filterList(text) {
    let examples;
    if (text.length < 2) {
      examples = info.examples;
    } else {
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
      examples = [];
      // eslint-disable-next-line prefer-const
      for (let j in scores) {
        const ex = info.examples[j];
        ex.score = scores[j];
        examples.push(ex);
      }
      // sort examples by first by number of words matched, then
      // by word frequency
      examples.sort(function (a, b) {
        let cmp;
        let aWords = 0,
          bWords = 0;
        let aScore = 0,
          bScore = 0;
        // eslint-disable-next-line prefer-const
        for (let i in a.score) {
          aScore += a.score[i];
          aWords += 1;
        }
        // eslint-disable-next-line prefer-const
        for (let j in b.score) {
          bScore += b.score[j];
          bWords += 1;
        }
        if (aWords == bWords) {
          cmp = bScore - aScore;
        } else {
          cmp = bWords - aWords;
        }
        return cmp;
      });
    }
    listExamples(examples);
  }

  function parseQuery() {
    const params = {};
    const list = window.location.search.substring(1).split('&');
    for (let i = 0; i < list.length; ++i) {
      const pair = list[i].split('=');
      if (pair.length == 2) {
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
    }
    if (params['q']) {
      const input = document.getElementById('keywords');
      input.value = params['q'];
      inputChange.call(input);
    }
  }

  window.onload = function () {
    for (let i = 0; i < info.examples.length; ++i) {
      info.examples[i].link += window.location.search;
    }
    template = new jugl.Template('template');
    target = document.getElementById('examples');
    listExamples(info.examples);
    document.getElementById('keywords').onkeyup = inputChange;
    parseQuery();
  };
})();
