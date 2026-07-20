# Dynamic Dashboard Screen Integration Guide

## Overview

This guide shows how to refactor `DashboardScreen.tsx` to support **dynamic rendering from the backend** while maintaining **full backward compatibility**. If the backend API fails, returns null, or is unavailable, the screen displays exactly as it does today.

## Architecture

### Files Created

1. **`app/services/dashboardApi.ts`**
   - Centralized API service for dashboard-related calls
   - `getMenuAppWidgets()` - Main function to fetch menu configuration
   - `getHomeScreenWidgets()` - Convenience function for home screen
   - `getMenuWidgetsByType()` - Fetch widgets for specific menu type
   - Full error handling and fallback support

2. **`app/config/sectionConfig.ts`**
   - Section configuration management
   - `fetchSectionsFromBackend()` - Fetches and parses backend data
   - `parseSectionsFromBackend()` - Converts backend response to app format
   - `getVisibleSections()` - Filters visible sections
   - `DEFAULT_SECTIONS` - Fallback configuration

3. **`app/hooks/useDashboardSections.ts`**
   - React hook for section state management
   - Handles loading, error, and refetch states
   - Auto-filters patient-required sections
   - Always falls back to defaults on error

4. **`app/config/process_id.ts`** (Updated)
   - Added: `hospapp_get_mst_menu_app_widgets_json_data_common`

## Integration Steps

### Step 1: Import Hook in DashboardScreen

```typescript
import { useDashboardSections } from "../hooks/useDashboardSections";
import { SectionKey } from "../config/sectionConfig";
```

### Step 2: Add Hook Usage

```typescript
export default function DashboardScreen() {
  // ... existing code ...

  // Fetch dynamic sections (with full backward compatibility)
  const { visibleSections, isLoading } = useDashboardSections(
    noPatient,
    "PATIENT_PORTAL",  // Application code
    ""        // Menu type
  );

  // Show loading state if needed
  if (isLoading && visibleSections.length === 0) {
    // Optional: show loading indicator (current UI will show while loading)
    // return <ActivityIndicator />;
  }

  // Render sections conditionally based on visibleSections
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Keep existing structure, just add conditional rendering */}

      {visibleSections.includes("greeting") && (
        <View style={styles.headerGreetingSection}>
          {/* Existing greeting section code */}
        </View>
      )}

      {visibleSections.includes("promoBanner") && (
        <View style={styles.bodyContent}>
          {/* Existing promo banner code */}
        </View>
      )}

      {/* ... and so on for each section ... */}
    </ScrollView>
  );
}
```

### Step 3: Complete Example Implementation

Here's a minimal example showing the pattern:

```typescript
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useDashboardSections } from "../hooks/useDashboardSections";
import { SectionKey } from "../config/sectionConfig";

export default function DashboardScreen() {
  // ... existing state variables ...
  const [noPatient, setNoPatient] = useState(false);

  // Fetch sections from backend (with fallback to defaults)
  const { visibleSections, isLoading, error } = useDashboardSections(
    noPatient,
    "PATIENT_PORTAL",
    ""
  );

  // Log errors in development (optional)
  if (error) {
    console.log("Dashboard using default sections:", error.message);
  }

  return (
    <View style={styles.container}>
      {/* Sticky Header - always visible */}
      <View style={styles.stickyHeader}>
        {/* ... existing header code ... */}
      </View>

      {/* Main scrollable content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* GREETING SECTION */}
        {visibleSections.includes("greeting") && (
          <View style={styles.headerGreetingSection}>
            <View style={styles.bgCircleLarge} />
            <View style={styles.bgPlusHorizontal} />
            <View style={styles.bgPlusVertical} />
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>
                {noPatient
                  ? `Welcome, ${userProfileName}!`
                  : `${getGreetingTime()}, ${userProfileName}!`}
              </Text>
              <Text style={styles.subGreetingText}>
                {noPatient
                  ? "Start exploring healthcare services..."
                  : "Welcome back. How can we support..."}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bodyContent}>
          {/* PROMO BANNER */}
          {visibleSections.includes("promoBanner") && (
            <View style={styles.promoBanner}>
              {/* ... existing promo code ... */}
            </View>
          )}

          {/* QUICK ACTIONS */}
          {visibleSections.includes("quickActions") && (
            <View style={styles.quickActionsContainer}>
              {/* ... existing quick actions code ... */}
            </View>
          )}

          {/* UPCOMING APPOINTMENTS */}
          {visibleSections.includes("upcomingAppointments") &&
            !noPatient && (
              <View style={styles.sectionContainer}>
                {/* ... existing appointments code ... */}
              </View>
            )}

          {/* HEALTH AWARENESS */}
          {visibleSections.includes("healthAwareness") && (
            <View style={styles.sectionContainer}>
              {/* ... existing health awareness code ... */}
            </View>
          )}

          {/* HEALTH SUMMARY */}
          {visibleSections.includes("healthSummary") && !noPatient && (
            <View style={styles.sectionContainer}>
              {/* ... existing health summary code ... */}
            </View>
          )}

          {/* PROVIDERS */}
          {visibleSections.includes("providers") && (
            <View style={styles.sectionContainer}>
              {/* ... existing providers code ... */}
            </View>
          )}

          {/* SPECIALTIES */}
          {visibleSections.includes("specialties") && (
            <View style={styles.sectionContainer}>
              {/* ... existing specialties code ... */}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
});
```

