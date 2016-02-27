var pageMod = require("sdk/page-mod");
var data = require("sdk/self").data;

var storage = require("sdk/simple-storage").storage;
var prefs = require("sdk/simple-prefs").prefs;

pageMod.PageMod({
	include: "*.facebook.com",
	contentScriptWhen: 'start',
	contentScriptFile: data.url("content_script.js"),
	onAttach: function (worker) {
			worker.port.emit("prefs", prefs);
			worker.port.emit("storage", storage);
		
			worker.port.on("rebuild-storage", function (new_storage) {
				storage = new_storage;
			});
		}
});