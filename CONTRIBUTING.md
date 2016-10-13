# Contributing to OpenLayers 3

Thanks for your interest in contributing to OpenLayers 3.

## Asking Questions

Please ask questions about using the library on [stackoverflow using the tag 'openlayers-3'](http://stackoverflow.com/questions/tagged/openlayers-3).

When you want to get involved and discuss new features or changes, please use [the mailing list](https://groups.google.com/forum/#!forum/ol3-dev).


## Submitting Bug Reports

Please use the [GitHub issue tracker](https://github.com/openlayers/ol3/issues). Before creating a new issue, do a quick search to see if the problem has been reported already.


## Getting Familiar with the Code in the Repository

Look for `readme.md` files! Several directories contain a `readme.md` file that explains the contents of the directory and how to work with them.


## Contributing Code

See [`DEVELOPING.md`](https://github.com/openlayers/ol3/blob/master/DEVELOPING.md) to learn how to get started developing.

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


## Pull request guidelines

Before working on a pull request, create an issue explaining what you want to contribute. This ensures that your pull request won't go unnoticed, and that you are not contributing something that is not suitable for the project. Once a core developer has set the `pull request accepted` label on the issue, you can submit a pull request. The pull request description should reference the original issue.

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

    $ make check

before every commit.  This will catch many problems quickly, and it is much
faster than waiting for the Travis CI integration tests to run.

The `check` build target runs a number of quick tests on your code.  These
include:

 * Lint
 * Compile
 * Tests


### Follow OpenLayers 3's coding style

OpenLayers 3 follows [Google's JavaScript Style
Guide](https://google.github.io/styleguide/javascriptguide.xml).
This is checked using [ESLint](http://eslint.org/), you
can run the linter locally on your machine before committing using the `lint`
target:

    $ make lint

In addition to fixing problems identified by the linter, please also follow the
style of the existing OpenLayers 3 code, which includes:

 * Always wrap the body of `for`, `if`, and `while` statements in braces.

 * Class methods should be in alphabetical order.

 * `var` declarations should not span multiple lines.  If you cannot fit all
   the declarations in a single line, then start a new `var` declaration on a
   new line.  Within a single line, variables should be declared in
   alphabetical order.

 * Do not use assignments inside expressions.

 * Use uppercase for `@const` variables.

### Configure your editor

If possible, configure your editor to follow the coding conventions of the
library.  A `.editorconfig` file is included at the root of the repository that
can be used to configure whitespace and charset handling in your editor.  See
that file for a description of the conventions.  The [EditorConfig](
http://editorconfig.org/#download) site links to plugins for various editors.

### Pass the integration tests run automatically by the Travis CI system

The integration tests contain a number of automated checks to ensure that the
code follows the OpenLayers 3 style and does not break tests or examples.  You
can run the integration tests locally using the `ci` target:

    $ make ci


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

## Building on Windows

Most developers build on Linux. Building on Windows is possible under Cygwin.
When installing Cygwin from https://www.cygwin.com/, include the developer
tools to get GNU make.

First (before npm install), to avoid file permission problems between Windows
and Cygwin, edit Cygwin's /etc/fstab file to disable ACLs like this
`none /cygdrive cygdrive binary,noacl,posix=0,user 0 0`

Python is normally installed with Cygwin so need not be installed separately.
By default Cygwin will use its own version of Python rather than Window's,
so the Python modules should be installed for Cygwin's Python.

The build targets `check-deps`, `serve`, `lint`, `build`, `test`, `check` and
`host-examples` described above should all work. `host-examples` takes quite a
while to run. If a target does not run properly first time, try it again.

Currently, Firefox fails to run http://localhost:3000/build/examples
from make serve, but Chrome and Internet Explorer will.

Microsoft Visual Studio's javascript debugger may be used to debug the
build/hosted/your-branch/examples. It will be convenient to set
build/hosted/your-branch/examples/index.html as the startup page.

Your ol3 source tree need not be under the Cygwin root.
if you checkout to c:/ol3 then you can build under Cygwin at /cygdrive/c/ol3 .
However, keep the path to the ol3 files short otherwise you may see
`ENAMETOOLONG` errors.
