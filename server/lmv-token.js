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
const config = require('./credentials');
const ForgeApis = require('forge-apis');

const router = express.Router();

// This is the downgraded access_token for the viewer (should be read-only)
router.get('/', (req, res) => {
	const credentials = config.clone(['data:read']);
	credentials.client_id = req.query.key;
	credentials.client_secret = req.query.secret;
	refreshToken(credentials, res);
});

// This is the full access access_token for the application to process/translate files
router.post('/', (req, res) => {
	const credentials = config.clone();
	credentials.client_id = req.body.key;
	credentials.client_secret = req.body.secret;
	refreshToken(credentials, res);
});

const refreshToken = async (credentials, res) => {
	try {
		const oAuth2 = new ForgeApis.AuthClientTwoLegged(credentials.client_id, credentials.client_secret, credentials.scope);
		const response = await oAuth2.authenticate();
		res.json(response);
	} catch (error) {
		if (error.response?.status)
			return (res.status(error.response?.status || 401).end(error.response?.statusText || ''));
		res.status(500).end();
	}
};

module.exports = router;
