#!/usr/bin/env node

const commander = require('commander');
const completion = require('commander-completion');
const { version, description } = require('../package.json');
const Bundler = require('../src/Bundler');

const program = completion(commander);

/**
 * TODO: Добавить автодополнение
 * https://github.com/twolfson/commander-completion
 */

let watching = false;
let entry = null;

program
	.version(version)
	.description(description)
	.arguments('<entry>')
	.option('-p, --preset <presets>', 'list of applyed presets', (presetsList) => presetsList.split(','))
	.option('-m, --mode <mode>', 'run mode, as default gets from NODE_ENV')
	.action((env) => { entry = env; })
;

let command = null;

program
	.command('watch [entry]')
	.description('build bundle')
	.action((env, cmd) => { watching = true; entry = env; });

program
	.command('server [entry]')
	.description('run develop server with live reloading')
	.action((env) => { command = 'server'; entry = env; });

program.parse(process.argv);
const { preset: presetsList = [], mode = process.env.NODE_ENV } = program;
const bundler = new Bundler();

console.log(presetsList, entry, mode, program.entry);

// bundler
// 	.preset(...presetsList)
//     .entry('test/entry.js').out('test/build/bundle.js').run(true);
