# models.autodesk.io sample

[![build status](https://api.travis-ci.org/cyrillef/models.autodesk.io.png)](https://travis-ci.org/cyrillef/models.autodesk.io)
[![Node.js](https://img.shields.io/badge/Node.js-4.1.1-blue.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-2.15.5-blue.svg)](https://www.npmjs.com/)
[![LMV](https://img.shields.io/badge/View%20%26%20Data%20API-v2.5-green.svg)](http://developer-autodesk.github.io/)
![Platforms](https://img.shields.io/badge/platform-windows%20%7C%20osx%20%7C%20linux-lightgray.svg)
[![License](http://img.shields.io/:license-mit-blue.svg)](http://opensource.org/licenses/MIT)


<b>Note:</b> For hosting this sample, you do not need any credentials. But anyone using the sample will need
valid credentials for the translation / extraction process. Visit [the Forge WEB site](https://developer.autodesk.com) for
instructions to get on-board.


## Live demo at
https://models.autodesk.io/

[![](www/images/app.png)](https://models.autodesk.io/)


## Motivation

Our View and Data API Beta adds powerful 2D and 3D viewing functionality to your web apps.
Our REST and JavaScript API makes it easier to create applications that can view, zoom and interact with 2D and
3D models from over 60+ model formats with just a web browser, no plugin required!

But what if you wanted to view them and/or use the client API without having to implement the upload/translation protocol.
This sample will go through all the required steps.


## Description

This sample exercises and demonstrates the Autodesk View and Data API authorization, and the translation process
mentioned in the Quick Start guide. It provides you a quick way to get file ready for viewing on your own account.

It closely follows the steps described in the documentation:

* http://developer.api.autodesk.com/documentation/v1/vs_quick_start.html

In order to make use of this sample, you need to register your consumer key:

* https://developer.autodesk.com > My Apps

This provides the credentials to supply to the https requests on the Autodesk server.


## Dependencies

This sample is dependent of Node.js and few Node.js extensions which would update/install automatically via 'npm':

1. Node.js

    Node.js - built on Chrome's JavaScript runtime for easily building fast, scalable network applications.
	You need at least version v0.10.0. You can get Node.js from [here](http://nodejs.org/)<br /><br />
	Node.js modules:
	```
    "serve-favicon": ">= 0.0.2",
    "express": ">= 4.12.3",
    "request": ">= 2.55.0",
    "connect-multiparty": ">= 1.2.5",
    "body-parser": ">= 1.11.0",
    "fs": ">= 0.0.2",
    "unirest": ">= 0.4.0",
    "util": ">= 0.10.3",
    "path": ">= 0.11.14",
    "async": ">= 1.2.0"
	```
		
2. filedrop.js - A Self-contained cross-browser HTML5, legacy, AJAX, drag & drop JavaScript file upload, available [here](http://filedropjs.org/).

3. flipclock.js - A flip clock javascript library, available [here](http://flipclockjs.com/).

4. zeroclipboard.js - A library which provides an easy way to copy text to the clipboard using an invisible Adobe Flash movie and a JavaScript interface,
   available [here](http://zeroclipboard.org/).


## Setup/Usage Instructions

The sample was created using Node.js and javascript.

### Deploy on Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Setup
1. Download and install [Node.js](http://nodejs.org/) (that will install npm as well)
2. Download this repo anywhere you want (the server will need to write files, so make sure you install in
   a location where you have write permission, at least the 'uploads' folder)
3. Execute 'npm install', this command will download and install the required node modules automatically for you.
   These modules are only required for the translation process.<br />
   ```
   npm install
   ```
4. You are done for the setup, launch the node server using the command '[sudo] node start.js'.
   sudo is required only on OSX and Linux.<br />
   * Windows<br />
   ```
   [set PORT=<port>]
   node start.js
   ```
   * OSX/Linux<br />
   ```
   sudo [PORT=<port>] node start.js
   ```
   <br />
   <b>Note:</b> the port argument can be omitted and default to port 3000. If port 80 is already in use by another
   application (like Skype, or IIS, or Apache, ...), you can use any other free port such as 8000, 3000, etc...
   But in the next section you would need to specify the port to use, i.e. http://localhost[:port]/

### Use of the sample

Translating files

1. Start your favorite browser supporting HTML5 and WEBGL and browse to [http://localhost:3000/](http://localhost:3000/).<br />
   <b>Note:</b> In case you use a different port above do not forget to include it in the URL. I.e.
   [http://localhost:8000/](http://localhost:8000/).
2. Drag'n Drop your files into the 'Drop area' or browse for individual files, That's it.<br />
   Or choose one of the proposed sample from the Dropbox and click on teh the 'Translate this one for me'.
3. After the translation completed successfully, you can copy the encoded urn string that you can use to view the
   results, in a html page which supports the Autodesk viewer.
4. You are done with translation.


--------

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.


## Written by

Cyrille Fauvel (Autodesk Developer Network)<br />
http://www.autodesk.com/adn<br />
http://around-the-corner.typepad.com/<br />
