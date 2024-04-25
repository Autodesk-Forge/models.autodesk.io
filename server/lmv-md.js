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
const _fs = require('fs/promises');
const __fs = require('fs');
const _path = require('path');
const crypto = require('crypto');
const config = require('./credentials');
const ForgeApis = require('forge-apis');

const router = express.Router();

router.get('/:urn/progress', async (req, res) => {
	try {
		const accessToken = req.query.accessToken;
		const urn = req.params.urn;

		const oAuth2 = new ForgeApis.AuthClientTwoLegged('', '', config.credentials.scope);
		oAuth2.setCredentials({
			access_token: accessToken,
			type: 'Bearer',
			expires_at: 3599,
		});

		const md = new ForgeApis.DerivativesApi();
		const data = await md.getManifest(urn, {}, oAuth2, oAuth2.getCredentials());
		let name = _path.basename(Buffer.from(data.body.urn, 'base64').toString());
		if (data.body.derivatives !== undefined && data.body.derivatives.length > 0 && data.body.derivatives[0].hasOwnProperty('name'))
			name = data.body.derivatives[0].name;
		res.json({
			status: data.body.status,
			progress: data.body.progress,
			urn: data.body.urn,
			name: name
		}).end();
		console.log('Request: ' + data.body.status + ' (' + data.body.progress + ')');
	} catch (error) {
		res.status(404).end();
	}
});

function makeKey(file) {
	return (_path.basename(file));
}

function singleUpload(bucketKey, filename, total, oAuth2) {
	const objectKey = makeKey(filename);
	const readStream = __fs.createReadStream(filename);
	const ossObjects = new ForgeApis.ObjectsApi();
	return (ossObjects.uploadResources(
		bucketKey,
		[{
			objectKey,
			data: readStream,
			length: total,
		}],
		{},
		oAuth2, oAuth2.getCredentials()
	));
}

async function ExistOrCreate(bucketKey, oAuth2) {
	const ossBuckets = new ForgeApis.BucketsApi();
	try {
		console.log('Check Bucket if bucket exists...');
		const results = await ossBuckets.getBucketDetails(bucketKey, oAuth2, oAuth2.getCredentials());
		return (results);
	} catch (error) {
		console.log('Create Bucket...');
		const opts = { bucketKey: bucketKey, policyKey: 'persistent' };
		const headers = { xAdsRegion: 'US' };
		return (ossBuckets.createBucket(opts, headers, oAuth2, oAuth2.getCredentials()));
	}
}

router.post('/', async (req, res) => {
	try {
		const accessToken = req.body.accessToken;
		const filename = _path.normalize(__dirname + '/../' + req.body.file);
		const hash = crypto.createHash('md5').update(config.credentials.client_id).digest('hex').replace(/\W+/g, '');
		const bucketKey = `model-${req.session.id}-${hash}`.toLowerCase();

		const oAuth2 = new ForgeApis.AuthClientTwoLegged('', '', config.credentials.scope);
		oAuth2.setCredentials({
			access_token: accessToken,
			type: 'Bearer',
			expires_at: 3599,
		});

		let size = await _fs.stat(filename);
		size = size.size;
		const bucket = await ExistOrCreate(bucketKey, oAuth2)
		const data = await singleUpload(bucketKey, filename, size, oAuth2);

		const job = {
			input: {
				urn: Buffer.from(data[0].completed.objectId).toString('base64'),
			},
			output: {
				formats: [
					{
						type: 'svf',
						views: ['2d', '3d']
					}
				]
			}
		};
		const md = new ForgeApis.DerivativesApi();
		const results = await md.translate(job, { xAdsForce: true }, oAuth2, oAuth2.getCredentials());
		res.json(results.body);
	} catch (error) {
		console.log(JSON.stringify(error));
		res.status(500).end();
	};
});

module.exports = router;
