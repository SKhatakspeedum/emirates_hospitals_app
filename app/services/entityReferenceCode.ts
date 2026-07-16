import { getDecryptedID } from "../suggestus_plugin/util/util_functions";

// Used if DEFAULT_JSON_DATA hasn't loaded yet or doesn't carry this key —
// keeps the user↔patient entity-mapping calls working exactly as they did
// before this became backend-configurable.
const FALLBACK_USER_ENTITY_REFERENCE_CODE =
  "TRN_EHG_EHG_REHAB_PNTAPP_USER_PATIENTS";

/**
 * Reads `spd_user_entity_reference_code` from the cached DEFAULT_JSON_DATA
 * (same org-config blob used elsewhere for spd_app_location_list, etc.) —
 * the `p_entity_reference_code` value for xcelpat_save_mst_user_entity_mapping_common
 * calls when linking a patient to a user.
 */
export async function getUserEntityReferenceCode(): Promise<string> {
  try {
    const defaultJsonStr = await getDecryptedID("DEFAULT_JSON_DATA");
    const defaultJson = defaultJsonStr ? JSON.parse(defaultJsonStr) : {};
    return (
      defaultJson?.spd_user_entity_reference_code ||
      FALLBACK_USER_ENTITY_REFERENCE_CODE
    );
  } catch (e) {
    console.error("[getUserEntityReferenceCode] failed, using fallback:", e);
    return FALLBACK_USER_ENTITY_REFERENCE_CODE;
  }
}
