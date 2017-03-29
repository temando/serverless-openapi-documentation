/**
 * `package` script.
 *
 * - Builds `./dist` for a `npm publish` by merging
 *   the project root and files built from `./src`.
 */ 

const exec = require('shelljs').exec;

exec('rm -rf dist');
exec('mkdir dist');
// exec('cp * dist');
// exec('cp .* dist');
exec('tsc');
