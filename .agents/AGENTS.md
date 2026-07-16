# Style and Theme Guidelines
Always use colors defined in `config/colors.ts` for styling in components. Do not use hardcoded hex or rgba values in component files. If a new color is needed, define it in `colors.ts` first and then reference it via the `Colors` object. This ensures the app properly supports theming and global color changes.

Similarly, always use typography and font families defined in `config/fonts.ts` via the `FontFamilies` object. Do not hardcode font family strings in component files.

Always rely on the `config/*` directory for all default UI properties. Whether it's colors, fonts, typography, layout dimensions, or spacing constants, ensure that they are imported from the relevant config file rather than hardcoding arbitrary values into component styles.
