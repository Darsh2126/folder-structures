# 📂 Enterprise-Style Folder Structure & Conventions

This project is mainly focused on **general folder structures and patterns followed at enterprise level**.
⚠️ Note: Structures **vary based on requirements** — this is not a one-size-fits-all solution, but a **good-to-go directory** that works for most projects.

We aim to support **major and popular libraries/frameworks** including:

* **Frontend** → React, Next.js, Tailwind CSS
* **Forms** → Zod, Formik, React Hook Form
* **State Management** → Redux Toolkit (RTK), Zustand
* **Backend** → Node.js, FastAPI, NestJS
* **Others** → Testing, CI/CD, Authentication (NextAuth, Supabase, Clerk, Auth0), etc.

This structure helps teams **quickly bootstrap enterprise-grade apps** with consistent patterns.

---

## 📁 Folder Structure

```
src/
  ├── app/                # Next.js App Router (routes) (optional for NEXT APPS)
  │   └── route-name/
  │       ├── page.jsx    # Page file (only allowed here)
  │       └── layout.jsx  # Layout file (only allowed here)
  │
  ├── hooks/              # Custom React hooks
  │
  ├── store/              # State management (Zustand, Redux, etc.)
  │
  ├── modules/            # Full pages (Login, Dashboard, Form, etc.)
  │   └── login/
  │       ├── index.jsx
  │       ├── LoginContainer.jsx
  │       └── Login.jsx
  │       └── components/ # Module-specific components
  │
  ├── components/         # Shared/common components
  │   ├── UI/             # Custom UI components
  │   │   └── multi-select/
  │   │       └── index.jsx
  │   │
  │   └── forms/          # Form-related components
  │
  ├── utils/              # Utility/helper functions
  │
  └── types/              # TypeScript types/interfaces
```

---

## 📝 Rules & Conventions

### 1. **Pages (`src/app`)**

* Only **`page.jsx`** and **`layout.jsx`** files are allowed inside route folders.
* Example:

  ```
  src/app/login/page.jsx
  src/app/login/layout.jsx
  ```

---

### 2. **Modules (`src/modules`)**

* Each module = a **full page** (e.g., Login, Form, Dashboard).
* Naming convention: **kebab-case** (e.g., `login-form`, `user-profile`).

#### Required Files Inside a Module

1. `index.jsx` → Main export (import this everywhere).
2. `ModuleContainer.jsx` → Business logic / state / data fetching.
3. `Module.jsx` → Pure UI component (presentational).

#### Import Flow

* `Module.jsx` → imported inside `ModuleContainer.jsx`
* `ModuleContainer.jsx` → imported inside `index.jsx`
* Always import **only `index.jsx`** when using the module in other parts of the app.

#### Module-Specific Components

* Place in: `src/modules/module-name/components/`
* Example:

  ```
  src/modules/login/components/LoginButton.jsx
  ```

---

### 3. **Components (`src/components`)**

* Shared/common components used across modules.
* Each component folder should contain **only an `index.jsx` file** for clean imports.
* Example:

  ```
  src/components/UI/multi-select/index.jsx
  ```

---

### 4. **Hooks (`src/hooks`)**

* Store all custom hooks.
* Naming: `useSomething.js`

---

### 5. **Store (`src/store`)**

* Centralized state management (Zustand/Redux).

---

### 6. **Utils (`src/utils`)**

* General utility/helper functions.

---

### 7. **Types (`src/types`)**

* Global TypeScript types & interfaces.

---

## ✅ Example: Login Page Flow

1. Create a module folder:

   ```
   src/modules/login/
   ```
2. Add three base files:

   * `Login.jsx` → UI
   * `LoginContainer.jsx` → logic + hooks + API calls
   * `index.jsx` → entry point (exports container)
3. Usage:

   ```jsx
   import Login from "@/modules/login";
   ```

---
