# Design Specification: Real-Time Chat Application

> **Design Read**: Modern real-time 1-to-1 chat application for desktop and mobile web.
> **Aesthetic Tone**: Restrained Obsidian & Slate dark mode with Electric Emerald presence indicators and Cobalt/Azure message accents. Crisp, tactile, and highly legible without generic AI-slop gradients or ungrounded glassmorphism.
> **Dials**: `DESIGN_VARIANCE: 5` | `MOTION_INTENSITY: 4` | `VISUAL_DENSITY: 6`

---

## 1. Overall Visual Direction

* **Atmosphere**: Professional, distraction-free messaging interface with dark-mode first architecture.
* **Hierarchy**: High visual contrast between structural chrome (sidebar, headers, message composer) and conversational content (message bubbles, timestamps, avatars).
* **Anti-Default Discipline**:
  * No purple/violet glowing gradients.
  * No generic full-screen glassmorphism or muddy blur filters.
  * Solid surfaces with crisp 1px borders (`#1e293b` / `#334155`) for structural containment.
  * Tactile feedback on all interactive controls (`:active` with `transform: scale(0.98)`).
  * Strict avoidance of layout shifts using `100dvh` viewport heights.

---

## 2. Color Palette & Semantic Tokens

All colors use an obsidian/slate dark theme foundation with WCAG AA compliance (4.5:1 minimum text contrast).

### 2.1 CSS Custom Properties (`tokens.css`)

```css
:root {
  /* Surfaces & Backgrounds */
  --bg-app: #090d16;             /* Canvas background */
  --bg-sidebar: #0f172a;         /* Sidebar / channel list */
  --bg-chat: #0b1120;            /* Main message stream canvas */
  --bg-card: #131d35;            /* Elevated card surface */
  --bg-card-hover: #1e293b;      /* Hover state for conversation items */
  --bg-card-active: #23324f;     /* Selected conversation */

  /* Borders & Dividers */
  --border-subtle: #1e293b;      /* Panel separators */
  --border-strong: #334155;      /* Focus rings, input borders */
  --border-highlight: #475569;   /* Hover borders */

  /* Typography / Foreground */
  --text-primary: #f8fafc;       /* 98% white for headings, active messages */
  --text-secondary: #94a3b8;     /* Muted secondary labels, timestamps */
  --text-muted: #64748b;         /* Placeholders, disabled states */
  --text-inverse: #ffffff;       /* Text on primary accent buttons */

  /* Primary Brand Accent (Cobalt / Azure) */
  --accent-primary: #2563eb;     /* Outgoing message bubble, primary CTA */
  --accent-primary-hover: #1d4ed8;
  --accent-primary-subtle: rgba(37, 99, 235, 0.15);

  /* Status Tokens */
  --status-online: #10b981;      /* Emerald 500: Active connection / online dot */
  --status-online-glow: rgba(16, 185, 129, 0.35);
  --status-offline: #64748b;     /* Slate 500: Offline dot */
  --status-connecting: #f59e0b;  /* Amber 500: Reconnecting banner */
  --status-danger: #ef4444;      /* Red 500: Error alert */

  /* Message Bubbles */
  --bubble-sender-bg: #2563eb;          /* Outgoing bubble (Sender) */
  --bubble-sender-text: #ffffff;
  --bubble-receiver-bg: #1e293b;        /* Incoming bubble (Receiver) */
  --bubble-receiver-text: #f1f5f9;
  --bubble-receiver-border: #334155;

  /* Input Composer */
  --input-bg: #0f172a;
  --input-border: #334155;
  --input-border-focus: #3b82f6;

  /* Badges & Indicators */
  --badge-unread-bg: #2563eb;
  --badge-unread-text: #ffffff;
}
```

---

## 3. Typography

