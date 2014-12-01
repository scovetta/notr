/**
 * Gets a unique installation identifier. This is just a random
 * number that gets generated when the extension is installed,
 * and used instead of an authentication token for retrieving
 * the user's (private) content.
 */
function getUniqueInstallationID() {
    var installationID = localStorage.getItem("notr.installation_id");

    if (installationID === null) {
      localStorage.setItem("notr.installation_id", (function() {
        var sid = new Uint8Array(32);
        var sidhex = '';
        crypto.getRandomValues(sid);
        for (var i=0; i<sid.length; i++) {
            sidhex += sid[i].toString(16);
        }
        return sidhex;
      })());
      installationID = localStorage.getItem("notr.installation_id");
    }

    return installationID || "ERR";
}

// Cache an installation identifier.
chrome.runtime.onInstalled.addListener(function(info){
    getUniqueInstallationID();
});

/* Respond to requests from our extension */
chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
    if (sender.id !== chrome.runtime.id) {
        console.log('Ignoring message from unauthorized sender.');
        return;
    }
    if (msg.action == 'notr.get_installation_id') {
        sendResponse({'notr.installation_id': getUniqueInstallationID()});
    }
});
