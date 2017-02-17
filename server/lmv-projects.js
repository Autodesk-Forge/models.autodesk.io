//
// Copyright (c) Autodesk, Inc. All rights reserved 
//
// Node.js server workflow 
// by Cyrille Fauvel - Autodesk Developer Network (ADN)
// January 2015
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted, 
// provided that the above copyright notice appears in all copies and 
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting 
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS. 
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC. 
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
//
var express =require ('express') ;
var bodyParser =require ('body-parser') ;
var fs =require ('fs') ;
var path =require ('path') ;
var promisify =require ('es6-promisify') ;
var stat =promisify (fs.stat) ;
var readFile =promisify (fs.readFile) ;

var ForgeOSS =require ('forge-oss') ;
var ForgeModelDerivative =require ('forge-model-derivative') ;

var config =require ('./credentials') ;

var ossBuckets =new ForgeOSS.BucketsApi () ;
var ossObjects =new ForgeOSS.ObjectsApi () ;
var md =new ForgeModelDerivative.DerivativesApi () ;

var router =express.Router () ;
router.use (bodyParser.json ()) ;

router.get ('/translate/:urn/progress', function (req, res) {
	var accessToken =req.query.accessToken ;
	var urn =req.params.urn ;

	//ForgeOSS.ApiClient.instance.authentications ['oauth2_application'].accessToken =accessToken ;
	ForgeModelDerivative.ApiClient.instance.authentications ['oauth2_application'].accessToken =accessToken ;
	md.getManifest (urn, {})
		.then (function (data) {
			var name =path.basename (Buffer.from (data.urn, 'base64').toString ()) ;
			if ( data.derivatives !== undefined && data.derivatives.length > 0 && data.derivatives [0].hasOwnProperty ('name') )
				name =data.derivatives [0].name ;
			res.json ({
				status: data.status,
				progress: data.progress,
				urn: data.urn,
				name: name
			}).end () ;
			console.log ('Request: ' + data.status + ' (' + data.progress + ')') ;
		})
		.catch (function (error) {
			res.status (404).end () ;
		}) ;
}) ;

function makeKey (file) {
	var filename =path.basename (file) ;
	return (filename) ;
}

function singleUpload (bucketKey, filename, total) {
	var objectKey =makeKey (filename) ;
	var readStream =fs.createReadStream (filename) ;
	return (ossObjects.uploadObject (bucketKey, objectKey, total, readStream, {})) ;
}

router.post ('/translate', function (req, res) {
	var accessToken =req.body.accessToken ;
	var filename =path.normalize (__dirname + '/../' + req.body.file) ;
	var bucketKey =
		  'model'
		+ new Date ().toISOString ().replace (/T/, '-').replace (/:+/g, '-').replace (/\..+/, '')
		+ '-' + accessToken.toLowerCase ().replace (/\W+/g, '') ;

	ForgeOSS.ApiClient.instance.authentications ['oauth2_application'].accessToken =accessToken ;
	ForgeModelDerivative.ApiClient.instance.authentications ['oauth2_application'].accessToken =accessToken ;

	var stats ;
	stat (filename)
		.then (function (results) {
			stats =results ;
			console.log ('Create Bucket...') ;
			var opts ={
				"bucketKey": bucketKey,
				"policyKey": 'transient'
			} ;
			var headers ={
				'xAdsRegion': 'US'
			} ;
			return (ossBuckets.createBucket (opts, headers)) ;
		})
		.then (function (bucket) {
			console.log ('async upload') ;
			var total =stats.size ;
			var chunkSize =config.fileResumableChunk * 1024 * 1024 ;
			if ( total <= chunkSize )
				return (singleUpload (bucketKey, filename, total)) ;
			//else
			//	return (uploadFileAsChunks (bucketKey, filename, total, chunkSize)) ;
		})
		.then (function (data) {
			console.log ('Launching translation') ;
			var job ={
				"input": {
					"urn": new Buffer (data.objectId).toString ('base64'),
					"compressedUrn": false,
					"rootFilename": data.objectKey
				},
				"output": {
					"formats": [
						{
							"type": "svf",
							"views": [
								"2d",
								"3d"
							]
						}
					]
				}
			} ;
			return (md.translate (job, { 'xAdsForce': true })) ;
		})
		.then (function (results) {
			res.json (results) ;
		})
		.catch (function (error) {
			console.log (JSON.stringify (error)) ;
			res.status (500).end () ;
		})
	;
}) ;


module.exports =router ;
