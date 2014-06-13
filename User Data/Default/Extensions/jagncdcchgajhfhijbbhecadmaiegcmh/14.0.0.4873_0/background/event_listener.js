function EventListener()
{
	this.deliverProtectedKeyboardEvent = function(event) 
	{
		tryCall(function() { deliverProtectedKeyboardEventToFocusedTab(event) });
	}

	this.updateView = function() 
	{
		tryCall(function() { SendUpdateToAllTabs(); });
}

	this.tsfEditorCreate = function(editorId, tsfEditorEventsSink) 
{
		tryCall(function() { tsfEditorCreate(editorId, tsfEditorEventsSink); });
	}

	this.tsfEditorDestroy = function(editorId) 
	{
		tryCall(function() { tsfEditorDestroy(editorId); });
 	}

	this.tsfEditorInsertText = function(editorId, text) 
	{
		tryCall(function() { tsfEditorInsertText(editorId, text); });
	}

	this.tsfEditorSetComposition = function(editorId, composition) 
	{
		tryCall(function() { tsfEditorSetComposition(editorId, composition); });
}

	function tryCall(callback)
{
	try
	{
			callback();
 	}
	catch(e)
	{
			console.error(callback + "has exception: " + e);
		}
	}
}
