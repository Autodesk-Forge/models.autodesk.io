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

let oCountdown = null;
let oDropZone = null;
let oList = [];

$(document).ready(function () {
	// Initialization code
	let accessToken = $.cookie('accessToken');
	if (accessToken === "null" || accessToken === undefined || accessToken === "undefined")
		HostResetAccessToken();
	else
		HostSetupAccessToken(JSON.parse(accessToken));

	let oList = $.cookie('models');
	if (oList === "null" || oList === undefined || oList === "undefined")
		oList = [];
	else
		oList = JSON.parse(oList);
	HostSetupTranslated(oList);

	// Access Token request code
	$('#btnGetAccessToken').click(async (evt) => {
		try {
			const response = await fetch(
				window.location.protocol + '//' + window.location.host + '/api/token',
				{
					method: 'POST',
					cache: "no-cache",
					headers: {
						"Content-Type": 'application/json'
					},
					body: JSON.stringify({ 'key': $('#key').val().trim(), 'secret': $('#secret').val().trim() }),

				}
			);
			const data = await response.json();
			const date = new Date();
			date.setTime(date.getTime() + (parseInt(data.expires_in) * 1000));
			HostSetupAccessToken(data);
			$.cookie('accessToken', JSON.stringify(data), { expires: date }); //, secure: true }) ;
		} catch (ex) {
			alert(`Server replied: ${ex.message}`);
		}
	});

	$('#btnReleaseAccessToken').click((evt) => oCountdown.stop());

	// Translation process code
	$('#btnTranslateThisOne').click((evt) => {
		const sample = $('#inputModellist').val();
		if (sample)
			translate(sample);
	});

	// Drag 'n Drop zone code
	// fd.jQuery();
	// $('#zone')
	// 	.filedrop()
	// 	// jQuery always passes event object as the first argument.
	// 	.on('fdsend', (e, files) => { // Occurs when FileDrop's 'send' event is initiated.
	// 		$("#bar_zone10").val(0);
	// 		$.each(files, (i, file) => {
	// 			file.sendTo('/api/file');
	// 		});
	// 	})
	// 	.on('fileprogress', (e, file, current, total) => {
	// 		$("#bar_zone10").val(current / total * 100);
	// 	})
	// 	.on('fileerror', (e, file) => {
	// 		if (file.xhr.readyState === 4 && !file.xhr.status)
	// 			alert('Timeout reached, request aborted.');
	// 		else
	// 			alert(file.xhr.status + ', ' + file.xhr.statusText);
	// 	})
	// 	.on('filedone', (e, file) => {
	// 		translate('uploads/' + file.name);
	// 	});
	const zone = new FileDrop('zone', {});
	zone.event('send', (files) => {
		$("#bar_zone10").val(0);
		$.each(files, (i, file) => {
			file.event('progress', (current, total) => {
				$("#bar_zone10").val(current / total * 100);
			});
			file.event('done', (xhr) => {
				translate('uploads/' + file.name);
			});
			file.event('error', (xhr) => {
				if (xhr.readyState === 4 && !xhr.status)
					alert('Timeout reached, request aborted.');
				else
					alert(xhr.status + ', ' + xhr.statusText);
			});

			file.sendTo('/api/file');
		});
	});

	new ClipboardJS('.copy');
});

function HostSetupAccessToken(data) {
	$('#accessToken').val(data.access_token);
	$('#key').val('');
	$('#secret').val('');

	const to = new Date(data.expires_at);
	//const to = new Date(); to.setSeconds(to.getSeconds() + 10)
	oCountdown = new FlipClock(
		$('#countdown')[0],
		to,
		{
			countdown: true,
			face: 'MinuteCounter',
			stopAt: new Date(),
		}
	);
	oCountdown.on('stop', () => {
		HostResetAccessToken();
		$('#modal-accesstoken').modal('show');
	});

	$('#urns').show();
	$('#models').show();
	$('#accessTokenDiv').show();
	$('#keys').hide();
}

function HostResetAccessToken() {
	$('#accessToken').val('');

	$.cookie('accessToken', null);
	$.cookie('models', null);

	$('#urns').hide();
	$('#accessTokenDiv').hide();
	$('#models').hide();
	$('#keys').show();
}

