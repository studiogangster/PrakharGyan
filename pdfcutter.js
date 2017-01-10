var scissors = require('scissors');
 var fs = require('fs');
// Use and chain any of these commands... 
var pdf = scissors('in.pdf')
   .pages(4, 5, 6, 1, 12) // select or reorder individual pages 
   .range(1, 10) // pages 1-10 
   .even() // select even pages 
   .odd() // select odd pages 
   .rotate(90) // 90, 180, 270, 360 
   .compress()
   .uncompress()
   .crop(100, 100, 300, 200) // offset in points from left, bottom, right, top 
 

pdf.pngStream(300).pipe(fs.createWriteStream('picture.jpg')); // PNG of first page at 300 dpi 

 
