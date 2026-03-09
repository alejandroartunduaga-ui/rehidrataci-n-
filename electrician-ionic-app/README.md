# OPS Application

A mobile application built with Ionic for Bia Energy.

## 🚀 Getting Started

### Environment Setup

1. Clone the repository
2. Configure environment files:

a. Create `.env.local` file with required environment variables:

```sh
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
# Add other Firebase configs as needed

# Other Environment Variables
VITE_API_URL=your_api_url
VITE_OTHER_CONFIG=your_config
```

b. Create `.npmrc` file for private package registry access:

```sh
@fortawesome:registry=https://npm.fontawesome.com/
//npm.fontawesome.com/:_authToken=${FONTAWESOME_AUTH_TOKEN}

@entropy:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## 🛠️ Development

### Installation

```sh
npm install
```

### Running the Project

```sh
npm run dev
```

### Build

```sh
npm run build
```

## 🔧 Technologies

- React + TypeScript
- Ionic Framework
- Vite
- Firebase
- TanStack Query
- ESLint + Prettier
