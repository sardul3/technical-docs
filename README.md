# Dev Docs

Welcome to the **Dev Docs** repository! This project is a comprehensive developer documentation site built using [VitePress](https://vitepress.vuejs.org/).

## Project Overview
This repository hosts the documentation for various developer-related topics, such as REST APIs, Temporal, Kubernetes, TDD with Java, and more.

### Features
- **Dynamic Documentation**: Easy to navigate and fully customizable.
- **Topics Covered**:
  - REST APIs: Best practices, Idempotency, eTags, Rate Limiting, and more.
  - **Temporal**: Documentation for integrating with Spring Boot.
  - **Kubernetes**: Step-by-step guides to set up and deploy applications.
  - **TDD with Java**: Practical guide and best practices.
  - **Others**: Including tools like Neovim, SSH, and Server Access.

## Project Structure
- `.github/workflows/` contains GitHub Actions workflows for CI/CD.
- `docs/` contains all the documentation content.
- `.vitepress/` contains configuration files for the VitePress build.
- `.gitignore` helps exclude unnecessary files from version control.
- `package.json` manages dependencies and scripts.

## Running Locally
To run this project locally, follow these steps:

1. **Clone the Repository**:
   ```sh
   git clone https://github.com/Beyond-Boilerplate/technical-docs.git
   cd technical-docs
   ```

2. **Install Dependencies**:
   ```sh
   npm install
   ```

3. **Run the Development Server**:
   ```sh
   npm run docs:dev
   ```

4. **Build the Static Files**:
   ```sh
   npm run docs:build
   ```

## Deploying to GitHub Pages
The deployment process is handled automatically using GitHub Actions. Any changes pushed to the `main` branch will trigger the deployment workflow, building and publishing the updated site to GitHub Pages.

## Contributing
Contributions are welcome! If you notice anything that could be improved, feel free to open an issue or submit a pull request.
