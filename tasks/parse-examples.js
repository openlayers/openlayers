var fs = require('fs');
var path = require('path');

var async = require('async');
var Parser = require('htmlparser2').Parser;


var exampleDir = path.join(__dirname, '..', 'examples');


/**
 * List all .html files in the example directory (excluding index.html).
 * @param {function(Error, Array.<string>)} callback Called with any error or
 *     the list of paths to examples.
 */
function listExamples(callback) {
  fs.readdir(exampleDir, function(err, items) {
    if (err) {
      return callback(err);
    }
    var examplePaths = items.filter(function(item) {
      return /\.html$/i.test(item) && item !== 'index.html';
    }).map(function(item) {
      return path.join(exampleDir, item);
    });
    callback(null, examplePaths);
  });
}


/**
 * Parse info from examples.
 * @param {Array.<string>} examplePaths Paths to examples.
 * @param {function(Error, Array.<Object>)} callback Called with any error or
 *     the list of example info objects.
 */
function parseExamples(examplePaths, callback) {
  async.map(examplePaths, function(examplePath, next) {
    fs.readFile(examplePath, function(err, data) {
      if (err) {
        return next(err);
      }
      var name = path.basename(examplePath);
      var info = {
        link: name,
        example: name,
        title: '',
        shortdesc: '',
        tags: ''
      };
      var key;
      var openTag;
      var parser = new Parser({
        onopentag: function(tag, attrs) {
          if (attrs.id in info) {
            key = attrs.id;
            openTag = tag;
          }
        },
        ontext: function(text) {
          if (key) {
            info[key] += text.replace(/\n/g, '').trim() + ' ';
          }
        },
        onclosetag: function(tag) {
          if (tag === openTag) {
            info[key] = info[key].trim();
            key = undefined;
            openTag = undefined;
          }
        },
        onerror: function(err2) {
          var message = 'Trouble parsing ' + examplePath + '\n' + err2.message;
          next(new Error(message));
        }
      });
      parser.write(data.toString('utf8'));
      parser.end();
      next(null, info);
    });
  }, callback);
}


/**
 * Create an inverted index of keywords from examples.  Property names are
 * lowercased words.  Property values are objects mapping example index to word
 * count.
 * @param {Array.<Object>} exampleInfos Array of example info objects.
 * @return {Object} Word index.
 */
function createWordIndex(exampleInfos) {
  var index = {};
  var keys = ['shortdesc', 'title', 'tags'];
  exampleInfos.forEach(function(info, i) {
    keys.forEach(function(key) {
      var text = info[key];
      var words = text ? text.split(/\W+/) : [];
      words.forEach(function(word) {
        if (word) {
          word = word.toLowerCase();
          var counts = index[word];
          if (counts) {
            if (index in counts) {
              counts[i] += 1;
            } else {
              counts[i] = 1;
            }
          } else {
            counts = {};
            counts[i] = 1;
            index[word] = counts;
          }
        }
      });
    });
  });
  return index;
}


/**
 * Write the example-list.js file with example info and word index.
 * @param {Array.<Object>} exampleInfos Array of example info objects.
 * @param {function(Error)} callback Called with any error.
 */
function writeExampleList(exampleInfos, callback) {
  var info = {
    examples: exampleInfos,
    index: createWordIndex(exampleInfos)
  };
  var indexPath = path.join(exampleDir, 'example-list.js');
  var str = 'var info = ' + JSON.stringify(info);
  fs.writeFile(indexPath, str, callback);
}


/**
 * List examples, parse them, and write example list.
 */
async.waterfall([
  listExamples,
  parseExamples,
  writeExampleList
], function(err) {
  if (err) {
    process.stderr.write(err + '\n');
    process.exit(1);
  }
});
