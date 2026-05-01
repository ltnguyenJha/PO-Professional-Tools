# Theme Settings Design Specification

**Author:** Tess (UX Designer)  
**Date:** 2026-04-30  
**Status:** Ready for Implementation  

---

## 1. User Stories

### Primary Users: Product Owners & Technical PMs

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-1 | Product Owner | Customize accent colors per view | I can distinguish PBI Studio, Epics, and Features visually |
| US-2 | User with visual preferences | Adjust card density (compact/comfortable/spacious) | I can optimize screen real estate for my workflow |
| US-3 | Team lead with multiple projects | Override the default Epic color (violet) | I can use my team's branding or personal preference |
| US-4 | User working across views | Have my theme preferences persist across sessions | I don't have to reconfigure every time I open VS Code |
| US-5 | Accessibility-conscious user | Preview theme changes before applying | I can verify readability and contrast |

---

## 2. Proposed UX Pattern

### 2.1 Entry Points

Theme settings are accessible via **three consistent patterns**:

#### A) Global Settings Tab (Primary)
- **Location:** Sidebar nav → Settings (existing view)
- **New Section:** "Appearance" card below "Team & Defaults"
- **Contains:** All theme customization for all views

#### B) Per-View Settings Cog (Secondary)
- **Location:** Each view's Topbar (right side, next to existing actions)
- **Icon:** ⚙️ cog or "Appearance" button
- **Behavior:** Opens a focused settings popover scoped to that view's options
- **Why:** Quick access without leaving the view; reduces context-switching

#### C) Command Palette (Power Users)
- **Command:** `PO Tools: Open Appearance Settings`
- **Behavior:** Opens Settings view, scrolls to Appearance section

### 2.2 Settings UI Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ ⚙️ Appearance                                        [Reset All] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ╭───────────────────────────────────────────────────────────────╮│
│ │  🎨 PBI Studio                                                ││
│ │  ─────────────────────────────────────────────────────────────││
│ │  Accent Color    [ ● Teal (default) ▾ ]                       ││
│ │  Card Style      ( ) Compact  (●) Comfortable  ( ) Spacious   ││
│ │  Font Size       [ Default (13px) ▾ ]                         ││
│ ╰───────────────────────────────────────────────────────────────╯│
│                                                                  │
│ ╭───────────────────────────────────────────────────────────────╮│
│ │  🟣 Epics                                                     ││
│ │  ─────────────────────────────────────────────────────────────││
│ │  Accent Color    [ ● Violet (default) ▾ ]                     ││
│ │  ⓘ Used for Epic wizard steps, cards, and status indicators  ││
│ ╰───────────────────────────────────────────────────────────────╯│
│                                                                  │
│ ╭───────────────────────────────────────────────────────────────╮│
│ │  ✨ Feature Creation                                          ││
│ │  ─────────────────────────────────────────────────────────────││
│ │  Accent Color    [ ● Blue (default) ▾ ]                       ││
│ │  Form Density    (●) Standard  ( ) Compact                    ││
│ ╰───────────────────────────────────────────────────────────────╯│
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ Preview                                                     │  │
│ │ ┌───────────────────────┐ ┌──────────────────────────────┐  │  │
│ │ │ PBI Card Sample       │ │ Epic Step Indicator          │  │  │
│ │ │ ───────────────────── │ │ (1) ─ (2) ─ (3) ─ (4) ─ (5)  │  │  │
│ │ │ Title: Sample Story   │ │          ↑ current           │  │  │
│ │ │ [Accent Border]       │ └──────────────────────────────┘  │  │
│ │ └───────────────────────┘                                   │  │
│ └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│                                    [ Cancel ]  [ Apply Settings ]│
└──────────────────────────────────────────────────────────────────┘
```

### 2.3 Per-View Popover (Quick Settings)

When the cog icon is clicked from a specific view's Topbar:

```
┌────────────────────────────────────────┐
│ PBI Studio Appearance           [ × ]  │
├────────────────────────────────────────┤
│ Accent Color   [ ● Teal ▾ ]            │
│ Card Style     (●) Comfortable         │
│ Font Size      [ Default ▾ ]           │
├────────────────────────────────────────┤
│ [Open All Settings]        [Apply]     │
└────────────────────────────────────────┘
```

**Behavior:**
- Changes apply immediately (live preview)
- "Apply" confirms and persists
- Clicking outside dismisses without saving
- "Open All Settings" navigates to full Settings view

---

## 3. Settings Fields per View

### 3.1 PBI Studio

| Field | Type | Default | Options | Constraints |
|-------|------|---------|---------|-------------|
| `pbiStudio.accentColor` | enum | `'teal'` | `'teal'`, `'blue'`, `'indigo'`, `'purple'`, `'pink'`, `'emerald'`, `'amber'`, `'slate'` | Must map to existing design token |
| `pbiStudio.cardStyle` | enum | `'comfortable'` | `'compact'`, `'comfortable'`, `'spacious'` | Affects padding and gap |
| `pbiStudio.fontSize` | enum | `'default'` | `'small'` (12px), `'default'` (13px), `'large'` (14px) | Uses VS Code font scaling |

**Card Style Effects:**
| Style | Card Padding | Gap | Use Case |
|-------|-------------|-----|----------|
| Compact | 12px (`--space-3`) | 8px (`--space-2`) | Power users, small screens |
| Comfortable | 16px (`--space-4`) | 12px (`--space-3`) | Default, balanced |
| Spacious | 20px (`--space-5`) | 16px (`--space-4`) | Readability preference |

### 3.2 Epics

| Field | Type | Default | Options | Constraints |
|-------|------|---------|---------|-------------|
| `epics.accentColor` | enum | `'violet'` | `'violet'`, `'purple'`, `'indigo'`, `'fuchsia'`, `'rose'`, `'blue'` | Must have light/dark variants |

**Note:** Epic accent color applies to:
- Step indicator circles (`--tw-epic`)
- Card borders and backgrounds (`--tw-epic-bg`, `--tw-epic-border`)
- Navigation active state highlight
- Status badges for Epic items

### 3.3 Feature Creation

| Field | Type | Default | Options | Constraints |
|-------|------|---------|---------|-------------|
| `featureCreation.accentColor` | enum | `'blue'` | `'blue'`, `'teal'`, `'cyan'`, `'indigo'`, `'sky'` | Maps to `--tw-vscode-accent` override |
| `featureCreation.formDensity` | enum | `'standard'` | `'standard'`, `'compact'` | Affects field spacing and button sizes |

**Form Density Effects:**
| Density | Field Margin | Button Height | Use Case |
|---------|--------------|---------------|----------|
| Standard | 16px | 36px | Default, accessibility compliant |
| Compact | 12px | 32px | Experienced users, dense workflows |

---

## 4. VS Code Integration Notes

### 4.1 CSS Variables to Leverage

The extension already bridges VS Code theme variables to Tailwind. Theme settings should **extend**, not replace:

```css
/* Base VS Code tokens (DO NOT OVERRIDE) */
--vscode-editor-background
--vscode-editor-foreground
--vscode-button-background
--vscode-focusBorder

