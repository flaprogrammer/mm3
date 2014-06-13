var KasperskyLabVirtualKeyboard = (function (ns)
{

ns.KeypressEmulatorChromeImpl = function()
{
	this.generateInputEvents = function()
	{
		return true;
	}

	// Content scripts in Chrome are executed in an isolated environment. We cannot create and fill
	// a real event here. A real event should be created in a document context.
	this.createEvent = function(_ /* document */)
	{
		return {};
	}

	this.createKeyboardEvent = function(_ /* document */)
	{
		return {};
	}
	
	this.initEvent = function(event, eventType)
	{
		event.type = eventType;
	}

	this.initKeyboardEvent = function(_ /* document */, event, eventType, charCode, keyCode, isCtrl, isAlt, isShift, keyLocation)
	{
		event.type = eventType;
		event.params = {
			keyCode: keyCode ? keyCode : charCode,
			which: keyCode ? keyCode : charCode,
			charCode: keyCode ? 0 : charCode,
			keyIdentifier: convertKeyCodeToKeyIdentifier(keyCode),
			keyLocation: keyLocation,
			ctrlKey: isCtrl ? true : false,
			altKey: isAlt ? true : false,
			shiftKey: isShift ? true : false,
			metaKey: false,
			altGraphKey: false
		};
	}	

	this.fireEvent = function(event, _ /* eventType */, element)
	{
		return runFunctionInDocumentContext(inDocumentEventSender,
			element.ownerDocument, event);
	}

	this.insertCharacter = function(element, char)
	{
		require(element.ownerDocument && element.ownerDocument.activeElement === element, 'Element should be in document and should be active');
		require(typeof char === 'string' && char.length === 1, 'Invalid parameter');

		// TODO: this is legacy code, it needs refactoring
		var selStart = element.selectionStart;
		var selEnd = element.selectionEnd;

		var valueLength = element.value.length;
		var beforeSelection = element.value.substr(0, selStart);
		var afterSelection = element.value.substr(selEnd, valueLength);

		element.value = beforeSelection + char + afterSelection;

		var diffLen = element.value.length - valueLength;
		var selLength = selEnd - selStart;
		var pos = selStart + diffLen + selLength;

		element.setSelectionRange(pos, pos);
	}

	// TODO: separate Chrome specific logic from the event firing code. Make event firing code
	// feature driven, not browser version driven.
	function inDocumentEventSender(eventPrototype)
	{
		// Caution: this function is executed in document context. It cannot access
		// any local or global variables from the content scripts, it should be
		// completely pure.

		// Webkit contains a bug in keyboard events initializer
		// (https://bugs.webkit.org/show_bug.cgi?id=16735
		// Keyboard events created with DOM have keyCode and charCode of 0)
		// We create generic event instead of keyboard event as the workaround.
		// TODO: create a keyboard event here when the bug will be fixed.
		var event = document.createEvent('Event');
		event.initEvent(eventPrototype.type, true, true);
		for (var paramName in eventPrototype.params)
		{
			event[paramName] = eventPrototype.params[paramName];
		}
		var result = document.activeElement.dispatchEvent(event);
		return result;
	}

	// Executes a function in context of targetDocument.
	// 'data' should be JSON.stringifiable (it shouldn't contain DOM objects).
	function runFunctionInDocumentContext(func, targetDocument, data)
	{
		// This is some sort of a hack. We add a <script> element to the document's
		// header and run it. Result is written to another <script> element, so
		// we can access it through DOM.
		// There is more straightforward approach wich is described here:
		// http://developer.chrome.com/extensions/content_scripts.html#host-page-communication
		// but it proposes to post asynchronous messages between content and document scripts.
		// It will make things much more complicated here, so I prefer to use the hack.
		var scriptElementId = 'KasperskyLabVirtualKeyboardInjectedToDocumentScript';
		var resultElementId = scriptElementId + 'Result';
		var codeToInject = [''
			, '(function(scriptElementId)'
			, '{'
			, '    var scriptElement = document.getElementById(scriptElementId);'
			, '    var result = (' + func + ')(' + JSON.stringify(data) + ');'
			, '    var resultElement = document.createElement("script");'
			, '    resultElement.id = ' + JSON.stringify(resultElementId) + ';'
			, '    resultElement.textContent = result ? "true" : "false";'
			, '    (document.head||document.documentElement).appendChild(resultElement);'
			, '})(' + JSON.stringify(scriptElementId) + ');'
			].join('\n');
			
		var scriptElement = targetDocument.createElement('script');
		scriptElement.id = scriptElementId;
		scriptElement.textContent = codeToInject;
		(targetDocument.head||targetDocument.documentElement).appendChild(scriptElement);
		scriptElement.parentNode.removeChild(scriptElement);

		var resultElement = targetDocument.getElementById(resultElementId);
		var result = resultElement ? JSON.parse(resultElement.textContent) : undefined;
		resultElement.parentNode.removeChild(resultElement);
	 	return result;
	}

	function convertKeyCodeToKeyIdentifierCode(keyCode)
	{
		if (keyCode >= 97 && keyCode <= 105) // numpad '1' ... '9'
			return 65 + keyCode - 97;
		if (keyCode === 106) // numpad '*'
			return 74;
		if (keyCode === 107) // numpad '+'
			return 75;
		if (keyCode === 109) // numpad '-'
			return 77;
		if (keyCode === 110) // numpad '.'
			return 78;
		if (keyCode === 111) // numpad '/'
			return 79;
		return keyCode;
	}

	function convertKeyCodeToKeyIdentifier(keyCode)
	{
		var keyIdentifierCode = convertKeyCodeToKeyIdentifierCode(keyCode);
		return keyIdentifierCode ? 'U+' + decimalToHex(keyIdentifierCode, 4).toUpperCase() : '';
	}

	function decimalToHex(number, padding)
	{
		var hex = Number(number).toString(16);
		padding = (typeof (padding) === "undefined" || padding === null) ? 2 : padding;
		while (hex.length < padding)
			hex = '0' + hex;
		return hex;
	}
}

// TODO: move this function to a common place
function require(condition, message)
{
	if (!condition)
	{
		throw new Error(message ? message : 'Requirement failure');
	}
}

return ns;
}(KasperskyLabVirtualKeyboard || {}));
