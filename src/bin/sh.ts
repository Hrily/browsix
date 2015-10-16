/// <reference path="../../typings/node/node.d.ts" />
'use strict';

import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';
import { Pipe } from '../kernel/pipe';

//
// We split on the pipe, which works since pipe is the only operator.
// 
function tokenize(statement: string, delim: string): string[] {
	'use strict';
	// strips whitespace in between commands
	return statement.split(delim);
}

function parse(tokens: string[], utildir: string): string[][] {
	'use strict';
	// each command is a list, starting with the utility,
	// followed by flags and arguments
	let commands: string[][] = [];
	for (var i = 0; i < tokens.length; i++) {
		let token = tokens[i];
		// if pipe isn't between commands, throw error
		if (! (/\S/.test(token))) {
			// string is empty or is just whitespace
			throw new SyntaxError();
		}
		// split on whitespace, don't include whitespace
		let command = token.match(/\S+/g);
		//if path to utility is not given, expand.
		if (command[0].match(/\//g) === null) {
			command[0] = utildir + command[0];
		}
		commands.push(command);
	}
	return commands;
}

function parsetree_is_valid(parsetree: string[][]): boolean {
	'use strict';
	// TODO: check if util exists on file system.
	return true;
}

function run_child(commandPath: string): void {
	'use strict';
	let pathToScript = process.argv[1];
	let args = process.argv.slice(2);

	if (args.length < 1) {
		let usage = 'usage: ' + path.basename(pathToScript) + ' CMD [ARGS...]\n';
		process.stderr.write(usage, (err: any) => {
			process.exit(1);
		});
		return;
	}

	let opts = {
		// pass our stdin, stdout, stderr to the child
		stdio: [0, 1, 2],
	};
	console.log(args[0] + " " + args.slice(1) + " " + opts);
	//let child = child_process.spawn(args(0));
	let child = child_process.spawn(args[0], args.slice(1), opts);
	child.on('error', (err: any) => {
		console.log('eee: ' + err);
		process.stderr.write('error: ' + err, () => {
			process.exit(1);
		});
	});
	//child.stdout.on('data', (data: any) => {
	//	process.stdout.write('out: ' + data, () => {
	//		console.log('stdout: ' + data);
	//	});
	//});
	child.on('exit', (code: number) => {
		console.log("ex: " + code);
		process.exit(code);
	});
}

function main(): void {
	'use strict';

	// get statement
	let argv = process.argv;
	let pathToNode = argv[0];
	let pathToScript = argv[1];
	let args = argv.slice(2);
	let statement = args[0];
	//console.log(statement);

	// tokenize statement
	let tokens = tokenize(statement, "|");
	//console.log(tokens);

	// parse tokens into command sequence.
	// do path expansion for commands.
	// raise error if | is not surrounded by
	// commands.
	let code = 0;
	let utilpath = "lib/bin/";
	let parsetree: string[][] = [];
	try {
		parsetree = parse(tokens, utilpath);
		console.log(parsetree);
	} catch (e) {
		console.log(e);
		if (e instanceof SyntaxError) {
			process.stderr.write('SyntaxError: a pipe can only be between two commands.\n');
			code = 1;
			process.exit(code);
		}
	}
	// check if parse tree is valid
	if (! parsetree_is_valid(parsetree)) {
		code = 1;
		process.exit(code);
	}
	run_child(parsetree[0][0]);

	// iterate over commands, setup pipes, and execute commands
	// let pids: number[] = [];
	// first command gets input from stdin, last writes output to stdout,
	// all commands write err to stderr
	//let stdin = process.stdin;
	//let stderr = process.stderr;
	//for (var i = 0; i < parsetree.length-1; i++) {
		//let command = parsetree[i];
		// pipe returns a buffer, not a file descriptor(?)
		//let child_process = require('child_process').spawn();
		//let child = child_process.execFile(command[0], ["hi"]);
		// let stdout = new Pipe();
		// TODO: figure out the type signature for streams.  NodeJS.ReadableStream works, but there's
		// no corresponding NodeJS.WritableStream nor NodeJS.Stream exported (why would there be?),
		// and Pipe is none of the above. Want to run the following:
		// let pid = exec(command,[stdin, stdout, stderr]);
		//let pid = exec(command);
		//pids.push(pid);
		// TODO: Pipe and process.stdin are different types. Want to run the following:
		//stdin = stdout;
	//}
	//let command = parsetree[parsetree.length-1];
	//let stdout = process.stdout;
	//let pid = exec(command);
	//pids.push(pid);

	// iterate over processids, waiting for them to complete, and get command exit codes
	//for (var i = 0; i < pids.length; i++) {
	//	pid = pids[i];
	//}

	// set statement exit code and exit
	process.exit(code);
}

main();
