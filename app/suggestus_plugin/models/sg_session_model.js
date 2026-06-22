/**
 * Suggestus Session Model - Device Info Management
 * @author Speedum Team
 * @copyright Copyright (c) 2022 Speedum
 */

let mAi_code = '';
let mDevice_type = '';
let mDevice_unique_id = '';
let mDevice_os = '';
let mDevice_os_version = '';
let mDevice_ip = '';

const DeviceSessionModel = {
  setAiCode(ai_code) {
    mAi_code = ai_code;
  },

  setDeviceType(device_type) {
    mDevice_type = device_type;
  },

  setDeviceUniqueId(device_unique_id) {
    mDevice_unique_id = device_unique_id;
  },

  setDeviceOs(device_os) {
    mDevice_os = device_os;
  },

  setDeviceOsVersion(device_os_version) {
    mDevice_os_version = device_os_version;
  },

  setDeviceIp(device_ip) {
    mDevice_ip = device_ip;
  },

  getSessionResponse() {
    return {
      ai_code: mAi_code,
      device_type: mDevice_type,
      device_unique_id: mDevice_unique_id,
      device_os: mDevice_os,
      device_os_version: mDevice_os_version,
      device_ip: mDevice_ip
    };
  }
};

export default DeviceSessionModel;
