# Contributing to Music Scan Pro

Thanks for your interest in contributing to Music Scan Pro! This guide will help you understand our development workflow and how to create releases.

## 🌳 Branch Structure

We use a **two-branch workflow**:

- **`main`** - Production-ready code, protected branch
- **`dev`** - Development branch, where all features are integrated

## 🚀 Development Workflow

### 1. Setting Up for Development

```bash
# Clone the repository
git clone https://github.com/yarnobachmann/music_scanner.git
cd music_scanner

# Install dependencies
npm install

# Start development server
npm run electron
```

### 2. Making Changes

1. **Always start from dev branch:**
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Create feature branch (optional for small changes):**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes and test:**
   ```bash
   npm run dev          # Test web version
   npm run electron     # Test Electron app
   npm run build        # Test production build
   npm run lint         # Check code style
   npm run type-check   # Check TypeScript
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: describe your changes"
   ```

5. **Push to dev branch:**
   ```bash
   git checkout dev
   git merge feature/your-feature-name  # if using feature branch
   git push origin dev
   ```

## 📦 Release Process

### Automated Release (Recommended)

Use our release script for automatic version management:

```bash
# Make sure you're on dev branch with latest changes
git checkout dev
git pull origin dev

# Create release (this will automatically handle everything)
npm run release 1.0.1
```

The script will:
1. ✅ Update package.json version
2. ✅ Commit version change
3. ✅ Merge dev → main
4. ✅ Create and push version tag
5. ✅ Trigger GitHub Actions build
6. ✅ Merge back to dev

### Manual Release Process

If you prefer manual control:

```bash
# 1. Update version in package.json
# 2. Commit version change
git add package.json
git commit -m "chore: bump version to 1.0.1"

# 3. Merge to main
git checkout main
git pull origin main
git merge dev
git push origin main

# 4. Create and push tag
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1

# 5. Merge back to dev
git checkout dev
git merge main
git push origin dev
```

## 🤖 CI/CD Pipeline

Our GitHub Actions workflow automatically:

### On Push to Dev/Main:
- ✅ Runs tests and linting
- ✅ Builds Next.js application
- ✅ Tests Python dependencies

### On Main Branch or Version Tags:
- ✅ Builds for Windows, macOS, and Linux
- ✅ Creates downloadable artifacts
- ✅ Stores build artifacts for 7 days

### On Version Tags (v*):
- ✅ Creates GitHub release
- ✅ Uploads all platform builds
- ✅ Generates release notes
- ✅ Makes downloads publicly available

## 📝 Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/config changes

Examples:
```bash
git commit -m "feat: add custom icon support to loading screen"
git commit -m "fix: resolve icon path issue in packaged version"
git commit -m "docs: update installation instructions"
```

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Next.js dev server
npm run electron         # Electron development
npm run electron-dev     # Electron only (assumes Next.js running)

# Building
npm run build            # Build Next.js for production
npm run dist:win         # Build Windows installer
npm run dist:mac         # Build macOS package
npm run dist:linux       # Build Linux packages

# Quality
npm run lint             # ESLint
npm run type-check       # TypeScript check
npm test                 # Run tests (if any)

# Release
npm run release 1.0.1    # Automated release
```

## 🏗️ Project Structure

```
Music scan/
├── src/
│   ├── components/      # React components
│   ├── styles/          # CSS styles
│   └── types/           # TypeScript types
├── pages/               # Next.js pages
├── public/              # Static assets
├── build/               # Build scripts and assets
├── scripts/             # Utility scripts
├── *.py                 # Python backend scripts
├── main.js              # Electron main process
├── preload.js           # Electron preload script
└── package.json         # Dependencies and scripts
```

## 🔧 Environment Setup

### Required Software:
- **Node.js 18+**
- **Python 3.9+**
- **Git**

### Python Dependencies:
```bash
pip install mutagen requests
```

### Node.js Dependencies:
```bash
npm install
```

## 🐛 Troubleshooting

### Development Issues:
- **Electron won't start**: Check if port 3000 is available
- **Python errors**: Ensure Python dependencies are installed
- **Build fails**: Try deleting `node_modules` and `npm install`

### Release Issues:
- **Tag already exists**: Delete with `git tag -d v1.0.1 && git push origin :refs/tags/v1.0.1`
- **Merge conflicts**: Resolve manually and continue process
- **GitHub Actions fails**: Check build logs in Actions tab

## 📞 Getting Help

- **Issues**: [GitHub Issues](https://github.com/yarnobachmann/music_scanner/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yarnobachmann/music_scanner/discussions)

## 🎯 Release Checklist

Before creating a release:

- [ ] All tests pass locally
- [ ] Code is properly linted
- [ ] Version follows semantic versioning
- [ ] Changes are documented
- [ ] No breaking changes (or properly documented)
- [ ] All features tested in development

After release:
- [ ] Verify GitHub Actions completed successfully
- [ ] Test download links work
- [ ] Update any external documentation if needed 