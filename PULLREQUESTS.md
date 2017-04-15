# Guidelines for pull requests

Your pull request must:

 * Follow OpenLayers 3's coding style.

 * Pass the integration tests run automatically by the Travis Continuous
   Integration system.

 * Address a single issue or add a single item of functionality.

 * Contain a clean history of small, incremental, logically separate commits,
   with no merge commits.

 * Use clear commit messages.

 * Be possible to merge automatically.


## The `check` build target

It is strongly recommended that you run

    $ ./build.py check

before every commit.  This will catch many problems quickly, and it is much
faster than waiting for the Travis CI integration tests to run.

The `check` build target runs a number of quick tests on your code.  These
include:

 * Lint
 * Compile
 * Tests


## Follow OpenLayers 3's coding style

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


## Pass the integration tests run automatically by the Travis CI system

The integration tests contain a number of automated checks to ensure that the
code follows the OpenLayers 3 style and does not break tests or examples.  You
can run the integration tests locally using the `integration-test` target:

    $ ./build.py integration-test


## Address a single issue or add a single item of functionality

Please submit separate pull requests for separate issues.  This allows each to
be reviewed on its own merits.


## Contain a clean history of small, incremental, logically separate commits, with no merge commits

The commit history explains to the reviewer the series of modifications to the
code that you have made and breaks the overall contribution into a series of
easily-understandable chunks.  Any individual commit should not add more than
one new class or one new function.  Do not submit commits that change thousands
of lines or that contain more than one distinct logical change.  Trivial
commits, e.g. to fix lint errors, should be merged into the commit that
introduced the error.

`git apply --patch` and `git rebase` can help you create a clean commit
history.
[Reviewboard.org](http://www.reviewboard.org/docs/codebase/dev/git/clean-commits/)
and [Pro GIT](http://git-scm.com/book/en/Git-Tools-Rewriting-History) have
explain how to use them.


## Use clear commit messages

Commit messages should be short, begin with a verb in the imperative, and
contain no trailing punctuation.


## Be possible to merge automatically

Occasionally other changes to `master` might mean that your pull request cannot
be merged automatically.  In this case you may need to rebase your branch on a
more recent `master`, resolve any conflicts, and `git push --force` to update
your branch so that it can be merged automatically.
