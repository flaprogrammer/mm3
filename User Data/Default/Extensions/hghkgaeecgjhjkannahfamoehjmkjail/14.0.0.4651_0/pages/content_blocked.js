document.addEventListener('DOMContentLoaded', function()
{
	getPageContentFromPlugin(function(content)
	{
		replacePageContent(content);
	});
});

function getPageContentFromPlugin(onResponseCallback)
{
	chrome.extension.sendRequest({ name: 'getBlockedPageContent' }, function(response)
	{
		if (response && response.content)
		{
			onResponseCallback(response.content);
		}
		else
		{
			console.error('Invalid response: "' + JSON.stringify(response) + '"');
		}
	});
}

function replacePageContent(content)
{
	document.open();
	document.write(content);
	document.close();
}


