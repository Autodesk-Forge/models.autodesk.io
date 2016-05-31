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
var request =require ('request') ;
// unirest (http://unirest.io/) or SuperAgent (http://visionmedia.github.io/superagent/)
var unirest =require('unirest') ;
var async =require ('async') ;
var events =require('events') ;
var util =require ('util') ;
var path =require ('path') ;
var fs =require ('fs') ;
var uid =require ('gen-uid') ;
var config =require ('./credentials') ;

function Lmv (bucketName, accessToken) {
	events.EventEmitter.call (this) ;
	this.bucket =bucketName ;
	this.accessToken =accessToken ;
}
//Lmv.prototype.__proto__ =events.EventEmitter.prototype ;
util.inherits (Lmv, events.EventEmitter) ;

// GET /oss/v1/buckets/:bucket/details
Lmv.prototype.checkBucket =function () {
	var self =this ;
	unirest.get (util.format (config.getBucketsDetailsEndPoint, self.bucket))
		.header ('Accept', 'application/json')
		.header ('Content-Type', 'application/json')
		.header ('Authorization', 'Bearer ' + self.accessToken)
		//.query (params)
		.end (function (response) {
			try {
				if ( response.statusCode != 200 )
					throw response ;
				try { self.emit ('success', response.body) ; } catch ( err ) {}
			} catch ( err ) {
				self.emit ('fail', err) ;
			}
		})
	;
	return (this) ;
} ;

// POST /oss/v1/buckets
Lmv.prototype.createBucket =function (policy) {
	policy =policy || 'transient' ;
	var self =this ;
	unirest.post (config.postBucketsEndPoint)
		.header ('Accept', 'application/json')
		.header ('Content-Type', 'application/json')
		.header ('Authorization', 'Bearer ' + self.accessToken)
		.send ({ 'bucketKey': self.bucket, 'policy': policy })
		.end (function (response) {
			try {
				if ( response.statusCode != 200 || !response.body.hasOwnProperty ('key') )
					throw response ;
				try { self.emit ('success', response.body) ; } catch ( err ) {}
			} catch ( err ) {
				self.emit ('fail', err) ;
			}
		})
	;
	return (this) ;
} ;

Lmv.prototype.createBucketIfNotExist =function (policy) {
	policy =policy || 'transient' ;
	var self =this ;

	unirest.get (util.format (config.getBucketsDetailsEndPoint, self.bucket))
		.header ('Accept', 'application/json')
		.header ('Content-Type', 'application/json')
		.header ('Authorization', 'Bearer ' + self.accessToken)
		//.query (params)
		.end (function (response) {
			try {
				if ( response.statusCode != 200 )
					throw response ;
				try { self.emit ('success', response.body) ; } catch ( err ) {}
			} catch ( err ) {
				//- We need to create one if error == 404 (404 Not Found)
				if ( Number.isInteger (err.statusCode) && err.statusCode == 404 ) {
					unirest.post (config.postBucketsEndPoint)
						.header ('Accept', 'application/json')
						.header ('Content-Type', 'application/json')
						.header ('Authorization', 'Bearer ' + self.accessToken)
						.send ({ 'bucketKey': self.bucket, 'policy': policy })
						.end (function (response) {
							try {
								if ( response.statusCode != 200 || !response.body.hasOwnProperty ('key') )
									throw response ;
								try { self.emit ('success', response.body) ; } catch ( err ) {}
							} catch ( err ) {
								self.emit ('fail', err) ;
							}
						})
					;
				} else {
					self.emit ('fail', err) ;
				}
			}
		})
	;
	return (this) ;
} ;

// upload entry point - will decide to use singleUpload or resumableUpload based on file size
Lmv.prototype.uploadFile =function (filename) {
	var self =this ;
	var serverFile =path.normalize (__dirname + '/../' + filename) ;
	var localFile =path.basename (filename) ;

	fs.stat (serverFile, function (err, stats) {
		if ( err )
			return (self.emit ('fail', err)) ;
		var total =stats.size ;
		var chunkSize =config.fileResumableChunk * 1024 * 1024 ;
		if ( total <= chunkSize )
			self.singleUpload (filename) ;
		else
			self.resumableUpload (filename) ;
	}) ;

	return (this) ;
} ;

