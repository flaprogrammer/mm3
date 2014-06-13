var OTPList = {
    "VIPRelyingPartyList": {
        "Version": "1.0",
        "LastUpdateTime": "2010-08-01T00:00:00Z",
        "VIPRelyingParty": [
            {
                "Domain": "paypal.com",
                "Organization": "PayPal",
                "LoginPages": {
                    "URLs": [
                        {
                            "URL": "https://www.paypal.com"
                        },
                        {
                            "URL": "https://www.paypal.com/cgi-bin/webscr?cmd=_login-run"
                        },
                        {
                            "URL": "https://www.paypal.com/us/cgi-bin/webscr?cmd=_home-general&nav=0"
                        }
                    ],
                    "PasswordForm": {
                        "Name": "login_form",
                        "PasswordInput": {
                            "Name": "login_password",
                            "ID": "login_password"
                        },
                        "OTPAppendToPassword": "true"
                    },
                    "OTPFormURL": "https://www.paypal.com/us/cgi-bin/webscr?cmd=_login-submit&dispatch=",
                    "OTPForm": {
                        "Name": "security_form",
                        "ID": "otploginform",
                        "OTPInput": {
                            "Name": "otp",
                            "ID": "otp"
                        }
                    },
                    "OTPFailURL": "https://www.paypal.com/us/cgi-bin/webscr?dispatch="
                },
                "VIPCredentialRegistrationPage": {
                    "URL": "https://www.paypal.com/us/cgi-bin/webscr?cmd=_activate-security-key-any",
                    "NumberOfOTPRequired": 2,
                    "Form": {
                        "Name": "activate_security_form",
                        "CredentialIDFormInput": {
                            "Name": "serial-number",
                            "ID": "serialnumbertxt"
                        },
                        "OTPInput": {
                            "Name": "first-otp",
                            "ID": "otptxt"
                        },
                        "SecondOTPInput": {
                            "Name": "second-otp",
                            "ID": "otptxttwo"
                        }
                    },
                    "OTPFailURL": "https://www.paypal.com/us/cgi-bin/webscr?dispatch="
                }
            },
            {
                "Domain": "ebay.com",
                "Organization": "eBay",
                "LoginPages": {
                    "URLs": [
                        {
                            "URL": "https://signin.ebay.com/ws/eBayISAPI.dll?SignIn"
                        }
                    ],
                    "PasswordForm": {
                        "Name": "SignInForm",
                        "ID": "SignInForm",
                        "PasswordInput": {
                            "Name": "pass",
                            "ID": "pass"
                        },
                        "OTPAppendToPassword": "true"
                    },
                    "OTPFormURL": "https://signin.ebay.com/ws/eBayISAPI.dll?co_partnerId=2&siteid=0&UsingSSL=1",
                    "OTPForm": {
                        "Name": "signInForm",
                        "ID": "signInForm",
                        "OTPInput": {
                            "Name": "otp1",
                            "ID": "otp1"
                        }
                    },
                    "OTPFailURL": "https://signin.ebay.com/ws/eBayISAPI.dll?co_partnerid=2&siteid=0&UsingSSL=1"
                },
                "VIPCredentialRegistrationPage": {
                    "URL": "https://signin.ebay.com/ws/eBayISAPI.dll?ActivateSecurityToken",
                    "NumberOfOTPRequired": 2,
                    "Form": {
                        "Name": "ActivateSecurityToken",
                        "CredentialIDFormInput": {
                            "Name": "slno"
                        },
                        "OTPInput": {
                            "Name": "otp1"
                        },
                        "SecondOTPInput": {
                            "Name": "otp2"
                        }
                    },
                    "OTPFailURL": "https://signin.ebay.com/ws/eBayISAPI.dll"
                },
                "VIPCredentialDeactivationPage": {
                    "URL": "https://signin.ebay.com/ws/eBayISAPI.dll?DeactivateSecurityToken",
                    "NumberOfOTPRequired": 1,
                    "Form": {
                        "Name": "Deact-ResyncToken",
                        "OTPInput": {
                            "Name": "otp1"
                        }
                    },
                    "OTPFailURL": "https://signin.ebay.com/ws/eBayISAPI.dll"
                }
            },
            {
                "Domain": "geico.com",
                "Organization": "GEICO",
                "LoginPages": {
                    "URLs": [
                        {
                            "URL": "https://service.geico.com/insite/login.xhtml"
                        }
                    ],
                    "PasswordForm": {
                        "Name": "form",
                        "PasswordInput": {
                            "Name": "form:password",
                            "ID": "form:password"
                        },
                        "OTPAppendToPassword": "true"
                    },
                    "OTPFormURL": "https://service.geico.com/insite/login.xhtml",
                    "OTPForm": {
                        "Name": "form",
                        "ID": "form",
                        "OTPInput": {
                            "Name": "form:securityCode",
                            "ID": "form:securityCode"
                        }
                    }
                },
                "VIPCredentialRegistrationPage": {
                    "URL": "https://service.geico.com/insite/vipActivate.xhtml",
                    "NumberOfOTPRequired": 1,
                    "Form": {
                        "Name": "form",
                        "CredentialIDFormInput": {
                            "Name": "form:tokenId",
                            "ID": "form:tokenId"
                        },
                        "OTPInput": {
                            "Name": "form:securityCode",
                            "ID": "form:securityCode"
                        }
                    }
                }
            },
            {
                "Domain": "trusted-bank.com",
                "Organization": "Trusted Bank",
                "LoginPages": {
                    "URLs": [
                        {
                            "URL": "https://www.trusted-bank.com/trustedbank/app"
                        }
                    ],
                    "PasswordForm": {
                        "Name": "form",
                        "PasswordInput": {
                            "Name": "password",
                            "ID": "password"
                        },
                        "OTPAppendToPassword": "true"
                    },
                    "OTPFormURL": "https://www.trusted-bank.com/trustedbank/app?x=wi1Y7RONlx-l-ZRWNfKkjYVC2khIj9GBSHlKKtJz4-A",
                    "OTPForm": {
                        "Name": "form",
                        "ID": "enterOtpPanel_enterOtpForm",
                        "OTPInput": {
                            "Name": "vip_securitycode",
                            "ID": "vip_securitycode"
                        }
                    }
                },
                "VIPCredentialRegistrationPage": {
                    "URL": "https://www.trusted-bank.com/trustedbank/app?x=wi1Y7RONlx-l-ZRWNfKkjbWagnCInLvv3bituySizZXZF*M7k6lbYQ",
                    "NumberOfOTPRequired": 1,
                    "Form": {
                        "Name": "form",
                        "CredentialIDFormInput": {
                            "Name": "vip_credentialid"
                        },
                        "OTPInput": {
                            "Name": "vip_securitycode"
                        }
                    }
                }
            },
            {
                "Domain": "xyz.com",
                "Organization": "XYZ Inc.",
                "LoginPages": {
                    "URLs": [
                        {
                            "URL": "https://www.xyz.com"
                        }
                    ],
                    "PasswordForm": {
                        "Name": "login_form",
                        "PasswordInput": {
                            "Name": "login_password",
                            "ID": "login_password"
                        },
                        "OTPAppendToPassword": "true"
                    },
                    "OTPFormURL": "https://www.xyz.com/otpauth",
                    "OTPForm": {
                        "Name": "security_form",
                        "ID": "otploginform",
                        "OTPInput": {
                            "Name": "otp",
                            "ID": "otp"
                        }
                    }
                },
                "VIPCredentialRegistrationPage": {
                    "URL": "https://www.xyz.com/otpreg",
                    "NumberOfOTPRequired": 2,
                    "Form": {
                        "Name": "activate_security_form",
                        "CredentialIDFormInput": {
                            "Name": "serial-number",
                            "ID": "serialnumbertxt"
                        },
                        "OTPInput": {
                            "Name": "first-otp",
                            "ID": "otptxt"
                        },
                        "SecondOTPInput": {
                            "Name": "second-otp",
                            "ID": "otptxttwo"
                        }
                    }
                }
            }
        ]
    }
}
