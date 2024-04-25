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
const _path = require('path');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const lmvToken = require('./lmv-token');
const lmvProjects = require('./lmv-md');
const lmvFile = require('./lmv-file');

// http://garann.github.io/template-chooser/
const app = express();
//app.use (bodyParser.urlencoded ({ extended: false })) ;
app.use(bodyParser.json());
app.use(session({
	secret: 'models.io',
	resave: false,
	saveUninitialized: true
}));
app.use(express.static(_path.resolve(__dirname, '../www')));
app.use('/clipboard.min.js', express.static(_path.resolve(__dirname, '../node_modules/clipboard/dist/clipboard.min.js')));
app.use('/flipclock.min.js', express.static(_path.resolve(__dirname, '../node_modules/flipclock/dist/flipclock.min.js')));
app.use('/flipclock.css', express.static(_path.resolve(__dirname, '../node_modules/flipclock/dist/flipclock.css')));
app.use('/filedrop.js', express.static(_path.resolve(__dirname, '../node_modules/filedrop/filedrop.js')));
app.use('/filedrop.css', express.static(_path.resolve(__dirname, '../node_modules/filedrop/filedrop.css')));
app.use('/jquery.cookie.js', express.static(_path.resolve(__dirname, '../node_modules/jquery.cookie/jquery.cookie.js')));
app.use(favicon(_path.resolve(__dirname, '../www/images/favicon.ico')));
app.use('/api/token', lmvToken);
app.use('/api/translate', lmvProjects);
app.use('/api/file', lmvFile);

app.set('port', process.env.PORT || 3000);

module.exports = app;