// PUT /oss/v1/buckets/:bucket/objects/:filename
Lmv.prototype.singleUpload =function (filename) {
	var self =this ;
	var serverFile =path.normalize (__dirname + '/../' + filename) ;
	var localFile =path.basename (filename) ;

	var readStream =fs.createReadStream (serverFile) ;
	//var endpoint =util.format (config.putFileUploadEndPoint, self.bucket, localFile.replace (/ /g, '+')) ;
    var endpoint =util.format (config.putFileUploadEndPoint, self.bucket, encodeURIComponent (localFile)) ;
	var total =fs.statSync (serverFile).size ;

	readStream.pipe ( // pipe is better since it avoids loading all in memory
		unirest.put (endpoint)
			.headers ({
				'Accept': 'application/json',
				'Content-Type': 'application/octet-stream',
				'Authorization': ('Bearer ' + self.accessToken),
				'Content-Length': total // required from stream
			})
			.end (function (response) {
				try {
					if ( response.statusCode != 200 )
						throw response ;
					try { self.emit ('success', response.body) ; } catch ( err ) {}
				} catch ( err ) {
					self.emit ('fail', err) ;
				}
			}
		)
	) ;

	// The read file version

	//var file =fs.readFile (serverFile, function (err, data) {
	//	if ( err )
	//		return (self.emit ('fail', err)) ;
	//
	//	//var endpoint =util.format (config.putFileUploadEndPoint, self.bucket, localFile.replace (/ /g, '+')) ;
    //  var endpoint =util.format (config.putFileUploadEndPoint, self.bucket, encodeURIComponent (localFile)) ;
	//	unirest.put (endpoint)
	//		.headers ({
	//			'Accept': 'application/json',
	//			'Content-Type': 'application/octet-stream',
	//			'Authorization': ('Bearer ' + self.accessToken)
	//			// 'Content-Length' // not required here
	//		})
	//		.send (data)
	//		.end (function (response) {
	//			try {
	//				if ( response.statusCode != 200 )
	//					throw response ;
	//				try { self.emit ('success', response.body) ; } catch ( err ) {}
	//			} catch ( err ) {
	//				self.emit ('fail', err) ;
	//			}
	//		})
	//	;
	//}) ;
	return (this) ;
} ;

// PUT /oss/v1/buckets/:bucket/objects/:filename/resumable
Lmv.prototype.resumableUpload =function (filename) {
	var self =this ;
	var serverFile =path.normalize (__dirname + '/../' + filename) ;
	var localFile =path.basename (filename) ;

	fs.stat (serverFile, function (err, stats) {
		if ( err )
			return (self.emit ('fail', err)) ;
		var total =stats.size ;
		var chunkSize =config.fileResumableChunk * 1024 * 1024 ;
		var nbChunks =Math.round (0.5 + total / chunkSize) ;
		//var endpoint =util.format (config.putFileUploadResumableEndPoint, self.bucket, localFile.replace (/ /g, '+')) ;
        var endpoint =util.format (config.putFileUploadResumableEndPoint, self.bucket, encodeURIComponent (localFile)) ;
		var sessionId ='models-autodesk-io-' + uid.token () ;

		// pipe is better since it avoids loading all in memory
		var fctChunks =function (n, chunkSize) {
			return (function (callback) {
				var start =n * chunkSize ;
				var end =Math.min (total, (n + 1) * chunkSize) - 1 ;
				var contentRange ='bytes '
					+ start + '-'
					+ end + '/'
					+ total ;
				var readStream =fs.createReadStream (serverFile, { 'start': start, 'end': end }) ;
				readStream.pipe (
					unirest.put (endpoint)
						.headers ({
							'Accept': 'application/json',
							'Content-Type': 'application/octet-stream',
							'Authorization': ('Bearer ' + self.accessToken),
							'Content-Range': contentRange,
							'Session-Id': sessionId
						})
						.end (function (response) {
							try {
								if ( response.statusCode != 200 && response.statusCode != 202 )
									throw response ;
								callback (null, response.body) ;
							} catch ( err ) {
								callback (err, null) ;
							}
						}
					)
				)
			}) ;
		} ;

		// The read buffer option
		//var fctChunks =function (n, chunkSize) {
		//	return (function (callback) {
		//		fs.open (serverFile, 'r', function (err, fd) {
		//			if ( err )
		//				return (callback (err, null)) ;
		//			var buffer =new Buffer (chunkSize) ;
		//			fs.read (fd, buffer, 0, chunkSize, n * chunkSize, function (err, bytesRead, buff) {
		//				var contentRange ='bytes '
		//					+ (n * chunkSize) + '-'
		//					+ (n * chunkSize + bytesRead - 1) + '/'
		//					+ total ;
		//				unirest.put (endpoint)
		//					.headers ({
		//						'Accept': 'application/json',
		//						'Content-Type': 'application/octet-stream',
		//						'Authorization': ('Bearer ' + self.accessToken),
		//						'Content-Range': contentRange,
		//						'Session-Id': sessionId
		//					})
		//					.send (buff.slice (0, bytesRead))
		//					.end (function (response) {
		//						try {
		//							if ( response.statusCode != 200 && response.statusCode != 202 )
		//								throw response ;
		//							callback (null, response.body) ;
		//						} catch ( err ) {
		//							callback (err, null) ;
		//						}
		//					})
		//				;
		//			}) ;
		//		}) ;
		//	}) ;
		//} ;

		var fctChunksArray =Array.apply (null, { length: nbChunks }).map (Number.call, Number) ;
		for ( var i =0 ; i < fctChunksArray.length ; i++ )
			fctChunksArray [i] =fctChunks (i, chunkSize) ;
		async.parallelLimit (
			fctChunksArray,
			10,
			function (err, results) {
				if ( err )
					return (self.emit ('fail', err)) ;
				try {
					for ( var i =0 ; i < results.length ; i++ ) {
						if ( results [i] ) {
							self.emit ('success', results [i]) ;
							break ;
						}
					}
				} catch ( err ) {
				}
			}
		) ;

	}) ;

	return (this) ;
} ;

