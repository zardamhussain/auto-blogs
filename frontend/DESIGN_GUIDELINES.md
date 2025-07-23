# BGEX Frontend Design System

This document outlines the design guidelines and reusable components for the BGEX application frontend. Adhering to these guidelines will ensure a consistent, high-quality user experience across the platform.

## 1. Color Palette

Our color scheme is designed for a modern, focused, dark-mode experience.

| Role                  | Color           | Hex       | Usage                               |
| --------------------- | --------------- | --------- | ----------------------------------- |
| **Primary Background**| Charcoal Black  | `#121212` | Main app background                 |
| **Panel Background**  | Dark Gray       | `#1E1E1E` | Sidebar, cards, modals              |
| **Primary Text**      | Light Gray      | `#EAEAEA` | Main text color                     |
| **Secondary Text**    | Medium Gray     | `#a0a0a0` | Subtitles, descriptions, placeholders |
| **Subtle Borders**    | Dark Border     | `#333333` | Borders, dividers, separators       |
| **Accent Text**       | White           | `#FFFFFF` | Highlighted text, active states     |
| **Primary Button**    | White           | `#FFFFFF` | Background for primary buttons      |
| **Button Text**       | Charcoal Black  | `#121212` | Text for primary buttons            |
| **Primary Accent**    | Indigo          | `#4f46e5` | Primary buttons, interactive highlights |
| **Published Status**  | Green           | `#22c55e` | "Published" status indicator        |
| **Draft Status**      | Yellow          | `#eab308` | "Draft" status indicator            |
| **Delete Action**     | Red             | `#ef4444` | "Delete" button text                |
| **Output Panel**       | Dashboard Grey   | `#303030` | Background for workflow output blocks |

## 2. Typography

We use two primary fonts to create a clear visual hierarchy.

| Font Family         | Usage                                 | Weight(s)             | Style  |
| ------------------- | ------------------------------------- | --------------------- | ------ |
| **Playfair Display**| Main brand logo (`bgex`)              | 700 (Bold)            | Italic |
| **Inter**           | All other UI text (headings, buttons) | 400, 500, 600, 700    | Normal |

### Font Sizing
- **Logo Text:** `2rem`
- **Main Heading:** `2rem`
- **Card Title:** `1.25rem`
- **Body/Button Text:** `1rem`
- **Metadata/Breadcrumbs:** `0.9rem`

## 3. Layout & Spacing

- The application uses a main `Layout` component that includes the sidebar and a main content area.
- The main content area has a `.content-wrapper` that provides a `max-width` of `1400px` and horizontal `auto` margins to center the content.
- Standard padding for containers (cards, headers) is `1.5rem` (`24px`).
- Gaps between grid/flex items are typically `1rem` or `1.5rem`.

## 4. Reusable Components

The UI is built from a set of reusable components located in `src/components/`.

### `Layout.jsx`
The main application shell. It manages the sidebar's state and wraps the page content.
```jsx
<Layout>
  <YourPageComponent />
</Layout>
```

### `Sidebar.jsx`
The primary navigation component. It is included automatically by `Layout`.

### `PageHeader.jsx`
Creates a standardized header for each page.
- **Props:**
    - `breadcrumb`: An array of strings. e.g., `['Workspace', 'Blog']`
    - `title`: A string for the main page title.
    - `children`: Used to pass action buttons (e.g., `<button>` or `<select>`).

- **Usage:**
```jsx
<PageHeader
    breadcrumb={['Workspace', 'Blog']}
    title="Blog Posts"
>
    <select className="project-dropdown">...</select>
    <button className="new-blog-btn">+ New Blog</button>
</PageHeader>
```

### `BlogCard.jsx`
A card component for displaying a summary of a blog post.
- **Props:**
    - `title`, `status`, `description`, `date`, `tags` (array of strings)

### `ApiKeyGeneratedModal.jsx`
A modal popup used to display a newly generated API key. This is a critical component because the full key is only ever shown once.
- **Props:**
    - `apiKey`: The full, plaintext API key string to display.
    - `onClose`: A function to call when the modal is dismissed.

- **Usage:**
```jsx
<ApiKeyGeneratedModal apiKey={newlyGeneratedKey} onClose={() => setNewlyGeneratedKey(null)} />
```

## 5. Iconography

We use the `react-icons/tb` (Tabler Icons) library for all icons to ensure visual consistency. Icons should be clear, simple, and used to support text labels, not replace them. 

## 6. Standard Dialogs & Modals

Standardized dialogs should be used for user confirmation, alerts, and important messages to maintain a consistent UX.

### Confirmation Modal
Used for destructive or irreversible actions (e.g., deletion). It must clearly state the action and its consequences.

- **Component:** `ConfirmationModal.jsx`
- **Props:**
    - `isOpen`: (boolean) Controls the visibility of the modal.
    - `onClose`: (function) Called when the user cancels or closes the modal.
    - `onConfirm`: (function) Called when the user confirms the action.
    - `title`: (string) The main heading of the modal.
    - `message`: (string) The descriptive text explaining the action.
    - `confirmText`: (string) e.g., "Delete", "Confirm". Defaults to "Confirm".
    - `variant`: (string) 'danger' | 'info'. The 'danger' variant styles the confirm button in red. Defaults to 'info'.

- **Usage:**
```jsx
const [isModalOpen, setModalOpen] = useState(false);

// ...

<ConfirmationModal
    isOpen={isModalOpen}
    onClose={() => setModalOpen(false)}
    onConfirm={handleDelete}
    title="Delete API Key?"
    message="This action is irreversible. Are you sure you want to delete this key?"
    confirmText="Delete"
    variant="danger"
/>
```

### Alert & Message Boxes
For non-interactive notifications (e.g., "Changes saved successfully"), a toast or a simple dismissible alert box is preferred over a modal that interrupts user flow. These should be standardized in a future `Alert.jsx` component.
- **Info (Blue/Indigo)**: For general information.
- **Success (Green)**: For successful actions.
- **Warning (Yellow)**: For non-critical warnings. 