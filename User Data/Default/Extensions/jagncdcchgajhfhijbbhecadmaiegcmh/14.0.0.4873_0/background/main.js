var virtualKeyboardPlugin = document.getElementById("KavVkbdPluginId");
var eventListener = new EventListener();
var g_tsfEditors = {};

Startup();

function deliverProtectedKeyboardEventToFocusedTab(event)
{
	try
	{
		sendRequestToFocusedTab({ name: "deliverProtectedKeyboardEvent", event: event });
}
	catch (e)
{
		virtualKeyboardPlugin.InputError();
	}
}

function tsfEditorCreate(editorId, tsfEditorEventsSink)
{
	if (g_tsfEditors[editorId])
		{
		throw new Error('TSF editor already exists');
	}
	g_tsfEditors[editorId] = new TsfEditorProxy(editorId, tsfEditorEventsSink);
}

function tsfEditorDestroy(editorId)
{
	var proxy = g_tsfEditors[editorId];
	delete g_tsfEditors[editorId];
	proxy.destroy();
			}

function tsfEditorInsertText(editorId, text) 
	{
	g_tsfEditors[editorId].insertText(text);
}

function tsfEditorSetComposition(editorId, composition) 
		{
	g_tsfEditors[editorId].setComposition(composition);
}

function SendUpdateToAllTabs()
{
	var request = { name: "Update" };
	forAllTabsInAllWindows(function(window, tab)
	{
			if (tab.url != "chrome://newtab/")
		{
				sendRequestToTab(request, tab);
			}
	});
}

function ShowVirtualKeyboard(tab)
{
	try
	{
		virtualKeyboardPlugin.ShowVirtualKeyboard("");   
	}
	catch(e)
	{
		console.error("main.js ShowVirtualKeyboard has exception: " + e);
	}
}

function ProcessShowVirtualKeyboard(request)
{
	try
	{
		virtualKeyboardPlugin.ShowVirtualKeyboard(request.url);   
	}
	catch(e)
	{
		console.error("main.js ProcessShowVirtualKeyboard has exception: " + e);
	}
}

function ProcessFocus(request)
{
	try
	{
		var result = virtualKeyboardPlugin.ProcessFocus(request.url, request.element.name, request.element.type);
		return result;
	}
	catch(e)
	{
		console.error("main.js ProcessFocus has exception: " + e);
	}
}

function ProcessBlur()
{
	try
	{
		virtualKeyboardPlugin.ProcessBlur();
	}
	catch(e)
	{
		console.error("main.js ProcessBlur has exception: " + e);
	}
}

function AddOnRequestListener()
{
	chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) 
	{
		try
		{
			if (request.name == "ShowVirtualKeyboard")
			{
				ProcessShowVirtualKeyboard(request);
			}
			else if (request.name == "ProcessFocus")
			{
				var operationResult = ProcessFocus(request);
				sendResponse(
					{
						needVirtualKeyboardIcon: operationResult.NeedVirtualKeyboardIcon, 
						needSecurityInputTooltip: operationResult.NeedSecurityInputTooltip
					});
			}
			else if (request.name == "ProcessBlur")
			{
				ProcessBlur();
				sendResponse();
			}
			else if (request.name == "CurrentTabHasFocus")
			{
				if (sender.tab.selected)
					chrome.windows.get(sender.tab.windowId, function(window) { sendResponse(window.focused) });
				else
					sendResponse(false);
			}
			else if (request.name == "onTsfEditorCompositionLayoutChange")
			{
				if (g_tsfEditors[request.editorId])
				{
					g_tsfEditors[request.editorId].onCompositionLayoutChange(request.compositionLayout, request.windowLayout);
				}
			}
		}
		catch(exception)
		{
			console.error("main.js onRequest has exception: " + exception);
		}		
	});
}

function Startup()
{
	try 
	{
		virtualKeyboardPlugin.Initialize();
		chrome.browserAction.onClicked.addListener(ShowVirtualKeyboard);		
		AddOnRequestListener();		
	} 
	catch(exception) 
	{
		console.error("main.js Startup exc: " + exception);
	}
}