## Backend API Format

### API Endpoint

```
Process ID: hospapp_get_mst_menu_app_widgets_json_data_common
Process Flag: Y
```

### Request Parameters

```json
{
  "p_ai_code": "PATIENT_PORTAL",
  "sgOrgId": "3",
  "p_menu_type": "",
  "p_process_flag": "Y"
}
```

### Expected Response Format

```json
{
  "returnCode": true,
  "returnData": [
    {
      "widget_code": "greeting",
      "widget_name": "Greeting Section",
      "is_active": "Y",
      "sequence": 1
    },
    {
      "widget_code": "promo_banner",
      "widget_name": "Promotional Banner",
      "is_active": "Y",
      "sequence": 2
    },
    {
      "widget_code": "quick_actions",
      "widget_name": "Quick Actions",
      "is_active": "Y",
      "sequence": 3
    },
    {
      "widget_code": "upcoming_appointments",
      "widget_name": "Upcoming Appointments",
      "is_active": "Y",
      "sequence": 4
    },
    {
      "widget_code": "health_awareness",
      "widget_name": "Health Awareness",
      "is_active": "Y",
      "sequence": 5
    },
    {
      "widget_code": "health_summary",
      "widget_name": "My Health Summary",
      "is_active": "Y",
      "sequence": 6
    },
    {
      "widget_code": "providers",
      "widget_name": "Providers",
      "is_active": "Y",
      "sequence": 7
    },
    {
      "widget_code": "specialties",
      "widget_name": "Specialties",
      "is_active": "Y",
      "sequence": 8
    }
  ]
}
```

## Widget Codes Reference

| Widget Code             | Section               | Description         | Patient Required |
| ----------------------- | --------------------- | ------------------- | ---------------- |
| `greeting`              | Greeting              | Welcome message     | No               |
| `promo_banner`          | Promo Banner          | Promotional offers  | No               |
| `quick_actions`         | Quick Actions         | 4 action buttons    | No               |
| `upcoming_appointments` | Upcoming Appointments | Appointment list    | Yes              |
| `health_awareness`      | Health Awareness      | Educational videos  | No               |
| `health_summary`        | My Health Summary     | Health metrics      | Yes              |
| `providers`             | Providers             | Doctor list         | No               |
| `specialties`           | Specialties           | Medical specialties | No               |

## Backward Compatibility

### ✅ How It Works

1. **Normal Flow (Backend Available)**

   ```
   App Start → Fetch Sections → Backend Success → Use Dynamic Config
   ```

2. **Fallback Flow (Backend Unavailable)**
   ```
   App Start → Fetch Sections → Backend Error/Null → Use DEFAULT_SECTIONS
   → UI renders exactly as before
   ```

### ✅ Guaranteed Behavior

- **If backend API fails**: Screen shows default UI (100% backward compatible)
- **If backend returns null/empty**: Screen shows default UI
- **If backend is unavailable**: Screen shows default UI
- **If widget_code unmapped**: Section is skipped safely
- **No breaking changes**: Existing code structure preserved

## API Service Usage Examples

### Basic Usage (From Hook)

```typescript
const { visibleSections } = useDashboardSections(noPatient);
```

### Direct API Usage

```typescript
import {
  getMenuAppWidgets,
  getHomeScreenWidgets,
} from "../services/dashboardApi";

// Get home screen widgets
const widgets = await getHomeScreenWidgets();

// Get widgets for specific menu type
const dashboardWidgets = await getMenuWidgetsByType("DASHBOARD");

// Get with custom parameters
const customWidgets = await getMenuAppWidgets({
  p_ai_code: "CUSTOM_APP",
  sgOrgId: "5",
  p_menu_type: "CUSTOM_MENU",
});
```

## Error Handling

### Built-in Error Handling

```typescript
const { visibleSections, error, isLoading, refetch } =
  useDashboardSections(noPatient);

// Errors are logged automatically
// Screen continues to work with defaults
// Can manually refetch if needed
await refetch();
```

### Development Debugging

```typescript
if (error) {
  console.log("Using default sections due to:", error.message);
  // Error doesn't break the app
}
```

