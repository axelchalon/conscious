var pageMod = require("sdk/page-mod");
var data = require("sdk/self").data;
var prefs = require("sdk/simple-prefs").prefs;
let {Cc, Ci} = require('chrome');

pageMod.PageMod({
	include: "*.facebook.com",
	contentScriptWhen: 'start',
	contentScriptFile: data.url("content_script.js"),
	onAttach: function (worker) {
			worker.port.emit("prefs", prefs);
		
			worker.port.on("update-prefs", function (new_prefs) {
				for (var attrname in new_prefs)
						prefs[attrname] = new_prefs[attrname];
			});
		
			worker.port.on("get-prefs", function () {
				worker.port.emit('prefs', prefs)
			});
		}
});


exports.onUnload = function(reason) {
	if (reason == 'disable')
	{
		var ffpref = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
		// ffpref.clearUserPref('extensions.conscious@axelchalon.fr.lastUpdate');
		// ffpref.clearUserPref('extensions.conscious@axelchalon.fr.count');
		ffpref.deleteBranch('extensions.conscious@axelchalon.fr.');
	}
}