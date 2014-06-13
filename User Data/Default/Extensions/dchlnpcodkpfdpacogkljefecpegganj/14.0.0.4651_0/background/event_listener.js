function EventListener()
{
}

EventListener.prototype.ProcessFilteredLinks = function(tabId, linkCollection) 
{
	try
	{
		var response = new Object();
		response.name = "LinkCollection";
		
		response.linkCollection = new Array();
		for(var i=0; i < linkCollection.length; i++)
		{
			/*
			console.log("link: url:    "+linkCollection[i].url);		
			console.log("link: status: "+linkCollection[i].status);		
			console.log("link: source: "+linkCollection[i].source);		
			console.log("link: cat:    "+linkCollection[i].categories);		
			*/

			var link = new Object();
			link.url = linkCollection[i].url;
			link.status = linkCollection[i].status;
			link.source = linkCollection[i].source;
			link.categories = linkCollection[i].categories;
			link.threats = linkCollection[i].threats;
			response.linkCollection.push(link);
		}
		
		chrome.tabs.sendRequest(tabId, response);
    }
    catch(e)
	{
		console.error("EventListener.ProcessFilteredLinks has exception: " + e);
    }
}

EventListener.prototype.EnableHighlight = function(enable) 
{
	try
	{
		SetEnableHighlight(enable);
    }
    catch(e)
	{
		console.error("EventListener.EnableHighlight has exception: " + e);
    }
}

EventListener.prototype.SetLinksMode = function(mode) 
{
	try
	{
		SetLinksMode(mode);
    }
    catch(e)
	{
		console.error("EventListener.SetLinksMode has exception: " + e);
    }
}

EventListener.prototype.UpdateLinksHighlighting = function() 
{
	try
	{
		UpdateContentOnAllTabs();
	}
	catch(e)
	{
		console.error("EventListener.UpdateLinksHighlighting has exception: " + e);
	}
}

