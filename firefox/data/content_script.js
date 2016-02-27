// ### UTILS ###

function hydrate_defaults(defaults,store){
    var result = {};
	
	for (var attrname in defaults)
	{
		if (attrname in store && typeof store[attrname] !== 'undefined')
			result[attrname] = store[attrname];
		else
			result[attrname] = defaults[attrname];
	}
	
    return result;
}

function getCurrentDate() {
	var dateObj = new Date();
	var month = dateObj.getUTCMonth() + 1; //months from 1-12
	var day = dateObj.getUTCDate();
	var year = dateObj.getUTCFullYear();
	return day + "/" + month + "/" + year;
}

function isFbHomepage(url) {
	return /^https?:\/\/(?:www\.)?facebook\.com\/?$/.test(url) || /^https?:\/\/(?:www\.)?facebook\.com\/\?/.test(url)
}

// ### BROWSER STORE / PREFS IMPLEMENTAION ###

if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined') // chrome
{
	var prefs,
		storage = prefs = {
			get: function(values, callback) { chrome.storage.sync.get(values, callback); },
			set: function(values, callback) { chrome.storage.sync.set(values, callback); }
		};
	launch();
}
else // firefox
{	
	var prefs, storage;
	
	self.port.on("prefs", function (loaded_prefs) {
		// self.port.on("storage", function (loaded_storage) {
			storage = {
				get: function (defaults, callback) {
					var result = hydrate_defaults(defaults,loaded_prefs);
					setTimeout(function() { callback(result) }, 1);
				},
				set: function (values, callback) {
					// loaded_prefs = merge_objects(loaded_prefs,values);
					self.port.emit("update-prefs", values);
					setTimeout(callback, 1);
				}
			};

			prefs = {
				get: function (defaults, callback) {
					var result = hydrate_defaults(defaults,loaded_prefs);
					
					if ('maxVisits' in result && typeof result['maxVisits'] !== 'undefined')
						result['maxVisits'] = parseInt(result['maxVisits']); // firefox prefs won't save -1 as an int
					
					setTimeout(function() { callback(result) }, 1);
				}
			};
			
			launch();
		// });
	});

}

// ### STATELESS FUNCTION TO UPDATE STORAGE & DISPLAY ###

function updateStorageAndDisplay(sheet, new_count, new_date, show_message, message_content, max_visits, max_visits_message) {
	if ((max_visits !== -1) && (new_count > max_visits)) {
		if (max_visits_message == '')
			window.location.href = 'data:text/html;charset=utf-8,<!doctype html><html><head></head><body style="position: absolute; top: 50%; transform: translateY(-50%); left: 0; right: 0;"><h1 style="display: block; text-align: center; margin-top: 20px;">You\'ve visited Facebook over ' + (new_count - 1) + ' times today.</h1><h2 style="display: block; text-align: center; margin-top: 20px;">Why not move on to something else now?</h2></body></html>';
		else
			window.location.href = 'data:text/html;charset=utf-8,<!doctype html><html><head></head><body style="position: absolute; top: 50%; transform: translateY(-50%); left: 0; right: 0;"><h1 style="display: block; text-align: center; margin-top: 20px;">' + max_visits_message + '</h1></body></html>';
		return;
	}
	
	storage.set({
		count: new_count,
		lastUpdate: new_date
	}, function () {

		if (show_message) {
			// default message
			if (message_content.length == 0)
				message_content = (new_count == 1 ? "This is the first time you've visited Facebook today." : "You've visited Facebook " + new_count + " times today.")
			else // user-defined message
				message_content = message_content.replace(/%s/g, new_count);

			sheet.addRule('#pagelet_composer::after', 'content: "' + message_content.replace(/"/g, '\\"') + '"; font-size: 20px; margin-top: 30px; margin-bottom: 30px; text-align: center; display: block; font-family: "Helvetica Neue", Helvetica, Arial, "lucida grande", tahoma, verdana, arial, sans-serif;');
		}
	});
}

// ### SCRIPT START FUNCTION / ENTRY POINT ###

function launch() {
	prefs.get({ // get config
		newsFeed: 'normal',
		message: 'show',
		messageContent: '',
		maxVisits: -1,
		maxVisitsMessage: ''
	}, function (config) {

		// Create style sheet
		sheet = (function () {
			var style = document.createElement("style"); // Create the <style> tag
			style.setAttribute("media", "screen") // Add a media (and/or media query) here if you'd like!   
			style.appendChild(document.createTextNode("")); // WebKit hack :(
			document.head.appendChild(style); // Add the <style> element to the page

			var lastInsertId = -1;
			
			// if firefox, insertRule('body { background: blue;}',0);
			// if chrome, addRule('body','background: blue;');
			if (typeof style.sheet.addRule == 'undefined')
			{
				style.sheet.addRule = function(selectors,properties) {
					style.sheet.insertRule(selectors+'{'+properties+'}', ++lastInsertId);
				}
			}

			return style.sheet;
		})();
		
		// Hide news feed
		if (config.newsFeed == 'kill') {
			sheet.addRule('[id^=topnews_main_stream], [id^=mostrecent_main_stream], [id^=pagelet_home_stream], .ticker_stream, #pagelet_games_rhc, #pagelet_trending_tags_and_topics, #pagelet_canvas_nav_content', 'visibility: hidden');
			sheet.addRule('.ego_column, ._2c44', 'display: none');
		}

		// First update of the visit count (page load)
		storage.get({
			count: 0,
			lastUpdate: getCurrentDate()
		}, function (countInfo) {
			// update if HOMEAGE or OTHER PAGE BUT NOT A LINK OPENED FROM FACEBOOK
			if (isFbHomepage(window.location.href) || !/^https?:\/\/(?:www\.)?facebook\.com/.test(document.referrer)) {
				if (countInfo.lastUpdate == getCurrentDate())
					var newCount = countInfo.count + 1;
				else
					var newCount = 1

				var newDate = getCurrentDate();
			} else {
				var newCount = countInfo.count;
				var newDate = countInfo.lastUpdate;
				// Technically we only have to call "andDisplay" from here; updateStorage is unnecessary
			}

			updateStorageAndDisplay(sheet, newCount, newDate, config.message === 'show', config.messageContent, config.maxVisits, config.maxVisitsMessage);
		});		

		// Inject pushState listener
		var actualCode = ['var pushState = window.history.pushState;',
					  'window.history.pushState = function(state) {',
					  'window.postMessage({ type: "PUSHSTATE", newUrl: state }, "*");',
					  'return pushState.apply(window.history, arguments); };'].join('\n');
		var script = document.createElement('script');
		script.textContent = actualCode;
		(document.head || document.documentElement).appendChild(script);
		script.parentNode.removeChild(script);

		// Update visit count on AJAX page load (<=> on pushState)
		window.addEventListener("message", function (event) {
			if (event.data.type && (event.data.type == "PUSHSTATE")) {
				if (isFbHomepage(event.data.newUrl)) {
					storage.get({
						count: 0,
						lastUpdate: getCurrentDate()
					}, function (countInfo) {
						if (countInfo.lastUpdate == getCurrentDate())
							var newCount = countInfo.count + 1;
						else
							var newCount = 1

						updateStorageAndDisplay(sheet, newCount, getCurrentDate(), config.message === 'show', config.messageContent, config.maxVisits, config.maxVisitsMessage);
					});
				}
			}
		}, false);

	});
}