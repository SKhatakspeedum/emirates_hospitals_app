import { useState, useEffect } from "react";
import { Platform } from "react-native";

function isMobileWeb() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent,
  );
}

function getResponsiveHorizontalMargin() {
  if (Platform.OS !== "web") return 0;
  if (isMobileWeb()) return 0;
  const width = typeof window !== "undefined" ? window.innerWidth : 0;
  if (width > 1900) return 350;
  if (width < 1900 && width > 1200) return 200;
  if (width < 1200 && width > 800) return 0;
  return 16;
}

export default function useResponsiveHorizontalMargin() {
  const [horizontalMargin, setHorizontalMargin] = useState(
    getResponsiveHorizontalMargin(),
  );

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handleResize = () =>
      setHorizontalMargin(getResponsiveHorizontalMargin());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return horizontalMargin;
}
