/***************************************************************************
* Configuration file manage class.
***************************************************************************/
function config_helper(config, url, doc) {
    this._config = config || null;
    this._config_item = null;
    this._doc = doc || document;
    this._fnRegister = null;

    var _self = this;

    this.isSpecialSite = function () {
        return _self._config_item != null;
    }

    this.getDomain = function () {
        if (!_self.isSpecialSite())
            return null;

        return _self._config_item['Domain'];
    }

    this.getIsAutoLogin = function () {
        if (!_self.isSpecialSite())
            return null;

        return _self._config_item['IsAutoLogin'];
    }

    this.getIsRefreshOnLoginFailed = function () {
        if (!_self.isSpecialSite())
            return null;

        return _self._config_item['IsRefreshOnLoginFailed'];
    }

    this.isUserNameExist = function () {
        if (_self.isSpecialSite() && _self._config_item['Username'])
            return true;

        return false;
    }

    this.isPasswordExist = function () {
        if (_self.isSpecialSite() && _self._config_item['Password'])
            return true;

        return false;
    }

    this.getUserName = function () {
        if (!_self.isSpecialSite())
            return null;

        return _self.getElementByTypeName('Username', _self._config_item);
    }

    this.getPassword = function () {
        if (!_self.isSpecialSite())
            return null;

        return _self.getElementByTypeName('Password', _self._config_item);
    }

    this.getSubmit = function () {
        if (!_self.isSpecialSite())
            return null;

        return _self.getElementByTypeName('Submit', _self._config_item);
    }

    function getElementsByClassName(name) {
        if (_self._doc.getElementsByClassName) {
            return _self._doc.getElementsByClassName(name);
        }

        var elems = _self._doc.getElementsByTagName('*');
        var arr = new Array();
        for (var i = 0; i < elems.length; ++i) {
            if (elems[i].className && elems[i].className == name) {
                alert(elems[i].className);
                arr.push(elems[i]);
            }
        }
        return arr;
    }

    this.getElementByFilter = function (filter) {
        var type = filter['Type'];
        var content = filter['Content'];
        var value = content['Value'];
        var index = content['Index'];

        var elem = null;

        if (type == 'ID') {
            elem = _self._doc.getElementById(value);
        } else if (type == 'Name') {
            elem = _self._doc.getElementsByName(value)[index];
        } else if (type == 'Tag') {
            elem = _self._doc.getElementsByTagName(value)[index];
        } else if (type = 'Class') {
            elem = getElementsByClassName(value)[index];
        }

        return elem;
    }

    this.getElementByTypeName = function (name, item) {
        var filter = null;

        if (name == 'Username') {
            filter = item['Username'];
        } else if (name == 'Password') {
            filter = item['Password'];
        }
        else if (name == 'Submit') {
            filter = item['Submit'];
        }

        if (!filter)
            return null;

        return _self.getElementByFilter(filter);
    }

    //Initialize config item.
    if (_self._config && _self._config['WebsiteList']) {
        for (var i = 0; i < _self._config['WebsiteList'].length; ++i) {
            var item = _self._config['WebsiteList'][i];
            var reg = new RegExp(item['URL'], 'i');
            if (reg.test(url)) {
                if (item['Username']) {
                    if (!_self.getElementByTypeName('Username', item)) {
                        continue;
                    }
                }

                if (item['Password']) {
                    if (!_self.getElementByTypeName('Password', item)) {
                        continue;
                    }
                }

                if (!_self.getElementByTypeName('Submit', item)) {
                    continue;
                }

                _self._config_item = item;
                break;
            }
        }
    }
}