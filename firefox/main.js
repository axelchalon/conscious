var pageMod = require("sdk/page-mod");
var data = require("sdk/self").data;

// var storage = require("sdk/simple-storage").storage;
var prefs = require("sdk/simple-prefs").prefs;

pageMod.PageMod({
	include: "*.facebook.com",
	contentScriptWhen: 'start',
	contentScriptFile: data.url("content_script.js"),
	onAttach: function (worker) {
			worker.port.emit("prefs", prefs);
		
/*			worker.port.on("rebuild-storage", function (new_storage) {
				storage = new_storage;
			});*/
		
			worker.port.on("update-prefs", function (new_prefs) {
				console.log('update prefs');
				for (var attrname in new_prefs)
						prefs[attrname] = new_prefs[attrname];
			});
		}
});