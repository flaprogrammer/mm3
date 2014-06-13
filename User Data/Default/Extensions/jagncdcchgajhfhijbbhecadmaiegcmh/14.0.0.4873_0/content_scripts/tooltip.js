function KasperskyVirtualKeyboardTooltip(element, text, window, document) {
    'use strict';
    // global variables with different tooltip inner elements
    var tooltip,
        pointer,
        content,
        contentText,
        close,
        top,
        bottom,
        timer,
        curPosition = '' ,

    // some more global variables with cached values
        visible = false,
        that = this;

    // some helper functions with syntax sugar
    function $div(cssText) {
        var div = document.createElement('div');
        div.style.cssText = cssText || '';
        return div;
    }

    function append(parent) {
        for (var i = 1, length = arguments.length; i < length; i++) {
            parent.appendChild(arguments[i]);
        }
        return parent;
    }

    function addEvent(elem, evType, fn) {
        if (elem.addEventListener) {
            elem.addEventListener(evType, fn, false);
        } else if (elem.attachEvent) {
            elem.attachEvent('on' + evType, fn);
        }
    }

    tooltip = append(
            $div("position:absolute!important;display:block!important;width:auto!important;height:auto!important;padding:0!important;margin:0!important;text-align:left!important;border:none!important;border-radius:0!important;background:#transparent!important;z-index:10000!important;"),
                top = $div("position:relative!important;display:block!important;width:32px!important;height:12px!important;padding:0!important;margin:0 0 -1px!important;text-align:left!important;border:none!important;border-radius:0!important;background:#transparent!important;z-index:10001!important;"),
                append(                 
                    $div("position:relative!important;display:block!important;height:auto!important;width:auto!important;padding:35px 10px 11px!important;margin:0!important;text-align:left!important;border:1px solid #B2B2B2!important;border-radius:5px!important;background:#fff url(data:image/gif;base64,R0lGODdhRQAPALMAAP///wJ6Wezz8UCagaLOwh2IanCzoczl3rja0YzCs12plNc4K/C2semSi95bUffU0iwAAAAARQAPAAAE/xDISasURtjNZzpdKIZGQIwiEShoKGjXS8GAEAyTPL8yXxUFmK7my9EmioBGAKQREhMVQoIIWAsnldV6KFkHIJthcpOoFCUQ4BAYAxiLxSOpGZgoTUkioK4O7AEIKgMKhRg3dkFVUBJlNkFMOAADQRIODwwNdHssE1UBjCqMi2srKicTaQB7BDaSAGV2aqenbw4Lt5qBAZUTlJQXeaRVBqcCDRKqrJOBjQMlbhKUBZICmAwMczd3nqCkACpjxEl8p3HJoIlLvM5WR2x8FA1xumy9zC9AEwUBAIuUU2oxQHeA3xQJSUDc2BMtWacJlzLROSOBjYFbtQCk+WaGG0E2r2RIxWpmpEIDBw4Y0AGQ5IQdAZkA6NOohCM4RH8OgYBG5Y6jPBJiVsjGUkkNgyso7EHApIA/UBS0bOkSjxmIl7AkDZpwTsK8OAuQtahhB9VYCzzPqq3AcG0FkG7j1mAkV0/dCREAADs=) 10px 9px no-repeat!important;z-index:10000!important;"),
                        append(
                            close = $div("position:absolute!important;right:10px!important;top:6px!important;display:inline-block!important;height:16px!important;width:8px!important;padding:0!important;margin:0!important;text-align:left!important;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIBAMAAAA2IaO4AAAAGFBMVEUAAACMjIyNjY2NjY2NjY2NjY2NjY2NjY23MmtjAAAAB3RSTlMAFMfNztTXdONU4wAAACNJREFUeF5jUBZgNGJwDxQtYRAtSw9kYEwvEwATYC5YAqwEAJOeB3GjsoLnAAAAAElFTkSuQmCC) right center no-repeat!important;cursor:pointer!important;border:none!important;border-radius:0!important;white-space:nowrap!important;z-index:10000!important;")
                    ),
                    contentText = $div("position:static!important;display:block!important;width:auto!important;height:auto!important;padding:0!important;margin:0!important;font:11px/1 Arial,Helvetica,sans-serif!important;text-align:left!important;color:#000!important;border:none!important;border-radius:0!important;background:#transparent!important;white-space:nowrap!important;z-index:10000!important;")
                ),
                bottom = $div("position:relative!important;display:block!important;width:32px!important;height:12px!important;padding:0!important;margin:-1px 0 0!important;text-align:left!important;border:none!important;border-radius:0!important;background:#transparent!important;z-index:10001!important;")
                                
        );

    this.element = element;
    contentText.innerHTML = text;

    // showing tooltip
    this.show = function () {
        document.body.appendChild(tooltip);
        // positioning of the tooltip, the main quest
        positionTooltip();
        timer = setInterval(function() { positionTooltip() }, 100);
        visible = true;
    };

    // returning tooltip back to memory
    this.hide = function () {
        clearInterval(timer);
        tooltip.parentNode.removeChild(tooltip);
        visible = false;
    };

    // positioning the pointer part of the tooltip, at the top or at the bottom
    function positionTooltipPointer(position) {
    var pointer = $div("position:static!important;display:block!important;padding:0!important;margin:0!important;height:12px!important;width:100%!important;z-index:10001!important;");
    top.innerHTML = '';
    bottom.innerHTML = '';
    if (position === "top") {
      pointer.style.background = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAMCAYAAABiDJ37AAAACXBIWXMAAA7DAAAOwwHHb6hkAAABWElEQVR4nGNgIAJs27ZNBoSJUctISMH69esFmJmZj4DYf//+tQkMDPyATz0TPslVq1axAQ3brKSkpA3CLCwsW0Fi+PQw45JoaGhgkpWVXSElJeWhp6fHICoqyvD161fZb9++6WhoaKw+cODAf3wGY4DNmzdPO378+H+gN//DAIgNEtu0adMMUg2rOXjw4P/fv3//RwcgMZAc0NA6ogwDKkzevXv3/x8/fmAYBgM/f/78v2fPnv9Ai1PxGrZx40bvHTt2/P7y5QtOw2AAGJ7/gWr/Ag0NRDYDHstAl1mwsrKuNDc3Z+Hm5iboEy4uLgYLCwsmYCpYtmHDBisUA4EuU2FkZNxsZGTELSAgQFTQgAA/Pz+DiYkJBzA5bQY6SBskxrh161YJYOydNDAwkAMmE6INQwZPnz5lOH/+/COga61ZgIY9B6YrBnINAwFpaWkGYETJXb169TEAxE/maDihlpAAAAAASUVORK5CYII=) no-repeat right bottom';
      append(top, pointer);
        } else if (position === "bottom") {
            pointer.style.background = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAMCAMAAABV0m3JAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAHtQTFRF/f39/v7+9/f3vLy82traxMTEsrKy+vr6+Pj44eHhwcHBu7u71NTU9PT06Ojov7+/x8fH+/v7zc3N5+fn2dnZ9fX1y8vLzMzMuLi46urq7+/v4uLi8PDw0dHR7u7u0tLSysrK5OTk+fn58vLy3d3d7e3tubm5////////XpsuDAAAACl0Uk5T/////////////////////////////////////////////////////wBS9CCHAAAAcklEQVR42lzIRRLDQBBD0Z4xsx1mTs+//wlTLseojaQnoe8W+YQSZ+e5PT0rFFpO7ahvBG56Gu1y+NIipRa9bXVNhyRZ3NnLS+gRP21aa9INI3KvxTmpr0zR7PbGrB5mhkiQ58Fw/k1UVRFLxNph/gQYAF9EHwMdCtNxAAAAAElFTkSuQmCC) no-repeat right top';
            append(bottom, pointer);
        }
    }

    function positionTooltip() {
        // some helper functions, getting different size parameters of the document

        // absolure position of the element in the document
        function getElemPosition(elem) {
            var top = 0,
                left = 0;
                
            while (elem) {
                top = top + elem.offsetTop;
                left = left + elem.offsetLeft;
                elem = elem.offsetParent;
            }
            
            return {
                top: top,
                left: left
            };
        }

        // amount of vertical space before the currently visible part of the document
        function getPageScroll() {
            var xScroll, yScroll;
            if (window.pageYOffset) {
                yScroll = window.pageYOffset;
                xScroll = window.pageXOffset;
            } else if (document.documentElement && document.documentElement.scrollTop) {
                yScroll = document.documentElement.scrollTop;
                xScroll = document.documentElement.scrollLeft;
            } else if (document.body) {
                yScroll = document.body.scrollTop;
                xScroll = document.body.scrollLeft;
            }
            
            return {
                left: xScroll,
                top: yScroll
            };
        }

        // visible part height
        function getPageHeight() {
            var windowHeight;
            if (window.innerHeight) {
                windowHeight = window.innerHeight;
            } else if (document.documentElement && document.documentElement.clientHeight) {
                windowHeight = document.documentElement.clientHeight;
            } else if (document.body) {
                windowHeight = document.body.clientHeight;
            }
            return windowHeight;
        }

        // visible part width
        function getPageWidth() {
            var windowWidth;
            if (window.innerWidth) {
                windowWidth = window.innerWidth;
            } else if (document.documentElement && document.documentElement.clientHeight) {
                windowWidth = document.documentElement.clientWidth;
            } else if (document.body) {
                windowWidth = document.body.clientWidth;
            }
            return windowWidth;
        }

		function stringifyPosition(position)
		{
			return position ? 'top=' + position.top + ',left=' + position.left : '';
		}

        var inputPosition = getElemPosition(that.element),
            tooltipHeight = tooltip.offsetHeight,
            tooltipWidth = tooltip.offsetWidth,
            topInputWindowPosition = inputPosition.top - getPageScroll().top, // vertical position of the element relative to the window
            leftInputWindowPosition = inputPosition.left - getPageScroll().left, // horizontal position of the element relative to the window
            bottomInputWindowPosition = getPageHeight() - topInputWindowPosition - that.element.offsetHeight, // free space right to the element
            rightInputWindowPosition = getPageWidth() - leftInputWindowPosition; // free space bottom to the element

		var inputPositionStringified = stringifyPosition(inputPosition);
        if(inputPositionStringified != curPosition) {
            //tooltip horisontal position
            tooltip.style.left = inputPosition.left + "px";

            //tooltip vertical position
            if (bottomInputWindowPosition > tooltipHeight - 1) {
                tooltip.style.top = (inputPosition.top + that.element.offsetHeight - 1) + "px";
                positionTooltipPointer("top");
            } else {
                tooltip.style.top = (inputPosition.top - tooltipHeight + 1) + "px";
                positionTooltipPointer("bottom");
            }
            curPosition = inputPositionStringified;
        }
     }

    // repositioning tooltip in case of window resize
    addEvent(window, "resize", function () {
        if (visible) {
            positionTooltip();
        }
    });

    addEvent(close, "click", function () {
        that.hide();
    });
}