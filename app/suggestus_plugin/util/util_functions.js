/**
 * Util export functions for React Native
 * @author Speedum Team
 * @copyright Copyright (c) 2022 Speedum
 */

import GlobalVariables from "../config/global_variables";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import meta_data_body from "../models/meta_data_model";
import other_data_body from "../models/other_data_model";
import user_data_body from "../models/user_data_model";
import sg_API_model from "../models/sg_API_model";
import mGlobal_vars from "../config/global_variables";
import { callSuggestusAPI } from "../suggestusClient";
import { spd_processId_config } from "@/app/config/process_id";
import bcrypt from 'react-native-bcrypt';

const PRINT_CONSOLE = true; // Manually set
const usedOtps = new Set();

// async version:
// export async function hashPasswordAsync(pwd) {
//   const salt = await bcrypt.genSalt(10);
//   return await bcrypt.hash(pwd, salt);
// }

export async function hashPasswordAsync(password) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  return hash;
}

// export async function hashPasswordAsync(pwd) {
 
//   return pwd;
// }

// this function will generate otp
export function generateOtp() {
  let otp;
  do {
    otp = Math.floor(Math.random() * 900000) + 100000; // 100000–999999
  } while (usedOtps.has(otp));
  usedOtps.add(otp);
  return otp.toString();
}

export function generateOtpEmail(userName, otp) {
  const subject = "OnMood9 Account Verification Code";
  const message = `
Hi ${userName},

Your one-time password (OTP) is: ${otp}

This code will expire in 10 minutes.

If you didn’t request this, please ignore this email.

Thanks,
OnMood9 Team
`.trim();

  return { subject, message };
}

export function generatePasswordResetEmail( tempPassword) {
  const subject = 'OnMood9 Password Reset Request';
  const message = `
Hi,

You (or someone else) requested a password reset for your OnMood9 account.
Your temporary password is: ${tempPassword}

Please log in using this password and change it immediately for security reasons.

If you did not request this, please contact our support team.

Thanks,
OnMood9 Team
`.trim();

  return { subject, message };
}
// Always stringify value before encrypting and await encryptData
export const setEncryptedID = async (key, value) => {
  try {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);
    // const encrypted = await encryptData(stringValue);
    await AsyncStorage.setItem(key, stringValue);
  } catch (error) {
    console.error("setEncryptedID error:", error);
  }
};
export const getDecryptedID = async (key) => {
  try {
    const encrypted = await AsyncStorage.getItem(key);
    // return decryptData(encrypted);
    return encrypted;
  } catch (error) {
    console.error("getDecryptedID error:", error);
    return "";
  }
};
// Get ID from AsyncStorage
export const getID = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (error) {
    console.error("Error fetching ID:", error);
    return null;
  }
};
// Print console in full code
export function printConsole(message) {
  if (PRINT_CONSOLE) {
    console.log(message);
  }
}

// Check if value is null or undefined
export function chechIfValueIsNull(value) {
  return value === null || value === undefined ? "" : value;
}

// Check if key exists in array
export function findIfKeyExistsInArray(headerArray, global_array) {
  if (headerArray !== null) {
    for (const array_value of global_array) {
      let fetched_value = headerArray.header(array_value);
      if (fetched_value !== undefined) {
        return fetched_value;
      }
    }
  }
  return undefined;
}

// Check if value exists in array
export function checkIfValueContainInArray(global_array, find_value) {
  return global_array.includes(find_value);
}

// Get microtime (approximate)
export function getMicroTime() {
  return Date.now() * 1000;
}

// Save to AsyncStorage
export async function saveDataFromLocalStorage(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.log("Error saving data:", e);
  }
}

// Fetch from AsyncStorage
export async function fetchDataFromLocalStorage(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.log("Error fetching data:", e);
    return null;
  }
}

// Convert UTC datetime to local and check expiry
export function convertUTCTimeToLocal(SessionExpiry) {
  try {
    const convert_local = convertUTCDateToLocalDate(
      moment(SessionExpiry, "YYYY-MM-DD HH:mm:ss").toDate()
    );
    SessionExpiry = toTimestamp(convert_local);
    SessionExpiry = new Date(SessionExpiry * 1000);

    const targetTime = moment(new Date()).subtract(5, "minutes").toDate();

    return SessionExpiry <= targetTime;
  } catch (error) {
    return true;
  }
}

