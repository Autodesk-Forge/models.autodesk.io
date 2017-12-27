//
// Copyright (c) Autodesk, Inc. All rights reserved
//
// Node.js server workflow
// by Cyrille Fauvel - Autodesk Developer Network (ADN)
// January 2015
// Modified by SVNINDIA, Sep 2017
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
var crypto =require ('crypto') ;
var config =require ('./credentials') ;
var ForgeSDK = require('forge-apis');
var session = require('express-session');

// var ForgeOSS = ForgeSDK;
// var ForgeModelDerivative = ForgeSDK;
// var ForgeOSS =require ('forge-oss') ;
var ForgeModelDerivative =require ('forge-model-derivative') ;

var config =require ('./credentials') ;

var ossBuckets =new ForgeSDK.BucketsApi () ;
var ossObjects =new ForgeSDK.ObjectsApi () ;
var md =new ForgeSDK.DerivativesApi () ;

var router =express.Router () ;
router.use (bodyParser.json ()) ;

router.get ('/translate/:urn/progress', function (req, res) {
  var urn =req.params.urn ;
  var credentials = req.session.credentials
  var autoRefresh = true;
  var oAuth2TwoLegged = new ForgeSDK.AuthClientTwoLegged(credentials.client_id, credentials.client_secret, credentials.scope, autoRefresh);
  oAuth2TwoLegged.authenticate().then(function(credentials) {
    md.getManifest (urn, {},oAuth2TwoLegged,credentials)
    .then (function (dataBody) {
        var data = dataBody.body
        console.log("progrees data ",data)
        var name =path.basename (new Buffer(data.urn, 'base64').toString ()) ;
        if ( data.derivatives !== undefined && data.derivatives.length > 0 && data.derivatives [0].hasOwnProperty ('name') )
          name =data.derivatives [0].name ;
        // var percentage = data.progress.split("% complete")
        res.json ({
          status: data.status,
          progress: data.progress,
          urn: data.urn,
          name: name
        }).end () ;
        console.log ('Request: ' + data.status + ' (' + data.progress + ')') ;
    }).catch (function (error) {
        console.log("error ",error)
        res.status (404).end () ;
      }) ;
  })
}) ;

function makeKey (file) {
  var filename =path.basename (file) ;
  return (filename) ;
}

function singleUpload (bucketKey, filename, total,oAuth2TwoLegged,credentials) {
  var objectKey =makeKey (filename) ;
  var readStream =fs.createReadStream (filename) ;
  return (ossObjects.uploadObject (bucketKey, objectKey, total, readStream, {},oAuth2TwoLegged,credentials)) ;
}

function ExistOrCreate (bucketKey,oAuth2TwoLegged,credentials) {
  console.log ('Check Bucket if bucket exists...') ;
  return (ossBuckets.getBucketDetails (bucketKey,oAuth2TwoLegged,credentials)
      .then (function (results) {
        return (results) ;
      })
      .catch (function (error) {
        console.log ('Create Bucket...') ;
        var opts ={
          "bucketKey": bucketKey,
          "policyKey": 'transient'
        } ;
        var headers ={
          'xAdsRegion': 'US'
        } ;
        return (ossBuckets.createBucket (opts, headers,oAuth2TwoLegged,credentials)) ;
      })
  ) ;
}

router.post ('/translate', function (req, res) {
  var credentials = req.session.credentials
  var autoRefresh = true;
  var oAuth2TwoLegged = new ForgeSDK.AuthClientTwoLegged(credentials.client_id, credentials.client_secret, credentials.scope, autoRefresh);
  oAuth2TwoLegged.authenticate().then(function(credentials) {
    console.log(" oAuth2TwoLegged credentials ", credentials)
    var filename =path.normalize (__dirname + '/../' + req.body.file) ;
    var hash =crypto.createHash ('md5').update (config.credentials.client_id).digest ('hex').replace (/\W+/g, '') ;
    var bucketKey =
      'model'
      + new Date ().toISOString ().replace (/T/, '-').replace (/:+/g, '-').replace (/\..+/, '')
      + '-' + hash
      + '-' + "manufact" ;
    // ForgeModelDerivative.ApiClient.instance.authentications ['oauth2_application'].accessToken =credentials.access_token ;
    var stats ;
    stat (filename)
      .then (function (results) {
        stats =results ;
        return (ExistOrCreate (bucketKey,oAuth2TwoLegged,credentials)) ;
      })
      .then (function (bucket) {
        console.log ('async upload') ;
        var total =stats.size ;
        var chunkSize =config.fileResumableChunk * 1024 * 1024 ;
        //if ( total <= chunkSize )
        return (singleUpload (bucketKey, filename, total,oAuth2TwoLegged,credentials)) ;
        //else
        //	return (uploadFileAsChunks (bucketKey, filename, total, chunkSize)) ;
      })
      .then (function (data) {
        console.log ('Launching translation',data) ;
        var job ={
          "input": {
            "urn": new Buffer (data.body.objectId).toString ('base64'),
            "compressedUrn": false,
            "rootFilename": data.body.objectKey
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
        return (md.translate (job, { 'xAdsForce': true },oAuth2TwoLegged,credentials)) ;
      })
      .then (function (results) {
        console.log("results ",results)
        res.json (results.body) ;
      })
      .catch (function (error) {
        console.log ("error ",JSON.stringify (error)) ;
        res.status (500).end () ;
      })
    ;
  });
}) ;


module.exports =router ;
