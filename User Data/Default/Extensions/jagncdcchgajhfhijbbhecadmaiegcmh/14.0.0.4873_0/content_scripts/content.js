var kasperskyLabVirtualKeyboardTooltip = new KasperskyLabVirtualKeyboard.OnceTimedTooltip(window, chrome.i18n.getMessage("TooltipText"));
var lastFocusedElement = null;
var protectableElementDetector = new KasperskyLabVirtualKeyboard.ProtectableElementDetector();
var iconHelper = new KasperskyLabVirtualKeyboard.IconHelper(window);
var keypressEmulator = new KasperskyLabVirtualKeyboard.KeypressEmulator(new KasperskyLabVirtualKeyboard.KeypressEmulatorChromeImpl());
var tsfEditors = new TsfEditorsManager(isProtectableElementHasFocus, createTsfEditor);

Startup();

function TsfEditorEventsSink(editorId)
{
	this.onCompositionLayoutChange = function(compositionLayout, windowLayout)
	{
		chrome.extension.sendRequest({
			name: 'onTsfEditorCompositionLayoutChange',
			editorId: editorId,
			compositionLayout: compositionLayout,
			windowLayout: windowLayout
		});
	}
}

function TsfEditorsManager(isProtectableElementHasFocus, createTsfEditor)
{
	var m_editors = {};

	this.create = function(editorId)
	{
		m_editors[editorId] = isProtectableElementHasFocus() ?
			createTsfEditor(document.activeElement, editorId) : new DummyEditor();
	}
	this.destroy = function(editorId)
	{
		m_editors[editorId].destroy();
		delete m_editors[editorId];
	}
	this.insertText = function(editorId, text)
	{
		m_editors[editorId].insertText(text);
	}
	this.setComposition = function(editorId, composition)
	{
		m_editors[editorId].setComposition(composition);
	}

	function DummyEditor()
	{
		this.destroy = function() {}
		this.insertText = function() {}
		this.setComposition = function() {}
	}
}

function createTsfEditor(inputElement, editorId)
{
	var editorEventsSink = new TsfEditorEventsSink(editorId);
	var viewFactory = function(element, window, document)
	{
		return new KasperskyLabVirtualKeyboard.TsfCompositionView(element, window, document);
	}
	return new KasperskyLabVirtualKeyboard.TsfEditor(inputElement, window, document, editorEventsSink, viewFactory);
}

function isProtectableElementHasFocus()
{
	return document.hasFocus() && protectableElementDetector.test(document.activeElement);
}

function deliverProtectedKeyboardEvent(event)
{
	if (isProtectableElementHasFocus())
	{
		keypressEmulator.emulateKeyboardEvent(document.activeElement, event.text, event.keyCode, event.isCtrl, event.isAlt, event.isShift, event.isNumpad);
	}
}

function AddOnRequestListener()
{
	chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) 
	{
		try
		{
			if (request.name == "deliverProtectedKeyboardEvent")
			{
				deliverProtectedKeyboardEvent(request.event);
			}
			else if (request.name == "Update")
			{
				UpdateTab();
			}
			else if (request.name == "tsfEditorCreate")
			{
				tsfEditors.create(request.editorId);
			}
			else if (request.name == "tsfEditorDestroy")
			{
				tsfEditors.destroy(request.editorId);
			}
			else if (request.name == "tsfEditorInsertText")
			{
				tsfEditors.insertText(request.editorId, request.text);
			}
			else if (request.name == "tsfEditorSetComposition")
			{
				tsfEditors.setComposition(request.editorId, request.composition);
			}
		}
		catch(exception)
		{
			console.error("content.js onRequest has exception: " + exception);
			sendResponse({ hasException: true, exceptionMessage: String(exception) });
		}		
	});
}

function ShowVirtualKeyboard(url)
{
	try 
	{
		if (lastFocusedElement)
			lastFocusedElement.focus();
		var request = new Object();
		request.name = "ShowVirtualKeyboard";
		request.url = url;
		chrome.extension.sendRequest(request);
	} 
	catch(exception) 
	{
		console.error("content.js ShowVirtualKeyboard exc: " + exception);
	}
}

function onElementFocus(element)
{
	currentTabHasFocus(function(tabHasFocus)
		{
			if (tabHasFocus && document.hasFocus() && element && document.activeElement == element)
				onElementFocusInFocusedDocument(element);
		});
}

