# Quick Reference - Config Files

## Import Statements

```tsx
// Colors
import { Colors } from "../config/colors";

// Typography & Fonts
import { Typography, FontSizes, FontWeights, LineHeights } from "../config/typography";
import { FontFamilies } from "../config/fonts";

// Spacing & Layout
import { Spacing, PaddingSizes, MarginSizes, GapSizes, BorderRadius } from "../config/spacing";

// Messages & Labels
import { Labels } from "../config/labels";
```

## Colors - Quick Lookup

| Use Case | Color | Usage |
|----------|-------|-------|
| Main Background | `Colors.background` | Default screen background |
| Dark Background | `Colors.backgroundDark` | Dark themed sections |
| Light Background | `Colors.backgroundLight` | Light subtle backgrounds |
| Text Primary | `Colors.text` | Main text color |
| Text Secondary | `Colors.textLabel` | Secondary/label text |
| Primary Button | `Colors.primary` | Main action buttons |
| Secondary Button | `Colors.secondary` | Secondary actions |
| Borders | `Colors.border` | Default borders |
| Accent Border | `Colors.borderAccent` | Highlighted borders |
| Success State | `Colors.success` | Success messages/icons |
| Error State | `Colors.error` | Error messages/validation |
| Warning State | `Colors.warning` | Warning messages |
| Overlay | `Colors.backgroundOverlay` | Dimmed overlay (dark) |
| Shadow | `Colors.shadow` | Text/element shadow |

## Typography - Quick Lookup

| Component Type | Style | Usage |
|----------------|-------|-------|
| Page Title | `Typography.h1` | Main page headings |
| Section Title | `Typography.h2` | Section headers |
| Subsection Title | `Typography.h3` | Subsection headers |
| Small Heading | `Typography.h4` | Small headings |
| Body Text | `Typography.body_large` | Main content text |
| Secondary Text | `Typography.body_medium` | Secondary content |
| Small Text | `Typography.body_small` | Small content |
| Label | `Typography.label_large` | Form labels |
| Caption | `Typography.caption` | Captions/hints |

## Spacing - Quick Lookup

| Value | Pixels | Common Uses |
|-------|--------|-------------|
| `Spacing.xs` | 4px | Tiny gaps, micro-interactions |
| `Spacing.sm` | 8px | Small gaps between elements |
| `Spacing.md` | 12px | Standard padding |
| `Spacing.lg` | 16px | Standard container padding |
| `Spacing.xl` | 20px | Large padding/margins |
| `Spacing.2xl` | 24px | Large spacing |
| `Spacing.3xl` | 32px | Extra large spacing |
| `Spacing.4xl` | 40px | Huge spacing |

## Border Radius - Quick Lookup

| Value | Pixels | Common Uses |
|-------|--------|-------------|
| `BorderRadius.sm` | 4px | Subtle corners |
| `BorderRadius.md` | 8px | Default button radius |
| `BorderRadius.lg` | 12px | Cards, large elements |
| `BorderRadius.xl` | 16px | Prominent elements |
| `BorderRadius.full` | 9999 | Perfect circles |

## Font Sizes - Quick Lookup

| Constant | Size | Common Uses |
|----------|------|-------------|
| `FontSizes.xs` | 10px | Smallest text (captions) |
| `FontSizes.sm` | 12px | Small text (hints) |
| `FontSizes.base` | 14px | Base body text |
| `FontSizes.lg` | 16px | Large body text |
| `FontSizes.xl` | 18px | Headings |
| `FontSizes.2xl` | 20px | Section titles |
| `FontSizes.3xl` | 24px | Major headings |
| `FontSizes.4xl` | 28px | Page titles |

## Font Weights - Quick Lookup

| Constant | Weight | Common Uses |
|----------|--------|-------------|
| `FontWeights.light` | 300 | Subtle, de-emphasized text |
| `FontWeights.normal` | 400 | Regular body text |
| `FontWeights.medium` | 500 | Emphasized text |
| `FontWeights.semibold` | 600 | Subheadings |
| `FontWeights.bold` | 700 | Main headings |

## Common StyleSheet Patterns

### Button Style
```tsx
const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    ...Typography.body_large,
    color: Colors.background,
  },
});
```

### Card Style
```tsx
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
});
```

### Input Field
```tsx
const styles = StyleSheet.create({
  input: {
    ...Typography.body_large,
    color: Colors.text,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  label: {
    ...Typography.label_large,
    color: Colors.textLabel,
    marginBottom: Spacing.sm,
  },
});
```

### Container/Screen
```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  content: {
    flex: 1,
    gap: GapSizes.lg,
  },
});
```

## Text Messages Quick Lookup

| Category | Key | Value |
|----------|-----|-------|
| Login | `Labels.login` | "Log in" |
| Signup | `Labels.signup` | "Sign up" |
| Error | `Labels.error` | "Error" |
| Loading | `Labels.loading` | "Loading..." |
| Success | `Labels.success` | "Success" |
| Cancel | `Labels.cancel` | "Cancel" |
| Save | `Labels.save` | "Save" |
| Continue | `Labels.continue` | "Continue" |
| Field Required | `Labels.fieldRequired` | "This field is required" |
| Invalid Email | `Labels.invalidEmail` | "Please enter a valid email address" |

## Migration Checklist

When refactoring a component file:

- [ ] Add import statements at the top
  ```tsx
  import { Colors } from "../config/colors";
  import { Typography, FontSizes } from "../config/typography";
  import { Spacing, BorderRadius } from "../config/spacing";
  import { Labels } from "../config/labels";
  ```

- [ ] Replace hardcoded colors
  ```tsx
  // ❌ backgroundColor: "#001871"
  // ✅ backgroundColor: Colors.primary
  ```

- [ ] Replace hardcoded font sizes
  ```tsx
  // ❌ fontSize: 16, fontFamily: "QuicksandMedium"
  // ✅ ...Typography.body_large
  ```

- [ ] Replace hardcoded spacing
  ```tsx
  // ❌ paddingHorizontal: 16
  // ✅ paddingHorizontal: Spacing.lg
  ```

- [ ] Replace hardcoded messages
  ```tsx
  // ❌ <Text>{"Log in"}</Text>
  // ✅ <Text>{Labels.login}</Text>
  ```

- [ ] Use consistent border radius
  ```tsx
  // ❌ borderRadius: 8
  // ✅ borderRadius: BorderRadius.md
  ```

## Color Palette at a Glance

### Primary
- `Colors.primary` - #001871 (Dark Blue)
- `Colors.secondary` - #0177C8 (Bright Blue)

### Backgrounds
- `Colors.background` - #FFFFFF (White)
- `Colors.backgroundDark` - #2c3a4c (Dark Gray-Blue)
- `Colors.backgroundLight` - #FAFAFF (Off-White)
- `Colors.backgroundOverlay` - rgba(0, 0, 0, 0.4) (Dark transparent)

### Text
- `Colors.text` - #262626 (Dark Gray)
- `Colors.textLabel` - #898D9E (Medium Gray)
- `Colors.textLight` - #898D9E (Light Gray)

### Status
- `Colors.success` - #4caf50 (Green)
- `Colors.warning` - #ff9800 (Orange)
- `Colors.error` - #f44336 (Red)

---

**For detailed information, see [STYLING_GUIDE.md](STYLING_GUIDE.md)**
