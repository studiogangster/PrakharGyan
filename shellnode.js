const exec = require('child_process').exec;
const child = exec('sh ImageCutter.sh "753,1245:970,1551 133,14:887,141"', (error, stdout, stderr) => {
  if (stderr) {
  	console.log(stderr)
    
  }
  console.log(stdout);
});