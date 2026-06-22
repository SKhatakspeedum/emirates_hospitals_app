/**
 * User Data Model - Session User Information Management
 * @author Speedum Team
 * @copyright Copyright (c) 2022 Speedum
 */

let mSgAppSession = '';
let mSgMenuId = '';
let mSgOrgId = '';
let mSgRoleId = '';
let mSgUserId = '';
let mSgUserType = '';

const UserDataModel = {
  setSgAppSession(sgAppSession) {
    mSgAppSession = sgAppSession;
  },

  setSgMenuId(sgMenuId) {
    mSgMenuId = sgMenuId;
  },

  setSgOrgId(sgOrgId) {
    mSgOrgId = sgOrgId;
  },

  setSgRoleId(sgRoleId) {
    mSgRoleId = sgRoleId;
  },

  setSgUserId(sgUserId) {
    mSgUserId = sgUserId;
  },

  setSgUserType(sgUserType) {
    mSgUserType = sgUserType;
  },

  getUserData() {
    return {
      sgAppSession: mSgAppSession,
      sgMenuId: mSgMenuId,
      sgOrgId: mSgOrgId,
      sgRoleId: mSgRoleId,
      sgUserId: mSgUserId,
      user_type: mSgUserType
    };
  }
};

export default UserDataModel;
