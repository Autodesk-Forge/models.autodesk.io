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
const express = require('express');
const multipart = require('connect-multiparty');
const _fs = require('fs');

const ACCESS_CONTROLL_ALLOW_ORIGIN = false;

const router = express.Router();
const multipartMiddleware = multipart();

router.post('/', multipartMiddleware, (req, res) => {
	req
		.pipe(_fs.createWriteStream('./uploads/' + decodeURIComponent(req.headers['x-file-name'])))
		.on('finish', (err) => {
			res.end();
		})
		.on('error', function (err) {
			res.status(500).end();
		});
});

module.exports = router;
