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
var unirest =require('unirest') ;
var config =require ('./credentials') ;

var router =express.Router () ;

router.get ('/token', function (req, res) {
	config.credentials.client_id =req.query.key ;
	config.credentials.client_secret= req.query.secret ;
	unirest.post (config.AuthenticateEndPoint)
		.header ('Accept', 'application/json')
		.send (config.credentials)
		.end (function (response) {
			if ( response.statusCode != 200 )
				return (res.status (500).end ()) ;
			res.json (response.body) ;
		})
	;
}) ;

router.post ('/token', function (req, res) {
	config.credentials.client_id =req.body.key ;
	config.credentials.client_secret= req.body.secret ;
	unirest.post (config.AuthenticateEndPoint)
		.header ('Accept', 'application/json')
		.send (config.credentials)
		.end (function (response) {
			if ( response.statusCode != 200 )
				return (res.status (500).end ()) ;
			res.json (response.body) ;
		})
	;
}) ;

module.exports =router ;
