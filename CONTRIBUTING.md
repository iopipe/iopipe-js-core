# Contributing Guidelines

## Code of Conduct

This project and everyone participating in it is governed by our (Code of Conduct)(https://github.com/iopipe/iopipe-docs/blob/master/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to dev@iopipe.com.

## Working on an issue

Comment on the issue (or, inside the organization, assign yourself to the issue) to clarify that you're starting work on the issue.

Fork the repository and do work on your fork.

Aim to include the issue number in the branch used to create your PR, to better assist if someone later is fetching from your remote. For example, fix-120 or issue/120 or fixing-report-bug-120 are all acceptable branch names.

### Committing & opening Prs

We use GPG signing to sign and verify work from collaborators. See the [GitHub Documentation](https://help.github.com/articles/signing-commits-with-gpg/) for instructions on how to create a key and use it to sign your commits. Once this is done, your commits will show as verified within a pull request on GitHub.

This project uses `semantic-release`, so ensure your commits are formatted appropriately for this purpose, and keep your git history clean. `yarn commit` is available in this repository to help you do this.

When you are ready to push some code ensure:

- Tests (including linter) pass
- You've added tests for any new code

When ready, open a [pull request](https://github.com/iopipe/iopipe-js-core/pulls) to the master branch of the project.