## Performance Considerations

1. **Minimal Impact**: API call is asynchronous, doesn't block UI
2. **Caching**: Backend should cache the response
3. **Loading State**: Screen renders with defaults while loading
4. **Efficient Filtering**: `visibleSections` array is pre-computed

## Testing Checklist

- [ ] Backend API works - sections display dynamically ✅
- [ ] Backend API fails - sections display as defaults ✅
- [ ] Backend returns empty - sections display as defaults ✅
- [ ] Patient-required sections hide when no patient ✅
- [ ] Section order changes based on `sequence` ✅
- [ ] Inactive sections hide (`is_active: "N"`) ✅
- [ ] No console errors in either case ✅
- [ ] UI renders within 1-2 seconds ✅

## Migration Checklist

- [ ] Copy `dashboardApi.ts` to `app/services/`
- [ ] Copy `sectionConfig.ts` to `app/config/`
- [ ] Copy `useDashboardSections.ts` to `app/hooks/`
- [ ] Add process ID to `process_id.ts`
- [ ] Import hook in DashboardScreen
- [ ] Wrap each section with `{visibleSections.includes("...")} && <Section />`
- [ ] Test with backend available
- [ ] Test with backend unavailable
- [ ] Deploy with confidence ✅

## Dynamic Icons & Labels Feature (🆕)

### Overview

Both the **Left Menu Drawer** and **HomeScreen Widgets** now support **fully dynamic icons and labels** from the backend. Instead of hardcoded static icons, you can customize each menu item and widget header with different icon types and custom labels.

### Supported Icon Types

| Type | Format | Example | Use Case |
|------|--------|---------|----------|
| **icon** | Font Awesome string or JSON config | `"fa-solid fa-user-doctor"` | Vector icons mapped to available libraries |
| **img** | Remote image URL | `"https://api.example.com/icon.png"` | Custom branded icons |
| **svg** | Inline SVG XML or URL | `"<svg>...</svg>"` | Scalable graphics |
| **other** | Raw HTML | `"<i class='fa-solid fa-hospital'></i>"` | Web fonts (auto-detects & maps) |

### Implementation: Left Menu

**File:** `app/(drawer)/tab_bar_home/CustomDrawer.tsx`

**Hook:** `useLeftMenuItems()` (fetches with `p_menu_type: "LeftMenu"`)

**Icon Rendering:**
```typescript
const drawerItems = useMemo(() => {
  if (backendMenuItems.length > 0) {
    return backendMenuItems.map((item) => ({
      label: item.widget_name,
      icon: getDrawerMenuIcon(
        item.menu_image_type,  // "icon" | "img" | "svg" | "other"
        item.menu_image,       // icon data (string or URL)
        item.widget_code
      ),
      screen: item.screen,
    }));
  }
  return DEFAULT_DRAWER_ITEMS;  // Hardcoded fallback
}, [backendMenuItems]);
```

**API Response Example:**
```json
{
  "menu_type": "LeftMenu",
  "details": [
    {
      "menu_id": "104",
      "menu_name": "Find Doctors",
      "menu_image_type": "icon",
      "menu_image": "fa-solid fa-user-doctor",
      "menu_action_screen_identifier": "providers",
      "menu_display_order": "100"
    },
    {
      "menu_id": "105",
      "menu_name": "Order Medicines",
      "menu_image_type": "icon",
      "menu_image": "fa-solid fa-shopping-cart",
      "menu_action_screen_identifier": "orders",
      "menu_display_order": "110"
    }
  ]
}
```

### Implementation: HomeScreen Widgets

**File:** `app/dashboard/DashboardScreen.tsx`

**Data Flow:**
```
Backend (p_menu_type="HomeScreen")
  ↓
dashboardApi.ts (preserves menu_image & menu_image_type)
  ↓
sectionConfig.ts (populates menuImage & menuImageType)
  ↓
DashboardScreen renderBodySection() (uses getMenuIcon())
```

**Widget Headers Using Dynamic Icons:**

| Widget | Line | Icon | Title |
|--------|------|------|-------|
| **upcomingAppointments** | 1008 | `section.menuImageType` | `section.menuName` |
| **healthAwareness** | 1087 | `section.menuImageType` | `section.menuName` |
| **healthSummary** | 1143 | `section.menuImageType` | `section.menuName` |
| **providers** | 1193 | `section.menuImageType` | `section.menuName` |
| **specialties** | 1276 | `section.menuImageType` | `section.menuName` |

**Rendering Pattern:**
```typescript
{getMenuIcon(
  section.menuImageType,           // Backend: "icon" | "img" | "svg" | "other"
  section.menuImage,               // Backend: icon data
  <Ionicons name="calendar" />,    // Fallback hardcoded icon
  13,                              // Size
)}
```

