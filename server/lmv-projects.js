//
// Copyright (c) Autodesk, Inc. All rights reserved
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
var _fs =require ('fs') ;
var _path =require ('path') ;
var crypto =require ('crypto') ;
var config =require ('./credentials') ;
var ForgeApis = require('forge-apis');

var router =express.Router () ;

router.get ('/translate/:urn/progress', function (req, res) {
	var accessToken =req.query.accessToken ;
	var urn =req.params.urn ;

	var oAuth2 =new ForgeApis.AuthClientTwoLegged ('', '', config.credentials.scope) ;
	oAuth2.setCredentials ({
		access_token: accessToken,
		type: 'Bearer',
		expires_at: 3599,
	}) ;

	var md = new ForgeApis.DerivativesApi();
	md.getManifest (urn, {}, oAuth2, oAuth2.getCredentials ())
		.then (function (data) {
			var name =_path.basename (Buffer.from (data.body.urn, 'base64').toString ()) ;
			if ( data.body.derivatives !== undefined && data.body.derivatives.length > 0 && data.body.derivatives [0].hasOwnProperty ('name') )
				name =data.body.derivatives [0].name ;
			res.json ({
				status: data.body.status,
				progress: data.body.progress,
				urn: data.body.urn,
				name: name
			}).end () ;
			console.log ('Request: ' + data.body.status + ' (' + data.body.progress + ')') ;
		})
		.catch (function (error) {
			res.status (404).end () ;
		}) ;
}) ;

function makeKey (file) {
	var filename =_path.basename (file) ;
	return (filename) ;
}

function singleUpload (bucketKey, filename, total, oAuth2) {
	var objectKey =makeKey (filename) ;
	var readStream =_fs.createReadStream (filename) ;
	var ossObjects =new ForgeApis.ObjectsApi () ;
	return (ossObjects.uploadObject (bucketKey, objectKey, total, readStream, {}, oAuth2, oAuth2.getCredentials ())) ;
}

function ExistOrCreate (bucketKey, oAuth2) {
	console.log ('Check Bucket if bucket exists...') ;
	var ossBuckets =new ForgeApis.BucketsApi () ;
	return (ossBuckets.getBucketDetails (bucketKey, oAuth2, oAuth2.getCredentials ())
		.then (function (results) {
			return (results) ;
		})
		.catch (function (error) {
			console.log ('Create Bucket...') ;
			var opts ={
				bucketKey: bucketKey,
				policyKey: 'persistent'
			} ;
			var headers ={
				xAdsRegion: 'US'
			} ;
			return (ossBuckets.createBucket (opts, headers, oAuth2, oAuth2.getCredentials ())) ;
		})
	) ;
}

function filesize (path) {
	return (new Promise (function (fulfill, reject) {
		_fs.stat (path, function (err, stat) {
			if (err)
				reject (err) ;
			else
				fulfill (stat.size) ;
		}) ;
	})) ;
}

router.post ('/translate', function (req, res) {
	var accessToken =req.body.accessToken ;
	var filename =_path.normalize (__dirname + '/../' + req.body.file) ;
	var hash =crypto.createHash ('md5').update (config.credentials.client_id).digest ('hex').replace (/\W+/g, '') ;
	var bucketKey =
		  'model'
		+ new Date ().toISOString ().replace (/T/, '-').replace (/:+/g, '-').replace (/\..+/, '')
		+ '-' + hash ;

	var oAuth2 =new ForgeApis.AuthClientTwoLegged ('', '', config.credentials.scope) ;
	oAuth2.setCredentials ({
		access_token: accessToken,
		type: 'Bearer',
		expires_at: 3599,
	}) ;

	var size ;
	filesize(filename)
		.then (function (results) {
			size =results ;
			return (ExistOrCreate (bucketKey, oAuth2)) ;
		})
		.then (function (bucket) {
			console.log ('async upload') ;
			var total =size ;
			//var chunkSize =config.fileResumableChunk * 1024 * 1024 ;
			//if ( total <= chunkSize )
				return (singleUpload (bucketKey, filename, total, oAuth2)) ;
			//else
			//	return (uploadFileAsChunks (bucketKey, filename, total, chunkSize, oAuth2)) ;
		})
		.then (function (data) {
			console.log ('Launching translation') ;
			var job ={
				input: {
					urn: new Buffer (data.body.objectId).toString ('base64'),
					//compressedUrn: false,
					//rootFilename: data.objectKey
				},
				output: {
					formats: [
						{
							type: 'svf',
							views: [
								'2d',
								'3d'
							]
						}
					]
				}
			} ;
			var md =new ForgeApis.DerivativesApi () ;
			return (md.translate (job, { xAdsForce: true }, oAuth2, oAuth2.getCredentials ())) ;
		})
		.then (function (results) {
			res.json (results.body) ;
		})
		.catch (function (error) {
			console.log (JSON.stringify (error)) ;
			res.status (500).end () ;
		})
	;
}) ;

module.exports =router ;
