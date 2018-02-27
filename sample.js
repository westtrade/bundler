const Bundler = require('./src/Bundler');

const bundler = new Bundler({}, true);
bundler
    .entry('test/entry.js').out('test/build/bundle.js').run(true);
