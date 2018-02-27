const browserify = require('browserify');
const { createWriteStream } = require('fs');
const { parse, join } = require('path');
const watchify = require('watchify');
const condenseify = require('condenseify');

const bows = require('bows');
const log = bows('bundler');

const splitter = require('./splitter');
const flatten = require('./utils/flatten');

const DEFAULT_OUT_FILENAME = 'bundle.js';
const DEFAULT_OUT_PATH = `build/${ DEFAULT_OUT_FILENAME }`;
const DEFAULT_ENTRY = 'src/entry.js';

const babelify = require("babelify");
const scssify = require("scssify");
const errorify = require("errorify");
const envify = require('envify');

/**
    TODO:
        - Добавить envify, hotreloadify, rustify (возможно в качестве пресетов)
        - добавить плагины
        - добавить пресеты - которые будут браться из npm модулей
        - сделать проверку на недостающие модули и возможно автоинстал

**/

const scssifyTransform = [scssify, {
    // Disable/enable <style> injection; true by default
    // autoInject: true,
    autoInject: false,

    // Useful for debugging; adds data-href="src/foo.scss" to <style> tags
    // autoInject: 'verbose',

    // This can be an object too
    // autoInject: {
    //   verbose: false,
    //
    //   // If true the <style> tag will be prepended to the <head>
    //   prepend: false
    // },

    // require('./MyComponent.scss') === '.MyComponent{color:red;background:blue}'
    // autoInject: false, will also enable this
    // pre 1.x.x, this is enabled by default
    // export: false,

    // Pass options to the compiler, check the node-sass project for more details
    sass: {
      // See the relevant node-sass documentation
      // importer: 'custom-importers.js',

      // This will let the importer state be reset if scssify
      // is called several times within the same process, e.g. by factor-bundle
      // should export a factory function (which returns an importer function)
      // overrides opt.sass.importer
      // importerFactory: 'custom-importer-factory.js',

      // Enable both of these to get source maps working
      // "browserify --debug" will also enable css sourcemaps
      // sourceMapEmbed: true,
      // sourceMapContents: true,
      includePaths: module.parent.paths,

      // This is the default only when opt.sass is undefined
      // outputStyle: 'compressed'
    },

    // Configure postcss plugins too!
    // postcss is a "soft" dependency so you may need to install it yourself
    postcss: {
    //   autoprefixer: {
    //     browsers: ['last 2 versions']
    //   }
    }
}];

const DEFAULT_TRANSFORMS =  [
    babelify.configure({presets: ["env", "react"]}),
    scssifyTransform,
];

module.exports = class Bundler {
    constructor(options = {}, devmode = false) {
        this.__options = Object.assign({}, options || { paths: [] }, { paths: module.parent.paths });
        this.__entries = [DEFAULT_ENTRY];
        this.__out = DEFAULT_OUT_PATH;
        this.__transforms = DEFAULT_TRANSFORMS;
        this.__bundler = null;
        this.__devmode = devmode;
    }

    initBundler(watch) {
        const watchOptions = watch ? {
            cache: {},
            packageCache: {},
        } : {};

        const bundlerOptions = Object.assign({}, this.__options, watchOptions);

        this.__bundler = browserify(bundlerOptions);
    }

    entry(...entriesList) {
        this.__entries = flatten(entriesList.length && entriesList || this.__entries);
        return this;
    }

    /**
     * set output paths
     * @param  {String} [outPath=DEFAULT_OUT_PATH] path to build folder, or out
     * @return {Bundler}                            current bundler instance
     */
    out(outPath = DEFAULT_OUT_PATH) {
        const info = parse(outPath || DEFAULT_OUT_PATH);
        const isFolder = !!info.ext;

        this.__out = outPath;
        return this;
    }

    /**
     * Apply presets to bundler
     * @param {Array<String>} presetsList List of presets names
     */
    preset(...presetsList) {

    }

    transform(...transforms) {
        this.__transforms = flatten(transforms.length && transforms || this.__transforms);
    }

    run(watch = false) {
        watch = watch || this.__devmode;

        this.initBundler(watch);

        const outFile = createWriteStream(this.__out);
        const { name, dir } = parse(this.__out);

        const cssOutStream = createWriteStream(join(dir, `${ name }.css`));
        this.__transforms.push([splitter, {
            out: cssOutStream,
        }]);

        // this.__transforms.push(condenseify);

        this.__entries.forEach((entry) => this.__bundler.add(entry));
        this.__transforms.forEach((transform) => this.__bundler.transform(transform));

        if (watch) {
            this.__bundler.plugin(watchify);
        }

        if (this.__devmode) {
            this.__bundler.plugin(errorify);
        }

        this.__bundler.on('log', function (msg) {
            log(msg);
        });
        //
        //
        // this.__bundler.on('bundle', function () {
        //     console.log('Bundle');
        // });

        this.__bundler.on('label', (...args) => {
            console.log('Update', args);
        })

        const bundleStream = this.__bundler.bundle();

        bundleStream.on('end', () => cssOutStream.end());
        bundleStream.pipe(outFile);

        setTimeout(() => {
            // console.log(this.__bundler._options.cache);

            this.__bundler._options.cache = {};
            this.__bundler.emit('update')
        }, 1500);

        return this;
    }
}