function onElementFocusInFocusedDocument(element)
{
	lastFocusedElement = element;
	iconHelper.forceRemoveKeyboardIcon();
	kasperskyLabVirtualKeyboardTooltip.hide();
	var request =
	{
		name : "ProcessFocus",
		url : document.URL,
		element :
		{
			name : element.nodeName,
			type : element.type
		}
	};

	chrome.extension.sendRequest(request, 
		function(response)
		{ 
			if (response.needVirtualKeyboardIcon)
			{
				var url = document.URL;
				iconHelper.addKeyboardIcon(document.activeElement, function() { ShowVirtualKeyboard(url); } );
			}
			if (response.needSecurityInputTooltip)
			{
				kasperskyLabVirtualKeyboardTooltip.show(document.activeElement);
			}
		});
}

function onElementBlur()
{
	iconHelper.delayRemoveKeyboardIcon(); // not receive icon click if we remove icon immediately			
	kasperskyLabVirtualKeyboardTooltip.hide();
	chrome.extension.sendRequest({ name : "ProcessBlur" });
}

function onDomChange(document)
{
	updateDocumentListeners(document);
}

function onFocusNoThrow(event)
{
	try 
	{
		if (event && event.target)
			onElementFocus(event.target);
	} 
	catch(exception) 
	{
		console.error("content.js onFocusNoThrow exception: " + exception);
	}
}

function onBlurNoThrow(event)
{
	try 
	{
		onElementBlur();
	} 
	catch(exception) 
	{
		console.error("content.js onBlurNoThrow exception: " + exception);
	}
}

function onPageUnloadNoThrow(event)
{
	try 
	{
		if (lastFocusedElement && lastFocusedElement.ownerDocument == document)
		{
			onElementBlur();
		}
	} 
	catch(exception) 
	{
		console.error("content.js onPageUnloadNoThrow exception: " + exception);
	}
}

function onDomChangeNoThrow(document)
{
	try 
	{
		onDomChange(document);
	} 
	catch(exception) 
	{
		console.error("content.js onDomChangeNoThrow exception: " + exception);
	}
}

function addElementListeners(element)
{
	element.addEventListener('focus', onFocusNoThrow, true);
	element.addEventListener('blur', onBlurNoThrow, true);
}

function removeElementListeners(element)
{
	element.removeEventListener('focus', onFocusNoThrow, true);
	element.removeEventListener('blur', onBlurNoThrow, true);
}

function updateInputListeners(input)
{
	if (protectableElementDetector.test(input))
	{
		if (input.kasperskyVirtualKeyboardListenersAttached)
			return;
		addElementListeners(input);
		input.kasperskyVirtualKeyboardListenersAttached = true;
	}
	else
	{
		if (!input.kasperskyVirtualKeyboardListenersAttached)
			return;
		removeElementListeners(input);
		delete input.kasperskyVirtualKeyboardListenersAttached;
	}
}

function updateDocumentListeners(document)
{
	var inputs = document.getElementsByTagName('INPUT');
	for (var i = 0; i < inputs.length; ++i)
		updateInputListeners(inputs[i]);
}

// Chrome 15 and older has a bug in the document.hasFocus() function
// see http://code.google.com/p/chromium/issues/detail?id=64846
function currentTabHasFocus(callback)
{
	chrome.extension.sendRequest( { name: 'CurrentTabHasFocus' }, callback);
}

function UpdateTab()
{
	iconHelper.forceRemoveKeyboardIcon();
	kasperskyLabVirtualKeyboardTooltip.hide();
	if (document.activeElement && protectableElementDetector.test(document.activeElement))
		onElementFocus(document.activeElement);
}

function Startup()
{
	try 
	{
		AddOnRequestListener();		
		updateDocumentListeners(document);		
		window.addEventListener('unload', onPageUnloadNoThrow, true);
		document.addEventListener('DOMSubtreeModified', function(){ onDomChangeNoThrow(document); }, true);
		UpdateTab();
	} 
	catch(exception) 
	{
		console.error("content.js Startup exception: " + exception);
	}
}

function check(condition, conditionMessage)
{
	if (!condition)
	{
		throw new Error('Requirement failed: ' + conditionMessage);
	}
}
