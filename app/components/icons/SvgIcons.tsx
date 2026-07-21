import React from "react";
import Svg, { Path } from "react-native-svg";
import { ICON_PATHS } from "./generatedIconPaths";

interface SvgVectorIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Drop-in SVG replacements for the @expo/vector-icons font components —
// same (name, size, color) prop shape, so a call site can switch from
// <Ionicons name="x" size={n} color={c} /> to <SvgIonicons .../> with no
// other changes. Path data in generatedIconPaths.ts is extracted directly
// from the exact font files @expo/vector-icons vendors, so the rendered
// shape is pixel-identical to what the font glyph already produced.
const makeSvgIconComponent = (library: string) => {
  const Component = ({ name, size = 20, color = "#000", style }: SvgVectorIconProps) => {
    const entry = ICON_PATHS[library]?.[name];
    if (!entry) {
      console.warn(`[SvgIcons] No path data for ${library}/${name}`);
      return null;
    }
    // viewBox width reflects the glyph's real advance width, which isn't
    // always square (e.g. FontAwesome5 "diagnoses" is wider than tall) —
    // treat `size` as the height, matching how the font renders at a given
    // fontSize, and derive width from the viewBox's own aspect ratio so
    // non-square glyphs aren't stretched into a square.
    const [, , vbWidth, vbHeight] = entry.viewBox.split(" ").map(Number);
    const width = (size * vbWidth) / vbHeight;
    return (
      <Svg width={width} height={size} viewBox={entry.viewBox} style={style}>
        <Path d={entry.d} fill={color} />
      </Svg>
    );
  };
  Component.displayName = `Svg${library}`;
  return Component;
};

export const SvgIonicons = makeSvgIconComponent("Ionicons");
export const SvgFontAwesome = makeSvgIconComponent("FontAwesome");
export const SvgFontAwesome5 = makeSvgIconComponent("FontAwesome5");
export const SvgFontisto = makeSvgIconComponent("Fontisto");
export const SvgMaterialCommunityIcons = makeSvgIconComponent("MaterialCommunityIcons");
export const SvgMaterialIcons = makeSvgIconComponent("MaterialIcons");
