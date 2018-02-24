const browserify = require('browserify');

module.exports = class Bundler {
    constructor(options = {}) {
        this.options = Object.assign({}, options || {});
    }

    transform() {

    }
}
