# Contributing to OpenLayers 3

Thanks for your interest in contributing to OpenLayers 3.

## Contributing Code

Our preferred means of receiving contributions is through [pull requests](https://help.github.com/articles/using-pull-requests). Make sure
that your pull request follows our pull request guidelines below before submitting it.

This page describes what you need to know to contribute code to ol3 as a developer.

## Contributor License Agreement

Before accepting a contribution, we ask that you provide us a Contributor
License Agreement.  If you are making your contribution as part of work for
your employer, please follow the guidelines on submitting a [Corporate
Contributor License Agreement](https://raw.github.com/openlayers/cla/master/ccla.txt). If you are
making your contribution as an individual, you can submit a digital [Individual
Contributor License Agreement](https://docs.google.com/spreadsheet/viewform?formkey=dGNNVUJEMXF2dERTU0FXM3JjNVBQblE6MQ).

## Setting up development environment

You will obviously start by
[forking](https://github.com/openlayers/ol3/fork_select) the ol3 repository.

### Travis CI

The Travis CI hook is enabled on the Github repository. This means every pull request 
is run through a full test suite to ensure it compiles and passes the tests. Failing
pull requests will not be merged.

Although not mandatory, it is also recommended to set up Travis CI for your ol3 fork.
For that go to your ol3 fork's Service Hooks page and set up the Travis hook.
Then every time you push to your fork, the test suite will be run. This means
errors can be caught before creating a pull request. For those making
small or occasional contributions, this may be enough to check that your contributions
are ok; in this case, you do not need to install the build tools on your local environment
as described below.

### Development dependencies

The minimum requirements are:

* Git
* [Node.js](http://nodejs.org/) 
* Python 2.6 or 2.7 with a couple of extra modules (see below)
* Java 7 (JRE and JDK)

The executables `git`, `java`, `jar`, and `python` should be in your `PATH`.

You can check your configuration by running:

    $ ./build.py checkdeps

To install the Node.js dependencies run

    $ npm install

To install the extra Python modules, run:

    $ sudo pip install -r requirements.txt
or

    $ cat requirements.txt | sudo xargs easy_install

depending on your OS and Python installation.

## Working with the build tool

As an ol3 developer you will need to use the `build.py` Python script. This is
the script to use to run the linter, the compiler, the tests, etc.  Windows users
can use `build.cmd` which is a thin wrapper around `build.py`.

The `build.py` script is equivalent to a Makefile. It is actually based on
[pake](https://github.com/twpayne/pake/), which is a simple implementation of
`make` in Python.

The usage of the script is:

    $ ./build.py <target>
    
where `<target>` is the name of the build target you want to execute. For
example:

    $ ./build.py test

The main build targets are `serve`, `lint`, `build`, `test`, and `check`. The
latter is a meta-target that basically runs `lint`, `build`, and `test`.

The `serve` target starts a node-based web server, which we will refer to as the *dev server*. You'll need to start that server for running the examples and the tests in a browser. More information on that further down.

Other targets include `apidoc` and `ci`. The latter is the target used on Travis CI. See ol3's [Travis configuration file](https://github.com/openlayers/ol3/blob/master/.travis.yml).

## Running the `check` target

The `check` target is to be run before pushing code to GitHub and opening pull
requests. Branches that don't pass `check` won't pass the integration tests,
and have therefore no chance of being merged into `master`.

To run the `check` target:

    $ ./build.py check

If you want to run the full suite of integration tests, see "Running the integration
tests" below.

## Running examples

To run the examples you first need to start the dev server:

    $ ./build.py serve

Then, just point your browser <http://localhost:3000/examples> in your browser. For example <http://localhost:3000/examples/side-by-side.html>.

Run examples against the `ol.js` standalone build:

The examples can also be run against the `ol.js` standalone lib, just like the examples
[hosted](http://openlayers.github.com/ol3/master/examples/) on GitHub. Start by
executing the `host-examples` build target:

    $ ./build.py host-examples

After running `host-examples` you can now open the examples index page in the browser, for example: <http://localhost/~elemoine/ol3/build/hosted/master/examples/>. (This assumes that the `hosted` directory is a web directory, served by Apache for example.)

Append `?mode=raw` to make the example work in full debug mode. In raw mode the OpenLayers and Closure Library scripts are loaded individually by the Closure Library's `base.js` script (which the example page loads and executes before any other script).

## Running tests

To run the tests in a browser start the dev server (`./build.py serve`) and open <http://localhost:3000/test/index.html> in the browser.

To run the tests on the console (headless testing with PhantomJS) use the `test` target:

    $ ./build.py test

See also the test-specific [README](../blob/master/test/README.md).

## Running the integration tests

When you submit a pull request the [Travis continuous integration
server](https://travis-ci.org/) will run a full suite of tests, including
building all versions of the library and checking that all of the examples
work.  You will receive an email with the results, and the status will be
displayed in the pull request.

To run the full suite of integration tests use the `ci` target:

    $ ./build.py ci

Running the full suite of integration tests currently takes 5-10 minutes.

This makes sure that your commit won't break the build. It also runs JSDoc3 to
make sure that there are no invalid API doc directives.

## Adding examples

Adding functionality often implies adding one or several examples. This
section provides explanations related to adding examples.

The examples are located in the `examples` directory. Adding a new example
implies creating two files in this directory, an `.html` file and a `.js` file.
See `examples/simple.html` and `examples/simple.js` for instance.

The `.html` file needs to include a script tag with
`loader.js?id=<example_name>` as its `src`. For example, if the two files for
the example are `myexample.js` and `myexample.html` then the script tag's `src`
should be set to `myexample`.

You can use `simple.js` and `simple.html` as templates for new examples.

### Use of the `goog` namespace in examples

Short story: the ol3 examples should not use the `goog` namespace, except
for `goog.require`.

Longer story: we want that the ol3 examples work in multiple modes, with the
standalone lib (which has implications of the symbols and properties we
export), and compiled together with the ol3 library.

Compiling the examples together with the library makes it mandatory to declare dependencies with `goog.require` statements.

## Pull request guidelines

Your pull request must:

 * Follow OpenLayers 3's coding style.

 * Pass the integration tests run automatically by the Travis Continuous
   Integration system.

 * Address a single issue or add a single item of functionality.

 * Contain a clean history of small, incremental, logically separate commits,
   with no merge commits.

 * Use clear commit messages.

 * Be possible to merge automatically.


### The `check` build target

It is strongly recommended that you run

    $ ./build.py check

before every commit.  This will catch many problems quickly, and it is much
faster than waiting for the Travis CI integration tests to run.

The `check` build target runs a number of quick tests on your code.  These
include:

 * Lint
 * Compile
 * Tests


### Follow OpenLayers 3's coding style

OpenLayers 3 follows [Google's JavaScript Style
Guide](http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml).
This is checked using the [Closure
Linter](https://developers.google.com/closure/utilities/) in strict mode.  You
can run the linter locally on your machine before committing using the `lint`
target to `build.py`:

    $ ./build.py lint

In addition to fixing problems identified by the linter, please also follow the
style of the existing OpenLayers 3 code, which includes:

 * Always wrap the body of `for`, `if`, and `while` statements in braces.

 * Class methods should be in alphabetical order.

 * `var` declarations should not span multiple lines.  If you cannot fit all
   the declarations in a single line, then start a new `var` declaration on a
   new line.  Within a single line, variables should be declared in
   alphabetical order.

 * Do not use assignments inside expressions.


### Pass the integration tests run automatically by the Travis CI system

The integration tests contain a number of automated checks to ensure that the
code follows the OpenLayers 3 style and does not break tests or examples.  You
can run the integration tests locally using the `ci` target:

    $ ./build.py ci


### Address a single issue or add a single item of functionality

Please submit separate pull requests for separate issues.  This allows each to
be reviewed on its own merits.


### Contain a clean history of small, incremental, logically separate commits, with no merge commits

The commit history explains to the reviewer the series of modifications to the
code that you have made and breaks the overall contribution into a series of
easily-understandable chunks.  Any individual commit should not add more than
one new class or one new function.  Do not submit commits that change thousands
of lines or that contain more than one distinct logical change.  Trivial
commits, e.g. to fix lint errors, should be merged into the commit that
introduced the error.  See the [Atomic Commit Convention on Wikipedia](http://en.wikipedia.org/wiki/Atomic_commit#Atomic_Commit_Convention) for more detail.

`git apply --patch` and `git rebase` can help you create a clean commit
history.
[Reviewboard.org](http://www.reviewboard.org/docs/codebase/dev/git/clean-commits/)
and [Pro GIT](http://git-scm.com/book/en/Git-Tools-Rewriting-History) have
explain how to use them.


### Use clear commit messages

Commit messages should be short, begin with a verb in the imperative, and
contain no trailing punctuation. We follow
http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html
for the formatting of commit messages.

Git commit message should look like:

    Header line: explaining the commit in one line

    Body of commit message is a few lines of text, explaining things
    in more detail, possibly giving some background about the issue
    being fixed, etc etc.

    The body of the commit message can be several paragraphs, and
    please do proper word-wrap and keep columns shorter than about
    74 characters or so. That way "git log" will show things
    nicely even when it's indented.

    Further paragraphs come after blank lines.

Please keep the header line short, no more than 50 characters.

### Be possible to merge automatically

Occasionally other changes to `master` might mean that your pull request cannot
be merged automatically.  In this case you may need to rebase your branch on a
more recent `master`, resolve any conflicts, and `git push --force` to update
your branch so that it can be merged automatically.
