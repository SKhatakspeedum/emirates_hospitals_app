/**
 * Suggestus Utility Functions - React Native Version
 */

import suggestusClientConfig from "../config/suggestus_client_config";

import sg_session_body from "./models/sg_session_model";
import mGlobal_vars from "./config/global_variables";
import mMessages_obj from "./config/error_messages";
import {
  getDecryptedID,
  saveDataFromLocalStorage,
  createAPIBody,
  setEncryptedID,
  fetchDataFromLocalStorage,
  convertUTCTimeToLocal,
} from "./util/util_functions";
import axios from "axios";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

/*
 * Create Suggestus Session
 */
export async function createSuggestusSession() {
  try {
    const url = suggestusClientConfig.SUGGESTUS_INTERNAL_URL;
    const env = suggestusClientConfig.SUGGESTUS_EVN;
    const ai_code = suggestusClientConfig.SUGGESTUS_AI_CODE;
    const uuid = await getDecryptedID("device_unique_id");

    sg_session_body.setAiCode(ai_code);
    sg_session_body.setDeviceType(mGlobal_vars.DEVICE_TYPE);
    sg_session_body.setDeviceUniqueId(uuid);
    sg_session_body.setDeviceOs("");
    sg_session_body.setDeviceOsVersion("");
    sg_session_body.setDeviceIp("");

    const session_body = sg_session_body.getSessionResponse();
    const axiosConfig = {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        sgIntProcess: mGlobal_vars.SESSION_HEADER_VALUE,
        sgIntEnvironment: env,
      },
    };

    const response = await axios.post(url, session_body, axiosConfig);

    if (response.status === 200) {
      const { return_AppIdentifier, return_LicenseIdentifier } = response.data;
      if (
        return_AppIdentifier === "true" &&
        return_LicenseIdentifier === "true"
      ) {
        await saveDataFromLocalStorage(
          "SessionTokenNode",
          response.data.return_SessionToken,
        );
        await saveDataFromLocalStorage(
          "SessionExpiryNode",
          response.data.return_SessionExpiry,
        );
        return { returnCode: true };
      }
      return { returnCode: false };
    } else {
      return {
        msg: "Error146 while Creating Suggestus Session",
        returnCode: false,
      };
    }
  } catch (error) {
    console.log("Exception in createSuggestusSession:", error.message);
    return {
      msg: "Error85 while initializing Suggestus: " + error.message,
      returnCode: false,
    };
  }
}

/*
 * Create Suggestus Footprint
 */
export async function createSuggestusFootPrint() {
  try {
    const url = suggestusClientConfig.SUGGESTUS_INTERNAL_URL;
    const env = suggestusClientConfig.SUGGESTUS_EVN;
    const ai_code = suggestusClientConfig.SUGGESTUS_AI_CODE;
    const uuid = Math.random().toString().slice(2, 11);

    await setEncryptedID("device_unique_id", uuid);

    sg_session_body.setAiCode(ai_code);
    sg_session_body.setDeviceType(mGlobal_vars.DEVICE_TYPE);
    sg_session_body.setDeviceUniqueId(uuid);
    sg_session_body.setDeviceOs("");
    sg_session_body.setDeviceOsVersion("");
    sg_session_body.setDeviceIp("");

    const foot_print_body = sg_session_body.getSessionResponse();
    const axiosConfig = {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        sgIntProcess: mGlobal_vars.FOOT_PRINT_HEADER_VALUE,
        sgIntEnvironment: env,
      },
    };

    console.log(
      "url, foot_print_body, axiosConfig :>> ",
      url,
      foot_print_body,
      axiosConfig,
    );
    const response = await axios.post(url, foot_print_body, axiosConfig);
    console.log("response :>> ", response.data);

    if (response.status === 200) {
      const { return_AppIdentifier, return_LicenseIdentifier } = response.data;
      if (
        return_AppIdentifier === "true" &&
        return_LicenseIdentifier === "true"
      ) {
        return await createSuggestusSession();
      }
      return { returnCode: false };
    } else {
      return {
        msg: "Error146 while Creating Suggestus Foot Print",
        returnCode: false,
      };
    }
  } catch (error) {
    console.log("Exception in createSuggestusFootPrint:", error.message);
    return {
      msg: "Error145 while initializing Suggestus: " + error.message,
      returnCode: false,
    };
  }
}

/*
 * Initialize Suggestus
 */
export async function initializeSuggestus() {
  return await createSuggestusFootPrint();
}

/*
 * Call Suggestus API
 */
export async function callSuggestusAPI(
  process_id,
  dataJSON,
  app_ver = "",
  otherdata = "",
  userdata = "",
  metadata = "",
  tab_id,
  showToastFlag = true,
) {
  if (!process_id) {
    Toast.show({ type: "error", text1: "Process ID is blank" });
    return { msg: mMessages_obj.PROCESS_ID_BLANK, returnCode: false };
  }

  try {
    let api_url = suggestusClientConfig.SUGGESTUS_ULTRA_URL;
    let env = suggestusClientConfig.SUGGESTUS_EVN;
    let ai_code = suggestusClientConfig.SUGGESTUS_AI_CODE;
    let session_token = await fetchDataFromLocalStorage("SessionTokenNode");
    let sessionExpiry = await fetchDataFromLocalStorage("SessionExpiryNode");

    if (convertUTCTimeToLocal(sessionExpiry)) {
      await createSuggestusFootPrint();
      session_token = await fetchDataFromLocalStorage("SessionTokenNode");
    }

    const request_body = await createAPIBody(
      env,
      app_ver,
      process_id,
      dataJSON,
      otherdata,
      userdata,
      metadata,
      tab_id,
    );
    const axiosConfig = {
      timeout: 60000,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Sgsessiontoken: session_token,
      },
    };

    const response = await axios.post(
      api_url,
      JSON.stringify(request_body),
      axiosConfig,
    );

    if (response.status === 200) {
      if (response.data.returnCode?.toLowerCase() === "true") {
        if (showToastFlag) {
          // Toast.show({ type: 'success', text1: 'Success', text2: 'API Call Successful' });
        }
        return { ...response.data, returnCode: true };
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: mMessages_obj.SUGGESTUS_ERR,
        });
        return { msg: mMessages_obj.SUGGESTUS_ERR, returnCode: false };
      }
    } else {
      return { msg: mMessages_obj.API_NO_RESPONSE_ERROR, returnCode: false };
    }
  } catch (error) {
    console.log("Exception in callSuggestusAPI:", error.message);
    Alert.alert("Error", mMessages_obj.SUGGESTUS_ERR + error.message);
    return {
      msg: mMessages_obj.SUGGESTUS_ERR + error.message,
      returnCode: false,
    };
  }
}

/*
 * Other helper functions
 */
export async function setOrgId(org_id) {
  await saveDataFromLocalStorage("sg_org_id", org_id);
}

export async function setRoleId(roleId) {
  await saveDataFromLocalStorage("sg_roleId", roleId);
}

export async function setUserId(userId) {
  await saveDataFromLocalStorage("sg_userId", userId);
}

export async function setUserName(userName) {
  await saveDataFromLocalStorage("sg_user_name", userName);
}

export async function setPatientId(patientId) {
  await saveDataFromLocalStorage("sg_patientId", patientId);
}

export async function setVisitId(visitId) {
  await saveDataFromLocalStorage("sg_visitId", visitId);
}

export async function setMenuId(menuId) {
  await saveDataFromLocalStorage("sg_menuId", menuId);
}
