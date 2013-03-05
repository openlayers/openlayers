/**
 Jasmine Reporter that outputs test results to the browser console.
 Useful for running in a headless environment such as PhantomJs, ZombieJs etc.

 Usage:
 // From your html file that loads jasmine:
 jasmine.getEnv().addReporter(new jasmine.ConsoleReporter());
 jasmine.getEnv().execute();
*/

(function(jasmine, console) {
  if (!jasmine) {
    throw "jasmine library isn't loaded!";
  }

  var ANSI = {};
  ANSI.color_map = {
      "green" : 32,
      "red"   : 31
  };

  ANSI.colorize_text = function(text, color) {
    var color_code = this.color_map[color];
    return "\033[" + color_code + "m" + text + "\033[0m";
  };

  var ConsoleReporter = function() {
    if (!console || !console.log) { throw "console isn't present!"; }
    this.status = this.statuses.stopped;
  };

  var proto = ConsoleReporter.prototype;
  proto.statuses = {
    stopped : "stopped",
    running : "running",
    fail    : "fail",
    success : "success"
  };

  proto.reportRunnerStarting = function(runner) {
    this.status = this.statuses.running;
    this.start_time = (new Date()).getTime();
    this.executed_specs = 0;
    this.passed_specs = 0;
    this.log("Starting...");
  };

  proto.reportRunnerResults = function(runner) {
    var failed = this.executed_specs - this.passed_specs;
    var spec_str = this.executed_specs + (this.executed_specs === 1 ? " spec, " : " specs, ");
    var fail_str = failed + (failed === 1 ? " failure in " : " failures in ");
    var color = (failed > 0)? "red" : "green";
    var dur = (new Date()).getTime() - this.start_time;

    this.log("");
    this.log("Finished");
    this.log("-----------------");
    this.log(spec_str + fail_str + (dur/1000) + "s.", color);

    this.status = (failed > 0)? this.statuses.fail : this.statuses.success;

    /* Print something that signals that testing is over so that headless browsers
       like PhantomJs know when to terminate. */
    this.log("");
    this.log("ConsoleReporter finished");
  };


  proto.reportSpecStarting = function(spec) {
    this.executed_specs++;
  };

  proto.reportSpecResults = function(spec) {
    if (spec.results().passed()) {
      this.passed_specs++;
      return;
    }

    var resultText = spec.suite.description + " : " + spec.description;
    this.log(resultText, "red");

    var items = spec.results().getItems();
    for (var i = 0; i < items.length; i++) {
      var trace = items[i].trace.stack || items[i].trace;
      this.log(trace, "red");
    }
  };

  /**
   * Will hold the title of the current 'group'.
   */
  proto.lastTitle = "";

  /**
   * Pads given string up to a target length with a given character on either
   * the left or right side.
   */
  proto.pad = function(string, len, char, side){
    var str = string + "",
        whichSide = side || 'left',
        buff = "",
        padChar = char || " ",
        padded = "",
        iterEnd = len - str.length;

    while(buff.length < iterEnd) {
      buff += padChar;
    }
    if (side === 'left') {
      padded = buff + str;
    } else {
      padded = str + buff;
    }
    // we still need a substring when we are called with e.g. " . " as char.
    return padded.substring(0, len);
  };

  /**
   * Pads given string up to a target length with a given character on the right
   * side.
   */
  proto.padRight = function(str, len, char){
    return this.pad(str, len, char, 'right');
  };

  /**
   * Pads given string up to a target length with a given character on the right
   * side.
   */
  proto.padLeft = function(str, len, char){
    return this.pad(str, len, char, 'left');
  };

  proto.reportSuiteResults = function(suite) {
    if (!suite.parentSuite) { return; }
    // determine title from full name (wo/ own description)
    var title = suite.getFullName().replace(new RegExp(suite.description + "$"), "");
    if (this.lastTitle !== title) {
      // when title differs, we have a new 'group'
      this.log("\n" + title);
    }
    // always set current title
    this.lastTitle = title;

    var results = suite.results();
    var failed = results.totalCount - results.passedCount;
    var color = (failed > 0) ? "red" : "green";
    var logStr = " " + this.padRight(suite.description + " ", 60, '.') +
        this.padLeft(results.passedCount, 4) + "/" +
        this.padRight(results.totalCount, 4) + " ok";
    this.log(logStr, color);
  };

  proto.log = function(str, color) {
    var text = (color)? ANSI.colorize_text(str, color) : str;
    console.log(text);
  };

  jasmine.ConsoleReporter = ConsoleReporter;
})(jasmine, console);

