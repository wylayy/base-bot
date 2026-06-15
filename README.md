# Lazy Bot

> A modern, enterprise-scale WhatsApp bot framework powered by [Baileys](https://github.com/WhiskeySockets/Baileys), featuring a modular Plugin Architecture and a robust Command Line Interface (CLI).

[Baca dalam Bahasa Indonesia (Read in Indonesian) 🇮🇩](./README.id.md)

## ✨ Features

- **Modular Plugin Architecture:** Build features in isolated namespaces (e.g., `@admin/leveling`). Turn on, turn off, or uninstall features without modifying the core system.
- **Robust CLI:** Say goodbye to boilerplate. Use Laravel-like commands to generate structure:
  - `make:plugin` - Scaffolds a new plugin.
  - `make:command` & `make:event` - Creates bot interactions.
  - `plugin:install` - Downloads plugins from the official registry.
  - `plugin:migrate` - Runs dedicated database migrations for your plugin.
- **Hot-Reloading:** Built-in Plugin Watcher reloads your code automatically on save. Develop without restarting the bot!
- **Isolated Database Migrations:** Integrated with Knex.js. Each plugin has its own migration files.
- **Multi-language Support (i18n):** Native support for localization, both for the bot's interactions and the CLI.
- **Middlewares & Security:** Built-in layered middleware support for spam protection, admin checks, and more.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A running Database (MySQL, PostgreSQL, SQLite, etc. supported by Knex.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/lazy-bot.git
   cd lazy-bot
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup your environment:
   ```bash
   cp .env.example .env
   # Edit .env with your database and session credentials
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## 🛠️ CLI Usage

Lazy Bot features an interactive CLI. Start it by running:
```bash
npm run cli
```
Or use the commands directly:
```bash
npm run cli -- make:plugin
npm run cli -- make:migration
npm run cli -- plugin:install @community/sticker-maker
npm run cli -- plugin:migrate
```

## 📦 Creating a Plugin

Plugins are stored in the `workspace/` directory during development.

1. Generate a plugin:
   ```bash
   npm run cli -- make:plugin
   ```
2. Generate a command inside your plugin:
   ```bash
   npm run cli -- make:command
   ```
3. Watch your changes apply instantly in development mode without restarting the bot!

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
