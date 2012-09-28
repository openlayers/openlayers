# Guidelines for contributing

## Code formatting

We use the [Closure
Linter](https://developers.google.com/closure/utilities/docs/linter_howto) for
checking JavaScript files for style issues. To execute the linter use:

    $ make lint

This command assumes that the `gjslint` command in on your PATH.

## Code compilation

The OpenLayers 3 is compiled and type-checked using the [Closure
Compiler](https://developers.google.com/closure/compiler/). To
compile the code use:

    $ make build-all

## Generating doc

We use [jsdoc3](https://github.com/jsdoc3/jsdoc) to generate the API
doc. Changing the code can break the generation of the API
doc. Use the following to generate the doc:

    $ make doc

This command assumes that the `jsdoc` command is on your PATH.

## Tests

Changes should not break existing tests. We use
[PhantomJS](http://phantomjs.org/) to run tests *headlessly*.
Use the following to run the tests:

    $ make test

This command assumes that the `phantomjs` command is on your PATH.

## The `precommit` target

The Makefile includes a `precommit` target for running all of the
above (`lint`, `build-all`, `doc`, and `test`). As the name of the
target suggests `make precommit` is the command to run before
committing:

    $ make precommit

## Commit messages

We follow http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html
for the formatting of commit messages.

Basically, here's what a Git commit message should look like:

    Header line: explaining the commit in one line

    Body of commit message is a few lines of text, explaining things
    in more detail, possibly giving some background about the issue
    being fixed, etc etc.

    The body of the commit message can be several paragraphs, and
    please do proper word-wrap and keep columns shorter than about
    74 characters or so. That way "git log" will show things
    nicely even when it's indented.

    Further paragraphs come after blank lines.
