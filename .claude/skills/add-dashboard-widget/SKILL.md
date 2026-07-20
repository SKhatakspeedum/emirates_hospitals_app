---
name: add-dashboard-widget
description: Add, wire up, or modify a Home Dashboard widget/section in this app (app/dashboard/DashboardScreen.tsx and its supporting config/hooks/services). Use whenever asked to add a new dashboard section, connect a new backend API to a dashboard widget, or change how an existing dashboard widget fetches/renders — so it follows this project's established backend-driven widget standard instead of a one-off implementation.
---

# Dashboard widget standard

The Home Dashboard (`app/dashboard/DashboardScreen.tsx`) renders a list of
widgets/sections whose **existence, order, title, and data-fetch params are
backend-driven**, via one API: `hospapp_get_mst_menu_app_widgets_json_data_common`
(wrapped by `getMenuAppWidgets` in `app/services/dashboardApi.ts`). Every widget
— existing or new — MUST follow the rules below. Do not reintroduce hardcoded
titles, hardcoded static params, or frontend reordering hacks; those were bugs
fixed in this codebase and the whole point of this standard is to not repeat them.

## The backend contract (per menu item, inside the `details` JSON array)

| Backend field | Meaning | Where it lands |
|---|---|---|
| `menu_action_screen_identifier` | widget code, e.g. `"providers"` | `widget_code` → `SectionKey` via `WIDGET_CODE_MAP` |
| `menu_display_order` | render sequence | `sequence` → `SectionConfig.order` — **sole source of truth for order** |
| `menu_name` (falls back to `menu_title`, then a static default) | section header text | `widget_title` → `SectionConfig.label` — **sole source of truth for the on-screen title**. `menu_name` wins because it's the field actually edited per-instance; `menu_title` tends to hold a generic value shared across repeated occurrences of the same widget_code, so it must never take priority. |
| `menu_id` | used with array index to build a stable per-occurrence id | `instanceId` |
| `menu_additional_attributes` (JSON string, tolerant of JS-object-literal syntax) | per-widget extras | parsed into `additionalAttributes`; `process_id` / `default_params_json` inside it become `processId` / `defaultParams` |

**The same `menu_action_screen_identifier` can appear more than once** (e.g. two
"providers" rows with different `default_params_json`). Every widget must render
as one independent instance per array occurrence, not once per widget_code.

## Rules ("our standard") — apply to every widget, existing or new

