import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { getDecryptedID } from "../suggestus_plugin/util/util_functions";

/**
 * Maps a newly-created/updated patient record to every org location from
 * DEFAULT_JSON_DATA.spd_app_location_list — the same org-codes source
 * already used for the user-org mapping in personal_details.tsx. Called
 * after every "create a patient" flow (register_new_patient, patient
 * selection, registered_patients, and the no-patient-record branch in
 * personal_details) so a patient has org access regardless of which
 * screen created them.
 *
 * sgUserId / sgRoleId / sgOrgId (userdata) and sgPatientId (metadata) are
 * auto-injected by callSuggestusAPI from the current session — not passed
 * here. Failures are swallowed (logged only) so a mapping hiccup doesn't
 * block the registration flow that just succeeded.
 */
export async function mapPatientToAllOrgs(
  patientId: string,
  userId: string,
  mrn: string = "",
): Promise<void> {
  try {
    const defaultJsonStr = await getDecryptedID("DEFAULT_JSON_DATA");
    const defaultJson = defaultJsonStr ? JSON.parse(defaultJsonStr) : {};
    const orgCodes = defaultJson?.spd_app_location_list ?? "";

    await callSuggestusAPI(
      spd_processId_config.hosapp_save_update_trn_patient_master_org_mapping_pnt_app,
      {
        p_patient_id: patientId,
        p_map_user_id: userId,
        p_org_codes: orgCodes || "",
        p_process_flag: "map_multiple_user",
        p_additional_attribute: "",
        p_patmas_mrn: mrn,
      },
    );
  } catch (e) {
    console.error("[mapPatientToAllOrgs] patient-org mapping failed:", e);
  }
}
