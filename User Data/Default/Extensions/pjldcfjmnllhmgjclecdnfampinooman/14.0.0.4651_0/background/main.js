var KavABPlugin = document.getElementById("KavABPluginId");

function AddUrlToAntibanner(url)
{
	KavABPlugin.AddToBlackList(url);
}

function genericOnClick(info, tab) 
{
    try
    {
		var url = info["srcUrl"];
		AddUrlToAntibanner(url);
    }
    catch(e)
	{
		console.log("genericOnClick has exception: " + e);
    }
}

chrome.contextMenus.create
(
	{
		"title": chrome.i18n.getMessage("CommandAdd"), 
		"contexts": ["image"],
		"onclick": genericOnClick
	}
);
