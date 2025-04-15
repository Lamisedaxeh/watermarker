const PDFDocument = require('pdfkit');
const blobStream = require('blob-stream');

/* Form TODO :
- Custom space in line
	- Verify all type of image
	- Import PDF
	- Import PDF multi page
	- Export PDF multi page
	- Export page PDF to multi png in zip 

	idea :
	 - Layering
	 - Metadata
	 - steganography mark
	*/

//Get canvas information
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

//Handle the image upload into canvas 
//https://jsfiddle.net/influenztial/qy7h5/
/*var imageLoader = document.getElementById('imageLoader');
//imageLoader.addEventListener('change', handleImage, false);
function handleImage(e){
	var reader = new FileReader();
	reader.onload = function(event){
		var img = ne	Downloadw Image();
		img.onload = function(){
			drawImage(img);
			drawTxt('1234567');
		}
		img.src = event.target.result;
	}
	reader.readAsDataURL(e.target.files[0]);
}*/


var watermarkText = "My Privacy watermark"
var textSpace = 8
var lineSpace = 50
var offsetSpace = 8
var textColor = "rgba(0, 0, 0, 0.5)"

var fileName = "Dummy_CV_test_file"

window.generate = function(){ 
	watermarkText = document.getElementById('watermarkText').value;
	textSpace = Number(document.getElementById('textSpace').value);
	lineSpace = Number(document.getElementById('lineSpace').value);
	offsetSpace = Number(document.getElementById('offsetSpace').value);
	textColor = document.getElementById('textColor').value + Number(document.getElementById('alpha').value).toString(16) ;
	console.log("color " + textColor)



	//Update offset max value 
	document.getElementById("offsetSpace").max = watermarkText.length + textSpace ;
	/*//Removed should be done by the browser
	if (document.getElementById("offsetSpace").max < document.getElementById("offsetSpace").value){
		document.getElementById("offsetSpace").value = document.getElementById("offsetSpace").max
	}*/


	console.log("generating canvas")
	var reader = new FileReader();
	reader.onload = function(event){
		var img = new Image();
		img.onload = function(){
			drawImage(img);
			drawTxt(watermarkText);
		}
		img.src = event.target.result;
	}
	if (document.getElementById("imageLoader").files[0]){
		var file = document.getElementById("imageLoader").files[0];
		fileName = file.name
		reader.readAsDataURL(file);
	} else {
		// Load dummy image
		fetch("./assets/cvTest.png")
			.then(res => res.blob()) // Gets the response and returns it as a blob
			.then(blob => {
				fileName = "Dummy_CV_test_file"
				reader.readAsDataURL(blob);
			});
	} 
}

//Draw the image on canvas
function drawImage(img){
	canvas.width = img.width;
	canvas.height = img.height;
	ctx.drawImage(img,0,0);
}

//Add watermark to canvas
function drawTxt(txt){
	//https://jsfiddle.net/y0b6fv5s/22/
	var offsetWidth = canvas.width/2;
	var offsetHeight = canvas.height/2;

	//Calculate the future size of the rotated rectangle using pythagore 
	//https://fr.wikipedia.org/wiki/Triangle_isoc%C3%A8le_rectangle
	var squareHeight = canvas.width/Math.SQRT2 + canvas.height/Math.SQRT2 //Height of with of the square

	//Save the context before rotate
	ctx.save()
	ctx.translate(offsetWidth, offsetHeight );
	ctx.rotate(45 * Math.PI / 180);

	//Watermark settings
	ctx.font = parseFloat(document.getElementById('textSize').value) + "px Arial";//TODO Change with a case size fixed font
	var txtHeight=ctx.measureText("A").actualBoundingBoxAscent + ctx.measureText("A").actualBoundingBoxDescent; // calc the text Height
	var offsetLeft= ctx.measureText("A").width * offsetSpace; // SizeOfLetter * number of char to offset //TODO
	//lineSpace=50; //TODO
	console.log(lineSpace)
	ctx.fillStyle = textColor//"rgba(0, 0, 0, 0.5)"; //TODO
	spaceSize = new Array(textSpace).join(" ") //TODO

	//Prepare the text fill
	// Calc the size of text + space
	var w=Math.ceil(ctx.measureText(txt + spaceSize).width);

	//Calc the required number of repetition with square size + offsetMax * 2(quick patch) 
	var txt=new Array(Math.ceil((squareHeight + w)/w)*2).join(txt + spaceSize);

	//Filling the image with the watermark
	for(var i=0;i<Math.ceil(squareHeight/(txtHeight+lineSpace));i++){
		ctx.fillText(txt, -((i*offsetLeft % w ) + squareHeight/2), i * (txtHeight+lineSpace) - squareHeight/2)
	}
	//Restore the context for future use
	ctx.restore();
};

//TODO download as pdf or png 
window.downloadFile = function(output){
	var link = document.createElement('a');
	link.download = fileName;
	console.log(link.download)

	switch(output) {
		case "png":
			link.href = canvas.toDataURL("image/png")
			break;
		case "jpg":
			link.href = canvas.toDataURL("image/jpeg", 0.8)
			break;
		case "pdf":
			// create a document with the correct size
			const doc = new PDFDocument({size: [canvas.width,canvas.height]});
			var stream = doc.pipe(blobStream());
			
			//Add the image
			doc.image(canvas.toDataURL("image/jpeg"),0,0);

			//Generate and download
			doc.end();
			stream.on('finish', function() {
				var blob = stream.toBlobURL('application/pdf');
				link.href = blob;
				link.click();//Required
			});

			break;
		default:
			console.log("Error invalid output");
			return 1;
	}
	console.log(link.href)
	link.click();
}

//Load a default image as example
//And make the first generation
generate();
