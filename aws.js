var FilePath  = "pic.jpg"

var AWS = require('aws-sdk');
var fs = require('fs')


     //aws credentials
var albumBucketName = 'prakhargyan';
var bucketRegion = 'us-west-2';
var IdentityPoolId = 'us-west-2:a27fe5b3-7d29-458b-a789-21ebf22afd94';

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});

    var s3 = new AWS.S3({signatureVersion: 'v4'});



function upload(inpFilePath , outCloudPath , name)
{
    var bodystream = fs.createReadStream(inpFilePath);

    var params = {
        'Bucket': 'prakhargyan',
        'Key':outCloudPath + name,
        'Body': bodystream,
        'ContentEncoding': 'base64', 
        'ContentType ': 'image/jpeg'
     };

     //also tried with s3.putObject
     s3.upload(params, function(err, data){

if(err)
{
  console.log('S3 Upload Error : ', err);
}
else
{

     console.log('S3 Upload Success : ',data);
}

       
     }) 

 }

 upload(FilePath , 'upload/testUplaod/' , FilePath);