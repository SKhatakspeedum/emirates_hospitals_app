/**
 * Suggestus Session Model - Other Data
 * @author Speedum Team
 * @copyright Copyright (c) 2022 Speedum
 */

let mRemoteAddr = '';
let mSgAppPlatform = '';
let mSgAppVersion = '';

const OtherSessionData = {
  setRemoteAddr(remoteAddr) {
    mRemoteAddr = remoteAddr;
  },

  setSgAppPlatform(sgAppPlatform) {
    mSgAppPlatform = sgAppPlatform;
  },

  setSgAppVersion(sgAppVersion) {
    mSgAppVersion = sgAppVersion;
  },

  getOtherData() {
    return {
      remoteAddr: mRemoteAddr,
      sgAppPlatform: mSgAppPlatform,
      sgAppVersion: mSgAppVersion
    };
  }
};

export default OtherSessionData;
