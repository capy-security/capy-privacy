# Capy Privacy DNS Frontend

A modern, responsive web application for managing DNS filtering, domains, categories, clients, groups, and users. Built with SvelteKit and TypeScript, featuring a beautiful gradient UI with full CRUD operations.

## ✨ Features

### 🔐 Authentication & Authorization
- **Secure Login**: JWT-based authentication with email and password
- **Role-Based Access Control**: Three user roles (Superadmin, Admin, User)
- **Protected Routes**: Automatic redirect to login for unauthenticated users
- **Session Management**: Persistent authentication state

### 🌐 Domain Management
- **Full CRUD Operations**: Create, read, update, and delete DNS domains
- **Advanced Filtering**: 
  - Search by domain name (server-side filtering)
  - Filter by category
  - Filter by active/inactive status
- **Domain Configuration**:
  - Set domain name with validation
  - Assign to categories
  - Configure redirect IP address
  - Toggle active/inactive status
- **Pagination**: Efficient browsing through large domain lists

### 🏷️ Category Management
- **Category CRUD**: Manage DNS filtering categories
- **Category Details**: Name and description fields
- **Domain Association**: Link domains to categories

### 💻 Client Management
- **Client CRUD**: Manage client hosts/IPs
- **Client Information**: IP address, name, and description
- **Validation**: IP address format validation

### 👥 Group Management
- **Group CRUD**: Create and manage groups
- **Multi-Association**: 
  - Link groups to multiple categories
  - Link groups to multiple clients
- **Group Purpose**: Match client hosts with DNS filtered categories

### 👤 User Management
- **User CRUD**: Create, update, and delete users
- **Role Assignment**: Assign Superadmin, Admin, or User roles
- **Password Management**: Set passwords on creation, optional update on edit
- **User Profiles**: Display name and email management

### 🎨 User Interface
- **Modern Design**: Beautiful gradient purple theme with glassmorphism effects
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Collapsible Sidebar**: Expandable navigation menu
- **Modal Dialogs**: Smooth modal interactions for create/edit/delete operations
- **Loading States**: Visual feedback during API operations
- **Error Handling**: User-friendly error messages

### 📊 Additional Features
- **Pagination**: Consistent pagination across all list views
- **Search & Filter**: Server-side and client-side filtering capabilities
- **Real-time Updates**: Automatic refresh after create/update/delete operations
- **Form Validation**: Client-side validation with helpful error messages
- **Accessibility**: ARIA labels and keyboard navigation support

## 🛠️ Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) - The fastest way to build Svelte apps
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Icons**: [svelte-heros-v2](https://github.com/craftzdog/svelte-heros-v2) - Heroicons for Svelte
- **API Client**: Auto-generated with [Orval](https://orval.dev/) from OpenAPI spec
- **Authentication**: JWT token-based authentication
- **Package Manager**: [Yarn](https://yarnpkg.com/) v4

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher
- **Yarn**: v4.12.0 or higher (specified in `package.json`)
- **Backend API**: The Capy Privacy DNS API should be running and accessible

## 🚀 Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies using Yarn**:
   ```bash
   yarn install
   ```

   This will install all project dependencies defined in `package.json`.

## 💻 Development

### Start Development Server

To start the development server with hot module replacement:

```bash
yarn dev
```

The application will be available at `http://localhost:5173` (or the next available port).

### Development Features

- **Hot Module Replacement (HMR)**: Changes are reflected instantly without full page reload
- **TypeScript Checking**: Real-time type checking during development
- **Source Maps**: Easy debugging with source maps enabled

### Available Scripts

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Preview production build locally
yarn preview

# Type checking
yarn check

# Type checking in watch mode
yarn check:watch

# Format code with Prettier
yarn format

# Lint code (Prettier + ESLint)
yarn lint

# Generate API client from OpenAPI spec
yarn api:generate

# Fetch OpenAPI spec from running API
yarn api:fetch
```

## 🔧 Configuration

### API Configuration

The API base URL is configured in `src/lib/config.ts`. Make sure it points to your running backend API.

### Environment Variables

If needed, you can create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000
```

## 📁 Project Structure

```
src/
├── lib/
│   ├── api/              # API client and utilities
│   │   ├── generated/    # Auto-generated API client
│   │   ├── fetchTableData.ts
│   │   └── mutator.ts
│   ├── components/       # Reusable Svelte components
│   │   ├── Navbar.svelte
│   │   └── Sidebar.svelte
│   ├── models/           # TypeScript model interfaces
│   │   ├── category.ts
│   │   ├── client.ts
│   │   ├── domain.ts
│   │   ├── group.ts
│   │   └── user.ts
│   ├── stores/           # Svelte stores
│   │   └── auth.ts       # Authentication store
│   └── config.ts         # App configuration
├── routes/               # SvelteKit routes (pages)
│   ├── +layout.svelte    # Root layout
│   ├── +page.svelte      # Home page
│   ├── login/            # Login page
│   ├── domains/          # Domain management
│   ├── categories/       # Category management
│   ├── clients/          # Client management
│   ├── groups/           # Group management
│   ├── users/            # User management
│   └── profile/          # User profile
└── app.css               # Global styles
```

## 🎯 Key Pages

- **`/`** - Home/Dashboard
- **`/login`** - Authentication page
- **`/domains`** - Domain management with filtering
- **`/categories`** - Category management
- **`/clients`** - Client/IP management
- **`/groups`** - Group management with category/client associations
- **`/users`** - User and admin management
- **`/profile`** - User profile page

## 🔄 API Integration

The frontend uses auto-generated API clients from the OpenAPI specification:

- **DNS Operations**: `src/lib/api/generated/dns/dns.ts`
- **Authentication**: `src/lib/api/generated/authentication/authentication.ts`

To regenerate API clients after backend changes:

```bash
yarn api:generate
```

## 🎨 Styling

The application uses Tailwind CSS with a custom gradient theme:

- **Primary Colors**: Violet/Purple gradient background
- **Components**: Glassmorphism effects with backdrop blur
- **Responsive**: Mobile-first responsive design
- **Dark Theme**: Optimized for dark backgrounds

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port.

### API Connection Issues

Ensure the backend API is running and accessible. Check the API URL in `src/lib/config.ts`.

### Type Errors

Run `yarn check` to identify TypeScript errors. Fix them or regenerate API types with `yarn api:generate`.

### Build Errors

Clear the build cache and reinstall dependencies:

```bash
rm -rf .svelte-kit node_modules
yarn install
yarn build
```

## 📝 Code Style

The project uses:

- **Prettier**: Code formatting
- **ESLint**: Code linting
- **TypeScript**: Type safety

Format your code before committing:

```bash
yarn format
```

## 🤝 Contributing

1. Make your changes
2. Format code: `yarn format`
3. Check types: `yarn check`
4. Test your changes locally: `yarn dev`
5. Submit your changes

## 📄 License

[Add your license information here]

## 🙏 Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)

