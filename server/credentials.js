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
var config ={
	credentials: {
        // This sample do not need any keys, as the keys will be passed as argument from the client
        // Do not do this in your 'production' application ;)
		client_id: '',
		client_secret: '',
		scope:'data:read data:write data:create bucket:create bucket:read',
		grant_type: 'client_credentials'
	},
	fileResumableChunk: 40, // in Mb

    clone: function (scope) {
        var ret =JSON.parse (JSON.stringify (this.credentials)) ;
        if ( scope !== undefined )
            ret.scope =scope ;
        return (ret) ;
    }

} ;

module.exports =config ;
