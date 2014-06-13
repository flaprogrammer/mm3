var KasperskyLabVirtualKeyboard = (function (ns) {
    'use strict';

    ns.VirtualKeyboardIconInjector = function (window, iconData) {
        var m_iconCss = 'position:absolute;display:block;width:16px;height:16px;background:url(' + iconData + ') no-repeat center center;cursor:pointer;z-index:10000;',



        // some helper functions with syntax sugar
            span = function (document, cssText) {
                var span = document.createElement('span');
                span.style.cssText = cssText || '';
                return span;
            },

            addEvent, removeEvent,

            curPosition = '';


        if (window.addEventListener) {
            addEvent = function (elem, evType, fn) {
                elem.addEventListener(evType, fn, false);
            };
            removeEvent = function (elem, evType, fn) {
                elem.removeEventListener(evType, fn, false);
            };
        } else {
            addEvent = function (elem, evType, fn) {
                elem.attachEvent('on' + evType, fn);
            };
            removeEvent = function (elem, evType, fn) {
                elem.detachEvent('on' + evType, fn);
            };
        }

        function documentMode() {
            if (document.compatMode === 'CSS1Compat') {
                return 'Standards';
            } else {
                return 'Quirks';
            }
        }

        function Icon(document, element, callback) {
            this.element = span(document, m_iconCss);
            this.input = element;
            var that = this;

            addEvent(this.element, 'mouseover', function () { element.style.opacity = 0.7; });
            addEvent(this.element, 'mouseout', function () { element.style.opacity = 1; });
            if (callback) {
                addEvent(this.element, 'click', callback);
            }

            this.reposition = function () { that.position(); };
        }

        Icon.prototype.position = function () {

            // get element's absolute position
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

            function stringifyPosition(position) {
                return position ? 'top=' + position.top + ',left=' + position.left : '';

            }

            var inp = this.input,
                elementStyle = this.element.style;

            var inputPosition = getElemPosition(inp),
                inputHeight = inp.offsetHeight,
                inputWidth = inp.offsetWidth;

            var inputPositionStringified = stringifyPosition(inputPosition);

            if ( (inputPositionStringified != curPosition) || !elementStyle.left ) {
                elementStyle.left = inputPosition.left + inputWidth - 20 + 'px';
                elementStyle.top = inputPosition.top + (inputHeight - 16) / 2 + 'px';
                curPosition = inputPositionStringified;
            }
        };

        // showing icon
        this.showIcon = function (element, callback) {
            var document = element.ownerDocument,
                icon,
                inputClientWidth,
                inputPaddingTop,
                inputPaddingRight,
                inputPaddingBottom,
                inputPaddingLeft,
                returnStyles,
                inputBoxSizing,
                inputMozBoxSizing,
                elementStyle = element.style;

            function getStyle(prop) {
                var computedStyle;
                if (!window.getComputedStyle) {
                    computedStyle = function (el, pseudo) {
                        this.el = el;
                        this.propertyValue = function (prop) {
                            var re = /(\-([a-z]){1})/g;
                            if (prop == 'float') prop = 'styleFloat';
                            if (re.test(prop)) {
                                prop = prop.replace(re, function () {
                                    return arguments[2].toUpperCase();
                                });
                            }
                            return el.currentStyle[prop] ? el.currentStyle[prop] : null;
                        }
                        return this;
                    }
                } else {
                    computedStyle = getComputedStyle(element, null).getPropertyValue(prop);

                }

                return computedStyle || '';
            }

            if (!document) {
                throw 'Cannot add virtual keyboard icon: invalid document';
            }

            icon = new Icon(document, element, callback);

            icon.inputClientWidth = element.clientWidth;
            icon.inputPaddingTop = getStyle('padding-top');
            icon.inputPaddingRight = getStyle('padding-right');
            icon.inputPaddingBottom = getStyle('padding-bottom');
            icon.inputPaddingLeft = getStyle('padding-left');
            icon.inputBoxSizing = getStyle('box-sizing');
            icon.inputMozBoxSizing = getStyle('-moz-box-sizing');
            icon.returnStyles = false;
            icon.timer;

            if (documentMode() != 'Quirks' && parseInt(icon.inputPaddingRight) < 24) {
                if (!(icon.inputBoxSizing === 'border-box' || icon.inputMozBoxSizing === 'border-box')) {
                    elementStyle.width = icon.inputClientWidth - 24 - parseInt(icon.inputPaddingLeft) + 'px';
                };
                elementStyle.paddingRight = '24px';
                elementStyle.paddingTop = icon.inputPaddingTop;
                elementStyle.paddingBottom = icon.inputPaddingBottom;
                elementStyle.paddingLeft = icon.inputPaddingLeft;
                icon.returnStyles = true;
            }

            document.body.appendChild(icon.element);

            icon.position();
            icon.timer = setInterval(icon.reposition, 100);

            addEvent(window, "resize", icon.reposition);
            return icon;
        };

        // returning icon back to memory
        this.hideIcon = function (icon) {
            if (!icon) {
                return; // Icon has already been hidden, nothing to do
            }

            clearInterval(icon.timer);
            removeEvent(window, "resize", icon.reposition);

            var elementStyle = icon.input.style;
            icon.element.parentNode.removeChild(icon.element);

            // resetting styles
            if (icon.returnStyles) {
                elementStyle.paddingRight = icon.inputPaddingRight;
                elementStyle.paddingTop = icon.inputPaddingTop;
                elementStyle.paddingBottom = icon.inputPaddingBottom;
                elementStyle.paddingLeft = icon.inputPaddingLeft;
                if (!(icon.inputBoxSizing === 'border-box' || icon.inputMozBoxSizing === 'border-box')) {
                    elementStyle.width = icon.inputClientWidth - parseInt(icon.inputPaddingRight) - parseInt(icon.inputPaddingLeft) + 'px';
                };
            }
        };
    };

    return ns;
} (KasperskyLabVirtualKeyboard || {}));