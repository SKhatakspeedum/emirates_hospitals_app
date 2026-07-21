import {
  SvgIonicons,
  SvgFontAwesome5,
  SvgMaterialCommunityIcons,
} from "../components/icons/SvgIcons";

export interface SpecialtyIconMeta {
  Icon: typeof SvgIonicons | typeof SvgFontAwesome5 | typeof SvgMaterialCommunityIcons;
  iconName: string;
  iconSize: number;
  iconColor: string;
  bgColor: string;
}

// Best-effort icon/color lookup for departments returned by the backend —
// the API only gives us a name, not an icon, so match on common keywords
// and fall back to a generic icon for anything unrecognized. Shared by the
// dashboard's "Specialties" carousel and the "All Specialties" list screen.
export const getSpecialtyIconMeta = (label: string): SpecialtyIconMeta => {
  const key = label.toLowerCase();
  if (key.includes("neuro")) {
    return {
      Icon: SvgMaterialCommunityIcons,
      iconName: "brain",
      iconSize: 28,
      iconColor: "#6B7280",
      bgColor: "#F3F4F6",
    };
  }
  if (key.includes("ent") || key.includes("ear")) {
    return {
      Icon: SvgFontAwesome5,
      iconName: "diagnoses",
      iconSize: 26,
      iconColor: "#E87722",
      bgColor: "#FDF1EB",
    };
  }
  if (key.includes("pediatric") || key.includes("paediatric")) {
    return {
      Icon: SvgMaterialCommunityIcons,
      iconName: "baby-face-outline",
      iconSize: 28,
      iconColor: "#F1C40F",
      bgColor: "#FEF9E7",
    };
  }
  if (key.includes("cardio") || key.includes("heart")) {
    return {
      Icon: SvgFontAwesome5,
      iconName: "heartbeat",
      iconSize: 24,
      iconColor: "#E74C3C",
      bgColor: "#FDEDEC",
    };
  }
  if (key.includes("ortho") || key.includes("bone")) {
    return {
      Icon: SvgMaterialCommunityIcons,
      iconName: "bone",
      iconSize: 26,
      iconColor: "#3498DB",
      bgColor: "#EBF5FB",
    };
  }
  if (key.includes("dental") || key.includes("dent")) {
    return {
      Icon: SvgMaterialCommunityIcons,
      iconName: "tooth-outline",
      iconSize: 26,
      iconColor: "#3498DB",
      bgColor: "#EBF5FB",
    };
  }
  if (key.includes("gyn") || key.includes("obstet")) {
    return {
      Icon: SvgMaterialCommunityIcons,
      iconName: "human-pregnant",
      iconSize: 26,
      iconColor: "#9B59B6",
      bgColor: "#F5EEF8",
    };
  }
  if (key.includes("eye") || key.includes("ophthal")) {
    return {
      Icon: SvgMaterialCommunityIcons,
      iconName: "eye-outline",
      iconSize: 26,
      iconColor: "#3498DB",
      bgColor: "#EBF5FB",
    };
  }
  if (key.includes("medicine") || key.includes("general")) {
    return {
      Icon: SvgFontAwesome5,
      iconName: "briefcase-medical",
      iconSize: 22,
      iconColor: "#2ECC71",
      bgColor: "#EAF6F0",
    };
  }
  return {
    Icon: SvgIonicons,
    iconName: "medkit-outline",
    iconSize: 24,
    iconColor: "#6B7280",
    bgColor: "#F3F4F6",
  };
};
