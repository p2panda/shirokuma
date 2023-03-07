# Releasing shirokuma

_This is an example for publising version `1.2.0`._

## Checks and preparations

1. Check that the CI has passed on the shirokuma project's
  [Github page](https://github.com/p2panda/shirokuma).
2. Make sure you are on the `main` branch.
3. Make sure to run `npm install` to have the latest dependencies installed
4. Run the test suites and make sure all tests pass: `npm run test` and also test `npm run build`
5. Make sure that all examples in the `README.md` are still up-to-date with the latest API changes.

## Changelog time!

6. Check the git history for any commits on main that have not been mentioned
   in the _Unreleased_ section of `CHANGELOG.md` but should be.
7. Add an entry in `CHANGELOG.md` for this new release and move over all the
   _Unreleased_ stuff. Follow the formatting given by previous entries.
8. Remember to update the links to your release and the unreleased git log at
   the bottom of `CHANGELOG.md`.

## Tagging and versioning

9. Bump the package version in `package.json` using `npm version [major|minor|patch]` 
   (this is using [semantic versioning](https://semver.org/)).
10. Change the examples in the `README.md` which import `shirokuma` by version to use the latest version
11. Push your changes including your tags using `git push origin main --tags`.

## Publishing releases

12. Copy the changelog entry you authored into Github's [new release
    page](https://github.com/p2panda/shirokuma/releases/new)'s description field.
    Title it with your version `v1.2.0`.
13. Run `npm run build`.
14. Run `npm pack --dry-run` to check the file listing you are about to publish
    doesn't contain any unwanted files.
15. Run `npm publish` and check the window for any birds outside your window.
