var KasperskyLabVirtualKeyboard = (function (ns)
{

ns.KeypressEmulator = function(impl)
{
	require(typeof impl === 'object', 'Invalid value for parameter "impl"');
	var m_impl = impl;

	// Emulates keyboard button press event:
	// - sends keyboard events to a document,
	// - inserts a character (characters) to the active element if this action hasn't been cancelled by event handlers.
	// This emulator only works with buttons that have text representation.
	// You cannot use it to emulate modifiers keys events.
	// Please note that one button press can produce several characters.
	this.emulateKeyboardEvent = function(element, text, keyCode, isCtrl, isAlt, isShift, isNumpad)
	{
		require(!!element, "Parameter 'element' is null.");
		require(!!element.ownerDocument, "Element is not attached to document.");
		require(typeof text === 'string', "Parameter 'text' has invalid type '" + (typeof text) + "'.");
		require(typeof keyCode === 'number' && keyCode % 1 === 0 && keyCode >= 0, "Parameter 'keyCode' has invalid type or value.");
		
		ensureImplementationIsCreated(element.ownerDocument);

		var keyLocation = isNumpad ? KeyLocations.DOM_KEY_LOCATION_NUMPAD : KeyLocations.DOM_KEY_LOCATION_STANDARD;
		var charCodeForKeyEvents = text.length ? text.charCodeAt(0) : 0;
		if (fireKeydownEvent(element, charCodeForKeyEvents, keyCode, isCtrl, isAlt, isShift, keyLocation))
		{
			for (var textIndex = 0; textIndex < text.length; ++textIndex)
			{
				deliverOneCharacter(element, text.charCodeAt(textIndex), isCtrl, isAlt, isShift, keyLocation);
			}
		}
		fireKeyupEvent(element, charCodeForKeyEvents, keyCode, isCtrl, isAlt, isShift, keyLocation);
	}

	function deliverOneCharacter(element, charCode, isCtrl, isAlt, isShift, keyLocation)
	{
		if (fireKeyboardEvent('keypress', element, charCode, 0 /* keyCode */, isCtrl, isAlt, isShift, keyLocation))
		{
		 	insertCharToElementIfElementAllows(element, String.fromCharCode(charCode));
			if (m_impl.generateInputEvents())
			{
				fireEvent('input', element);
			}
		}
	}

	function insertCharToElementIfElementAllows(element, char)
	{
		require(!!m_impl, 'No implementation found, browser is unsupported');

		if (element.maxLength && element.maxLength > 0 && element.value.length >= element.maxLength)
		{
			return;
		}

		m_impl.insertCharacter(element, char);
	}

	function fireKeydownEvent(element, charCode, keyCode, isCtrl, isAlt, isShift, keyLocation)
	{
		return fireKeyboardEvent('keydown', element, charCode, keyCode, isCtrl, isAlt, isShift, keyLocation)
	}

	function fireKeyupEvent(element, charCode, keyCode, isCtrl, isAlt, isShift, keyLocation)
	{
		return fireKeyboardEvent('keyup', element, charCode, keyCode, isCtrl, isAlt, isShift, keyLocation)
	}

	function fireEvent(eventType, element)
	{
		require(!!m_impl, 'No implementation found, browser is unsupported');

		var event = m_impl.createEvent(element.ownerDocument);
		m_impl.initEvent(event, eventType);
		return m_impl.fireEvent(event, eventType, element);
	}

	function fireKeyboardEvent(eventType, element, charCode, keyCode, isCtrl, isAlt, isShift, keyLocation)
	{
		require(!!m_impl, 'No implementation found, browser is unsupported');

		var event = m_impl.createKeyboardEvent(element.ownerDocument);
		m_impl.initKeyboardEvent(element.ownerDocument, event, eventType, charCode, keyCode, isCtrl, isAlt, isShift, keyLocation);
		return m_impl.fireEvent(event, eventType, element);
	}

	function ensureImplementationIsCreated(document)
	{
		require(!!document, 'Invalid document');

		if (!m_impl)
		{
			m_impl = createImpl(document);
		}
	}

	var KeyLocations = {
		DOM_KEY_LOCATION_STANDARD: 0,
		DOM_KEY_LOCATION_LEFT: 1,
		DOM_KEY_LOCATION_RIGHT: 2,
		DOM_KEY_LOCATION_NUMPAD: 3
	};
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
