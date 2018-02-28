const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const spawn = require('cross-spawn');
const argv = require('yargs').argv;

const testDirFiles = fs.readdirSync(path.join(__dirname, '../testProjects'));
const folders = _.chain(testDirFiles)
  .reject(s => s.match(/^\./))
  .reject(s => s === 'util')
  .filter(file => {
    const toInclude = argv.folders || argv.projects;
    if (toInclude) {
      return _.includes(toInclude, file);
    }
    return true;
  })
  .value();

const results = [];
function resultPush({ status }) {
  results.push(status);
}

folders.forEach(folder => {
  resultPush(
    spawn.sync('yarn', ['install', '--cwd', `testProjects/${folder}`], {
      stdio: 'inherit'
    })
  );

  fs.copyFileSync('dist/iopipe.js', `testProjects/${folder}/iopipe.js`);

  resultPush(
    spawn.sync('yarn', ['--cwd', `testProjects/${folder}`, 'test'], {
      stdio: 'inherit'
    })
  );
});

process.exit(_.max(results));
