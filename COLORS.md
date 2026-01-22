# Pastel Color Theme Documentation

## Overview

The eduMEDIBOR website uses a **pastel color palette** that's easy on the eyes and provides a friendly, welcoming user experience. All colors throughout the site are based on **5 fundamental colors** defined as CSS variables.

## Base Pastel Colors

| Color Name | Hex Code | CSS Variable | Usage |
|-----------|----------|--------------|-------|
| **Pastel Blue** | `#a8d5ff` | `--pastel-blue` | Primary color for headers, buttons, gradients, links |
| **Pastel Pink** | `#f5a5a5` | `--pastel-pink` | Secondary/accent color, alerts, CTAs, error states |
| **Pastel Green** | `#b8e6b8` | `--pastel-green` | Success states, completed items, checkmarks |
| **Pastel Gray** | `#e8e8e8` | `--pastel-gray` | Neutral backgrounds, borders, disabled states |
| **Pastel Yellow** | `#f9e9b5` | `--pastel-yellow` | Reserved for future highlights and warnings |

## Derived Colors

| CSS Variable | Value | Purpose |
|-------------|-------|---------|
| `--primary-color` | `#a8d5ff` | Main theme color |
| `--secondary-color` | `#f5a5a5` | Accent color |
| `--text-color` | `#5a5a5a` | Soft dark gray for text |
| `--light-bg` | `#fafbfd` | Very light background |
| `--white` | `#ffffff` | Pure white for cards, modals |
| `--gradient` | `linear-gradient(135deg, #a8d5ff 0%, #c8e3ff 100%)` | Primary gradient |

## How to Modify Colors

### Quick Theme Change

To change the entire theme, edit the CSS variables in `public/css/style.css` within the `:root` selector:

```css
:root {
  --pastel-blue: #a8d5ff;      /* Change this */
  --pastel-pink: #f5a5a5;      /* Change this */
  --pastel-green: #b8e6b8;     /* Change this */
  --pastel-gray: #e8e8e8;      /* Change this */
  --pastel-yellow: #f9e9b5;    /* Change this */
}
```

All components will automatically adapt to the new colors since they reference these variables.

### Component-Specific Colors

The following components use the base colors:

- **Headers & Navigation**: `--primary-color` (pastel blue)
- **Buttons & CTAs**: `--secondary-color` (pastel pink) for primary, `--primary-color` for secondary
- **Success Messages**: `--pastel-green`
- **Error Messages**: `--pastel-pink`
- **Background Areas**: `--light-bg`
- **Completed Items**: `--pastel-green`
- **Hover States**: Slightly darker or transparent versions of base colors

## Files Using CSS Variables

The following files reference the CSS color variables:

1. **CSS Files**:
   - `public/css/style.css` - Main stylesheet with all component styles

2. **JavaScript Files** (inline colors):
   - `public/js/addresses-map.js` - Map marker colors
   
3. **SVG Image Files** (hardcoded):
   - `public/images/pediatric.svg`
   - `public/images/trauma.svg`

## Color Usage Guidelines

### Readability
- Use `#5a5a5a` (pastel text color) for text on light/pastel backgrounds
- Use white (`#ffffff`) for text on colored backgrounds
- Ensure sufficient contrast ratio (WCAG AA minimum 4.5:1 for normal text)

### Consistency
- Always use CSS variables instead of hardcoding hex values
- For new components, reference the base colors: `var(--pastel-blue)`, `var(--pastel-pink)`, etc.

### Interactive States
- **Hover**: Use slightly modified opacity or saturated version
- **Active**: Use full color
- **Disabled**: Use `--pastel-gray` with reduced opacity

## Example: Creating a New Component

```css
.new-component {
  background: var(--pastel-blue);
  color: #ffffff;
  border: 2px solid var(--primary-color);
}

.new-component:hover {
  background: var(--pastel-blue);
  opacity: 0.8;
}

.new-component.success {
  background: var(--pastel-green);
}

.new-component.error {
  background: var(--pastel-pink);
}
```

## Accessibility Notes

The pastel color palette was chosen for:
- **Visual Comfort**: Reduced eye strain compared to saturated colors
- **Friendly Appearance**: Welcoming and approachable aesthetic
- **Contrast**: Sufficient contrast with text for readability
- **Professional Look**: Soft but still professional appearance

## Testing Color Changes

After modifying colors:

1. Check the home page for overall appearance
2. Visit `/courses` to see course cards
3. Check `/learn` for learning interface
4. Test all button states (hover, active, disabled)
5. Verify form validation messages display correctly
6. Check success/error message backgrounds
7. Test responsive design on mobile devices

## Future Enhancements

- Consider adding dark mode by creating additional color variables
- Add CSS animations that utilize the pastel colors
- Create utility classes for quick color application (`.text-primary`, `.bg-secondary`, etc.)
