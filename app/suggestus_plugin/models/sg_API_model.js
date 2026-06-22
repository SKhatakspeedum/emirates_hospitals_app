/**
 * Suggestus API Model - Session Response Management
 * @author Speedum Team
 * @copyright Copyright (c) 2022 Speedum
 */

let mDataJson = {};
let mEnvironment = '';
let mMeta_data = {};
let mOther_data = {};
let mProcess_id = '';
let mUser_data = {};

const ApiSessionModel = {
  setDataJson(dataJson) {
    mDataJson = dataJson;
  },

  setEnvironment(environment) {
    mEnvironment = environment;
  },

  setMeta_data(meta_data, extra_data) {
    try {
      mMeta_data = extra_data ? { ...meta_data, ...extra_data } : meta_data;
    } catch (error) {
      console.log(error);
    }
  },

  setOther_data(other_data, extra_data) {
    try {
      mOther_data = extra_data ? { ...other_data, ...extra_data } : other_data;
    } catch (error) {
      console.log(error);
    }
  },

  setProcess_id(process_id) {
    mProcess_id = process_id;
  },

  setUser_data(user_data, extra_data) {
    try {
      mUser_data = extra_data ? { ...user_data, ...extra_data } : user_data;
    } catch (error) {
      console.log(error);
    }
  },

  getSessionResponse() {
    return {
      dataJSON: mDataJson,
      environment: mEnvironment,
      meta_data: mMeta_data,
      other_data: mOther_data,
      process_id: mProcess_id,
      user_data: mUser_data
    };
  }
};

export default ApiSessionModel;
