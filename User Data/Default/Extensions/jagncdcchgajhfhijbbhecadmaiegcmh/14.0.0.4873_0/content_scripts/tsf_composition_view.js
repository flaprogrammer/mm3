var KasperskyLabVirtualKeyboard = (function (ns)
{

ns.TsfCompositionView = function(inputElement, window, document)
{
	var m_view = null;

    this.update = function(composition)
	{
		if (composition.text.length == 0)
		{
			hide();
		}
		else
		{
			show(composition);
		}
	}

    this.hide = function()
	{
		hide();
	}

	this.getLayout = function()
	{
		if (!m_view)
		{
			return { isVisible: false };
		}
		return {
			isVisible: true,
			compositionTextRect: KasperskyLab.getElementScreenPosition(m_view.textElement),
			selectedTextRect: KasperskyLab.getElementScreenPosition(m_view.selectedTextElement)
			};
	}

	function show(composition)
	{
		if (!m_view)
		{
			m_view = createView();
			document.body.appendChild(m_view.rootElement);
			// TODO
			// addEvent(window, "resize", updateViewPosition);
			// TODO: the view should send updated coordinates to the plugin
			m_view.timer = setInterval(updateViewPosition, 500);
		}
		updateViewContent(composition);
		updateViewPosition();
	};

	function hide()
	{
		if (m_view)
		{
			if (m_view.timer)
			{
				clearInterval(m_view.timer);
				delete m_view.timer;
			}

			// removeEvent(window, "resize", updateViewPosition); // TODO

			m_view.rootElement.parentNode.removeChild(m_view.rootElement);
			m_view = null;
		}
	};

	function createView()
	{
		var viewElement = makeDiv(
"position:absolute!important;display:block!important;height:auto!important;width:auto!important;padding:11px 10px!important;"+
"margin:0!important;text-align:left!important;border:1px solid #B2B2B2!important;border-radius:5px!important;"+
"background:#fff!important;z-index:20000!important;"
			);
		var textElementStyles = 
"width:auto!important;height:auto!important;padding:0!important;margin:0!important;"+
"font:16px/1 Arial,Helvetica,sans-serif!important;text-align:left!important;color:#000!important;border:none!important;"+
"white-space:nowrap!important;z-index:20000!important;"
			;
		var textElement = makeDiv(textElementStyles + "position:static!important;display:block!important;background:#transparent!important;");
		var leftTextElement = makeDiv(textElementStyles + "position:static!important;display:inline!important;background:#transparent!important;");
		var selectedTextElement = makeDiv(textElementStyles + "position:static!important;display:inline!important;color:#fff!important;background:#3297FD!important;");
		var rightTextElement = makeDiv(textElementStyles + "position:static!important;display:inline!important;background:#transparent!important;");
		var caretWrapperElement = makeDiv(textElementStyles + "position:relative!important;display:inline!important;width:0!important;");
		var caretElement = makeDiv(textElementStyles + "position:absolute!important;display:block!important;left:-1px!important;width:1px!important;top:0!important;bottom:0!important;background:#000!important;");

		appendChildsToParent(viewElement,
			appendChildsToParent(textElement,
				leftTextElement,
				selectedTextElement,
				appendChildsToParent(caretWrapperElement,
					caretElement
					),
				rightTextElement
				)
			);
		
		return {
			rootElement: viewElement,
			textElement: textElement,
			leftTextElement: leftTextElement,
			selectedTextElement: selectedTextElement,
			rightTextElement: rightTextElement,
			caretElement: caretElement
		};
	}

	function updateViewContent(composition)
	{
		var text = splitCompositionText(composition);
		setInnerText(m_view.leftTextElement, text.left);
		setInnerText(m_view.selectedTextElement, text.selected);
		setInnerText(m_view.rightTextElement, text.right);
		m_view.caretElement.style.visibility = text.selected.length == 0 ? 'visible' : 'hidden';
	}

	function setInnerText(element, text)
	{
		if (typeof(element.textContent) != 'undefined')
		{
			element.textContent = text;
		}
		else
		{
			element.innerText = text;
		}
	}

	function splitCompositionText(composition)
	{
		return {
			left: composition.text.substr(0, composition.selectionStart),
			selected: composition.text.substr(composition.selectionStart, composition.selectionEnd - composition.selectionStart),
			right: composition.text.substr(composition.selectionEnd, composition.text.length - composition.selectionEnd)
			};
	}

	function updateViewPosition()
	{
		var view = m_view.rootElement;
		var inputPosition = getElementPositionInWindow(inputElement);
		var viewHeight = view.offsetHeight;
		var topInputWindowPosition = inputPosition.top - getPageScroll().top; // vertical position of the element relative to the window
		var bottomInputWindowPosition = getHeightOfVisiblePartOfPage() - topInputWindowPosition - inputElement.offsetHeight; // free space right to the element

		if (!m_view.currentPosition || m_view.currentPosition.top != inputPosition.top || m_view.currentPosition.left != inputPosition.left)
		{
			view.style.left = inputPosition.left + "px";

			if (bottomInputWindowPosition > viewHeight - 1)
			{
				view.style.top = (inputPosition.top + inputElement.offsetHeight - 1) + "px";
			}
			else
			{
				view.style.top = (inputPosition.top - viewHeight + 1) + "px";
			}
			m_view.currentPosition = inputPosition;
		}
	}

	function getElementPositionInWindow(element)
	{
		var top = 0;
		var left = 0;
				
		while (element)
		{
			top = top + element.offsetTop;
			left = left + element.offsetLeft;
			element = element.offsetParent;
		}
			
		return {
			left: left,
			top: top
		};
	}

	// Amount of vertical space before the currently visible part of the document
	function getPageScroll()
	{
		var xScroll;
		var yScroll;
		if (window.pageYOffset)
		{
			yScroll = window.pageYOffset;
			xScroll = window.pageXOffset;
		}
		else if (document.documentElement && document.documentElement.scrollTop)
		{
			yScroll = document.documentElement.scrollTop;
			xScroll = document.documentElement.scrollLeft;
		}
		else if (document.body)
		{
			yScroll = document.body.scrollTop;
			xScroll = document.body.scrollLeft;
		}
			
		return {
			left: xScroll,
			top: yScroll
		};
	}

	function getHeightOfVisiblePartOfPage()
	{
		var windowHeight;
		if (window.innerHeight)
		{
			windowHeight = window.innerHeight;
		}
		else if (document.documentElement && document.documentElement.clientHeight)
		{
			windowHeight = document.documentElement.clientHeight;
		}
		else if (document.body)
		{
			windowHeight = document.body.clientHeight;
		}
		return windowHeight;
	}

	function makeDiv(cssText)
	{
		var div = document.createElement('div');
		div.style.cssText = cssText || '';
		return div;
	}

	function appendChildsToParent(parent)
	{
		for (var i = 1, length = arguments.length; i < length; ++i)
		{
			parent.appendChild(arguments[i]);
		}
		return parent;
	}
}

return ns;
}(KasperskyLabVirtualKeyboard || {}));
