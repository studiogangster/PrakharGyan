function startCarousel(pics)
{
var Parent =$('.carousel-inner.slide')[0]
Parent.innerHTML = ""

for(pic of pics)
{
var div = document.createElement('div')

div.setAttribute('class','carousel-item active slide');


var img = document.createElement('img')

img.setAttribute('class','carousel-item active slide');

img.setAttribute('src',pic);

div.append(img)

Parent.append(div)


}

}