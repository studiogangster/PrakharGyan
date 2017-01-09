var fs      = require('fs');
var pdf2img = require('pdf2img');
 
var input   = __dirname + '/in.pdf';
 
pdf2img.setOptions({
  type: 'png',                      // png or jpeg, default png 
  size: 1024,                       // default 1024 
  density: 600,                     // default 600 
  outputdir: __dirname + '/public', // mandatory, outputdir must be absolute path 
  targetname: 'test'                // the prefix for the generated files, optional 
});
 
pdf2img.convert(input, function(err, info) {
  if (err) console.log(err)
  else console.log(info);
});