1. **Sequence** = `menu_display_order`, always. Never add a frontend swap/override
   keyed by widget key — it only ever touches the first occurrence of a repeated
   widget and scrambles the rest (this was a real bug here — see git history on
   `sectionConfig.ts`'s `parseSectionsFromBackend`).
2. **Title** = `section.label` in JSX, always. Never hardcode English text like
   `<Text>Providers</Text>` in `renderBodySection`. `section.label` already
   resolves `menu_title → menu_name → DEFAULT_SECTIONS fallback`.
3. **Repeats are real.** Key every rendered `<View>` by `instanceId` (never by the
   bare widget key), and scope all per-widget fetched data/loading state by
   `instanceId` (never a single global `useState` per widget type).
4. **No data → hidden widget**, not a fallback/placeholder UI. Any widget that
   calls a process id must pass `fallbackData = []` (or equivalent empty value)
   to `useSectionInstanceData`, and its render case must do:
   ```tsx
   if (!isLoadingThisInstance && dataForThisInstance.length === 0) return null;
   ```
   Never show fake/sample data when the real call fails or returns nothing.
5. **Dynamic params always win.** Merge as `{ ...instance.defaultParams, ...dynamicParams }`
   — runtime values (patient id, org id, month/year, etc.) must never be
   silently overridden by a backend-supplied static default.
6. **process_id resolution**: `instance.processId || fallbackProcessId` — the
   backend can redirect a widget instance to a different API; the hardcoded
   `spd_processId_config.*` constant is only the fallback when the backend
   omits `process_id`.
7. **Loading defaults to `true`, not `false`**, for the "hide if empty" check
   (`loadingByInstance[instanceId] ?? true`) — otherwise the widget flashes
   hidden for one frame before its fetch even starts.

## Files involved

- `app/services/dashboardApi.ts` — generic normalization of the raw backend
  array into `BackendMenuWidget[]` (title/sequence/processId/defaultParams/
  instanceId extraction). **Usually needs no changes for a new widget** — it's
  already generic across all widget types.
- `app/config/sectionConfig.ts` — `SectionKey` union, `WIDGET_CODE_MAP`,
  `DEFAULT_SECTIONS` (fallback label/order/`requiresPatient` used only when the
  backend omits a widget or the whole API fails). **Add your new widget's key
  here.**
- `app/hooks/useSectionInstanceData.ts` — shared fetch hook: one call per widget
  type, runs once per matching instance, merges params, resolves process id,
  tracks `dataByInstance` / `loadingByInstance`. **Reuse as-is, don't duplicate
  its logic.**
- `app/hooks/useDashboardSections.ts` — thin wrapper exposing `visibleSections`
  (ordered `SectionConfig[]`, already filtered by visibility/patient
  requirement). No changes needed per widget.
- `app/dashboard/DashboardScreen.tsx` — where you actually wire up a new widget:
  filter instances, call the hook, add a `renderBodySection` case.

## Step-by-step: adding a new widget (e.g. a "labResults" section)

1. **`sectionConfig.ts`**
   - Add the key to `SectionKey`: `| "labResults"`.
   - Add it to `WIDGET_CODE_MAP`: `labResults: "labResults",` (must match the
     backend's `menu_action_screen_identifier` exactly).
   - Add a `DEFAULT_SECTIONS` entry (label/order/description/`requiresPatient`
     as appropriate) — this is only the fallback when the backend widget-list
     call fails entirely; it is NOT what normally decides title or order.

2. **`DashboardScreen.tsx`** — near the other `useSectionInstanceData` calls
   (after `useDashboardSections`), add:
   ```tsx
   const labResultInstances = visibleSections.filter((s) => s.key === "labResults");
   const {
     dataByInstance: labResultsByInstance,
     loadingByInstance: loadingLabResultsByInstance,
   } = useSectionInstanceData(
     labResultInstances,
     spd_processId_config.some_get_lab_results_process_id, // fallback only
     async () => {
       const pid = await fetchDataFromLocalStorage("sg_patientId");
       return { p_patient_id: pid }; // ONLY genuinely dynamic/runtime values here
     },
     (returnData) =>
       returnData.map((r: any) => ({
         id: String(r.lab_result_id ?? ""),
         // ...map real fields, no fabricated placeholders
       })),
     [], // fallbackData — MUST be empty, never fake sample data
   );
   ```
   If the widget needs a refetch trigger beyond its instance list changing
   (e.g. on screen focus, like the appointments card does via `focusTick`),
   pass that as the 6th `extraDepsKey` argument.

3. **`renderBodySection`** — add a case following the existing pattern
   (copy the `"healthSummary"` or `"providers"` case as the template):
   ```tsx
   case "labResults": {
     const dataForInstance = labResultsByInstance[instanceId] ?? [];
     const isLoadingThisInstance = loadingLabResultsByInstance[instanceId] ?? true;
     if (!isLoadingThisInstance && dataForInstance.length === 0) return null;
     return (
       <View key={instanceId} style={styles.sectionContainer}>
         <Text style={styles.sectionTitle}>{section.label}</Text>
         {isLoadingThisInstance ? (
           <ActivityIndicator size="small" color={Colors.secondary} />
         ) : (
           /* render dataForInstance */
           null
         )}
       </View>
     );
   }
   ```

4. **Backend side** (for whoever configures `menu_action_screen_identifier`
   rows): set `menu_action_screen_identifier: "labResults"`, a `menu_title`,
   `menu_display_order`, and inside `menu_additional_attributes` optionally
   `{"process_id": "...", "default_params_json": {...static keys...}}` to
   override the fallback process id / static params without a frontend release.

5. **Verify**: `npx tsc --noEmit -p tsconfig.json` should show zero errors for
   the touched files. Then confirm in-app: the widget appears in the right
   sequence slot, shows the backend's `menu_title`, hides cleanly when its API
   returns no rows, and — if you duplicate the backend row with a different
   `default_params_json` — renders as two independent instances.
