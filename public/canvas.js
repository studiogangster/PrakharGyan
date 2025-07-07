/**
 * IndexedDB Helper for storing images and metadata
 */
const DB_NAME = 'CanvasImagesDB';
var STORE_NAME = 'images';
const DB_VERSION = 1;


let transform = {
  offsetX: 0,
  offsetY: 0,
};


function resetCropperWithCanvas(canvas) {
  // Get data URL of updated canvas
  const updatedDataURL = canvas.toDataURL();

  // Destroy existing cropper
  $('#image').cropper('destroy');

  // Replace image source
  $('#image').attr('src', updatedDataURL);

  // Wait for image to load before re-initializing cropper
  $('#image').off('load').on('load', function () {
    $('#image').cropper({
      viewMode: 1,
      // background: false,
      autoCrop: false,
    });
  });
}


function getTightBoundingBox(imageData) {
  const { data, width, height } = imageData;
  let top = height, left = width, right = 0, bottom = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      const isOpaque = a > 0;
      const isNotWhite = !(r === 255 && g === 255 && b === 255);

      if (isOpaque && isNotWhite) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        found = true;
      }
    }
  }

  return { bbox: found
    ? { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }
    : {x:0 , y:0 , width, height} };
}


function _openDB() {
  console.log('openDB', DB_NAME, STORE_NAME)
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = function (event) {
      resolve(event.target.result);
    };
    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

function openDB() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open(DB_NAME);
    let needsUpgrade = false;

    request.onsuccess = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Must upgrade
        db.close();
        const newVersion = db.version + 1;
        const upgradeRequest = indexedDB.open(DB_NAME, newVersion);
        upgradeRequest.onupgradeneeded = function (e) {
          const upgradedDB = e.target.result;
          if (!upgradedDB.objectStoreNames.contains(STORE_NAME)) {
            upgradedDB.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        upgradeRequest.onsuccess = function (e) {
          resolve(e.target.result);
        };
        upgradeRequest.onerror = function (e) {
          reject(e.target.error);
        };
      } else {
        resolve(db);
      }
    };

    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}


function saveImageWithMetadata(id, imageBlob, metadata = {}) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const obj = { id, image: imageBlob, metadata };
      const req = store.put(obj);
      req.onsuccess = () => resolve();
      req.onerror = e => reject(e);
    });
  });
}

function getImageWithMetadata(id) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = e => reject(e);
    });
  });
}

function getAllImagesWithMetadata() {
  return openDB().then(db => {
    // If store does not exist, create it and return []
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.close();
      // Bump version to trigger onupgradeneeded and create store
      const request = indexedDB.open(DB_NAME, db.version );
      request.onupgradeneeded = function (event) {
        const db2 = event.target.result;
        if (!db2.objectStoreNames.contains(STORE_NAME)) {
          db2.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      return new Promise((resolve, reject) => {
        request.onsuccess = function () {
          request.result.close();
          resolve([]);
        };
        request.onerror = function (e) {
          reject(e);
        };
      });
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = e => reject(e);
    });
  });
}

// Utility: Convert dataURL to Blob
function dataURLToBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Utility: Convert Blob to dataURL (async)
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function createArticleCard(name, img, id) {
  var imgElem = document.createElement('img');
  imgElem.setAttribute('class', 'card-img-center');

  try {
    const record = await getImageWithMetadata(id);
    if (record && record.image) {
      const dataURL = await blobToDataURL(record.image);
      imgElem.setAttribute('src', dataURL);
    } else {
      imgElem.setAttribute('alt', 'Image not found');
    }
  } catch (err) {
    imgElem.setAttribute('alt', 'Error loading image');
    console.error('Failed to load image for card:', err);
  }

  imgElem.setAttribute('alt', name);

  var card = document.createElement('div');
  card.setAttribute('id', 'card');
  card.setAttribute('class', 'card');

  var a = document.createElement('a');
  a.setAttribute('class', 'btn btn-primary');
  a.setAttribute('onclick', 'changeCoverImage(' + "'" + id + "'" + ')');
  a.innerText = name;

  card.appendChild(imgElem);
  card.appendChild(a);

  $('#right-top').append(card);
}

async function changeCoverImage(id) {
  console.log('changeCover');

  try {
    const record = await getImageWithMetadata(id);
    if (!record || !record.image) {
      console.warn('No image found in IndexedDB for id:', id);
      return;
    }
    const _imageDataURL = await blobToDataURL(record.image);

    $('#image').cropper('replace', _imageDataURL);
    var image = new Image();
    image.src = _imageDataURL;

    _backupImage = clone(image);
    StackMoves = [];
    SpaceRect = [];
  } catch (err) {
    console.error('Failed to load image from IndexedDB:', err);
  }
}