**API Response Example:**
```json
{
  "menu_type": "HomeScreen",
  "details": [
    {
      "menu_id": "96",
      "widget_code": "providers",
      "menu_name": "Find Doctors",
      "menu_image_type": "icon",
      "menu_image": "fa-solid fa-user-doctor",
      "menu_display_order": "50"
    },
    {
      "menu_id": "97",
      "widget_code": "upcomingAppointments",
      "menu_name": "My Appointments",
      "menu_image_type": "icon",
      "menu_image": "fa-solid fa-calendar",
      "menu_display_order": "40"
    }
  ]
}
```

### Shared Icon Rendering Logic

**File:** `app/utils/menuIcon.tsx`

**Core Function:** `getMenuIcon(imageType, imageData, fallbackIcon, size)`

**Features:**
- ✅ Font Awesome string format support (`"fa-solid fa-xxx"`)
- ✅ Font Awesome JSON config support
- ✅ Remote image URL with failure fallback
- ✅ Inline SVG XML rendering
- ✅ HTML web-font detection & mapping
- ✅ Smart quote handling (CMS auto-conversion)
- ✅ Always falls back to hardcoded icon when data missing/invalid

**Supported Font Awesome Icons (50+):**
```
Medical: user-doctor, stethoscope, hospital, pills, prescription, heart, capsules
Orders: cart, shopping-cart, bag-shopping, package
Calendar: calendar, calendar-days, clock
Settings: gear, cog
Home: house, home
Status: check, times, info
User: user, bell
Download/Upload: download, upload
```

### Data Preservation Pipeline

1. **dashboardApi.ts** (lines 223-224):
   ```typescript
   menu_image: item.menu_image,
   menu_image_type: item.menu_image_type,
   ```

2. **sectionConfig.ts** (lines 167-169):
   ```typescript
   menuImage: item.menu_image || undefined,
   menuImageType: item.menu_image_type || undefined,
   menuName: item.widget_name || undefined,
   ```

3. **DashboardScreen.tsx** (5 widgets):
   ```typescript
   {getMenuIcon(section.menuImageType, section.menuImage, fallback, size)}
   ```

### Empty Data Handling

When API returns empty data, widgets are automatically hidden:

- **providers**: Hides if `providerList.length === 0` and loaded
- **specialties**: Hides if `specialties.length === 0` and loaded
- **healthSummary**: Hides if all values are still `"--"`
- **upcomingAppointments**: Hides if `upcomingAppointments.length === 0`
- **quickActions**: Falls back to `FALLBACK_QUICK_ACTIONS`

### Fallback Behavior (Guaranteed)

**If backend doesn't send icon data:**
```json
{
  "menu_image": null,
  "menu_image_type": null
}
```

**Result:** Uses hardcoded fallback icon (zero breakage)

```typescript
// LeftMenu: Uses ICON_MAP["widget_code"] or DEFAULT_ICON
// HomeScreen: Uses hardcoded icon per widget (calendar, person, heart, etc.)
```

### Label Fallback (Guaranteed)

**If backend doesn't send menu_name:**
```json
{
  "menu_name": null
}
```

**Result:** Uses hardcoded title

```typescript
// HomeScreen examples:
{section.menuName?.trim() || "Upcoming appointments"}
{section.menuName?.trim() || "Health awareness"}
{section.menuName?.trim() || "Providers"}
{section.menuName?.trim() || "Specialties"}
```

### Testing Dynamic Icons

**Test Scenario 1: Font Awesome String**
```json
{
  "menu_image_type": "icon",
  "menu_image": "fa-solid fa-user-doctor"
}
```
Expected: 🩺 Doctor icon renders

**Test Scenario 2: Missing Icon Data**
```json
{
  "menu_image_type": null,
  "menu_image": null
}
```
Expected: Hardcoded fallback icon renders (no error)

**Test Scenario 3: Image URL**
```json
{
  "menu_image_type": "img",
  "menu_image": "https://api.example.com/icon.png"
}
```
Expected: Remote image loads; falls back if 404

**Test Scenario 4: Inline SVG**
```json
{
  "menu_image_type": "svg",
  "menu_image": "<svg>...</svg>"
}
```
Expected: SVG renders inline

**Test Scenario 5: HTML Web Font**
```json
{
  "menu_image_type": "other",
  "menu_image": "<i class=\"fa-solid fa-hospital\"></i>"
}
```
Expected: Auto-detected, mapped to available vector icon

## Support

For issues or questions:

1. Check console logs for error messages
2. Verify backend API response format
3. Confirm widget_code values match WIDGET_CODE_MAP
4. Test with `getHomeScreenWidgets()` directly
5. For icon mapping issues, verify `FONT_AWESOME_MAPPING` in `menuIcon.tsx`