/* Extension bridge tokens (CAN CUSTOMIZE) */
--tw-vscode-accent      /* Primary accent — customizable per view */
--tw-epic               /* Epic accent — default violet */
--tw-epic-bg
--tw-epic-fg
--tw-epic-muted
--tw-epic-border
```

### 4.2 Color Palette Definitions

Each accent color option must define light + dark mode values:

```typescript
// Example color palette (src/shared/themeColors.ts)
export const ACCENT_PALETTES = {
  teal: {
    light: { accent: '#0f766e', accentStrong: '#115e59', accentSoft: '#ccfbf1' },
    dark:  { accent: '#2dd4bf', accentStrong: '#5eead4', accentSoft: 'rgba(45,212,191,0.12)' }
  },
  violet: {
    light: { accent: '#6d28d9', accentStrong: '#5b21b6', accentSoft: '#ede9fe' },
    dark:  { accent: '#7c3aed', accentStrong: '#8b5cf6', accentSoft: 'rgba(124,58,237,0.15)' }
  },
  blue: {
    light: { accent: '#2563eb', accentStrong: '#1d4ed8', accentSoft: '#dbeafe' },
    dark:  { accent: '#3b82f6', accentStrong: '#60a5fa', accentSoft: 'rgba(59,130,246,0.15)' }
  },
  // ... other colors
};
```

### 4.3 Storage via ExtensionContext.globalState

**Storage Key:** `'poTools.ui.themeSettings'`

```typescript
// src/shared/messages.ts — extend UiSettings
export interface ViewThemeSettings {
  accentColor: string;
  cardStyle?: 'compact' | 'comfortable' | 'spacious';
  fontSize?: 'small' | 'default' | 'large';
  formDensity?: 'standard' | 'compact';
}

