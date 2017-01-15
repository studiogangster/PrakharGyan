#Requires SUDO Permssion
echoerr()
{
echo "Test cases failed !!!" >&2
exit 60

}      

resetDirector(){
	
rm -rf $1 > /dev/null

mkdir -p "$1"sd
mkdir -p "$1"fd
mkdir -p "$1"hd
mkdir -p "$1"thumb
}

ClearShit(){
	
rm -rf $1 > /dev/null
echoerr "Conversion Failed" >&2

}


ImageOutput="ShellImages/"
InputDirectory=$1

if [ -z "$InputDirectory" ];then
echoerr "No Input File Specified"; 
fi


if !(resetDirector $ImageOutput);then
echoerr "Unable To Create Directory.. Check for required permissions"
fi

if gs -sDEVICE=jpeg -dTextAlphaBits=4 -r150 -o "$ImageOutput"sd/tmp%03d.png $InputDirectory > /dev/null;then
echo "SD Converted"
else
ClearShit $ImageOutput
fi

if gs -sDEVICE=jpeg -dTextAlphaBits=4 -r600 -o "$ImageOutput"fd/tmp%03d.png $InputDirectory > /dev/null;then
echo "FD Converted"
else
ClearShit $ImageOutput
fi

if gs -sDEVICE=jpeg -dTextAlphaBits=4 -r300 -o "$ImageOutput"hd/tmp%03d.png $InputDirectory > /dev/null;then
echo "HD Converted"
else
ClearShit $ImageOutput
fi

if gs -sDEVICE=jpeg -dTextAlphaBits=4 -r15 -o "$ImageOutput"thumb/tmp%03d.png $InputDirectory > /dev/null;then
echo "THUMS Converted"
else
ClearShit $ImageOutput
fi