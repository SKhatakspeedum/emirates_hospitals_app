import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { Fontisto, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { SvgXml } from "react-native-svg";
import RenderHTML from "react-native-render-html";
import { Colors } from "@/app/config/colors";

// Shared icon/image rendering for backend-driven menu_image / menu_image_type
// fields (used by both the LeftMenu drawer and the HomeScreen widgets).

// Map Font Awesome icons to available icon libraries
export const FONT_AWESOME_MAPPING: Record<string, { name: string; type: string }> = {
  // Medical/Doctor icons
  "fa-solid fa-user-doctor": { name: "doctor", type: "MaterialCommunityIcons" },
  "fa-solid fa-stethoscope": { name: "stethoscope", type: "Fontisto" },
  "fa-solid fa-hospital": { name: "hospital-box", type: "MaterialCommunityIcons" },
  "fa-solid fa-hospital-user": { name: "hospital-box", type: "MaterialCommunityIcons" },
  "fa-solid fa-pills": { name: "pill", type: "MaterialCommunityIcons" },
  "fa-solid fa-prescription": { name: "prescription", type: "MaterialCommunityIcons" },
  "fa-solid fa-prescription-bottle": { name: "pill", type: "MaterialCommunityIcons" },
  "fa-solid fa-capsules": { name: "pill", type: "MaterialCommunityIcons" },
  "fa-solid fa-heart": { name: "heart", type: "Fontisto" },
  "fa-solid fa-health-check": { name: "heart", type: "Fontisto" },
  "fa-solid fa-microscope": { name: "microscope", type: "MaterialCommunityIcons" },
  "fa-solid fa-flask": { name: "flask", type: "MaterialCommunityIcons" },
  "fa-solid fa-flask-vial": { name: "flask", type: "MaterialCommunityIcons" },
  "fa-solid fa-dna": { name: "dna", type: "MaterialCommunityIcons" },
  "fa-solid fa-virus": { name: "virus", type: "MaterialCommunityIcons" },
  "fa-solid fa-syringe": { name: "needle", type: "MaterialCommunityIcons" },
  "fa-solid fa-tooth": { name: "tooth", type: "MaterialCommunityIcons" },
  "fa-solid fa-bone": { name: "bone", type: "MaterialCommunityIcons" },
  "fa-solid fa-baby": { name: "human-female", type: "MaterialCommunityIcons" },
  "fa-solid fa-wheelchair": { name: "wheelchair-accessibility", type: "MaterialCommunityIcons" },

  // Order/Cart icons
  "fa-solid fa-cart-shopping": { name: "cart", type: "MaterialCommunityIcons" },
  "fa-solid fa-shopping-cart": { name: "cart", type: "MaterialCommunityIcons" },
  "fa-solid fa-bag-shopping": { name: "shopping-bag", type: "Fontisto" },
  "fa-solid fa-package": { name: "package-variant", type: "MaterialCommunityIcons" },

  // Calendar/Appointment icons
  "fa-solid fa-calendar": { name: "calendar", type: "Fontisto" },
  "fa-solid fa-calendar-days": { name: "calendar", type: "Fontisto" },
  "fa-solid fa-clock": { name: "calendar", type: "Fontisto" },

  // Settings/Config icons
  "fa-solid fa-gear": { name: "settings-outline", type: "Ionicons" },
  "fa-solid fa-cog": { name: "settings-outline", type: "Ionicons" },

  // Home icons
  "fa-solid fa-house": { name: "home", type: "Fontisto" },
  "fa-solid fa-home": { name: "home", type: "Fontisto" },

  // Download/Upload
  "fa-solid fa-download": { name: "download-outline", type: "Ionicons" },
  "fa-solid fa-upload": { name: "upload-outline", type: "Ionicons" },

  // Other common icons
  "fa-solid fa-user": { name: "person-outline", type: "Ionicons" },
  "fa-solid fa-bell": { name: "bell", type: "Fontisto" },
  "fa-solid fa-check": { name: "checkmark", type: "Ionicons" },
  "fa-solid fa-times": { name: "close", type: "Ionicons" },
  "fa-solid fa-info": { name: "information", type: "MaterialCommunityIcons" },
};

// Normalizes Font Awesome style class aliases (fas/far/fal/fat/fab) to their
// long form (fa-solid/fa-regular/...) so lookups match FONT_AWESOME_MAPPING keys.
const FA_STYLE_ALIASES: Record<string, string> = {
  fas: "fa-solid",
  "fa-solid": "fa-solid",
  far: "fa-regular",
  "fa-regular": "fa-regular",
  fal: "fa-light",
  "fa-light": "fa-light",
  fat: "fa-thin",
  "fa-thin": "fa-thin",
  fab: "fa-brands",
  "fa-brands": "fa-brands",
};

export const renderVectorIcon = (
  name: string,
  type: string = "Ionicons",
  size: number = 20,
): React.ReactNode => {
  switch (type.toLowerCase()) {
    case "fontisto":
      return <Fontisto name={name} size={size} color={Colors.secondary} />;
    case "materialcommunityicons":
      return <MaterialCommunityIcons name={name} size={size} color={Colors.secondary} />;
    case "materialicons":
      return <MaterialIcons name={name} size={size} color={Colors.secondary} />;
    case "ionicons":
    default:
      return <Ionicons name={name} size={size} color={Colors.secondary} />;
  }
};

// Extract icon name from Font Awesome format
// "fa-solid fa-user-doctor" becomes "user-doctor"
// "fas fa-heart" becomes "heart"
export const extractFontAwesomeIconName = (faString: string): string | null => {
  if (!faString) return null;

  // Match the icon name (the part after fa-)
  const match = faString.match(/fa-([a-z0-9-]+)/i);
  return match ? match[1] : null;
};

// Backends commonly send Font Awesome as a web-font markup snippet, e.g.
// <i class="fa-solid fa-hospital"></i>. RenderHTML has no Font Awesome font
// loaded, so that tag renders as empty. Detect it and pull out the FA class
// combo so it can be looked up in FONT_AWESOME_MAPPING instead.
export const extractFontAwesomeKey = (html: string): string | null => {
  // Straight or curly quotes - CMS rich-text fields often auto-convert
  // straight quotes, which would otherwise silently fail to match.
  const quoted = html.match(
    /<i[^>]*\bclass\s*=\s*['"]([^'">]+)['"][^>]*>/i,
  );

  // Fallback: scan the whole string for fa-* style/icon tokens regardless of
  // tag structure or quoting, in case the markup doesn't match the exact
  // <i class="..."> shape.
  const tokens = quoted
    ? quoted[1].split(/\s+/).filter(Boolean)
    : html.match(/\bfa[srlbt]\b|fa-[a-z0-9-]+/gi) || [];

  if (tokens.length === 0) return null;

  let style = "fa-solid";
  let iconName: string | null = null;

  for (const rawCls of tokens) {
    const cls = rawCls.toLowerCase();
    if (FA_STYLE_ALIASES[cls]) {
      style = FA_STYLE_ALIASES[cls];
    } else if (cls.startsWith("fa-")) {
      iconName = cls;
    }
  }

  return iconName ? `${style} ${iconName}` : null;
};

// Renders a remote image URL for a menu icon; falls back if the URL 404s or fails to load.
export const RemoteIconImage = ({
  uri,
  fallback,
  size = 22,
}: {
  uri: string;
  fallback: React.ReactNode;
  size?: number;
}) => {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
};

/**
 * Renders a menu/widget icon based on backend-driven menu_image_type:
 * - "icon": Font Awesome string (e.g. "fa-solid fa-user-doctor") or JSON
 *   config {name, type, size}, mapped to a vector icon library
 * - "img": image from a URL, with fallback if it fails to load
 * - "svg": inline SVG XML, or an SVG/image URL
 * - "other": raw HTML, with special-case detection of Font Awesome web-font
 *   markup (e.g. <i class="fa-solid fa-hospital"></i>) that would
 *   otherwise render empty
 * - NULL/empty/unparseable: falls back to fallbackIcon, never blank
 */
export const getMenuIcon = (
  imageType: string | undefined,
  imageData: string | undefined,
  fallbackIcon: React.ReactNode,
  size: number = 20,
): React.ReactNode => {
  if (!imageType || imageType === "(NULL)") {
    console.log("[getMenuIcon] No imageType or NULL, using fallback");
    return fallbackIcon;
  }

  if (imageType === "icon" && imageData) {
    try {
      let iconConfig: any;

      // Check if it's Font Awesome format (e.g., "fa-solid fa-user-doctor")
      if (typeof imageData === "string" && imageData.startsWith("fa-")) {
        // Step 1: Try hardcoded mapping first (for special cases)
        const mappedIcon = FONT_AWESOME_MAPPING[imageData];

        if (mappedIcon) {
          iconConfig = { name: mappedIcon.name, type: mappedIcon.type, size };
          console.log("[getMenuIcon] Mapped Font Awesome (hardcoded):", imageData, "->", iconConfig);
        } else {
          // Step 2: Convert Font Awesome to MaterialCommunityIcons format
          // "fa-solid fa-user-doctor" -> "user-doctor" (directly usable)
          const iconName = extractFontAwesomeIconName(imageData);

          if (iconName) {
            // MaterialCommunityIcons has 6000+ icons covering most Font Awesome icons
            // Use the extracted name directly - it matches most Font Awesome icon names
            iconConfig = { name: iconName, type: "MaterialCommunityIcons", size };
            console.log("[getMenuIcon] Universal Font Awesome support:", imageData, "->", iconConfig);
          } else {
            console.warn("[getMenuIcon] Could not parse Font Awesome icon:", imageData);
            return fallbackIcon;
          }
        }
      } else {
        // Try to parse as JSON
        iconConfig = typeof imageData === "string" ? JSON.parse(imageData) : imageData;
      }

      const { name = "help-circle-outline", type = "MaterialCommunityIcons", size: iconSize = size } = iconConfig;
      return renderVectorIcon(name, type, iconSize);
    } catch (error) {
      console.error("[getMenuIcon] Error parsing icon:", error, "data:", imageData);
      return fallbackIcon;
    }
  }

  if (imageType === "img" && imageData && imageData.trim().length > 0) {
    return (
      <RemoteIconImage uri={imageData.trim()} fallback={fallbackIcon} size={size + 2} />
    );
  }

  if (imageType === "svg" && imageData) {
    const trimmed = imageData.trim();
    return (
      <View
        style={{
          width: size + 2,
          height: size + 2,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {trimmed.startsWith("<svg") ? (
          <SvgXml xml={trimmed} width={size + 2} height={size + 2} fill={Colors.secondary} />
        ) : trimmed.startsWith("http") || trimmed.startsWith("data:") ? (
          <RemoteIconImage uri={trimmed} fallback={fallbackIcon} size={size + 2} />
        ) : (
          <Text style={{ fontSize: size }}>{"◈"}</Text>
        )}
      </View>
    );
  }

  if (imageType === "other") {
    if (imageData && imageData.trim().length > 0) {
      console.log("[getMenuIcon] other type raw imageData:", JSON.stringify(imageData));

      // Web-font Font Awesome markup (e.g. <i class="fa-solid fa-hospital"></i>)
      // has no visible content without the FA font loaded - render the mapped
      // vector icon instead of the empty tag.
      const faKey = extractFontAwesomeKey(imageData);
      console.log("[getMenuIcon] extracted faKey:", faKey);
      if (faKey) {
        // Step 1: Try hardcoded mapping
        const mappedIcon = FONT_AWESOME_MAPPING[faKey];

        if (mappedIcon) {
          console.log("[getMenuIcon] Mapped Font Awesome (hardcoded) from HTML:", faKey, "->", mappedIcon);
          return renderVectorIcon(mappedIcon.name, mappedIcon.type, size);
        }

        // Step 2: Universal Font Awesome support - convert to MaterialCommunityIcons
        const iconName = extractFontAwesomeIconName(faKey);
        if (iconName) {
          console.log("[getMenuIcon] Universal Font Awesome support from HTML:", faKey, "->", iconName);
          return renderVectorIcon(iconName, "MaterialCommunityIcons", size);
        }

        console.warn("[getMenuIcon] Could not parse Font Awesome from HTML:", faKey);
        return fallbackIcon;
      }

      return (
        <View
          style={{
            width: size + 2,
            height: size + 2,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <RenderHTML
            contentWidth={size + 2}
            source={{ html: imageData }}
            baseStyle={{
              margin: 0,
              padding: 0,
              fontSize: size - 4,
              color: Colors.secondary,
            }}
            tagsStyles={{
              body: { margin: 0, padding: 0 },
              p: { margin: 0, padding: 0 },
              div: { margin: 0, padding: 0 },
            }}
            enableExperimentalMarginCollapsing
          />
        </View>
      );
    }
    return fallbackIcon;
  }

  return fallbackIcon;
};
