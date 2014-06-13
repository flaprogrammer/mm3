/*
 * @package 	websiteLogonBG
 * @author 		TrueSuite
 * @copyright (c) AuthenTec Inc.
 */
var websiteLogonNotification = {
    _currentPort: null,
    _currentAccountsString: null,
    _currentAccountsPasswordStatus: {},
    _currentPrompt: null,
    _currentDocNum: -1,

    connectBG: function() {
        this._currentPort = chrome.extension.connect({ name: document.location.href });
        if (this._currentPort) {
            console.log("<connectBG> currentPort: " + this._currentPort);
            this._currentPort.onMessage.addListener(function(msg) { websiteLogonNotification.receiveBG(msg); });
            this._currentPort.onDisconnect.addListener(function() { websiteLogonNotification.disconnectBG(); });
        }
    },

    disconnectBG: function() {
        if (this._currentPort) {
            this._currentPort.disconnect();
            this._currentPort = null;
        }
    },

    receiveBG: function(msg) {
        console.log("<receiveBG> cmd: " + msg.cmd);
        switch (msg.cmd) {
            case "document_connected":
                console.log("<receiveBG> document_connected number: " + msg.docnum);
                this._currentDocNum = msg.docnum;
                this.sendBG({ cmd: "frame_connected" });
                break;
            case "showregister":
                console.log("<receiveBG> showregister, url: " + document.location.href);
                if (this.isLogonShowed()) {
                    this.sendBG({ cmd: "cancellogon", url: document.location.href });
                }
                this.showNotificationFrame("register", msg.otpsupport);
                break;
            case "updateui":
                this.updateNotification(msg.type, msg.message);
                break;
        }
    },

    sendBG: function(msg) {
        if (!this._currentPort) {
            console.log("<sendBG> CS -> BG : FAILED " + msg.cmd);
            return;
        }

        msg.docnum = this._currentDocNum;
        this._currentPort.postMessage(msg);
    },

    saveProfile: function() {
        console.log("<saveProfile> entering...");
        this.sendBG({ cmd: "saveprofile" });
    },

    setNever: function() {
        console.log("<setNever> entering...");
        this.sendBG({ cmd: "setnever" });
    },

    selectAccount: function(username) {
        console.log("<selectAccount> entering...");
        this.sendBG({ cmd: "selectaccount", account: username });
    },

    verifyPassword: function(aPassword) {
        console.log("<logonByPassword> entering...");
        this.sendBG({ cmd: "verifypassword", password: aPassword });
    },

    clearRegisterInfo: function() {
        console.log("<clearRegisterInfo> entering...");
        this.sendBG({ cmd: "clearregister" });
    },

    cancelLogon: function() {
        console.log("<cancelLogon> entering...");
        this.sendBG({ cmd: "cancellogon", url: document.location.href });
    },

    openHelpFile: function() {
        console.log('<openHelpFile> entering');
        this.sendBG({ cmd: "openhelpfile" });
    },

    showNotificationFrame: function(type, param) {
        console.log('<showNotificationFrame> entering... type: ' + type);
        try {
            var accounts = null;
            var accountsChanged = false;
            if (type == "logon") {
                var accountsString = param;
                console.log('<showNotificationFrame> accounts: ' + accountsString);
                if (accountsString != this._currentAccountsString) {
                    accountsChanged = true;
                    this._currentAccountsString = accountsString;
                }
                if (accountsString) {
                    accounts = new Array();
                    var accountsInfo = accountsString.split("<<<");
                    for (var i = 0; i < accountsInfo.length; i++) {
                        accounts[i] = accountsInfo[i].substr(0, accountsInfo[i].length - 1);
                        this._currentAccountsPasswordStatus[accounts[i]] = accountsInfo[i].substr(accountsInfo[i].length - 1, 1);
                    }
                }

                if (accountsChanged) {
                    this.initLogonNotification(accounts);
                }

                document.getElementById("wlo_notification_logon").style.display = "";
                document.getElementById("wlo_notification_register").style.display = "none";
            } else if (type == "register") {
                this.initRegisterNotification(param);
                document.getElementById("wlo_notification_register").style.display = "";
                document.getElementById("wlo_notification_logon").style.display = "none";
            }

            //For logo and close button.
            document.getElementById("wlo_logo").src = chrome.extension.getURL("images/logo_32.png");
            document.getElementById("wlo_close").src = chrome.extension.getURL("images/close.png");
            document.getElementById("wlo_close").addEventListener("click", function(event) {
                if (websiteLogonNotification.isRegisterShowed()) {
                    websiteLogonNotification.clearRegisterInfo();
                }
                if (websiteLogonNotification.isLogonShowed()) {
                    websiteLogonNotification.cancelLogon();
                }
            }, false);

            //For learn more link.
            var learnMore = document.getElementById("wlo_learn_more");
            learnMore.addEventListener("click", function(event) { websiteLogonNotification.openHelpFile(); }, false);
            learnMore.style.display = (type == "logon" ? "none" : "");

            //Add localization
            learnMore.innerHTML = chrome.i18n.getMessage("IDS_LEARN_MORE");

            return true;
        } catch (e) {
        console.error("<showNotificationFrame> Exception:" + e);
            return false;
        }
    },

    initLogonNotification: function(accounts) {
        var logonDiv = document.getElementById("wlo_notification_logon");
        if (!logonDiv) {
            //update logon notification.
            return;
        }

        //For password input field.
        var passwordText = document.getElementById("use_password_input");
        var passwordInfo = document.getElementById("use_password_info");
        var logonButton = document.getElementById("logon_button");
        passwordInfo.addEventListener("focus", function(event) { passwordInfo.style.display = 'none'; passwordText.style.display = ''; passwordText.value = ''; passwordText.focus(); }, false);
        passwordText.addEventListener("blur", function(event) { if (passwordText.value == "") { passwordInfo.style.display = ''; passwordText.style.display = 'none'; } }, false);
        passwordText.addEventListener("keyup", function(event) { if (event.keyCode == 13) logonButton.click(); }, false);
        logonButton.addEventListener("click", function(event) { websiteLogonNotification.verifyPassword(passwordText.value); passwordText.value = ""; passwordText.focus(); }, false);

        //For Select field.
        if (accounts && accounts.length > 1) {
            var innerString = '<select id="user_name_select" style="-moz-border-radius:5px;-webkit-border-radius:5px;border-radius:5px;border:1px solid #000000;width:180px;height:24px;font-family:Lucida Sans;font-size:13px;">';
            for (var i = 0; i < accounts.length; i++) {
                innerString += '<option value="' + accounts[i] + '">' + accounts[i] + '</option>';
            }
            innerString += '</select>';

            document.getElementById("wlo_select_container").innerHTML = innerString;
        } else {
            document.getElementById("wlo_select_container").innerHTML = "";
        }
        var userSelect = document.getElementById("user_name_select");
        if (userSelect) {
            if (this._currentAccountsPasswordStatus[accounts[0]] == "0") {
                document.getElementById("wlo_password_container").style.display = "none";
                logonButton.style.display = "none";
            }

            userSelect.addEventListener("change", function(event) {
                websiteLogonNotification.selectAccount(userSelect.value);
                if (websiteLogonNotification._currentAccountsPasswordStatus[userSelect.value] == "1") {
                    document.getElementById("wlo_password_container").style.display = "";
                    logonButton.style.display = "";
                } else if (websiteLogonNotification._currentAccountsPasswordStatus[userSelect.value] == "0") {
                    document.getElementById("wlo_password_container").style.display = "none";
                    logonButton.style.display = "none";
                }
            }, false);
        }

        //Add localization
        passwordInfo.value = chrome.i18n.getMessage("IDS_USE_WINDOWS_PASSWORD");
        logonButton.innerHTML = chrome.i18n.getMessage("IDS_LOGIN_IN");
    },

    isLogonShowed: function() {
        var logonDiv = document.getElementById("wlo_notification_logon");
        if (logonDiv && logonDiv.style.display != "none") {
            return true;
        }

        return false;
    },

    initRegisterNotification: function(param) {
        //Add click function for save and never buttons.
        var saveButton = document.getElementById("save_password_button");
        var neverButton = document.getElementById("never_site_button");
        saveButton.addEventListener("click", function(event) { websiteLogonNotification.saveProfile(); }, false);
        neverButton.addEventListener("click", function(event) { websiteLogonNotification.setNever(); }, false);
        if (param) {
            neverButton.style.display = "none";
        }

        //Add localization
        document.getElementById("register_content").innerHTML = chrome.i18n.getMessage("IDS_SAVE_PASSWORD_NOTICE");
        saveButton.innerHTML = chrome.i18n.getMessage("IDS_SAVE_PASSWORD");
        neverButton.innerHTML = chrome.i18n.getMessage("IDS_NEVER_FOR_THIS_SITE");
    },

    isRegisterShowed: function() {
        var registerDiv = document.getElementById("wlo_notification_register");
        if (registerDiv && registerDiv.style.display != "none") {
            return true;
        }

        return false;
    },

    updateNotification: function(type, message) {
        console.log("<updateNotification> entering... type: " + type + ", message: " + message);
        switch (type) {
            case "swipe_failed":
                var logo = document.getElementById("wlo_logo");
                var logonInfo = document.getElementById("logon_content");
                if (logo && logonInfo) {
                    logo.src = chrome.extension.getURL("images/error_32.png");
                    logonInfo.innerHTML = chrome.i18n.getMessage(message);
                    setTimeout(function() {
                        if (logo.src == chrome.extension.getURL("images/error_32.png")) {
                            logo.src = chrome.extension.getURL("images/logo_32.png");
                            logonInfo.innerHTML = websiteLogonNotification._currentPrompt ? chrome.i18n.getMessage(websiteLogonNotification._currentPrompt) : chrome.i18n.getMessage("IDS_SWIPE_FINGER");
                        }
                    }, 1000);
                }
                break;
            case "swipe_end":
                if (this.isLogonShowed()) {
                    document.getElementById("wlo_notification_logon").style.display = "none";
                }
                break;
            case "logon_show":
                var accountInfo = message.split("---");
                this.showNotificationFrame("logon", accountInfo[1]);
                var temp = accountInfo[0].split("<<<");
                if (temp[0] == "nopassword") {
                    document.getElementById("wlo_password_container").style.display = "none";
                    document.getElementById("logon_button").style.display = "none";
                }
                if (temp[1]) {
                    this._currentPrompt = temp[1];
                    document.getElementById("logon_content").innerHTML = chrome.i18n.getMessage(temp[1]);
                    if (temp[1] == "IDS_ENTER_PASSWORD_NOTICE") {
                        document.getElementById("use_password_info").value = chrome.i18n.getMessage("IDS_TYPE_MASTER_PASSWORD");
                    }
                }
                break;
            case "swipe_focused":
                document.getElementById("wlo_logo").src = chrome.extension.getURL("images/logo_32.png");
                document.getElementById("logon_content").innerHTML = chrome.i18n.getMessage(this._currentPrompt);
                break;
            case "swipe_unfocused":
                document.getElementById("wlo_logo").src = chrome.extension.getURL("images/pause_32.png");
                document.getElementById("logon_content").innerHTML = chrome.i18n.getMessage(message);
                break;
            default:
                break;
        }
    },

    initRTL: function() {
        try {
            //Handle AR&HE RTL
            var uiLocale = chrome.i18n.getMessage("@@ui_locale");
            console.log("<initRTL> uiLocale:" + uiLocale);
            if (uiLocale == "ar" || uiLocale == "he") {
                document.getElementById("wlo_notification").style.direction = "rtl";
                document.getElementById("logon_content").style.float = "right";
                document.getElementById("logon_table").style.float = "right";
                document.getElementById("register_content").style.float = "right";
                document.getElementById("register_table").style.float = "right";
            }
        } catch (e) {
            console.error("<initRTL> exception:" + e);
        }
    }
}

function onLoad() {
    websiteLogonNotification.initRTL();
	websiteLogonNotification.connectBG();
}