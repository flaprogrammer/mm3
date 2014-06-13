var KasperskyLab = (function(namespace)
{

namespace.getElementScreenPosition = function(element)
{
	var document = element.ownerDocument;
	var window = document.parentWindow || document.defaultView;
	return getElementBox(element);

	function getElementBox(element)
	{
		var box = getBoundingClientRect(element);
		var frame = window;
		while (frame.parent != frame)
		{
			moveBox(box, getFrameOffset(frame));
			moveBox(box, getDocumentOffset(frame.document));
			frame = frame.parent;
		}

		moveBox(box, getDocumentOffset(window.top.document));
		return box;
	}

	function getFrameOffset(frame)
	{
		var frameElement = frame.frameElement;
		var frameElementBox = getBoundingClientRect(frameElement);
		var paddingLeft = 0;
		var paddingTop = 0;
		if (frame.getComputedStyle)
		{
			paddingLeft = parseInt(frame.getComputedStyle(frameElement, "").getPropertyValue('padding-left'), 10) || 0;
			paddingTop = parseInt(frame.getComputedStyle(frameElement, "").getPropertyValue('padding-top'), 10) || 0;
		}
		else if (frameElement.currentStyle)
		{
			if (isIeModernMode(frame.parent.document) || (isIeModernMode(frame.document) && !isFrameset(frame)))
			{
				paddingLeft = parseInt(frameElement.currentStyle.paddingLeft, 10) || 0;
				paddingTop = parseInt(frameElement.currentStyle.paddingTop, 10) || 0;
			}
		}
		return {
			left: frameElementBox.left + frameElement.clientLeft + paddingLeft,
			top: frameElementBox.top + frameElement.clientTop + paddingTop
			};
	}

	function getBoundingClientRect(element)
	{
		var box = element.getBoundingClientRect();
		return {
			left: box.left,
			top: box.top,
			right: box.right,
			bottom: box.bottom
			};
	}

	function getDocumentOffset(document)
	{
		var offset = { left: 0, top: 0 };
		if (isIe() && isIeModernMode(document))
		{
			var documentBox = getBoundingClientRect(document.documentElement);
			offset.left += documentBox.left < 0 ? -documentBox.left : 0;
			offset.top += documentBox.top < 0 ? -documentBox.top : 0;
		}
		return offset;
	}

	function isIeModernMode(document)
	{
		return document.documentMode && document.documentMode > 7;
	}

	function isIe()
	{
		return /Trident/.test(window.navigator.userAgent);
	}

	function isFrameset(window)
	{
		return window.frames.length > 0 && String(window.frames[0].frameElement.tagName).toUpperCase() === 'FRAME';
	}

	function moveBox(box, offset)
	{
		box.left += offset.left;
		box.top += offset.top;
		box.right += offset.left;
		box.bottom += offset.top;
	}
}

return namespace;
}(KasperskyLab || {}));
