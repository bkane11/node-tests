var requestHandler  = {},
    url             = require( "url" ),
    qs              = require( "querystring" ),
    fs              = require( "fs-then" ),
    formidable      = require( "formidable" ),
    mime            = require( "mime" )
	http = require('http'),
	path = require('path'),
	port = 9005
;

var server = http.createServer(function(req, res) {
	console.log(req.url);
	res.writeHead("Access-Control-Allow-Origin", "*");
  switch (req.url.split('?')[0]) {
    case '/' || '':
      requestHandler.start(res);
      break;
    case '/upload':
      requestHandler.upload(res, req);
      break;
    case '/show':
      requestHandler.show(res, req);
      break;
    case '/addAttachment':
      requestHandler.sendToAGS(req, res);
      break;
    default:
		// requestHandler.start(res);
      // show_404(req, res);
      break;
  }
});
server.listen(port);

requestHandler.start = function( response ) {
    var body = "<html>\n"+
               "<head>\n"+
                "\t<meta http-equiv='Content-Type' content='text/html; charset=UTF-8' />\n"+
                "\t<title>Welcome to the nodejs tutorial</title>\n"+
                "</head>\n"+
                "<body>\n"+
                "\t<form action='/upload' method='post' enctype='multipart/form-data'>\n" +
                "\t\t<input type='file' name='upload' />\n" +
                "\t\t<input type='submit' value='Upload File' />\n" +
                "\t</form>\n"+
                "</body>\n"+
                "</html>\n";
        
    console.log( "Request for 'start' is called." );
    response.writeHead( 200, { "Content-Type" : "text/html" } );
    response.end( body );
};

requestHandler.upload = function( response, request ) {
    console.log( "Request for 'upload' is called." );
    console.log( "Preparing upload" );
    var form = new formidable.IncomingForm();
	form.uploadDir = 'temp'
    form.parse( request, function( error, fields, file ){
        console.log( "Completed Parsing" );
		file.path = form.uploadDir + "/" + file.upload.name;
        if( error ){
            response.writeHead( 500, { "Content-Type" : "text/plain" } );
            response.end( "CRAP! " + error + "\n" );
            return;
        }
        fs.renameSync( file.upload.path, file.path );
		fs.readFile(
			file.path,
			// path.join(__dirname, image),
			function (err, data) {
				if( err ){
					response.writeHead( 500, { "Content-Type" : "text/plain" } );
					response.end( err + "\n" );
					return;
				}
				var type = mime.lookup( file.upload.name ),
					prefix = "data:" + type + ";base64,",
					base64 = new Buffer(data, 'binary').toString('base64'),
					img = prefix + base64;
				response.writeHead( 200, { "Content-Type" : "text/html" } );
				response.write( "received image <br />" );
				response.end( "<img src='"+ img +"' />" );
				// response.end( "<img src='/show?duri=true&i="+ file.path +"' />" );
		})
    });
};

requestHandler.show = function( response, request ) {
    var image = qs.parse( url.parse( request.url ).query ).i,
		datauri = qs.parse( url.parse( request.url ).query ).duri
    if( !image ){
        response.writeHead( 500, { "Content-Type" : "text/plain" } );
        response.end( " No Image in QueryString ");
        return;
    }
	var type = mime.lookup( image ),
		prefix = "data:" + type + ";base64,";
	console.log( "Request handler 'show' was called. " );
	console.log(image, type, prefix);
	fs.readFile(
        path.join(__dirname, image).replace('\\lib',''),
        function (err, data) {
			if( err ){
				response.writeHead( 500, { "Content-Type" : "text/plain" } );
				response.end( err + "\n" );
				return;
			 }
			base64 = new Buffer(data, 'binary').toString('base64'),
			img = prefix + base64;
			if(!datauri){
				response.writeHead( 200 , { "Content-Type" : "text/html" });
				response.end('<img src="'+img+'"/>');
			}else{
				// response.writeHead( 200 , { "Content-Type" : "text/plain" });
				response.end(img);
			}
    })
};

requestHandler.sendToAGS = function( request, response ) {
	console.log( "Request for 'add attachment' is called." );
    console.log( "Preparing upload" );
	
	body = '';
	request.on('data', function(chunk){
		console.log(chunk)
		body+=chunk;
	});
	request.on('end', function(e){
		body = JSON.parse(body);
		console.log(body.imgData);
		console.log(body.fileName);
		console.log('temp/'+body.fileName);
		var f = fs.writeFile('temp/'+body.fileName, new Buffer(body.imgData.replace('data:image/jpeg;base64,',''), 'base64'), function(err) { 
			if(err){
				response.writeHead( 500, { "Content-Type" : "text/plain" } );
				response.end( err + "\n" );
				return;
			}
			response.writeHead( 200, { "Content-Type" : "text/html" } );
			response.write( "received image <br />" );
			response.end('<img src="data:image/jpeg;base64,'+imgData+'"/>');
		}).then(console.log('file written:', f));
	});
}

exports.start   = requestHandler.start;
exports.upload  = requestHandler.upload;
exports.show    = requestHandler.show;