// Timestamp converter
export function toTimestamp(strDate) {
  const datum = Date.parse(strDate);
  return datum / 1000;
}

// Convert UTC Date to Local Date
export function convertUTCDateToLocalDate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}

// Create API Body
export async function createAPIBody(
  env,
  app_ver,
  process_id,
  dataJSON,
  otherdata = "",
  userdata = "",
  metadata = "",
  tab_id
) {
  try {
    const other_data = createOtherdata(app_ver);
    const user_data = await createUserdata();
    const meta_data = createMetadata(tab_id);

    sg_API_model.setDataJson(dataJSON);
    sg_API_model.setEnvironment(env);
    sg_API_model.setMeta_data(meta_data, metadata);
    sg_API_model.setOther_data(other_data, otherdata);
    sg_API_model.setProcess_id(process_id);
    sg_API_model.setUser_data(user_data, userdata);

    return sg_API_model.getSessionResponse();
  } catch (error) {
    console.log("Exception : createAPIBody-- Error--" + error.message);
    return null;
  }
}

// Create Metadata
export function createMetadata(tab_id) {
  try {
    const patientId = chechIfValueIsNull(GlobalVariables.SPD_PAT_ID);
    const visitId = chechIfValueIsNull(GlobalVariables.sg_visitId);

    meta_data_body.setSgPatientId(patientId);
    meta_data_body.setSgVisitId(visitId);

    return meta_data_body.getMetaData();
  } catch (error) {
    console.log("Exception : createMetadata-- Error--" + error.message);
    meta_data_body.setSgPatientId("");
    meta_data_body.setSgVisitId("");
    return meta_data_body.getMetaData();
  }
}

// Create Other Data
export function createOtherdata(app_ver) {
  try {
    other_data_body.setRemoteAddr(""); // IP fetching can be added via RN modules if needed
    other_data_body.setSgAppPlatform(mGlobal_vars.DEVICE_TYPE);
    other_data_body.setSgAppVersion(app_ver);

    return other_data_body.getOtherData();
  } catch (error) {
    console.log("Exception : createOtherdata-- Error--" + error.message);
    return null;
  }
}

// Create User Data
export async function createUserdata() {
  let user_type = "patient";

  try {
    const session_token = chechIfValueIsNull(
      await fetchDataFromLocalStorage("SessionToken")
    );
    const menuId = chechIfValueIsNull(
      await fetchDataFromLocalStorage("sg_menuId")
    );
    const orgId = chechIfValueIsNull(
      await fetchDataFromLocalStorage("sg_org_id")
    );
    const roleId = chechIfValueIsNull(
      await fetchDataFromLocalStorage("sg_roleId")
    );
    const userId = chechIfValueIsNull(
      await fetchDataFromLocalStorage("sg_userId")
    );

    user_data_body.setSgAppSession(session_token);
    user_data_body.setSgMenuId(menuId);
    user_data_body.setSgOrgId(orgId);
    user_data_body.setSgRoleId(roleId);
    user_data_body.setSgUserId(userId);
    user_data_body.setSgUserType(user_type);

    return user_data_body.getUserData();
  } catch (error) {
    console.log("Exception : createUserdata-- Error--" + error.message);
    return null;
  }
}

export function generateRandomPassword(length = 6) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const allChars = letters + digits;

  // 1. Pick one digit
  const pwdArr = [
    digits.charAt(Math.floor(Math.random() * digits.length))
  ];

  // 2. Fill remaining slots with random alphanumeric
  for (let i = 1; i < length; i++) {
    pwdArr.push(allChars.charAt(Math.floor(Math.random() * allChars.length)));
  }

  // 3. Shuffle to randomize digit position
  for (let i = pwdArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pwdArr[i], pwdArr[j]] = [pwdArr[j], pwdArr[i]];
  }

  return pwdArr.join('');
}
export const checkEmailExists = async (email) => {
  const response = await callSuggestusAPI(
    spd_processId_config.spdonmood9_get_md_onmood9_users,
    {
      p_email: email,
    }
  );

  if (response.returnCode === true && response.returnData?.length > 0) {
    return { success: true }; // Email exists
  }

  return { success: false, message: "Email does not exist in our records." };
};
