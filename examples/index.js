(function () {
  var template, target;

  function listExamples(examples) {
    target.innerHTML = "";
    var node = template.process({
      context: {examples: examples},
      clone: true,
      parent: target
    });
    document.getElementById("count").innerHTML = "(" + examples.length + ")";
  }

  var timerId;
  function inputChange() {
    if (timerId) {
      window.clearTimeout(timerId);
    }
    var text = this.value;
    timerId = window.setTimeout(function() {
      filterList(text);
    }, 500);
  }

  function filterList(text) {
    var examples;
    if (text.length < 2) {
      examples = info.examples;
    } else {
      var words = text.split(/\W+/);
      var scores = {};
      for(var i=0; i<words.length; ++i) {
        var word = words[i].toLowerCase();
        var dict = info.index[word];
        var updateScores = function() {
          for(exIndex in dict) {
            var count = dict[exIndex];
            if(scores[exIndex]) {
              if(scores[exIndex][word]) {
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
          var r;
          for (idx in info.index) {
            r = new RegExp(word);
            if (r.test(idx)) {
              dict = info.index[idx];
              updateScores();
            }
          }
        }
      }
      examples = [];
      for (var j in scores) {
        var ex = info.examples[j];
        ex.score = scores[j];
        examples.push(ex);
      }
      // sort examples by first by number of words matched, then
      // by word frequency
      examples.sort(function(a, b) {
        var cmp;
        var aWords = 0, bWords = 0;
        var aScore = 0, bScore = 0;
        for (var i in a.score) {
          aScore += a.score[i];
          aWords += 1;
        }
        for (var j in b.score) {
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
    var params = {};
    var list = window.location.search.substring(1).split("&");
    for (var i = 0; i < list.length; ++i) {
      var pair = list[i].split("=");
      if (pair.length == 2) {
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
    }
    if (params["q"]) {
      var input = document.getElementById("keywords");
      input.value = params["q"];
      inputChange.call(input);
    }
  }

  window.onload = function() {
    for (var i = 0; i < info.examples.length; ++i) {
      info.examples[i].link += window.location.search;
    }
    template = new jugl.Template("template");
    target = document.getElementById("examples");
    listExamples(info.examples);
    document.getElementById("keywords").onkeyup = inputChange;
    parseQuery();
  };
})();