* **Primary Font Family**: `'Outfit', 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
* **Monospace Font (Timestamps / Codes)**: `'Geist Mono', 'JetBrains Mono', 'SF Mono', monospace`

### Typography Hierarchy Scale

| Role | Font Size | Line Height | Weight | Letter Spacing | Color |
|---|---|---|---|---|---|
| **App Title / User Name** | `1.125rem` (18px) | `1.4` | `600` (SemiBold) | `-0.01em` | `var(--text-primary)` |
| **Section Label** | `0.75rem` (12px) | `1.2` | `600` (SemiBold) | `+0.05em` (Caps) | `var(--text-muted)` |
| **Conversation Partner** | `0.9375rem` (15px) | `1.3` | `600` (SemiBold) | `normal` | `var(--text-primary)` |
| **Message Body** | `0.9375rem` (15px) | `1.5` | `400` (Regular) | `normal` | `var(--bubble-*-text)` |
| **Message Preview** | `0.8125rem` (13px) | `1.4` | `400` (Regular) | `normal` | `var(--text-secondary)` |
| **Timestamps** | `0.6875rem` (11px) | `1.2` | `500` (Medium) | `+0.02em` | `var(--text-secondary)` |
| **Badge Counter** | `0.6875rem` (11px) | `1.0` | `700` (Bold) | `normal` | `var(--badge-unread-text)` |

---

## 4. Spacing, Sizing & Sizing Scale

* **Base Unit**: `4px` (`0.25rem`)
* **Layout Sizing**:
  * Viewport Container: `height: 100dvh; width: 100vw; overflow: hidden;`
  * Sidebar Width: `320px` (Desktop), `360px` (Wide Desktop), `100%` (Mobile overlay/view)
  * Chat Window: `flex: 1; min-width: 0;`
  * Header Height: `64px`
  * Message Composer Height: `68px` (Expands up to `140px` for multi-line)
  * Avatar Sizes:
    * Sidebar User Header: `40px x 40px`
    * Conversation Item: `44px x 44px`
    * Message Stream Header: `36px x 36px`

---

## 5. Border Radius & Shadows

Consistent shape system: Soft-rectangles for structural containers and bubbles, pill shape for interactive badges and status dots.

```css
:root {
  --radius-xs: 4px;      /* Date divider pill */
  --radius-sm: 6px;      /* Status badge */
  --radius-md: 10px;     /* Input fields, action buttons */
  --radius-lg: 14px;     /* Message bubbles, conversation cards */
  --radius-full: 9999px; /* Avatars, unread pills, status dots */

  /* Elevation Shadows (tinted dark blue-slate, no dirty black drops) */
  --shadow-sm: 0 1px 2px rgba(2, 6, 23, 0.4);
  --shadow-md: 0 4px 12px rgba(2, 6, 23, 0.5);
  --shadow-bubble: 0 2px 4px rgba(2, 6, 23, 0.25);
  --shadow-dropdown: 0 8px 24px rgba(2, 6, 23, 0.7);
}
```

---

## 6. Responsive Layout Architecture

* **Desktop (`>= 768px`)**:
  * 2-column split view: Left fixed Sidebar (`320px`), Right Chat Window (`flex: 1`).
  * Both columns fill `100dvh` independently with vertical auto-scroll.
* **Mobile (`< 768px`)**:
  * Single view switching:
    * When no conversation is active: Sidebar occupies `100vw`.
    * When a conversation is selected: Chat Window slides in / occupies `100vw`.
  * Chat Header displays a mobile `← Back` button to return to the Conversation List.
  * Input area respects virtual keyboard with `padding-bottom: env(safe-area-inset-bottom)`.

---

## 7. Chat Sidebar (`Sidebar.jsx`)

The left sidebar manages user switching, connection status, and conversation selection.

### 7.1 Sidebar Header (Top: 64px)
* **Elements**:
  * Current logged-in user profile pill (Avatar + Display Name + "Demo User").
  * **"Switch User" button**: Clear, accessible toggle button allowing instantaneous switching between Demo User 1 and Demo User 2 for testing.
  * Global Connection Status Pill (Green "Connected" / Amber "Reconnecting" / Red "Offline").

### 7.2 Search / Quick Filter Bar (Optional Utility)
* Input with subtle search glyph and placeholder: *"Search conversations..."*.
* Height `36px`, rounded `var(--radius-md)`, background `var(--bg-app)`.

### 7.3 Section Header
* Text: `DIRECT MESSAGES` (`0.75rem`, uppercase, tracking `+0.05em`, color `var(--text-muted)`).

---

## 8. Conversation List & Items (`ConversationItem.jsx`)

### 8.1 Visual States
* **Default**: Background `transparent`, border `1px solid transparent`.
* **Hover**: Background `var(--bg-card-hover)`, transition `background 150ms ease`.
* **Active (Selected)**: Background `var(--bg-card-active)`, left border accent `3px solid var(--accent-primary)`, slight inset shadow.

### 8.2 Item Anatomy
```
┌────────────────────────────────────────────────────────┐
│ [ Avatar + Dot ]  Partner Name             10:42 AM    │
│                   Latest message preview...     [ 2 ]  │
└────────────────────────────────────────────────────────┘
```
* **Avatar Container**: `44px x 44px` with absolute-positioned online status indicator on bottom-right.
* **Text Details Column**:
  * Line 1: Partner display name (`font-weight: 600`) + Timestamp of latest message right-aligned (`0.6875rem`, muted).
  * Line 2: Last message snippet (single line, `text-overflow: ellipsis; overflow: hidden; white-space: nowrap;`) + Unread Badge count if `unread > 0`.

---

## 9. User Avatar & Online / Offline Indicator

### 9.1 Avatar Styling
* Circle `border-radius: 50%`.
* Background: Generated subtle gradient based on user ID or initials fallback (e.g. `bg: #1e3a8a`, `text: #93c5fd`).
* Fallback: Bold 2-letter uppercase initials (`JD`, `AS`).

