'use strict';

const Command = require('cmnd').Command;
const path = require('path');

const LocalGateway = require('../local_gateway.js');
const FunctionParser = require('functionscript').FunctionParser;

const parser = require('../parser.js');
const scripts = require('../scripts.js');
const serviceConfig = require('../service_config');

class HTTPCommand extends Command {

  constructor() {

    super('http');

  }

  help() {

    return {
      description: 'Creates HTTP Server for Current Service',
      flags: {
        p: 'Port (default 8170)'
      },
      vflags: {
        port: 'Port (default 8170)'
      }
    };

  }

  run(params, callback) {

    let port = (params.flags.p || params.vflags.port || [])[0] || 8170;
    let pkg;
    let env;

    try {
      pkg = serviceConfig.get();
    } catch(err) {
      return callback(err);
    }

    try {
      env = require(path.join(process.cwd(), 'env.json'));
    } catch (e) {
      console.error(e);
      return callback(new Error('Invalid env.json in this directory'));
    }

    scripts.run(pkg, 'prehttp', null, null, err => {

      if (err) {
        return callback(err);
      }

      scripts.run(pkg, '+http', null, null);

      let build = pkg.build || pkg.stdlib.build;
      let serviceName = pkg.stdlib ? pkg.stdlib.name : pkg.name;

      if (build !== 'legacy') {
        console.log();
        console.log(`Service starting on:`);
        console.log(`\tlocalhost:${port}/${serviceName}/`);
        console.log();
        let gateway = new LocalGateway({debug: true});
        let fp = new FunctionParser();
        try {
          gateway.service(serviceName);
          gateway.environment(env.local || {});
          gateway.define(fp.load(process.cwd(), 'functions'));
        } catch (e) {
          return callback(e);
        }
        gateway.listen(port);
      } else {
        parser.check(err => parser.createServer(pkg, port, !!err));
      }

    });

  }

}

module.exports = HTTPCommand;
