import { Observable } from "tns-core-modules/data/observable";
import { alert, prompt } from "tns-core-modules/ui/dialogs";
import { ios as iosUtils } from "tns-core-modules/utils/utils";
import { isIOS } from "tns-core-modules/platform";
import { AddEventListenerResult, User } from "nativescript-plugin-firebase";
import * as fs from "tns-core-modules/file-system";

import * as firebase from"nativescript-plugin-firebase";
const firebaseWebApi = require("nativescript-plugin-firebase/app");

declare const Crashlytics: any;

const getCircularReplacer = () => {
  const seen = new WeakSet;
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export class HelloWorldModel extends Observable {

  public userEmailOrPhone: string;
  private userListenerWrapper: AddEventListenerResult;
  private companiesListenerWrapper: AddEventListenerResult;
  private onAuthStateChangedHandlerSet = false;


  /***********************************************
   * Web API usage examples
   ***********************************************/

  private ensureWebOnAuthChangedHandler(): void {
    if (!this.onAuthStateChangedHandlerSet) {
      this.onAuthStateChangedHandlerSet = true;
      firebaseWebApi.auth().onAuthStateChanged((user?: User) => {
        console.log(">> auth state changed: " + user);
        if (user) {
          this.set("userEmailOrPhone", user.email ? user.email : (user.phoneNumber ? user.phoneNumber : "N/A"));
          alert({
            title: "User signed in",
            message: JSON.stringify(user),
            okButtonText: "Nice!"
          });
        } else {
          alert({
            title: "User signed out",
            okButtonText: "Bye!"
          });
        }
      });
    }
  }

  public doWebInit(): void {
    firebaseWebApi.initializeApp();
  }

  public doWebLoginAnonymously(): void {
    this.ensureWebOnAuthChangedHandler();
    firebaseWebApi.auth().signInAnonymously()
        .then(() => console.log("User logged in"))
        .catch(err => {
              alert({
                title: "Login error",
                message: JSON.stringify(err),
                okButtonText: "OK, pity"
              });
            }
        );
  }

  public doWebLoginByPassword(): void {
    this.ensureWebOnAuthChangedHandler();
    firebaseWebApi.auth().signInWithEmailAndPassword('eddyverbruggen@gmail.com', 'firebase')
        .then(() => console.log("User logged in"))
        .catch(err => {
              alert({
                title: "Login error",
                message: JSON.stringify(err),
                okButtonText: "OK, pity"
              });
            }
        );
  }

  public doWebFetchProvidersForEmail(): void {
    const user = firebaseWebApi.auth().currentUser;
    if (!user || !user.email) {
      alert({
        title: "Can't fetch providers",
        message: "No user with an emailaddress logged in.",
        okButtonText: "OK, makes sense.."
      });
      return;
    }

    firebaseWebApi.auth().fetchProvidersForEmail(user.email).then(
        result => {
          alert({
            title: `Providers for ${user.email}`,
            message: JSON.stringify(result), // likely to be ["password"]
            okButtonText: "Thanks!"
          });
        },
        errorMessage => {
          alert({
            title: "Fetch Providers for Email error",
            message: errorMessage,
            okButtonText: "OK, pity.."
          });
        }
    );
  }

  public doWebFetchSignInMethodsForEmail(): void {
    const user = firebaseWebApi.auth().currentUser;
    if (!user || !user.email) {
      alert({
        title: "Can't fetch providers",
        message: "No user with an emailaddress logged in.",
        okButtonText: "OK, makes sense.."
      });
      return;
    }

    firebaseWebApi.auth().fetchSignInMethodsForEmail(user.email).then(
        result => {
          alert({
            title: `Sign-in methods for ${user.email}`,
            message: JSON.stringify(result), //  ["password"], ["emailLink"], or ["password", "emailLink']
            okButtonText: "Thanks!"
          });
        },
        errorMessage => {
          alert({
            title: "Sign-in methods for Email error",
            message: errorMessage,
            okButtonText: "OK, pity.."
          });
        }
    );
  }

  public doWebLogout(): void {
    firebaseWebApi.auth().signOut()
        .then(() => {
          this.set("userEmailOrPhone", null);
          alert({
            title: "Logout OK",
            okButtonText: "OK, bye!"
          });
        })
        .catch(error => {
              alert({
                title: "Logout error",
                message: JSON.stringify(error),
                okButtonText: "Hmmkay"
              });
            }
        );
  }

  public doWebCreateUser(): void {
    firebaseWebApi.auth().createUserWithEmailAndPassword('eddyverbruggen@gmail.com', 'firebase')
        .then(result => {
          alert({
            title: "User created",
            message: JSON.stringify(result),
            okButtonText: "Nice!"
          });
        })
        .catch(
            error => {
              alert({
                title: "No user created",
                message: JSON.stringify(error),
                okButtonText: "OK, got it"
              });
            }
        );
  }

  public doWebGetCurrentUser(): void {
    const user = firebaseWebApi.auth().currentUser;
    if (user) {
      alert({
        title: "Current user",
        message: JSON.stringify(user),
        okButtonText: "Nice!"
      });
    } else {
      alert({
        title: "No current user",
        okButtonText: "OK, thanks"
      });
    }
  }

  public doWebAddValueEventListenerForCompanies(): void {
    const path = "/companies";
    const onValueEvent = result => {
      if (result.error) {
        alert({
          title: "Listener error",
          message: result.error,
          okButtonText: "Darn!"
        });
      } else {
        this.set("path", path);
        this.set("key", result.key);
        this.set("value", JSON.stringify(result.val()));
      }
    };

    firebaseWebApi.database().ref(path).on("value", onValueEvent);
  }

  public doWebRemoveValueEventListenersForCompanies(): void {
    const path = "/companies";
    firebaseWebApi.database().ref(path).off("value");
  }

  public doWebGetServerInfo(): void {
    const path = ".info";
    firebaseWebApi.database().ref(path)
        .once("value")
        .then(result => {
          this.set("path", path);
          this.set("key", result.key);
          this.set("value", JSON.stringify(result.val()));
        })
        .catch(error => console.log("doWebGetServerTime error: " + error));
  }

  public doWebGetValueForCompanies(): void {
    const path = "/companies";
    firebaseWebApi.database().ref(path)
        .once("value")
        .then(result => {
          this.set("path", path);
          this.set("key", result.key);
          this.set("value", JSON.stringify(result.val()));
        })
        .catch(error => console.log("doWebGetValueForCompanies error: " + error));
  }

  public doWebStoreCompaniesBySetValue(): void {
    firebaseWebApi.database().ref("/companies")
        .set([
              {
                name: 'Telerik (web)',
                country: 'Bulgaria',
                since: 2000,
                updateTs: firebase.ServerValue.TIMESTAMP
              },
              {
                name: 'Google (web)',
                country: 'USA',
                since: 1900,
                updateTs: firebase.ServerValue.TIMESTAMP
              }
            ]
        )
        .then(() => console.log("firebase.setValue done"))
        .catch(error => console.log("firebase.setValue error: " + error));
  }

  public doWebRemoveCompanies(): void {
    firebaseWebApi.database().ref("/companies").remove()
        .then(() => console.log("firebase.remove done"))
        .catch((err) => console.log("firebase.remove error: " + err));
  }

  public doWebQueryBulgarianCompanies(): void {
    const path = "/companies";
    const child = "name";
    firebaseWebApi.database().ref(path).orderByChild(child)
        .once("value")
        .then(result => {
          this.set("path", path);
          this.set("key", result.key);
          this.set("value", JSON.stringify(result.val()));
        })
        .catch(error => console.log("doWebQueryBulgarianCompanies error: " + error));
  }

  public doWebStoreCompanyByFirstCreatingKey(): void {
    const path = "companies",
        companyRef = firebaseWebApi.database().ref().child(path),
        newCompanyKey = companyRef.push().key,
        storeAtPath = `/${path}/${newCompanyKey}`,
        value = {
          name: `Company with key ${newCompanyKey}`,
          updateTs: firebase.ServerValue.TIMESTAMP
        };

    firebaseWebApi.database().ref(storeAtPath).set(value).then(() => {
      this.set("path", storeAtPath);
      this.set("key", newCompanyKey);
      this.set("value", JSON.stringify(value));
    });
  }


  /***********************************************
   * Native API usage examples
   ***********************************************/

  public doInit(): void {
    firebase.init({
      storageBucket: 'gs://n-plugin-test.appspot.com',
      persist: true, // optional, default false
      onAuthStateChanged: data => { // optional
        console.log((data.loggedIn ? "Logged in to firebase" : "Logged out from firebase") + " (init's onAuthStateChanged callback)");
        if (data.loggedIn) {
          this.set("userEmailOrPhone", data.user.email ? data.user.email : (data.user.phoneNumber ? data.user.phoneNumber : "N/A"));
        }
      },
      // testing push wiring in init for iOS:
      onPushTokenReceivedCallback: token => {
        // you can use this token to send to your own backend server,
        // so you can send notifications to this specific device
        console.log("Firebase plugin received a push token: " + token);
        // this is for iOS, to copy the token onto the clipboard
        if (isIOS) {
          const pasteboard = iosUtils.getter(UIPasteboard, UIPasteboard.generalPasteboard);
          pasteboard.setValueForPasteboardType("[Firebase demo app] Last push token received: " + token, kUTTypePlainText);
        }
      },
      onMessageReceivedCallback: message => {
        console.log("Push message received");
        setTimeout(() => {
          alert({
            title: "Push message!",
            message: (message.title !== undefined ? message.title : ""),
            okButtonText: "Sw33t"
          });
        }, 500);
      },
      onDynamicLinkCallback: result => {
        console.log("dynamic link callback invoked with: " + result);
        setTimeout(() => {
          alert({
            title: "Dynamic Link!",
            message: JSON.stringify(result),
            okButtonText: "Awesome!"
          });
        }, 500);
      }
    }).then(
        () => {
          console.log("Firebase is ready");
        },
        error => {
          console.log("firebase.init error: " + error);
        }
    );
  }

  public doLogAnalyticsEvent(): void {
    firebase.analytics.logEvent({
      // see https://firebase.google.com/docs/reference/android/com/google/firebase/analytics/FirebaseAnalytics.Event.html
      key: "add_to_cart",
      parameters: [{ // optional
        key: "item_id",
        value: "p7654"
      },
        {
          key: "item_name",
          value: "abc"
        }]
    }).then(
        () => {
          console.log("Analytics event logged");
          alert({
            title: "Analytics event pushed",
            okButtonText: "Awesome :)"
          });
        }, errorMessage => {
          alert({
            title: "Analytics error",
            message: errorMessage,
            okButtonText: "Ehh, OK"
          });
        }
    );
  }

  public doSetAnalyticsUserProperty(): void {
    firebase.analytics.setUserProperty({
      key: "origin", // note that this needs to be preregistered, see https://support.google.com/firebase/answer/6317519?hl=en&ref_topic=6317489#create-property
      value: "demoapp"
    }).then(
        () => {
          alert({
            title: "Analytics user property set",
            okButtonText: "Great :P"
          });
        },
        errorMessage => {
          alert({
            title: "Analytics error",
            message: errorMessage,
            okButtonText: "Ehhmmm, OK"
          });
        }
    );
  }

  public doSetScreenNameA(): void {
    this.setScreenName("Screen A");
  }

  public doSetScreenNameB(): void {
    this.setScreenName("Screen B");
  }

  private setScreenName(screenName): void {
    firebase.analytics.setScreenName({
      screenName
    }).then(
        () => {
          alert({
            title: "Analytics screen name set to: " + name,
            okButtonText: "Great!"
          });
        },
        errorMessage => {
          alert({
            title: "Analytics error",
            message: errorMessage,
            okButtonText: "Ehhmmm, OK"
          });
        }
    );
  }

  public doShowAdMobBanner(): void {
    firebase.admob.showBanner({
      size: firebase.admob.AD_SIZE.SMART_BANNER,
      margins: {
        bottom: isIOS ? 50 : 0
      },
      androidBannerId: "ca-app-pub-9517346003011652/7749101329",
      iosBannerId: "ca-app-pub-9517346003011652/3985369721",
      testing: true,
      // Android automatically adds the connected device as test device with testing:true, iOS does not
      iosTestDeviceIds: [
        "45d77bf513dfabc2949ba053da83c0c7b7e87715", // Eddy's iPhone 6s
        "fee4cf319a242eab4701543e4c16db89c722731f"  // Eddy's iPad Pro
      ],
      keywords: ["keyword1", "keyword2"] // add keywords for ad targeting
    }).then(
        () => {
          alert({
            title: "Ad loaded successfully",
            message: "Should now be showing..",
            okButtonText: "Hmmkay"
          });
        },
        errorMessage => {
          alert({
            title: "AdMob error",
            message: errorMessage,
            okButtonText: "Hmmkay"
          });
        }
    );
  }

  public doShowAdMobInterstitial(): void {
    firebase.admob.showInterstitial({
      iosInterstitialId: "ca-app-pub-9517346003011652/6938836122",
      androidInterstitialId: "ca-app-pub-9517346003011652/6938836122",
      testing: true,
      // Android automatically adds the connected device as test device with testing:true, iOS does not
      iosTestDeviceIds: [
        "45d77bf513dfabc2949ba053da83c0c7b7e87715", // Eddy's iPhone 6s
        "fee4cf319a242eab4701543e4c16db89c722731f"  // Eddy's iPad Pro
      ]
    }).then(
        () => {
          console.log("AdMob interstitial showing");
        },
        errorMessage => {
          alert({
            title: "AdMob error",
            message: errorMessage,
            okButtonText: "Hmmkay"
          });
        }
    );
  }

  /**
   * Note that an interstitial is supposed to be hidden by clicking the close button,
   * so there's no function to do it programmatically.
   */
  public doHideAdMobBanner(): void {
    firebase.admob.hideBanner().then(
        () => {
          console.log("AdMob banner hidden");
        },
        errorMessage => {
          alert({
            title: "AdMob error",
            message: errorMessage,
            okButtonText: "Hmmkay"
          });
        }
    );
  }

  public doGetCurrentPushToken(): void {
    firebase.getCurrentPushToken().then(token => {
      // may be null if not known yet
      console.log("Current push token: " + token);
      alert({
        title: "Current Push Token",
        message: (token === null ? "Not received yet" : token),
        okButtonText: "OK, thx"
      });
    });
  }

  // You would normally add these handlers in 'init', but if you want you can do it seperately as well:
  public doRegisterPushHandlers(): void {
    firebase.addOnPushTokenReceivedCallback(
        token => {
          // you can use this token to send to your own backend server,
          // so you can send notifications to this specific device
          console.log("Firebase plugin received a push token: " + token);
          // var pasteboard = utils.ios.getter(UIPasteboard, UIPasteboard.generalPasteboard);
          // pasteboard.setValueForPasteboardType(token, kUTTypePlainText);
        }
    );
    firebase.addOnMessageReceivedCallback(
        message => {
          console.log("------------------- push message received: " + JSON.stringify(message, getCircularReplacer()));

          // alert({
          //   title: "Push message!",
          //   message: (message.title !== undefined ? message.title : ""),
          //   okButtonText: "Sw33t"
          // });
        }
    ).then(() => {
      console.log("Added addOnMessageReceivedCallback");
    }, err => {
      console.log("Failed to add addOnMessageReceivedCallback: " + err);
    });
  }

  public doUnregisterForPushNotifications(): void {
    firebase.unregisterForPushNotifications().then(
        () => {
          alert({
            title: "Unregistered",
            message: "If you were registered, that is.",
            okButtonText: "Got it, thanks!"
          });
        });
  }

  public doGetRemoteConfig(): void {
    // TODO downgrade to 3.4 and see if we get logging and alerts.. do this before publishing (the otherwise finished) 5.3.0 version
    // .. hmm doesn't look like it... and neither is disabling crash reporting
    console.log(">>> doGetRemoteConfig");
    firebase.getRemoteConfig({
      developerMode: true,
      cacheExpirationSeconds: 600, // 10 minutes, default is 12 hours
      properties: [{
        "key": "holiday_promo_enabled",
        "default": false
      },
        {
          "key": "default_only_prop",
          "default": 77
        },
        {
          "key": "coupons_left",
          "default": 100
        },
        {
          "key": "origin",
          "default": "client"
        },
        {
          "key": "double_test",
          "default": 9.99
        },
        {
          "key": "int_test",
          "default": 11
        }]
    }).then(
        result => {
          console.log("remote config fetched: " + JSON.stringify(result.properties));
          alert({
            title: `Fetched at ${result.lastFetch} ${result.throttled ? '(throttled)' : ''}`,
            message: JSON.stringify(result.properties),
            okButtonText: "Nice!"
          });
        },
        errorMessage => {
          alert({
            title: "Remote Config error",
            message: errorMessage,
            okButtonText: "OK, thanks"
          });
        }
    );
  }

  public doGetCurrentUser(): void {
    firebase.getCurrentUser().then(
        result => {
          alert({
            title: "Current user",
            message: JSON.stringify(result),
            okButtonText: "Nice!"
          });
        },
        errorMessage => {
          alert({
            title: "No current user",
            message: errorMessage,
            okButtonText: "OK, thanks"
          });
        }
    );
  }

  public doUpdateProfile(): void {
    firebase.updateProfile({
      displayName: `Name UpdateTS ${new Date().getTime()}`,
      photoURL: 'https://avatars2.githubusercontent.com/u/1426370?v=3&u=9661f01efde3c412e19650c9b632297970cbe6ed&s=400'
    }).then(
        () => {
          alert({
            title: "Profile updated",
            okButtonText: "Nice!"
          });
        },
        errorMessage => {
          alert({
            title: "Profile update error",
            message: errorMessage,
            okButtonText: "OK.."
          });
        }
    );
  }

  public doLoginAnonymously(): void {
    firebase.login({
      type: firebase.LoginType.ANONYMOUS
    }).then(
        result => {
          alert({
            title: "Login OK",
            message: JSON.stringify(result),
            okButtonText: "Nice!"
          });
        },
        errorMessage => {
          alert({
            title: "Login error",
            message: errorMessage,
            okButtonText: "OK, pity"
          });
        }
    );
  }

  public doFetchProvidersForEmail(): void {
    firebase.getCurrentUser().then(
        user => {
          if (!user || !user.email) {
            alert({
              title: "Can't fetch providers",
              message: "No user with emailaddress logged in.",
              okButtonText: "OK, makes sense.."
            });
            return;
          }

          firebase.fetchProvidersForEmail(user.email).then(
              result => {
                alert({
                  title: `Providers for ${user.email}`,
                  message: JSON.stringify(result), // likely to be ["password"]
                  okButtonText: "Thanks!"
                });
              },
              errorMessage => {
                alert({
                  title: "Fetch Providers for Email error",
                  message: errorMessage,
                  okButtonText: "OK, pity.."
                });
              }
          );
        });
  }

  public doFetchSignInMethodsForEmail(): void {
    firebase.getCurrentUser().then(
        user => {
          if (!user || !user.email) {
            alert({
              title: "Can't fetch providers",
              message: "No user with emailaddress logged in.",
              okButtonText: "OK, makes sense.."
            });
            return;
          }

          firebase.fetchSignInMethodsForEmail(user.email).then(
              result => {
                alert({
                  title: `Sign-in methods for ${user.email}`,
                  message: JSON.stringify(result), //  ["password"], ["emailLink"], or ["password", "emailLink']
                  okButtonText: "Thanks!"
                });
              },
              errorMessage => {
                alert({
                  title: "Fetch Sign-in methods for Email error",
                  message: errorMessage,
                  okButtonText: "OK, pity.."
                });
              }
          );
        });
  }

  public doCreateUser(): void {
    firebase.createUser({
      email: 'eddyverbruggen@gmail.com',
      password: 'firebase'
    }).then(
        result => {
          alert({
            title: "User created",
            message: JSON.stringify(result),
            okButtonText: "Nice!"
          });
        },
        errorMessage => {
          alert({
            title: "No user created",
            message: errorMessage,
            okButtonText: "OK, got it"
          });
        }
    );
  }

  public doDeleteUser(): void {
    firebase.deleteUser().then(
        () => {
          alert({
            title: "User deleted",
            okButtonText: "Nice!"
          });
        },
        errorMessage => {
          alert({
            title: "User not deleted",
            message: errorMessage,
            okButtonText: "OK, got it"
          });
        }
    );
  }

  public doLoginByPassword(): void {
    firebase.login({
      // note that you need to enable email-password login in your firebase instance
      type: firebase.LoginType.PASSWORD,
      passwordOptions: {
        // note that these credentials have been pre-configured in our demo firebase instance
        email: 'eddyverbruggen@gmail.com',
        password: 'firebase'
      }
    }).then(
        result => {
          alert({
            title: "Login OK",
            message: JSON.stringify(result),
            okButtonText: "Nice!"
          });

          // now retrieve an auth token we can use to access Firebase from our server
          firebase.getAuthToken({
            forceRefresh: false
          }).then(
              token => {
                console.log("Auth token retrieved: " + token);
              },
              errorMessage => {
                console.log("Auth token retrieval error: " + errorMessage);
              }
          );
        },
        errorMessage => {
          alert({
            title: "Login error",
            message: errorMessage,
            okButtonText: "OK, pity"
          });
        }
    );
  }

  public doLoginByPhone(): void {
    prompt(
        "Your phone number",
        "+31612345678"
    ).then(promptResult => {
      if (!promptResult.result) {
        return;
      }

      console.log(">> using promptResult.text: " + promptResult.text);
      firebase.login({
        // note that you need to enable phone login in your firebase instance
        type: firebase.LoginType.PHONE,
        phoneOptions: {
          phoneNumber: promptResult.text,
          verificationPrompt: "The received verification code" // default "Verification code"
        }
      }).then(
          result => {
            alert({
              title: "Phone login OK",
              message: JSON.stringify(result),
              okButtonText: "Cool"
            });
          },
          errorMessage => {
            alert({
              title: "Phone login error",
              message: errorMessage,
              okButtonText: "OK, damn shame"
            });
          }
      );
    });
  }

  public doLoginByEmailLink(): void {
    prompt(
        "The email address to send the link to",
        ""
    ).then(promptResult => {
      if (!promptResult.result) {
        return;
      }

      console.log(">> using promptResult.text: " + promptResult.text);
      firebase.login({
        // note that you need to enable phone login in your firebase instance
        type: firebase.LoginType.EMAIL_LINK,
        emailLinkOptions: {
          email: promptResult.text,
          url: "https://combidesk.com?foo=bar"
        }
      }).then(
          result => {
            alert({
              title: "Email link sent",
              message: "Check your email :)",
              okButtonText: "Cool"
            });
          },
          errorMessage => {
            alert({
              title: "Email link login error",
              message: errorMessage,
              okButtonText: "OK, damn shame"
            });
          }
      );
    });
  }

  public doLoginByFacebook(): void {
    firebase.login({
      // note that you need to enable Facebook auth in your firebase instance
      type: firebase.LoginType.FACEBOOK
    }).then(
        result => {
          alert({
            title: "Login OK",
            message: JSON.stringify(result),
            okButtonText: "Nice!"
          });
        },
        errorMessage => {
          alert({
            title: "Login error",
            message: errorMessage,
            okButtonText: "OK, pity"
          });
        }
    );
  }

  public doLoginByGoogle(): void {
    firebase.login({
      // note that you need to enable Google auth in your firebase instance
      type: firebase.LoginType.GOOGLE
    }).then(
        result => {
          alert({
            title: "Login OK",
            message: JSON.stringify(result),
            okButtonText: "Nice!"
          });
        },
        errorMessage => {
          alert({
            title: "Login error",
            message: errorMessage,
            okButtonText: "OK, pity"
          });
        }
    );
  }

  public doResetPassword(): void {
    firebase.resetPassword({
      email: 'eddyverbruggen@gmail.com'
    }).then(
        result => {
          alert({
            title: "Password reset. Check your email.",
            okButtonText: "OK, nice!"
          });
        },
        error => {
          alert({
            title: "Password reset error",
            message: error,
            okButtonText: "Hmmkay :("
          });
        }
    );
  }

  public doSendEmailVerification(): void {
    firebase.sendEmailVerification().then(
        () => {
          alert({
            title: "Email sent!",
            okButtonText: "Okay"
          });
        },
        error => {
          alert({
            title: "Error sending email verification",
            message: error,
            okButtonText: "Hmmmkay"
          });
        }
    );
  }

  public doLogout(): void {
    firebase.logout().then(
        () => {
          this.set("userEmailOrPhone", null);
          alert({
            title: "Logout OK",
            okButtonText: "OK, bye!"
          });
        },
        error => {
          alert({
            title: "Logout error",
            message: error,
            okButtonText: "Hmmkay"
          });
        }
    );
  }

  public doKeepUsersInSyncOn(): void {
    firebase.keepInSync("/users", true).then(
        () => {
          console.log("firebase.keepInSync ON");
        },
        error => {
          console.log("firebase.keepInSync error: " + error);
        }
    );
  }

  public doKeepUsersInSyncOff(): void {
    firebase.keepInSync("/users", false).then(
        () => {
          console.log("firebase.keepInSync OFF");
        },
        error => {
          console.log("firebase.keepInSync error: " + error);
        }
    );
  }

  public doAddChildEventListenerForUsers(): void {
    const onChildEvent = result => {
      this.set("path", '/users');
      this.set("type", result.type);
      this.set("key", result.key);
      this.set("value", JSON.stringify(result.value));
    };

    firebase.addChildEventListener(onChildEvent, "/users").then(
        result => {
          this.userListenerWrapper = result;
          console.log("firebase.addChildEventListener added");
        },
        error => {
          console.log("firebase.addChildEventListener error: " + error);
        }
    );
  }

  public doRemoveChildEventListenerForUsers(): void {
    if (!this.userListenerWrapper) {
      return;
    }

    firebase.removeEventListeners(this.userListenerWrapper.listeners, this.userListenerWrapper.path).then(
        () => {
          console.log("firebase.doRemoveChildEventListenerForUsers success");
          alert({
            title: "Listener removed",
            okButtonText: "OK"
          });
        },
        error => {
          console.log("firebase.removeEventListeners error: " + error);
        }
    );
  }

  public doAddValueEventListenerForCompanies(): void {
    const path = "/companies";
    const onValueEvent = result => {
      if (result.error) {
        alert({
          title: "Listener error",
          message: result.error,
          okButtonText: "Darn!"
        });
      } else {
        this.set("path", path);
        this.set("type", result.type);
        this.set("key", result.key);
        this.set("value", JSON.stringify(result.value));
      }
    };

    firebase.addValueEventListener(onValueEvent, path).then(
        result => {
          this.companiesListenerWrapper = result;
          console.log("firebase.addValueEventListener added");
        },
        error => {
          console.log("firebase.addValueEventListener error: " + error);
        }
    );
  }

  public doRemoveValueEventListenersForCompanies(): void {
    if (!this.companiesListenerWrapper) {
      return;
    }

    firebase.removeEventListeners(this.companiesListenerWrapper.listeners, this.companiesListenerWrapper.path).then(
        () => {
          console.log("firebase.doRemoveValueEventListenersForCompanies success");
          alert({
            title: "Listener removed",
            okButtonText: "OK"
          });
        },
        error => {
          console.log("firebase.removeEventListeners error.");
        }
    );
  }

  public doGetValueForCompanies(): void {
    firebase.getValue('/companies').then(
        result => {
          alert({
            title: "Value retrieved",
            message: JSON.stringify(result),
            okButtonText: "OK"
          });
        },
        error => {
          console.log("doGetValueForCompanies error: " + error);
        }
    );
  }

  public doUserStoreByPush(): void {
    firebase.push(
        '/users',
        {
          'first': 'Eddy',
          'last': 'Verbruggen',
          'birthYear': 1977,
          'isMale': true,
          'address': {
            'street': 'foostreet',
            'number': 123
          }
        }
    ).then(
        result => {
          console.log("firebase.push done, created key: " + result.key);
        },
        error => {
          console.log("firebase.push error: " + error);
        }
    );
  }

  public doStoreCompaniesBySetValue(): void {
    firebase.setValue(
        '/companies',

        // you can store a JSON object
        // {'foo':'bar'}

        // or even an array of JSON objects
        [
          {
            name: 'Telerik',
            country: 'Bulgaria',
            since: 2000,
            updateTs: firebase.ServerValue.TIMESTAMP
          },
          {
            name: 'Google',
            country: 'USA',
            since: 1900,
            updateTs: firebase.ServerValue.TIMESTAMP
          }
        ]
    ).then(
        () => {
          console.log("firebase.setValue done");
        },
        error => {
          console.log("firebase.setValue error: " + error);
        }
    );
  }

  public doRemoveUsers(): void {
    firebase.remove("/users").then(
        () => {
          console.log("firebase.remove done");
        },
        error => {
          console.log("firebase.remove error: " + error);
        }
    );
  }

  public doRemoveCompanies(): void {
    firebase.remove("/companies").then(
        () => {
          console.log("firebase.remove done");
        },
        error => {
          console.log("firebase.remove error: " + error);
        }
    );
  }

  public doQueryBulgarianCompanies(): void {
    const path = "/companies";
    const onValueEvent = result => {
      // note that the query returns 1 match at a time,
      // in the order specified in the query
      console.log("Query result: " + JSON.stringify(result));
      if (result.error) {
        alert({
          title: "Listener error",
          message: result.error,
          okButtonText: "Darn!"
        });
      } else {
        this.set("path", path);
        this.set("type", result.type);
        this.set("key", result.key);
        this.set("value", JSON.stringify(result.value));
      }
    };
    firebase.query(
        onValueEvent,
        path,
        {
          // order by company.country
          orderBy: {
            type: firebase.QueryOrderByType.CHILD,
            value: 'since' // mandatory when type is 'child'
          },
          // but only companies 'since' a certain year (Telerik's value is 2000, which is imaginary btw)
          // .. we're using 'ranges', but you could also use 'range' with type firebase.QueryRangeType.EQUAL_TO and value 2000
          ranges: [
            {
              type: firebase.QueryRangeType.START_AT,
              value: 1999
            },
            {
              type: firebase.QueryRangeType.END_AT,
              value: 2000
            }
          ],
          // range: {
          //   type: firebase.QueryRangeType.EQUAL_TO,
          //   value: null
          // },
          // only the first 2 matches (not that there's only 1 in this case anyway)
          limit: {
            type: firebase.QueryLimitType.LAST,
            value: 2
          }
        }
    ).then(
        result => {
          console.log("firebase.doQueryBulgarianCompanies done; added a listener");
        },
        errorMessage => {
          alert({
            title: "Query error",
            message: errorMessage,
            okButtonText: "OK, pity"
          });
        }
    );
  }

  public doQueryUsers(): void {
    const path = "/users";
    const onValueEvent = result => {
      // note that the query returns 1 match at a time,
      // in the order specified in the query
      console.log("Query result: " + JSON.stringify(result));
      if (result.error) {
        alert({
          title: "Listener error",
          message: result.error,
          okButtonText: "Darn!!"
        });
      } else {
        this.set("path", path);
        this.set("type", result.type);
        this.set("key", result.key);
        this.set("value", JSON.stringify(result.value));
      }
    };
    firebase.query(
        onValueEvent,
        path,
        {
          singleEvent: true,
          orderBy: {
            type: firebase.QueryOrderByType.KEY
          }
        }
    ).then(
        result => {
          console.log("This 'result' should be available since singleEvent is true: " + JSON.stringify(result));
        },
        errorMessage => {
          alert({
            title: "Query error",
            message: errorMessage,
            okButtonText: "OK, pity!"
          });
        }
    );
  }

  public doUploadFile(): void {
    // let's first create a File object using the tns file module
    const appPath = fs.knownFolders.currentApp().path;
    const logoPath = appPath + "/images/telerik-logo.png";

    firebase.uploadFile({
      remoteFullPath: 'uploads/images/telerik-logo-uploaded.png',
      localFile: fs.File.fromPath(logoPath), // use this (a file-system module File object)
      // localFullPath: logoPath, // or this, a full file path
      onProgress: status => {
        console.log("Uploaded fraction: " + status.fractionCompleted + " (" + status.percentageCompleted + "%)");
      }
    }).then(
        uploadedFile => {
          alert({
            title: "File upload successful!",
            message: JSON.stringify(uploadedFile),
            okButtonText: "Cool!"
          });
        },
        error => {
          console.log("firebase.doUploadFile error: " + error);
        }
    );
  }

  public doDownloadFile(): void {
    // let's first determine where we'll create the file using the 'file-system' module
    const documents = fs.knownFolders.documents();
    const logoPath = documents.path + "/telerik-logo-downloaded.png";

    // this will create or overwrite a local file in the app's documents folder
    const localLogoFile = documents.getFile("telerik-logo-downloaded.png");

    firebase.downloadFile({
      remoteFullPath: 'uploads/images/telerik-logo-uploaded.png',
      // localFile: localLogoFile // use this (a file-system module File object)
      localFullPath: logoPath // or this, a full file path
    }).then(
        () => {
          alert({
            title: "File download successful!",
            message: "The file has been downloaded to the requested location",
            okButtonText: "OK"
          });
        },
        error => {
          alert({
            title: "File download error",
            message: error,
            okButtonText: "Mmkay!"
          });
        }
    );
  }

  public doGetDownloadUrl(): void {
    firebase.getDownloadUrl({
      remoteFullPath: 'uploads/images/telerik-logo-uploaded.png'
    }).then(
        theUrl => {
          console.log("Download url: " + theUrl);
          alert({
            title: "File download URL determined",
            message: "You can download the file at: " + theUrl,
            okButtonText: "OK!"
          });
        },
        error => {
          alert({
            title: "File download URL error",
            message: error,
            okButtonText: "Mmkay"
          });
        }
    );
  }

  public doReauthenticatePwdUser(): void {
    firebase.reauthenticate({
      type: firebase.LoginType.PASSWORD,
      passwordOptions: {
        email: 'eddyverbruggen@gmail.com',
        password: 'firebase'
      }
    }).then(
        () => {
          alert({
            title: "Re-authenticated password user",
            okButtonText: "OK"
          });
        },
        error => {
          alert({
            title: "Re-authenticate error",
            message: error,
            okButtonText: "OK"
          });
        }
    );
  }

  public doReauthenticateGoogleUser(): void {
    firebase.reauthenticate({
      type: firebase.LoginType.GOOGLE
    }).then(
        () => {
          alert({
            title: "Re-authenticated Google user",
            okButtonText: "OK"
          });
        },
        error => {
          alert({
            title: "Re-authenticate error",
            message: error,
            okButtonText: "OK"
          });
        }
    );
  }

  public doReauthenticateFacebookUser(): void {
    firebase.reauthenticate({
      type: firebase.LoginType.FACEBOOK
    }).then(
        () => {
          alert({
            title: "Re-authenticated Facebook user",
            okButtonText: "OK"
          });
        },
        error => {
          alert({
            title: "Re-authenticate error",
            message: error,
            okButtonText: "OK"
          });
        }
    );
  }

  public doDeleteFile(): void {
    firebase.deleteFile({
      remoteFullPath: 'uploads/images/telerik-logo-uploaded.png'
    }).then(
        theUrl => {
          alert({
            title: "File deleted",
            message: "Enjoy your day!",
            okButtonText: "Thanks ;)"
          });
        },
        error => {
          alert({
            title: "File deletion error",
            message: error,
            okButtonText: "OK"
          });
        }
    );
  }

  public doSubscribeToTopic(): void {
    firebase.subscribeToTopic("demo").then(
        () => {
          alert({
            title: "Subscribed",
            message: ".. to the 'demo' topic",
            okButtonText: "Okay, interesting"
          });
        },
        error => {
          alert({
            title: "Subscribe error",
            message: error,
            okButtonText: "OK"
          });
        }
    );
  }

  public doUnsubscribeFromTopic(): void {
    firebase.unsubscribeFromTopic("demo").then(
        () => {
          alert({
            title: "Unsubscribed",
            message: ".. from the 'demo' topic",
            okButtonText: "Okay, very interesting"
          });
        },
        error => {
          alert({
            title: "Unsubscribe error",
            message: error,
            okButtonText: "OK"
          });
        }
    );
  }

  public sendInvitation(): void {
    firebase.invites.sendInvitation({
      title: "Invite title here",
      message: "Invite message here"
    }).then(
        result => { // SendInvitationResult
          alert({
            title: result.count + " invitations sent",
            message: "ID's: " + JSON.stringify(result.invitationIds),
            okButtonText: "Okay"
          });
        },
        error => {
          alert({
            title: "sendInvitation error",
            message: error,
            okButtonText: "OK"
          });
        }
    );
  }

  public getInvitation(): void {
    firebase.invites.getInvitation().then(
        result => { // GetInvitationResult
          alert({
            title: "Invitation result",
            message: JSON.stringify(result),
            okButtonText: "Okay"
          });
        },
        error => {
          alert({
            title: "getInvitation error",
            message: error,
            okButtonText: "OK"
          });
        }
    );
  }

  public doLogMessage(): void {
    firebase.sendCrashLog({
      message: "Hey, I was logged!",
      showInConsole: true
    }).then(
        () => {
          alert({
            title: "Message logged",
            message: "Check the Firebase console",
            okButtonText: "Okay"
          });
        },
        error => {
          alert({
            title: "Logging error",
            message: error,
            okButtonText: "OK"
          });
        }
    );
  }

  public doForceCrashIOS(): void {
    Crashlytics.sharedInstance().crash();
  }

  public doForceCrashAndroid(): void {
    throw new java.lang.Exception("Forced an exception.");
  }
}