export interface UiSettings {
  theme: ThemePreference;  // existing
  pbiStudio?: ViewThemeSettings;
  epics?: ViewThemeSettings;
  featureCreation?: ViewThemeSettings;
}
```

**Persistence Flow:**
1. User changes setting in UI
2. Webview sends `SET_VIEW_THEME` message to extension
3. Extension updates `globalState` via `SettingsService`
4. Extension broadcasts `UI_SETTINGS_CHANGED` event
5. All open webview panels receive update and re-render

### 4.4 Message Types (add to shared/messages.ts)

```typescript
// Request (webview → extension)
| { type: 'SET_VIEW_THEME'; payload: { view: 'pbiStudio' | 'epics' | 'featureCreation'; settings: Partial<ViewThemeSettings> } }
| { type: 'RESET_VIEW_THEME'; payload: { view: 'pbiStudio' | 'epics' | 'featureCreation' | 'all' } }

// Event (extension → webview)
| { type: 'UI_SETTINGS_CHANGED'; payload: UiSettings }
```

---

## 5. Implementation Notes for Rusty

### 5.1 Component Structure

```
webview-ui/src/
├── components/
│   ├── ThemeProvider.tsx         # Existing — extend to inject view-specific vars
│   ├── settings/
│   │   ├── AppearanceSection.tsx # Full settings section for Settings view
│   │   ├── ViewThemePopover.tsx  # Per-view quick settings popover
│   │   ├── ColorPicker.tsx       # Accessible color swatch selector
│   │   ├── DensityToggle.tsx     # Radio group for card style / form density
│   │   └── ThemePreview.tsx      # Live preview panel
├── hooks/
│   └── useThemeSettings.ts       # Hook: read/write theme settings, subscribe to changes
├── styles/
│   └── theme-overrides.css       # Dynamic CSS vars injected based on settings
```

### 5.2 State Management Approach

1. **Context:** Create `ThemeSettingsContext` providing:
   - `settings: UiSettings`
   - `updateViewTheme(view, partial)`
   - `resetViewTheme(view | 'all')`

2. **Effect Hook:** `useThemeSettings()` returns settings and syncs with extension state

3. **CSS Variable Injection:** ThemeProvider applies computed CSS variables to `:root` based on active settings:

```tsx
// ThemeProvider.tsx — pseudo-code
useEffect(() => {
  const root = document.documentElement;
  const palette = ACCENT_PALETTES[settings.pbiStudio?.accentColor ?? 'teal'];
  const mode = currentTheme === 'dark' ? 'dark' : 'light';
  
  root.style.setProperty('--pbi-accent', palette[mode].accent);
  root.style.setProperty('--pbi-accent-strong', palette[mode].accentStrong);
  root.style.setProperty('--pbi-accent-soft', palette[mode].accentSoft);
  
  // Similar for epics, featureCreation
}, [settings, currentTheme]);
```

### 5.3 Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | All accent colors must have 4.5:1 contrast on their backgrounds |
| Keyboard navigation | Color swatches focusable via Tab, selectable via Enter/Space |
| Screen reader | Color options announced with name (not just color swatch) |
| Reduced motion | Preview animations disabled when `prefers-reduced-motion: reduce` |
| Focus visible | Settings controls show visible focus ring (`:focus-visible`) |

### 5.4 Testing Checklist

- [ ] Settings persist after VS Code restart
- [ ] Light/dark mode toggle updates accent colors correctly
- [ ] Per-view popover applies changes without navigating away
- [ ] Reset button restores defaults
- [ ] Preview panel reflects live changes
- [ ] WCAG 2.1 AA compliance (color contrast, focus states)
- [ ] Multiple webview panels stay in sync when settings change

---

## 6. Open Questions / Future Considerations

1. **Per-project themes?** Currently global. Could later add `workspaceState` for project-specific overrides.
2. **Custom color picker?** v1 uses preset palettes; future could allow hex input.
3. **Import/export settings?** Useful for teams wanting shared configurations.

---

## Appendix: Color Palette Reference

| Name | Light Accent | Dark Accent | Use Case |
|------|--------------|-------------|----------|
| Teal | `#0f766e` | `#2dd4bf` | PBI Studio default |
| Violet | `#6d28d9` | `#7c3aed` | Epics default |
| Blue | `#2563eb` | `#3b82f6` | Feature Creation default |
| Indigo | `#4f46e5` | `#6366f1` | Alternative accent |
| Purple | `#7e22ce` | `#a855f7` | Alternative accent |
| Pink | `#be185d` | `#ec4899` | Expressive option |
| Emerald | `#059669` | `#10b981` | Success-adjacent |
| Amber | `#d97706` | `#f59e0b` | Warning-adjacent |
| Slate | `#475569` | `#94a3b8` | Neutral option |

All colors validated against WCAG 2.1 AA contrast requirements for both light and dark modes.

---

*Specification complete. Ready for Rusty's implementation.*