// POST /viewingservice/v1/register
Lmv.prototype.register =function (urn) {
	var self =this ;
	//var urn =this.getURN (connections ['lmv-root'] [0]) ;
	var desc ={ 'urn': new Buffer (urn).toString ('base64') } ;

	unirest.post (config.postRegisterEndPoint)
		.headers ({
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': ('Bearer ' + self.accessToken)
		})
		.send (desc)
		.end (function (response) {
			try {
				if ( response.statusCode != 200 && response.statusCode != 201 )
					throw response ;
				try { self.emit ('success', { 'urn': desc.urn, 'response': response.body }) ; } catch ( err ) {}
			} catch ( err ) {
				self.emit ('fail', err) ;
			}
		})
	;
	return (this) ;
} ;

Lmv.prototype.status =function (urn, params) {
	var self =this ;
	params =params || {} ;

	var endpoint =util.format (config.getStatusEndPoint, urn) ;
	unirest.get (endpoint)
		.headers ({
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': ('Bearer ' + self.accessToken)
		})
		.query (params)
		.end (function (response) {
			try {
				if ( response.statusCode != 200 )
					throw response ;
				try { self.emit ('success', response.body) ; } catch ( err ) {}
			} catch ( err ) {
				self.emit ('fail', err) ;
			}
		})
	;
	return (this) ;
} ;

Lmv.prototype.all =function (urn, params) {
    var self =this ;
    params =params || {} ;

    var endpoint =util.format (config.getAllEndPoint, urn) ;
    unirest.get (endpoint)
        .headers ({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': ('Bearer ' + self.accessToken)
    })
        .query (params)
        .end (function (response) {
        try {
            if ( response.statusCode != 200 )
                throw response ;
            try { self.emit ('success', response.body) ; } catch ( err ) {}
        } catch ( err ) {
            self.emit ('fail', err) ;
        }
    })
    ;
    return (this) ;
} ;

var router =express.Router () ;
router.Lmv =Lmv ;
module.exports =router ;

// Utility
if ( !Number.isInteger ) {
	Number.isInteger =function isInteger (nVal) {
		return (
			   typeof nVal === 'number'
			&& isFinite (nVal)
			&& nVal > -9007199254740992
			&& nVal < 9007199254740992
			&& Math.floor (nVal) === nVal
		) ;
	} ;
}

// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
if ( !Array.prototype.fill ) {
	Array.prototype.fill =function (value) {
		// Steps 1-2.
		if ( this == null )
			throw new TypeError ('this is null or not defined') ;
		var O =Object (this) ;
		// Steps 3-5.
		var len =O.length >>> 0 ;
		// Steps 6-7.
		var start =arguments [1] ;
		var relativeStart =start >> 0 ;
		// Step 8.
		var k =relativeStart < 0 ?
			Math.max (len + relativeStart, 0) :
			Math.min (relativeStart, len) ;
		// Steps 9-10.
		var end =arguments [2] ;
		var relativeEnd =end === undefined ? len : end >> 0 ;
		// Step 11.
		var final =relativeEnd < 0 ?
			Math.max (len + relativeEnd, 0) :
			Math.min (relativeEnd, len) ;
		// Step 12.
		while ( k < final ) {
			O [k] =value ;
			k++ ;
		}
		// Step 13.
		return (O) ;
	} ;
}