### 9.2 Status Indicator Dot
* Diameter: `10px`.
* Border: `2px solid var(--bg-sidebar)` (creates a clean cutout effect separating avatar and dot).
* Position: `bottom: 0; right: 0; position: absolute;`.
* **Online State**:
  * Background: `var(--status-online)` (`#10b981`).
  * Box-shadow: `0 0 6px var(--status-online-glow)`.
* **Offline State**:
  * Background: `var(--status-offline)` (`#64748b`).
  * No glow.

---

## 10. Chat Header (`ChatHeader.jsx`)

Anchored at top of Chat Window (`height: 64px`, `border-bottom: 1px solid var(--border-subtle)`).

### Elements (Left to Right)
1. **Mobile Back Button** (`< 768px` only): Arrow icon button, `36px x 36px`, accessible label `"Back to conversations"`.
2. **Partner Avatar**: `36px x 36px` circle with online dot.
3. **Partner Info**:
   * Row 1: Partner Name (`1rem`, `font-weight: 600`, color `var(--text-primary)`).
   * Row 2: Status text:
     * When online: `"Online"` in `var(--status-online)` with subtle green pulse.
     * When offline: `"Offline"` or `"Last seen recently"` in `var(--text-secondary)`.
4. **Header Actions**: Clean icon action button for refreshing/clearing history view or inspecting connection details.

---

## 11. Sender and Receiver Message Bubbles (`MessageBubble.jsx`)

Messages are arranged sequentially with distinct visual alignment and container styling.

### 11.1 Geometry & Alignment
* **Outgoing (Sender / Current User)**:
  * Container aligned: `margin-left: auto; justify-content: flex-end;`.
  * Max-width: `70%` of chat window width.
  * Background: `var(--bubble-sender-bg)` (`#2563eb`).
  * Text Color: `var(--bubble-sender-text)` (`#ffffff`).
  * Border Radius: `16px 16px 4px 16px` (tucked bottom-right corner).
  * Border: `none`.
  * Shadow: `var(--shadow-bubble)`.
* **Incoming (Receiver / Other User)**:
  * Container aligned: `margin-right: auto; justify-content: flex-start;`.
  * Max-width: `70%` of chat window width.
  * Background: `var(--bubble-receiver-bg)` (`#1e293b`).
  * Text Color: `var(--bubble-receiver-text)` (`#f1f5f9`).
  * Border: `1px solid var(--bubble-receiver-border)` (`#334155`).
  * Border Radius: `16px 16px 16px 4px` (tucked bottom-left corner).
  * Shadow: `var(--shadow-bubble)`.

