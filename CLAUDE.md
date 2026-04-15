# CIL Youth Platform — Claude Instructions

## Stack
- **Frontend:** React (Vite), plain inline styles (no Tailwind utilities in components)
- **Backend:** Node.js / Express
- **DB:** PostgreSQL
- **CSS:** `client/src/index.css` — utility classes + responsive rules

---

## Colors — CSS Variables only
All colors must use CSS variables defined in `client/src/index.css` `:root`.
**Never hardcode a hex value in a component.**

```js
// ✅ Correct
background: 'var(--color-bg-card)'
color:      'var(--color-brand-accent)'
border:     '1px solid var(--color-border-subtle)'

// ❌ Wrong
background: '#fffef9'
color:      '#c49a3c'
```

### Full variable reference
| Variable                    | Value     | Use                              |
|-----------------------------|-----------|----------------------------------|
| `--color-brand-primary`     | `#1a1610` | Header bg, dark buttons, ink     |
| `--color-brand-accent`      | `#c49a3c` | Gold — active tabs, badges, CTA  |
| `--color-brand-accent-lt`   | `#e8d4a0` | Light gold — header title text   |
| `--color-bg-page`           | `#faf8f3` | Page background, input bg        |
| `--color-bg-card`           | `#fffef9` | Card / surface background        |
| `--color-bg-stripe`         | `#f0ece2` | Table row stripe, disabled input |
| `--color-bg-highlight`      | `#f5edd8` | Highlighted form sections        |
| `--color-border-subtle`     | `#d4c9b0` | Default border on cards/inputs   |
| `--color-border-heavy`      | `#4a4234` | Header button borders            |
| `--color-divider`           | `#e8e0d0` | Section separator lines          |
| `--color-text-heading`      | `#3d3528` | Label / heading text             |
| `--color-text-subdued`      | `#6b5e4a` | Secondary body text              |
| `--color-text-muted`        | `#a09080` | Placeholder / helper text        |
| `--color-text-nav-muted`    | `#5a5040` | Mobile menu section headers      |
| `--color-text-placeholder`  | `#c0b090` | Empty/dash placeholder text      |
| `--color-header-border`     | `#3a3428` | Header divider lines             |
| `--color-header-active-bg`  | `#2a2418` | Active menu item background      |
| `--color-header-bg-deep`    | `#111009` | Deep header accent areas         |
| `--color-header-tabs-bg`    | `#211e18` | Tab bar background               |
| `--color-success`           | `#2d6a4f` | Green — success states           |
| `--color-info`              | `#1a4068` | Blue — info states               |
| `--color-warning`           | `#b85c00` | Orange — warning / funded        |
| `--color-danger`            | `#9b2335` | Red — errors, rejection          |
| `--color-danger-lt`         | `#e07070` | Light red — sign out button      |
| `--color-special`           | `#5a3e8a` | Purple — special categories      |
| `--color-tint-info`         | `#dce9f5` | Light blue bg for info badges    |
| `--color-tint-success`      | `#d8ede4` | Light green bg for success       |
| `--color-tint-danger`       | `#f5e0e3` | Light red bg for error banners   |
| `--color-tint-warning`      | `#fdecd8` | Light orange bg for warnings     |

---

## Responsive Design
All new UI must be mobile-first using the `rsp-*` utility classes from `index.css`.

### Grid classes
```jsx
<div className="rsp-grid-2" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
<div className="rsp-grid-3" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px'}}>
<div className="rsp-grid-4" style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px'}}>
```
- Always pair the className with the matching inline `gridTemplateColumns` (desktop default)
- The class handles the mobile breakpoint override automatically

### Submit/action button rows
```jsx
<div className="rsp-submit-row" style={{display:'flex', gap:'12px'}}>
  <button type="submit">Save</button>
  <button type="button">Cancel</button>
</div>
```
Stacks buttons full-width on mobile automatically.

### Section headers (title + action button side by side)
```jsx
<div className="rsp-section-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
```

### Tables
- Wrap in `<div className="rsp-table-wrap">` for horizontal scroll on mobile
- Add `className="rsp-card-table"` to `<table>` for card-style rows on mobile
- Add `data-label="Column Name"` to every `<td>` so the card layout can label each field

---

## Component patterns

### Card / surface container
```jsx
const card = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(26,22,16,0.06)'
};
```

### Section title
```jsx
const sectionTitle = {
  fontSize: '14px', fontWeight: '700',
  marginBottom: '16px', paddingBottom: '10px',
  borderBottom: '1px solid var(--color-divider)',
  color: 'var(--color-brand-primary)'
};
```

### Label (form fields)
```jsx
const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '700',
  color: 'var(--color-text-heading)', letterSpacing: '0.3px',
  textTransform: 'uppercase', marginBottom: '5px'
};
```

### Input / Select
```jsx
const inputStyle = {
  width: '100%', padding: '9px 11px',
  border: '1px solid var(--color-border-subtle)', borderRadius: '5px',
  fontSize: '13px', color: 'var(--color-brand-primary)',
  background: 'var(--color-bg-page)', outline: 'none', fontFamily: 'inherit'
};
```

### Primary button (dark with gold text)
```jsx
style={{
  background: 'var(--color-brand-primary)', color: 'var(--color-brand-accent)',
  border: 'none', borderRadius: '6px', padding: '10px 24px',
  fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
}}
```

### Success button
```jsx
style={{
  background: 'var(--color-success)', color: '#fff',
  border: 'none', borderRadius: '6px', padding: '10px 24px',
  fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
}}
```

### Ghost / cancel button
```jsx
style={{
  background: 'transparent', color: 'var(--color-text-subdued)',
  border: '1px solid var(--color-border-subtle)', borderRadius: '6px',
  padding: '10px 20px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit'
}}
```

### Error banner
```jsx
<div style={{
  background: 'var(--color-tint-danger)', border: '1px solid var(--color-danger)',
  borderRadius: '6px', padding: '10px 14px',
  color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px'
}}>
  {error}
</div>
```

### Success banner
```jsx
<div style={{
  background: 'var(--color-tint-success)', border: '1px solid var(--color-success)',
  borderRadius: '6px', padding: '10px 14px',
  color: 'var(--color-success)', fontSize: '13px', marginBottom: '16px'
}}>
  {success}
</div>
```

### Status badge
```jsx
<span style={{
  background: 'var(--color-tint-info)', color: 'var(--color-info)',
  padding: '2px 10px', borderRadius: '10px',
  fontSize: '11px', fontWeight: '700'
}}>
  Label
</span>
```

---

## File structure conventions
```
client/src/
  components/
    admin/       — admin-only views (AdminOverview, TESManagement, etc.)
    ldc/         — LDC staff views
    participant/ — participant profile tabs
    common/      — shared modals / utility components
    tes/         — TES batch detail views
  pages/         — top-level route pages (AdminDashboard, LDCDashboard, etc.)
  lib/           — api.js (axios instance)
  contexts/      — AuthContext
  index.css      — all styles + CSS variables
```

New components go in the most specific subfolder above. New route-level pages go in `pages/`.

---

## API calls
Use the `api` instance from `../../lib/api` (axios with baseURL and auth header pre-configured).
```js
import api from '../../lib/api';
const res = await api.get('/api/some-endpoint');
```

---

## General rules
- No Tailwind utility classes in component JSX — all styling via inline styles + `rsp-*` classes
- No new CSS files — add any needed utility classes to `index.css`
- Keep `rgba()` values as-is (e.g. `rgba(26,22,16,0.06)`) — they can't use hex variables
- Font family: always include `fontFamily: 'inherit'` on buttons/inputs
