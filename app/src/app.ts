/// <reference path="../../typings/tsd.d.ts" />

import generator = require("./generator");
import meta = require("./meta");
import fs = require("fs");
import path = require("path");
import glob = require("glob");
  
var sdkDir:string;
var metadata:{[serviceName:string]:meta.ServiceInfo}; 

function readMetadata():{[serviceName:string]:meta.ServiceInfo} {
  return JSON.parse(fs.readFileSync(path.join(sdkDir, "metadata.json")).toString());
};

function readServiceFiles() {
  Object.keys(metadata).forEach((serviceName) => {
    var expr = path.join(sdkDir, `${serviceName}-*.normal.json`)
  
    var result = glob.sync(expr)
  
    if (result) {
      metadata[serviceName].input = result[0]
      metadata[serviceName].output = `output/aws-${serviceName}.d.ts`
  
      console.log(serviceName + ": " + JSON.stringify(metadata[serviceName], null, 2));
    }
  });
}

function generateServiceDefinitions() {
  Object.keys(metadata).forEach((serviceName) => {
    if (!metadata[serviceName].input) {
      return;
    }
  
    console.log(`Generating ${metadata[serviceName].output} from ${metadata[serviceName].input}`)
  
    var content = fs.readFileSync(metadata[serviceName].input);
    var result = new generator.AWSTypeGenerator().executeOn(metadata[serviceName], content);
  
    fs.writeFileSync(metadata[serviceName].output, result);
  });
}

function copyCommonDefs() {
  var content = fs.readFileSync(__dirname + '/../src/aws-sdk-common.d.ts');
  fs.writeFileSync('output/aws-sdk-common.d.ts', content);
}

function generateModuleFile() {
  var services = Object.keys(metadata)
    .filter(name => !!metadata[name].input);
  var result = new generator.AWSTypeGenerator().generateMainModule(services);
  
  fs.writeFileSync('output/aws-sdk.d.ts', result);
}

console.log(JSON.stringify(process.argv))

sdkDir = (process.argv.length > 2) ? process.argv[-1 + process.argv.length] : "../aws-sdk-js/apis";

metadata = readMetadata();
readServiceFiles();
copyCommonDefs();
generateServiceDefinitions();
generateModuleFile();