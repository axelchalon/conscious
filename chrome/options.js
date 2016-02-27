function save_options() {
    var newsFeed;
    if (document.getElementById('newsfeed_kill').checked) newsFeed = 'kill';
    else newsFeed = 'normal';
    
	var message;
    if (document.getElementById('message_show').checked) message = 'show';
    else message = 'hide';
	
	var message_content = document.getElementById('message_content').value;
	
	var max_visits = document.getElementById('max_visits').value;
    if (max_visits == '') max_visits = -1;
	max_visits = parseInt(max_visits);
	
	var max_visits_message = document.getElementById('max_visits_message').value;
    
	chrome.storage.sync.set({ newsFeed: newsFeed, message: message, messageContent: message_content, maxVisits: max_visits, maxVisitsMessage: max_visits_message}, function () { alert('Options saved!'); });
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({ newsFeed: 'normal', message: 'show', messageContent: '', maxVisits: -1, maxVisitsMessage: ''}, function (items) {
        document.getElementById('newsfeed_kill').checked = items.newsFeed === 'kill';
        document.getElementById('message_show').checked = items.message === 'show';
        document.getElementById('message_content').value = items.messageContent;
        document.getElementById('max_visits').value = (items.maxVisits !== -1 ? items.maxVisits : '');
        document.getElementById('max_visits_message').value = items.maxVisitsMessage;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',save_options);
