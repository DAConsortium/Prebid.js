/**
 * This module adds dacId to the User ID module
 * The {@link module:modules/userId} module is required
 * @module modules/dacIdSystem
 * @requires module:modules/userId
 */

import {
  logError,
  logInfo,
  logWarn
} from '../src/utils.js';
import {
  ajax
} from '../src/ajax.js'
import {
  submodule
} from '../src/hook.js';
import {
  getStorageManager
} from '../src/storageManager.js';

export const storage = getStorageManager();

export const FUUID_COOKIE_NAME = '_a1_f';
export const AONEID_COOKIE_NAME = '_a1_d';
export const API_URL = 'https://penta.a.one.impact-ad.jp/aud';
const COOKIES_EXPIRES = 60 * 60 * 24 * 1000; // 24h

function getCookie() {
  return {
    fuuid: storage.getCookie(FUUID_COOKIE_NAME),
    uid: storage.getCookie(AONEID_COOKIE_NAME)
  };
}

function setAoneidToCookie(uid) {
  // set uid to Cookie.
  if (uid) {
    const expires = new Date(Date.now() + COOKIES_EXPIRES).toUTCString();
    storage.setCookie(
      AONEID_COOKIE_NAME,
      uid,
      expires,
      'none'
    );
  }
}

function getApiUrl(oid, fuuid) {
  return `${API_URL}?oid=${oid}&fu=${fuuid}`;
}

export const dacIdSystemSubmodule = {
  /**
   * used to link submodule with config
   * @type {string}
   */
  name: 'dacId',
  /**
   * decode the stored id value for passing to bid requests
   * @function
   * @param { {dacId: string} } value
   * @returns { {dacId: {id: string} } | undefined }
   */
  decode(id) {
    if (id && typeof id === 'object') {
      const fuuid = id.fuuid;
      const dacId = id.dacId;
      return { fuuid: fuuid, dacId: dacId }
    }
  },

  /**
   * performs action to obtain id
   * @function
   * @returns { {id: {fuuid: string, dacId: string}} | undefined }
   */

  getId(config) {
    const configParams = (config && config.params) || {};
    if (!configParams || typeof configParams.oid !== 'string') {
      logInfo('User ID - a valid oid is not defined');
      return undefined;
    }
    const cookie = getCookie();

    if (!cookie.fuuid) {
      logWarn('There is no fuuid in cookie')
      return undefined;
    }
    if (cookie.fuuid && cookie.uid) {
      logWarn('There is fuuid and AoneId in cookie')
      return {
        id: {
          fuuid: cookie.fuuid,
          dacId: cookie.uid
        }
      };
    }

    let fuuid = 'fuuid';
    let dacId = 'dacId';
    const result = {
      callback: (callback) => {
        const ret = {fuuid, dacId};
        const callbacks = {
          success: response => {
            let responseObj;
            if (response) {
              try {
                responseObj = JSON.parse(response);
                if (responseObj.uid === null) {
                  logWarn('AoneId is null');
                }
                if (responseObj.error === 'unable to provide uid') {
                  logWarn('There is no permission to use API');
                }
                ret.dacId = responseObj.uid;
                ret.fuuid = cookie.fuuid;
                setAoneidToCookie(ret.dacId);
              } catch (error) {
                logError('User ID - dacId submodule: ' + error);
              }
            }
            callback(ret);
          },
          error: (error) => {
            logError('User ID - dacId submodule was unable to get data from api: ' + error);
            callback(ret);
          }
        };
        const apiUrl = getApiUrl(configParams.oid, cookie.fuuid);
        ajax(apiUrl, callbacks, undefined, {
          method: 'GET',
          withCredentials: true
        });
      },
    };
    return result;
  }
};

submodule('userId', dacIdSystemSubmodule);