### 11.2 Consecutive Message Grouping
* When consecutive messages are sent by the same user within 2 minutes:
  * Remove redundant avatar/name displays.
  * Reduce top margin between bubbles from `12px` to `4px`.
  * Flatten intermediate corner radii to `6px` for continuous visual clustering.

---

## 12. Message Timestamps & Date Dividers

### 12.1 Timestamp inside Bubble
* Positioned inline at the bottom-right of the message text.
* Font size: `0.6875rem` (`11px`), `font-family: var(--font-mono)`.
* Color:
  * Sender bubble: `rgba(255, 255, 255, 0.75)`.
  * Receiver bubble: `var(--text-secondary)` (`#94a3b8`).
* Format: `hh:mm A` (e.g., `02:14 PM`).
* Delivery checkmark icon next to sender timestamp (Single check = Sent/Stored in PostgreSQL).

### 12.2 Date Divider Badge
* Displayed when a message occurs on a different calendar day.
* Centered horizontally with horizontal rule lines on either side.
* Styling: `padding: 4px 12px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-full); font-size: 0.75rem; color: var(--text-secondary);`.

---

## 13. Message Input Composer (`MessageInput.jsx`)

Fixed at bottom of Chat Window (`border-top: 1px solid var(--border-subtle)`).

### 13.1 Layout & Controls
```
┌────────────────────────────────────────────────────────────────────────┐
│  Type a message...                                      [ Send Button ]│
└────────────────────────────────────────────────────────────────────────┘
```
* **Container**: `padding: 12px 16px; background: var(--bg-chat);`.
* **Input Box**:
  * HTML `<textarea>` with automatic row expansion (min height `44px`, max height `120px`).
  * Background: `var(--input-bg)` (`#0f172a`).
  * Border: `1px solid var(--input-border)` (`#334155`).
  * Border Radius: `var(--radius-lg)` (`14px`).
  * Padding: `10px 48px 10px 14px` (padding-right reserves space for send button).
  * Focus State: `outline: none; border-color: var(--input-border-focus); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);`.
* **Send Button**:
  * Embedded inside input box or anchored right.
  * Size: `34px x 34px`, circular or soft-rectangle.
  * Background: `var(--accent-primary)`.
  * Icon: Paper airplane / send arrow icon (`fill: #ffffff`).
  * Hover: `var(--accent-primary-hover)`.
  * Disabled state (when input is empty or whitespace only): `opacity: 0.4; cursor: not-allowed; pointer-events: none;`.
  * Tactile Active: `transform: scale(0.95);`.
* **Keyboard Shortcut Behavior**:
  * `Enter`: Submits message immediately.
  * `Shift + Enter`: Inserts a new line without submitting.

---

## 14. Empty States

### 14.1 No Conversation Selected (Desktop Canvas)
* Centered graphic: Minimalist message bubble icon inside a subtle geometric circle (`background: #1e293b; color: #3b82f6; width: 64px; height: 64px;`).
* Title: `"Your Messages"` (`1.25rem`, bold, color `var(--text-primary)`).
* Subtitle: `"Select a conversation from the sidebar or start a chat with a user."` (`0.875rem`, color `var(--text-secondary)`).

### 14.2 Empty Chat History (New Conversation)
* Centered pill banner: `"No messages yet. Say hello to start the conversation!"`.

---

## 15. Loading States (Skeleton Loaders)

Avoid raw circular spinners for page/list loads. Use skeleton loaders with subtle shimmer animation (`animation: skeleton-shimmer 1.5s infinite linear;`).

### 15.1 Sidebar Skeletons
* 4 conversation items with placeholder avatar circle (`44px`) and two rectangular text bars (Title `60% width`, Preview `85% width`).

### 15.2 Message Stream Skeletons
* 3 alternating skeleton message bubbles (left, right, left) matching actual bubble geometry and paddings.

---

## 16. Connection & Reconnection State Banner

