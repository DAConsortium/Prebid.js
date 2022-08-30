/**
 * This module adds dacId to the User ID module
 * The {@link module:modules/userId} module is required
 * @module modules/dacIdSystem
 * @requires module:modules/userId
 */

import {
  logError,
  logInfo
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
export const apiUrl = 'https://staging.penta.a.one.impact-ad.jp/aud';
const COOKIES_MAX_AGE = 60 * 60 * 24 * 1000; // 24h

function getCookie() {
  return {
    fuuid: storage.getCookie(FUUID_COOKIE_NAME),
    uid: storage.getCookie(AONEID_COOKIE_NAME)
  };
}

function setAoneidToCookie(uid) {
  // set uid to Cookie.
  if (uid) {
    const expires = new Date(Date.now() + COOKIES_MAX_AGE).toUTCString();
    storage.setCookie(
      AONEID_COOKIE_NAME,
      uid,
      expires,
      'none'
    );
  }
}

function getApiCallback() {
  return {
    success: (response) => {
      try {
        const uid = JSON.parse(response)?.uid;
        setAoneidToCookie(uid);
      } catch (error) {
        logError('User ID - dacId submodule: ' + error);
      }
    },
    error: error => {
      logError('User ID - dacId submodule was unable to get data from api: ' + error);
    }
  };
}

function callAoneApi(apiUrl) {
  ajax(apiUrl, getApiCallback(), undefined, {
    method: 'GET',
    withCredentials: true
  });
}

function getApiUrl(oid, fuuid) {
  return `${apiUrl}?oid=${oid}&fu=${fuuid}`;
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
      return {
        fu: fuuid,
        dacId: dacId
      }
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
    const fuuid = cookie.fuuid;
    const uid = cookie.uid;

    if (!fuuid) {
      // if fuuid is not defined, return undefined.
      logInfo('fuuid is not defined');
      return undefined;
    }

    if (fuuid && !uid) {
      // if fuuid is defined but uid is not defined,call API using the fuuid.
      logInfo('uid is not defined');
      const apiUrl = getApiUrl(configParams.oid, fuuid);
      callAoneApi(apiUrl);
    }
    return {
      id: {
        fuuid: fuuid,
        dacId: uid
      }
    };
  }
};

submodule('userId', dacIdSystemSubmodule);
