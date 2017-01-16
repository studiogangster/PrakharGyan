// const exec = require('child_process').exec;
// const child = exec('sh ImageCutter.sh "753,1245:970,1551 133,14:887,141"', (error, stdout, stderr) => {
//   if (stderr) {
//   	console.log(stderr)
    
//   }
//   console.log(stdout);
// });


const exec = require('child_process').exec;
function cmd(command , success , failure)
{
const child = exec(command, (error, stdout, stderr) => {
  if (stderr) {

  	//Failed
  	console.log('Error ' ,stderr)
  	failure();
    
  }
  else

  {
  	//Success
  	success()

  }
});

}

exports.exec = cmd;