Real-time connection state must be explicitly communicated without breaking layout.

### Banner States (`ConnectionBanner.jsx`)
* Positioned directly under the chat header (sticky top).
* **Connecting / Reconnecting**:
  * Background: `rgba(245, 158, 11, 0.15)`.
  * Border: `1px solid rgba(245, 158, 11, 0.3)`.
  * Text: `Amber 400` - *"Reconnecting to real-time chat service..."*.
  * Icon: Animated spinning sync icon.
* **Offline / Disconnected**:
  * Background: `rgba(239, 68, 68, 0.15)`.
  * Border: `1px solid rgba(239, 68, 68, 0.3)`.
  * Text: `Red 400` - *"Connection lost. Check network or server status."* + `[Retry Now]` button.

---

## 17. Unread Message Indicators

* **Sidebar Pill**:
  * Pill element right-aligned in conversation card.
  * Background: `var(--badge-unread-bg)` (`#2563eb`).
  * Text: White, bold, `11px`.
  * Padding: `2px 7px`, rounded `9999px`.
* **New Messages Divider**:
  * When opening an active chat with unread messages, render a horizontal dividing line: `--- New Messages ---` in `var(--accent-primary)`.

---

## 18. Accessibility (a11y) & Keyboard Navigation

* **WCAG AA Compliance**: All text contrast ratios strictly >= 4.5:1 against their respective bubble and background surfaces.
* **Keyboard Focus**: Standardized visible focus rings: `focus-visible: 2px solid var(--accent-primary); outline-offset: 2px;`.
* **ARIA Live Regions**:
  * Message stream container tagged with `aria-live="polite"` and `role="log"` so screen readers announce incoming messages.
  * Connection state banner announced with `role="alert"`.
* **Accessible Labels**:
  * Send button: `aria-label="Send message"`.
  * Mobile back button: `aria-label="Back to conversations"`.
  * User switch toggle: `aria-label="Switch active test user"`.
* **Reduced Motion**: All animations wrapped in `@media (prefers-reduced-motion: reduce) { transition: none; animation: none; }`.

---

## 19. Component Hierarchy & Directory Architecture

```
client/src/
├── styles/
│   ├── tokens.css               # Design variables defined in Section 2
│   ├── base.css                 # Reset, typography, scrollbar styling
│   └── chat.css                 # Application layout and component classes
├── services/
│   ├── api.js                   # REST API client (Fetch / Axios)
│   └── socket.js                # Socket.IO connection & event handlers
├── components/
│   ├── Sidebar/
│   │   ├── Sidebar.jsx          # Sidebar container
│   │   ├── UserProfileHeader.jsx# Active user info + user switch button
│   │   └── ConversationItem.jsx # Individual conversation preview card
│   ├── ChatWindow/
│   │   ├── ChatWindow.jsx       # Chat window container
│   │   ├── ChatHeader.jsx       # Active partner name, avatar & status
│   │   ├── ConnectionBanner.jsx # Reconnection notification bar
│   │   ├── MessageList.jsx      # Scrollable stream of bubbles
│   │   ├── MessageBubble.jsx    # Individual incoming/outgoing bubble
│   │   ├── MessageInput.jsx     # Textarea composer & send button
│   │   └── EmptyChat.jsx        # Zero-state placeholder
│   └── Skeletons/
│       ├── SidebarSkeleton.jsx  # Shimmer loading for sidebar
│       └── MessageSkeleton.jsx  # Shimmer loading for message feed
└── App.jsx                      # Root container, user state & socket binding
```

---

## 20. Implementation Notes for Coding Agent

1. **Strict CSS Tokens**: Use `var(--...)` tokens from `tokens.css` everywhere. Do not hardcode ad-hoc hex values inside component files.
2. **Scroll Management**: In `MessageList.jsx`, automatically scroll to bottom on initial message fetch and when receiving new real-time messages, unless the user has scrolled up to view historical messages.
3. **Database Guard**: Outgoing messages must have their temporary state acknowledged upon PostgreSQL persistence before marking as permanently confirmed in UI.
