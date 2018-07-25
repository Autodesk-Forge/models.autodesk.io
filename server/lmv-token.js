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
var config =require ('./credentials') ;
var ForgeApis = require('forge-apis');

var router =express.Router () ;

// This is the downgraded access_token for the viewer (should be read-only)
router.get ('/token', function (req, res) {
    var credentials =config.clone (['data:read']) ;
    credentials.client_id =req.query.key ;
    credentials.client_secret =req.query.secret ;
    refreshToken (credentials, res) ;
}) ;

// This is the full access access_token for the application to process/translate files
router.post ('/token', function (req, res) {
	var credentials =config.clone () ;
	credentials.client_id =req.body.key ;
	credentials.client_secret =req.body.secret ;
	refreshToken (credentials, res) ;
}) ;

var refreshToken =function (credentials, res) {
	var oAuth2 =new ForgeApis.AuthClientTwoLegged (credentials.client_id, credentials.client_secret, credentials.scope) ;
	oAuth2.authenticate ()
		.then (function (response) {
			res.json (response) ;
		})
		.catch (function (error) {
			if ( error.statusCode )
				return (res.status (error.statusCode).end (error.statusMessage)) ;
			res.status (500).end () ;
		})
	;
} ;

module.exports =router ;
