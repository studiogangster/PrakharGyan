echo off
set dir_name=%1
echo %file_name%

rmdir /s /q public\images\%dir_name%\thumbnails
rmdir /s /q public\images\%dir_name%\SDimages
rmdir /s /q public\images\%dir_name%\HDimages

md public\images\%dir_name%\thumbnails
md public\images\%dir_name%\SDimages
md public\images\%dir_name%\HDimages

gsc -sDEVICE=jpeg -dTextAlphaBits=4 -r15 -o public\images\%dir_name%\thumbnails\image_%%03d.jpg in.pdf
gsc -sDEVICE=jpeg -dTextAlphaBits=4 -r90 -o public\images\%dir_name%\SDimages\image_%%03d.jpg in.pdf
gsc -sDEVICE=jpeg -dTextAlphaBits=4 -r300 -o public\images\%dir_name%\HDimages\image_%%03d.jpg in.pdf