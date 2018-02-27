const { Transform } = require('stream');
const TARGET_FILE_EXT = /\.(css|scss|sass)$/;


module.exports = function spliiter(file, config = {}) {
    if (!file.match(TARGET_FILE_EXT)) return through();
    return collect((content, done) => {
        const getSource = new Function('module', `${ content }; return css`);
        const css = getSource(content);
        config.out.write(css);
        done();
    });
};


/**
 * @param {function} flush(bufferedContent, done)
 * @return {DuplexStream}
 */
function collect(flush) {
    let buf = []
    return through(function (chunk, enc, next) {
        buf.push(chunk)
        next();
    }, done => flush(Buffer.concat(buf), done))
}

/**
 * Quickly create a object-mode duplex stream
 * @param {function?} transform(chunk, encoding, done)
 * @param {function?} flush(done)
 * @param {boolean} objectMode
 * @return {DuplexStream}
 */
function through(transform, flush, objectMode) {
    transform = transform || pass;
    return new Transform({objectMode, transform, flush})
}

function pass(chunk, _, done) {

    done(null, chunk)
}
