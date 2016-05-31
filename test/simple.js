//var mocha =require ('mocha') ;
//var expect =require ('Chai').expect ;
//var request =require ('request') ;
var request =require ('supertest') ;
var should =require ('should') ;
var app =require ('../server/server') ;
var fs =require ('fs') ;
var path =require ('path') ;
app.set ('port', process.env.PORT || 8000) ;

describe ('Starting Test server...', function () {

	var server ;
    var port =app.get ('port') ;
	//var url ='https://models.autodesk.io' ;
	//var url ='http://localhost:' + port ;

	// Start/End test server
	before (function (done) {
		console.log ('Starting server listening on port ' + app.get ('port')) ;
		this.timeout (12000) ;
		server =app.listen (port, function () {
			console.log ('Server listening on port ' + server.address ().port) ;
            setTimeout (done, 6000) ;
		}) ;
	}) ;

	after (function () {
		server.close () ;
	}) ;

	// Tests
	describe ('Setup & token module', function () {
		it('server/credentials.js present', function (done) {
			fs.exists ('server/credentials.js', function (exists) {
				exists.should.be.equal (true) ;
				done () ;
			}) ;
		}) ;

		var access_tokenEP ='/api/token' ;
		it('(get) ' + access_tokenEP + ' - returns status 500 because no oAuth key pair', function (done) {
			request (app)
				.get (access_tokenEP)
				.expect (500, done) ;
		}) ;

	}) ;

}) ;
