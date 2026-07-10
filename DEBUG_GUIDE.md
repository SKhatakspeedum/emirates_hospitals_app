# Debug Guide: Dashboard Section Sequence

## How to Test

1. **Open the app** and navigate to the Home screen
2. **Open browser DevTools** (F12)
3. **Check the Console** tab for debug logs

## What to Look For

The logs should appear in this order:

### 1. API Call
```
[getMenuAppWidgets] API Call params: {
  p_ai_code: "INPATIENT",
  sgOrgId: "3",
  p_menu_type: "HomeScreen"
}
```

### 2. API Response
```
[getMenuAppWidgets] API Response: {
  returnCode: true,
  returnData: [...]
}
```

### 3. Parsed Details
```
[getMenuAppWidgets] Parsed details array: [
  { menu_action_screen_identifier: "greeting", menu_display_order: 100, ... },
  { menu_action_screen_identifier: "promoBanner", menu_display_order: 105, ... },
  ...
]
```

### 4. Normalized Widgets
```
[getMenuAppWidgets] Normalized widgets: [
  { widget_code: "greeting", sequence: 1, is_active: "Y" },
  { widget_code: "promoBanner", sequence: 2, is_active: "Y" },
  { widget_code: "quickActions", sequence: 3, is_active: "Y" },
  ...
]
```

### 5. Parsed Sections
```
[fetchSectionsFromBackend] Parsed sections: [
  { key: "greeting", order: 1, visible: true, ... },
  { key: "promoBanner", order: 2, visible: true, ... },
  { key: "quickActions", order: 3, visible: true, ... },
  ...
]
```

### 6. Fetched Sections in Hook
```
[useDashboardSections] Fetched sections: [...]
```

## Troubleshooting

### If you see "No backend data, using defaults"
- The API call is failing or returning empty data
- Check if `response.returnData` is empty or null
- Verify the backend API is returning the expected format

### If you see "Error parsing details JSON"
- The `details` field might not be valid JSON
- Check the raw API response to see what's in the `details` field

### If API Response shows `returnCode: false`
- The backend API call failed
- Check the full response object for error details

### If sections are showing in default order
- The hook is probably falling back to `DEFAULT_SECTIONS`
- Check if there are any errors in the console logs
- Verify that `visibleSections` includes all sections in order

## Expected Behavior

If everything is working:
1. Sections will render in the order specified by `menu_display_order` from the backend
2. The console logs will show the full flow from API call to parsed sections
3. Inactive sections (if any) will be hidden
4. Patient-only sections will be hidden when no patient is selected

## Backend Response Format

The backend should return sections with these fields:
- `menu_action_screen_identifier`: camelCase section key (greeting, promoBanner, etc.)
- `menu_display_order`: numeric order (100, 105, 115, 125, etc.)
- `menu_name`: display name of the section

The `details` field must be a valid JSON string containing an array of these items.