function HostSetupTranslated(data) {
	$('#translatingDiv').hide();
	data = data.filter((value) => value.hasOwnProperty('urn'));
	data.length > 0 ? $('#translatedDiv').show() : $('#translatedDiv').hide();
	$('#translated').empty();
	for (let i = 0; i < data.length; i++) {
		const id = data[i].urn.replace(/=+/g, '');
		translatedItem(id, data[i].item, data[i].urn);
	}
}

async function translate(filename) {
	try {
		$('#modal-translationrequested').modal('show');
		const accessToken = JSON.parse($.cookie('accessToken'));
		const response = await fetch(
			'/api/translate',
			{
				method: 'POST',
				cache: "no-cache",
				headers: {
					"Content-Type": 'application/json'
				},
				body: JSON.stringify({ 'accessToken': accessToken.access_token, 'file': filename }),
			}
		);
		const data = await response.json();
		const fn = filename.replace(/^.*[\\\/]/, '');
		oList.push({ item: fn, urn: data.urn });
		$.cookie('models', JSON.stringify(oList));

		const id = data.urn.replace(/=+/g, '');
		translatingItem(id, fn);
		setTimeout(() => translateProgress(data.urn), 5000);
		$('#modal-translationrequested').modal('hide');
	} catch (ex) {
		$('#modal-translationrequested').modal('hide');
		$('#modal-translationfailed').modal('show');
	}
}

async function translateProgress(urn) {
	try {
		const accessToken = JSON.parse($.cookie('accessToken'));
		const response = await fetch(
			`/api/translate/${urn}/progress?accessToken=${encodeURIComponent(accessToken.access_token)}`,
			{
				method: 'GET',
			}
		);
		const data = await response.json();
		const id = data.urn.replace(/=+/g, '');
		if (data.progress === 'complete') {
			$('#' + id).remove();
			if ($('#' + id).children().length === 0)
				$('#translatingDiv').hide();
			translatedItem(id, data.name, data.urn);
		} else {
			if ($('#' + id)) {
				$('#' + id + ' div progress').val(parseInt(data.progress));
				setTimeout(() => translateProgress(urn), 1000);
			}
		}
	} catch (ex) {
		//console.log ('Progress request failed!') ;
		//var id =urn.replace (/=+/g, '') ;
		//var filename =$('#' + id + ' span').text () ;
		//$('#' + id).remove () ;
		//$('#translated').append ('<div class="list-group-item" id="' + id + '">'
		//	+ '<span>' + filename + '</span>'
		//	+ '<span>failed</span>'
		//	+ '</div>') ;
		setTimeout(() => translateProgress(urn), 2000);
	}
}

function translatedItem(id, name, urn) {
	$('#translated').append(
		`<div class="row" id="${id}">
			<div class="col-md-3">${decodeURIComponent(name)}</div>
			<div class="col-md-7">
				<input id="${id}-urn" type="text" class="form-control" value="${urn}" readonly="true" onClick="this.setSelectionRange (0, this.value.length)" oncopy="this.setSelectionRange (0, this.value.length)" />
			</div>
			<div class="col-md-1">
				<button class="form-control copy" data-clipboard-target="#${id}-urn" title="Copy the URN to clipboard"><img src="/images/copy.png" class="icon" height="24" width="24" /></button>
			</div>
			<div class="col-md-1">
				<button class="form-control view-result" data-clipboard-text="${urn}" title="View result"><img src="/images/view.png" class="icon" height="24" width="24" /></button>
			</div>
		</div>`

	);
	//const client =new ZeroClipboard ($(`#${id} div button.copy`)) ;
	$(`#${id} div button.view-result`).click((e) => {
		const windowName = e.target.getAttribute('data-clipboard-text') || e.target.parentElement.getAttribute('data-clipboard-text');
		window.open('/view.html?urn=' + encodeURIComponent(windowName) + '&token=' + encodeURIComponent($('#accessToken').val()), windowName, "height=768,width=1024");
	});
}

function translatingItem(id, fn) {
	$('#translatingDiv').show();
	$('#translating').append(
		`<div class="row" id="${id}">
			<div class="col-md-3">${fn}</div>
			<div class="col-md-7">
				<progress min="0" max="100" value="0" style="width: 100%;" />
			</div>
		</div>`
	);
}
