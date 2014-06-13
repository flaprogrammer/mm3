var KasperskyLabVirtualKeyboard = (function (ns) 
{

ns.ProtectableElementDetector = function()
{
	var m_tagsAllowed = [ 'input' ];
	var m_typesForbidden = ['hidden', 'submit', 'radio', 'checkbox', 'button', 'image'];

	this.test = function(element)
	{
		if (!includes(m_tagsAllowed, element.tagName))
			return false;
		if (includes(m_typesForbidden, element.getAttribute('type')))
			return false;
		if (getComputedStyle(element, 'display') === 'none')
			return false;
		var maxLength = parseInt(element.getAttribute('maxlength'));
		if (typeof maxLength === 'number' && maxLength <= 3)
			return false;
		if (element.readOnly)
			return false;
		return true;
	}

	function includes(list, text)
	{
		var lowerCasedText = String(text).toLowerCase();
		for(var i in list)
			if (list[i] === lowerCasedText)
				return true;
		return false;
	}

	function getComputedStyle(element, property)
	{
		var value;
		if (element.currentStyle)
		{
			value = element.currentStyle[property];
		}
		else
		{
			var styles = getWindow(element).getComputedStyle(element, '');
			if (styles)
				value = styles.getPropertyValue(property);
		}
		if (typeof value !== 'string')
			return '';
		return value.toLowerCase();
	}

	function getWindow(element)
	{
		var document = element.ownerDocument;
		return 'defaultView' in document ? document.defaultView : document.parentWindow;
	}
}

return ns;
}(KasperskyLabVirtualKeyboard || {}));
