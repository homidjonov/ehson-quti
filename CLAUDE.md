# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on port 8081
npm run build      # Production build
npm run build:dev  # Development build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

No test runner is configured.

## Architecture

**React 18 + TypeScript SPA** built with Vite (SWC). All source code lives in `src/`.

### Key Stack
- **Routing**: React Router v6 (`BrowserRouter` + `Routes/Route`)
- **Server state**: TanStack React Query v5 (`QueryClientProvider` wraps the app in `App.tsx`)
- **Client state**: Zustand
- **Forms**: React Hook Form + Zod validation
- **UI primitives**: Radix UI components
- **Styling**: Tailwind CSS v3 with CSS variables for theming (HSL format), dark mode via class strategy
- **Animations**: Framer Motion (advanced), Tailwind custom animations (accordion, fade-in, fade-up)
- **Notifications**: Sonner (`<Toaster>` in `App.tsx`)

### Path Alias
`@` resolves to `./src` — use `@/components/...` style imports throughout.

### TypeScript
Config is intentionally loose (`noImplicitAny: false`, `strictNullChecks: false`). Do not tighten these settings without explicit instruction.

### Styling Conventions
- Tailwind utility classes are primary
- Use `clsx` + `tailwind-merge` for conditional/merged class names
- Use `class-variance-authority` (CVA) for component variants
- Theme colors are CSS variables in HSL format defined in `src/index.css`

## Backend API

Base URL: `https://api.mehrli.uz/v1/quti`

Authentication: `X-Api-Key` header (obtained via PIN verification).

### Endpoints

**PIN tekshirish va API key olish**
```
POST /verify
Content-Type: application/x-www-form-urlencoded
Body: pin=123456
```
Default PIN: `123456`. Response returns `X-Api-Key`.

**Barcha qutilar ro'yxati**
```
GET /list
```

**Rasm yuklash**
```
POST /upload
Content-Type: multipart/form-data
X-Api-Key: <key>
Body: file=<image>
```
Returns image object with `name`, `type`, `size`, `base_url`, `path`, `url`, `delete_url`.

**Quti yaratish**
```
POST /create
Content-Type: application/json
X-Api-Key: <key>
Body: { number, location, images[] }
```
- `number` — quti raqami (integer)
- `location` — `"lat;lng"` format (e.g. `"41.3247603;69.3235123"`)
- `images` — `/upload` dan qaytgan rasm ob'ektlari massivi

**Qutini bo'shatish**
```
GET /set-empty?id=<id>
X-Api-Key: <key>
```

**Qutini o'chirish**
```
GET /remove?id=<id>
X-Api-Key: <key>
```
