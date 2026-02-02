# UI Component Rules

This document contains rules and conventions for UI components in DhanDiary.

---

## Badge Component

**Location:** `src/components/ui/Neumorphic.tsx`

### Valid Variants

The `Badge` component only accepts these variants:

| Variant   | Use Case                        |
| --------- | ------------------------------- |
| `neutral` | Default/informational badges    |
| `success` | Positive states (active, done)  |
| `warning` | Caution states (pending, alert) |
| `danger`  | Error/negative states           |

### Examples

```tsx
// ✅ CORRECT
<Badge variant="neutral">Default</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Error</Badge>

// ❌ WRONG - "default" is not a valid variant
<Badge variant="default">Default</Badge>
```

---

## Button Component

**Location:** `src/components/ui/Neumorphic.tsx`

### Valid Variants

- `primary` - Main actions
- `secondary` - Secondary actions
- `ghost` - Subtle/icon buttons
- `danger` - Destructive actions

### Valid Sizes

- `sm` - Small
- `md` - Medium (default)
- `lg` - Large

---

## Card Component

**Location:** `src/components/ui/Neumorphic.tsx`

Standard neumorphic card container. Use for grouping related content.

```tsx
<Card className="p-6">
  <h3>Title</h3>
  <p>Content</p>
</Card>
```

---

## Input Component

**Location:** `src/components/ui/Neumorphic.tsx`

Standard form input with neumorphic styling. Supports all standard input props.

```tsx
<Input
  type="text"
  placeholder="Enter value..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

---

_Last updated: February 2026_