function loadRightTopFromIndexedDB() {
  // Clear current cards
  $('#right-top').empty();
  getAllImagesWithMetadata().then(records => {
    records.forEach(record => {
      if (record && record.id) {
        createArticleCard('added', record.id, record.id);
      }
    });
  }).catch(err => {
    console.error('Failed to load images from IndexedDB:', err);
  });
}

function startCanvasEditor( namespace ) {



  STORE_NAME = namespace;


  $('#image').cropper({
    // preview: '.preview',

    viewMode: 1,
    autoCrop: false,

    crop: function (e) {

    },
    zoom: function (event) {
      var cropper = $(this).data('cropper');
      var canvasData = cropper.getCanvasData();
      var containerData = cropper.getContainerData();

      // Calculate center positions
      var centerX = containerData.width / 2;
      var centerY = containerData.height / 2;

      // Set canvas data so image center aligns with container center
      cropper.setCanvasData({
        left: centerX - canvasData.width / 2,
        top: centerY - canvasData.height / 2,
        width: canvasData.width,
        height: canvasData.height
      });
    }
  });

  var KeyState = true;



  $('#saveNewsClip').on('shown.bs.modal', async function () {
    var index = CroppedArticles.length;

    if (index > 0) {
      try {
        const record = await getImageWithMetadata(CroppedArticles[index - 1]);
        if (record && record.image) {
          const dataURL = await blobToDataURL(record.image);
          $('#previewCroppedArticle')[0].src = dataURL;
        } else {
          $('#previewCroppedArticle')[0].src = '';
        }
      } catch (err) {
        $('#previewCroppedArticle')[0].src = '';
        console.error('Failed to load preview image from IndexedDB:', err);
      }
    }

    KeyState = false;
    $('#article_name').focus();
  })
  $('#saveNewsClip').on('hidden.bs.modal', function () {

    KeyState = true;

  })



  var _backupImage = clone('#image')



  initButtonSetup('#image');


  var StackMoves = []
  var SpaceRect = []


  //Main Data Stack


  var MainStack = []


  //Cropped Artcle Stack

  var CroppedArticles = []



  // (Removed duplicate createArticleCard and changeCoverImage from inside startCanvasEditor)


  function convertImageToCanvas(image) {
    var canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext("2d").drawImage(image, 0, 0);

    return canvas;
  }






  function clone(image) {
    return $(image).clone()[0];
  }

  function backupImage(image) {

    // var _backupImage = $(image).clone()[0];


    var canvas = convertImageToCanvas(_backupImage);
    var image = canvas.toDataURL();
    $('#image').cropper('replace', image);
  }

  function drawImage() {
    var elem_img = _backupImage;
    var canvas = convertImageToCanvas(elem_img);
    var ctx = canvas.getContext("2d");
    ctx.globalAlpha = 0.5;
    ctx.beginPath();

    var MissedExcluded = []

    for (i of SpaceRect) {

      if (i.include == true) {
        ctx.fillStyle = 'green';
        let CropBoxData = i.coordinates;
        ctx.rect(CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height);

      }
      else if (i.include == false) {

        MissedExcluded.push(i)


      }



    }

    ctx.fill()
    var image = canvas.toDataURL();
    $('#image').cropper('replace', image);


  }

  function blurRect(image, include) {

    let CropBoxData = $(image).cropper('getData');
    console.log('croppeddata', CropBoxData, ( CropBoxData.width   <= 0 ) 
  ,
   (CropBoxData.height <= 0)
  )
    if( ( CropBoxData.width   <= 0 ) ||   (CropBoxData.height  <= 0)){
      return
    }
    console.log('CropBoxData', CropBoxData)
    if (include == true) {
      SpaceRect.push({ 'coordinates': CropBoxData, 'include': true });
      console.log(SpaceRect);
    }
    else {
      SpaceRect.push({ 'coordinates': CropBoxData, 'include': false });
      console.log(SpaceRect);
    }


    var elem_img = _backupImage;
    var canvas = convertImageToCanvas(elem_img);
    var ctx = canvas.getContext("2d");
    ctx.globalAlpha = 0.5;
    ctx.beginPath();

    var MissedExcluded = []

    clipboard = '"'
    for (i of SpaceRect) {


      clipboard += '' + Math.round(CropBoxData.x) + "," + Math.round(CropBoxData.y) + ":" + Math.round(CropBoxData.x + CropBoxData.width) + ',' + Math.round(CropBoxData.y + CropBoxData.height) + ' '


      if (i.include == true) {
        ctx.fillStyle = 'green';
        CropBoxData = i.coordinates;
        ctx.rect(CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height);

      }
      else if (i.include == false) {

        MissedExcluded.push(i)


      }



    }

    clipboard += '"'
    console.log(clipboard);

    ctx.fill()
    ctx.beginPath();
    for (i of MissedExcluded) {
      ctx.fillStyle = 'red';
      CropBoxData = i.coordinates;
      ctx.rect(CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height);

    }

    ctx.fill()
    var image = canvas.toDataURL();
    $('#image').cropper('replace', image);
    $('#image').cropper('clear');




  }


  function copyToNewCanvasResetCrop(ctxOld, ctxNew, CropBoxData) {
    console.log('CropBoxData', CropBoxData)
    var imgData = ctxOld.getImageData(CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height);
    ctxNew.putImageData(imgData, 0, 0);



  }


  function copyToNewCanvas(ctxOld, ctxNew, CropBoxData) {
    var imgData = ctxOld.getImageData(CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height);
    ctxNew.putImageData(imgData, CropBoxData.x, CropBoxData.y);




  }


  function clearRect(image) {
    var elem_img = _backupImage;
    var canvas = convertImageToCanvas(elem_img);
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';

    var newCanvas = canvas.cloneNode();

    canvas.clone

    console.log(canvas.width)
    console.log(canvas.height)

    newCanvas.width = canvas.width
    newCanvas.height = canvas.height


    var _ctx = newCanvas.getContext("2d");

    var _default = true;
    var Left = 0;
    var Right = 0;
    var Top = 0;
    var Bottom = 0;

    for (i of SpaceRect) {

      const CropBoxData = i.coordinates;
      const include = i.include;

      if (include)  {


      if (_default) {
        _default = false;
        Left = CropBoxData.x;
        Right = CropBoxData.width + Left;
        Top = CropBoxData.y;
        Bottom = CropBoxData.height + Top

      }
      else {

        if (Left > CropBoxData.x)
          Left = CropBoxData.x;


        if (Right < CropBoxData.width + CropBoxData.x)
          Right = CropBoxData.width + CropBoxData.x;


        if (Top > CropBoxData.y)
          Top = CropBoxData.y;


        if (Bottom < CropBoxData.height + CropBoxData.y)
          Bottom = CropBoxData.height + CropBoxData.y;



      }


      copyToNewCanvas(ctx, _ctx, CropBoxData)
      }


    }

    for (i of SpaceRect) {

      const CropBoxData = i.coordinates;
      const include = i.include;

      if (!include)  {



    _ctx.clearRect(CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height);
        
    
      }


    }
  
    



    var _CropBoxData = {};
    _CropBoxData.x = Left;
    _CropBoxData.y = Top;
    _CropBoxData.width = Right - Left;
    _CropBoxData.height = Bottom - Top;


    var _newCanvas = document.createElement('canvas')

    _newCanvas.width = _CropBoxData.width;
    _newCanvas.height = _CropBoxData.height;

    var __ctx = _newCanvas.getContext("2d");



    copyToNewCanvasResetCrop(_ctx, __ctx, _CropBoxData);



    const backupCanvas = document.createElement('canvas');
backupCanvas.width = canvas.width;
backupCanvas.height = canvas.height;

const backupCtx = backupCanvas.getContext('2d');

// Copy the main canvas to backup
backupCtx.drawImage(canvas, 0, 0);


    for (i of SpaceRect) {
      CropBoxData = i.coordinates;

      let include = i.include;

       if (include) {
    // Clear this region
    ctx.clearRect(CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height);
  } else {
    // Redraw the original image in this region
    // ctx.drawImage(backupCanvas, CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height, CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height);
  }

      // ctx.clearRect(CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height);
    }

     for (i of SpaceRect) {
      CropBoxData = i.coordinates;

      let include = i.include;

       if (include) {
    // Clear this region
    // ctx.clearRect(CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height);
  } else {
    // Redraw the original image in this region
    ctx.drawImage(backupCanvas, CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height, CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height);
  }

      // ctx.clearRect(CropBoxData.x, CropBoxData.y, CropBoxData.width, CropBoxData.height);
    }
    

    // get new bounding box
    const fullImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { bbox } = getTightBoundingBox(fullImage);
    console.log('bbox_reaclc', fullImage, bbox);
    transform.offsetX += bbox.x;
    transform.offsetY += bbox.y;
 

if (bbox) {
  const croppedData = ctx.getImageData(bbox.x, bbox.y, bbox.width, bbox.height);
  canvas.width = bbox.width;
  canvas.height = bbox.height;
  
  
  ctx.putImageData(croppedData, 0, 0);
  resetCropperWithCanvas(canvas);


  

  console.log('bbox_operation', canvas.width , canvas.height, bbox.width , bbox.height)

  // Also update cropper if you're using one
  //   $('#image').cropper('setCropBoxData',  {
  //   left: 0,
  //   top: 0,
  //   width: bbox.width,
  //   height: bbox.height
  // });



  
}
    // console.log('newbbobox', bbox)








    var image = canvas.toDataURL();

    var TimeStamp = Date.now();

    var name_article = 'CroppedArticle_' + TimeStamp;

    CroppedArticles.push(name_article);

    // Convert to Blob and save to IndexedDB with optional metadata
    var articleMeta = {
      created: TimeStamp,
      boundingBoxes: SpaceRect,
      outlineBox: transform,
      // Add more metadata fields as needed, e.g. title, tags, etc.
    };
    console.log('articleMeta', articleMeta.outlineBox, articleMeta.boundingBoxes , canvas.width , canvas.height)
    var newCanvasDataURL = _newCanvas.toDataURL();
    var newCanvasBlob = dataURLToBlob(newCanvasDataURL);

    saveImageWithMetadata(name_article, newCanvasBlob, articleMeta)
      .then(() => {
        createArticleCard('added', name_article, name_article);
      })
      .catch((err) => {
        console.error('Failed to save image to IndexedDB:', err);
      });

      // $('#image').cropper('clear');  // Clear the crop box


  

    var _image = new Image();
    _image.src = image;

    _backupImage = clone(_image);
    StackMoves = [];
    SpaceRect = [];



  }

  function SaveState() {


    MainStack.push(SpaceRect);

  }




  function saveArtcleCropped(image) {


    $('#saveNewsClip').modal('show');
    




  }



  function EnterKey(image) {
    $(document).keypress(function (e) {
      if (e.which == 13 && KeyState) {






        SaveState();
        console.log('MainStack', MainStack)
        clearRect(image);

        
        console.log('done')


  
        // saveArtcleCropped(image);



      }
    });
  }


  function SpaceKey(image) {
    $(document).keypress(function (e) {
      if (e.which == 32 && KeyState) {

        // var tmp = $('#image').cropper('getData')






        blurRect(image, true);
        //Save The cropped Area and Transform And Reset









      }
    });
  }

  function EscapeKey(image) {

    $(document).keyup(function (e) {
      if (e.keyCode == 27 && KeyState) {
        // $(image).cropper('clear')
        $(image).cropper('clear');
      }
    });

  }

  function DeleteKey(image) {

    $(document).keyup(function (e) {
        // console.log('deleteke' , e)
       const isDeleteKey = e.key === 'Delete' || e.key == 'Backspace' || e.keyCode === 46;

      if (isDeleteKey && KeyState) {
        blurRect(image, false);
      }
    });

  }


  function ControlZ(image) {
    $(document).keydown(function (e) {
      if (e.keyCode == 90 && e.ctrlKey && KeyState) {
        Undo();
      }
    });

  }
  function ControlR(image) {
    $(document).keydown(function (e) {
      if (e.keyCode == 82 && e.ctrlKey && KeyState) {
        Redo();
      }
    });

  }

  function BackspaceKey(image) {

    $(document).keyup(function (e) {
      if (e.keyCode == 8 && KeyState) {
        Undo();

      }
    });

  }


  function initButtonSetup(image) {

    EscapeKey(image);
    EnterKey(image);
    SpaceKey(image);
    // BackspaceKey(image);
    ControlZ(image)
    ControlR(image)
    DeleteKey(image);
  }

  function Undo() {
    var tmp = SpaceRect.pop();
    if (tmp) {

      StackMoves.push(tmp);
      drawImage();
    }

  }

  function Redo() {
    var tmp = StackMoves.pop();

    if (tmp) {
      SpaceRect.push(tmp);
      drawImage();

    }

  }

  

  setTimeout( ()=>{
 var elem_img = _backupImage;
    var canvas = convertImageToCanvas(elem_img);
    var ctx = canvas.getContext("2d");
   const fullImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { bbox } = getTightBoundingBox(fullImage);
    console.log('bbox_reaclc', fullImage, bbox);
  } , 10)
   
   
  // On editor start, load all images/cards from IndexedDB into right-top
  loadRightTopFromIndexedDB();
}





// Footer toolbar: Center Image button logic
// $('#centerImageBtn').on('click', function () {
//   var cropper = $('#image').data('cropper');
//   if (!cropper) return;
//   // Clear any crop box/selections
//   cropper.clear();
//   // Reset image: fits image to screen, resets zoom/pan, and removes all transformations
//   cropper.reset();
// });

// // Footer toolbar: Toggle Cropper button logic
// $('#toggleCropperBtn').on('click', function () {
//   var cropper = $('#image').data('cropper');
//   if (!cropper) return;
//   if (cropper.enabled) {
//     cropper.disable();
//     // Optionally, visually indicate disabled state
//     $('#toggleCropperBtn').addClass('disabled');
//   } else {
//     cropper.enable();
//     $('#toggleCropperBtn').removeClass('disabled');
//   }
// });
