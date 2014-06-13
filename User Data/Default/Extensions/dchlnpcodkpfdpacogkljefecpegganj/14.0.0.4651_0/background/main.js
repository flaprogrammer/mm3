kavEventListener = new EventListener();

var KavUrlAdvisorPlugin = document.getElementById("KavURLAdvisorPluginId");
var HighlightEnabled = KavUrlAdvisorPlugin.GetHighlightEnabled();
var LinksMode = KavUrlAdvisorPlugin.GetLinksMode();


function UpdateHighlight(tabId, changeInfo, tab)
{
	try
	{
		var cmd = new Object();
		cmd.name = "ContentUpdate";
		chrome.tabs.sendRequest(tabId, cmd);
    }
    catch(e)
	{
		console.error("UpdateHighlight has exception: " + e);
    }
}

function SendRequestToAllTabs(request) 
{
	chrome.windows.getCurrent(
	function(window)
	{
		chrome.tabs.getAllInWindow(window.id, 
		function(tabs)
		{
			if (tabs.length == 0) return;
			
			for(var i = 0; i < tabs.length; i++)
			{
				chrome.tabs.sendRequest(tabs[i].id, request);
			}
		});
	});
}

chrome.extension.onRequest.addListener(
function(request, sender, sendResponse) 
{
    try
    {
		if (request.name == "IsCheckPageEnabled")
		{
			var CheckPageEnable = KavUrlAdvisorPlugin.IsCheckPageEnabled(request.url);
			sendResponse(CheckPageEnable);
		}
		else
		if (request.name == "GetHighlightEnabled")
		{
			sendResponse(HighlightEnabled);
		}
		else
		if (request.name == "GetLinksMode")
		{
			sendResponse(LinksMode);
		}
		else
		if (request.name == "StartNavigate")
		{
			KavUrlAdvisorPlugin.StartNavigate(request.url);
		}
		else 
		if (request.name == "ShowInfoWindow")
		{
			var categorizedLink = new Object();
			categorizedLink.url = request.url;
			categorizedLink.status = parseInt(request.status);
			categorizedLink.source = parseInt(request.source);
			categorizedLink.categories = request.categories;
			categorizedLink.threats = request.threats;
			KavUrlAdvisorPlugin.ShowInfoWindow(sender.tab.url, categorizedLink, request.x, request.y);
		}
		else 
		if (request.name == "HideInfoWindow")
		{
			// info baloon will be hided automaticaly
			//KavUrlAdvisorPlugin.HideInfoWindow();
		}
		else 
		if (request.name == "GetLinksInfo")
		{
			KavUrlAdvisorPlugin.GetLinksInfo(sender.tab.id, sender.tab.url, request.urls);
		}
		else
			throw "chrome.extension.onRequest has wrong request.name";
    }
    catch(e)
	{
		console.error("main.js onRequest has exception: " + e);
    }
});


function SetEnableHighlight(enable)
{
	HighlightEnabled = enable;

	var cmd = new Object();
	cmd.name = "EnableHighlight";
	cmd.enable = parseInt(enable);
	SendRequestToAllTabs(cmd);
}

function SetLinksMode(mode)
{
	LinksMode = mode;

	var cmd = new Object();
	cmd.name = "SetLinksMode";
	cmd.mode = parseInt(LinksMode);
	SendRequestToAllTabs(cmd);
}

function UpdateContentOnAllTabs()
{
	var cmd = new Object();
	cmd.name = "ContentUpdate";
	SendRequestToAllTabs(cmd);
}

function OnIconClicked(tab)
{
	try
	{
		KavUrlAdvisorPlugin.ShowOptionsWindow();
	}
	catch(e)
	{
		console.error("main.js onIconClicked has exception: " + e);
	}
}

chrome.tabs.onUpdated.addListener(UpdateHighlight);
chrome.browserAction.onClicked.addListener(OnIconClicked);
