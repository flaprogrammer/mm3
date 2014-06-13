var KasperskyLabVirtualKeyboard = (function (ns)
{

ns.TsfEditor = function(inputElement, window, document, eventsSink, viewFactory)
{
	var m_compositionView = null;

	this.destroy = function()
	{
		if (m_compositionView)
		{
			m_compositionView.hide();
			m_compositionView = null;
		}
	}

	this.insertText = function(text)
	{
		// TODO: use keypress emulator to insert text
		insertText(inputElement, text);
	}

	this.setComposition = function(composition)
	{
		if (!m_compositionView)
		{
			m_compositionView = viewFactory(inputElement, window, document);
		}
		m_compositionView.update(composition);
		eventsSink.onCompositionLayoutChange(m_compositionView.getLayout(), getTopWindowLayout());
	}

	function getTopWindowLayout()
	{
		var topElement = window.top.document.documentElement;
		check(topElement, 'Top element is not defined');
		check(typeof(topElement.offsetWidth) != 'undefined', 'offsetWidth is not found');
		check(typeof(topElement.offsetHeight) != 'undefined', 'offsetHeight is not found');
		return {
			width: topElement.offsetWidth,
			height: topElement.offsetHeight
			};
	}

	function insertText(element, text)
	{
		check(typeof(text) == 'string', 'Invalid parameter');

		if (document.selection && document.selection.createRange)
		{
			var textRange = document.selection.createRange();
			if (textRange.parentElement() !== element)
			{
				throw new Error("Selection is outside the input field");
			}
	
			textRange.text = text;
			textRange.select();
		}
		else
		{
			var selectionStart = element.selectionStart;
			var selectionEnd = element.selectionEnd;

			var textBeforeSelection = element.value.substr(0, selectionStart);
			var textAfterSelection = element.value.substr(selectionEnd, element.value.length - selectionEnd);

			element.value = textBeforeSelection + text + textAfterSelection;

			var positionAfterText = textBeforeSelection.length + text.length;
			element.setSelectionRange(positionAfterText, positionAfterText);
		}
	}

	function check(condition, requirementMessage)
	{
		if (!condition)
		{
			throw new Error('Requirement failed: ' + requirementMessage);
		}
	}
}

return ns;
}(KasperskyLabVirtualKeyboard || {}));
