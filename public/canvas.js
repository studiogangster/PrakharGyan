function convertImageToCanvas(image) {
  var canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext("2d").drawImage(image, 0, 0);

  return canvas;
}



  $('#image').cropper({
 // preview: '.preview',

viewMode:1,
  crop: function(e) {


  }
});


var _backupImage = clone('#image')


function clone(image)
{
 return $(image).clone()[0];
}

function backupImage(image)
{

// var _backupImage = $(image).clone()[0];


var canvas = convertImageToCanvas(_backupImage);
var image= canvas.toDataURL();
$('#image').cropper('replace' , image);
}

function drawImage()
{
  var elem_img =  _backupImage;
var canvas = convertImageToCanvas( elem_img ) ;
var ctx = canvas.getContext("2d");
ctx.globalAlpha = 0.5;
ctx.beginPath();

var MissedExcluded = []

for(i of SpaceRect)
{

if(i.include == true)
{
ctx.fillStyle = 'green';
CropBoxData = i.coordinates;
ctx.rect(CropBoxData.x, CropBoxData.y, CropBoxData.width  ,CropBoxData.height);

}
else if(i.include == false)
{

MissedExcluded.push(i)


}



}

ctx.fill()
var image= canvas.toDataURL();
$('#image').cropper('replace' , image);


}

function blurRect(image , include)
{

var CropBoxData=  $(image).cropper('getData');
if(include == true)
{
SpaceRect.push({ 'coordinates': CropBoxData ,'include' : true});
console.log(SpaceRect);
}
else
{
SpaceRect.push({ 'coordinates': CropBoxData ,'include' : false});
console.log(SpaceRect);
}


var elem_img =  _backupImage;
var canvas = convertImageToCanvas( elem_img ) ;
var ctx = canvas.getContext("2d");
ctx.globalAlpha = 0.5;
ctx.beginPath();

var MissedExcluded = []

for(i of SpaceRect)
{

if(i.include == true)
{
ctx.fillStyle = 'green';
CropBoxData = i.coordinates;
ctx.rect(CropBoxData.x, CropBoxData.y, CropBoxData.width  ,CropBoxData.height);

}
else if(i.include == false)
{

MissedExcluded.push(i)


}



}


ctx.fill()
ctx.beginPath();
for(i of MissedExcluded)
{
  ctx.fillStyle = 'red';
CropBoxData = i.coordinates;
ctx.rect(CropBoxData.x, CropBoxData.y, CropBoxData.width  ,CropBoxData.height);

}

ctx.fill()
var image= canvas.toDataURL();
$('#image').cropper('replace' , image);



}



function clearRect(image)
{
var elem_img =  $('#image')[0]
var canvas = convertImageToCanvas( elem_img ) ;
var ctx = canvas.getContext("2d");
ctx.fillStyle = 'rgba(255, 0, 0, 1)';

for(i of SpaceRect)
{


CropBoxData = i.coordinates;
ctx.clearRect(CropBoxData.x, CropBoxData.y, CropBoxData.width  ,CropBoxData.height);


}


var image= canvas.toDataURL();
$('#image').cropper('replace' , image);
var _image = new Image();
_image.src = image;

_backupImage = clone(_image);
StackMoves = []
SpaceRect = []

}

function SaveState()
{


        MainStack.push(SpaceRect);

}

var KeyState = true;



        $('#saveNewsClip').on('shown.bs.modal', function () {
          KeyState = false;
    $('#article_name').focus();
})
                $('#saveNewsClip').on('hidden.bs.modal', function () {

KeyState = true;

})


function EnterKey(image) {
  $(document).keypress(function(e) {
    if(e.which == 13 && KeyState) {


        $('#saveNewsClip').modal('show');



      SaveState();
      clearRect(image);

      
      





    }
});
}


function SpaceKey (image) {
  $(document).keypress(function(e) {
    if(e.which == 32 && KeyState) {

 var tmp = $('#image').cropper('getData') 




      blurRect(image , true);
      //Save The cropped Area and Transform And Reset







 console.log(tmp)

    }
});
}

function EscapeKey(image)
{

$(document).keyup(function(e) {
     if (e.keyCode == 27 && KeyState) {
      // $(image).cropper('clear')
     $(image).cropper('clear')
    }
});

}

function DeleteKey(image)
{

$(document).keyup(function(e) {
     if (e.keyCode == 46 && KeyState) {
      blurRect(image , false);
    }
});

}


function ControlZ(image)
{
 $(document).keydown(function(e) {
        if (e.keyCode == 90 && e.ctrlKey  && KeyState) {
            Undo();
        }
    });

}
function ControlR(image)
{
 $(document).keydown(function(e) {
        if (e.keyCode == 82 && e.ctrlKey   && KeyState) {
            Redo();
        }
    });

}

function BackspaceKey(image)
{

$(document).keyup(function(e) {
     if (e.keyCode == 8  && KeyState) {
      Undo();

    }
});

}


function initButtonSetup(image)
{

EscapeKey(image);
EnterKey(image);
SpaceKey(image);
// BackspaceKey(image);
ControlZ(image)
ControlR(image)
// DeleteKey(image);
}

function Undo()
{
  var tmp = SpaceRect.pop();
  if(tmp)
  {
    
    StackMoves.push(tmp);
    drawImage();
  }
  
}

function Redo()
{
  var tmp = StackMoves.pop();

  if(tmp)
  {
  SpaceRect.push(tmp);
  drawImage();

  }

}


initButtonSetup('#image');


var StackMoves = []
var SpaceRect = []


//Main Data Stack

var MainStack = []
