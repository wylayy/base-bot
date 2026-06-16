<div align="center">
  <img src="https://avatars.githubusercontent.com/u/169166102?s=200&v=5" height="80" />


  <p><strong>A Next-Generation WhatsApp Bot Framework Built for Developers</strong></p>
</div>

---

**Lazy Bot** is an enterprise-scale, highly modular WhatsApp bot framework based on [Baileys](https://github.com/WhiskeySockets/Baileys). It brings modern backend development practices—like isolated plugins, automated database migrations, hot-reloading, and a robust CLI—straight to your WhatsApp bot development workflow.

*(For detailed development tutorials, please refer to our upcoming official documentation).*

## ✨ Features

- 🧩 **Modular Plugin Architecture:** Stop writing spaghetti code. Build features in isolated namespaces (e.g., `@admin/leveling`).
- ⚡ **Hot-Reloading System:** Save your code and watch it update in real-time. No more restarting the bot during development.
- 🛠️ **Developer-First CLI:** Generate boilerplate instantly using commands like `make:plugin`, `make:command`, or `make:migration`.
- 🗄️ **Isolated Database Migrations:** Powered by **Knex.js**. Each plugin manages its own database tables automatically.
- 🌍 **Native i18n Support:** Easily support multiple languages for your bot responses and CLI outputs.
- 🛡️ **Middleware Layer:** Built-in middleware mechanism for spam protection, admin verification, and custom request filtering.
- 📦 **Plugin Registry:** Download and install community plugins seamlessly via `plugin:install`.

---

## ⚙️ Requirements

Before installing Lazy Bot, make sure your system meets the following requirements:
- **Node.js** (v18.x or higher)
- **Database Server** (MySQL, PostgreSQL, or SQLite - depending on your Knex configuration)
- **Git**

---

## 🚀 Installation

Follow these simple steps to get your bot up and running:

**1. Clone the repository**
```bash
git clone https://github.com/onepixell/base-bot.git
cd base-bot
```

**2. Install dependencies**
```bash
npm install
```

---

## 💻 How to Run & The Integrated CLI

Unlike typical bots, **Lazy Bot features an integrated console (CLI)** 

To start the bot and access the console:
```bash
npm start
```

Once the bot is running and connected, your terminal becomes an interactive command prompt. You can type commands directly into the running terminal:

- `help` : Show all available commands.
- `make:plugin` : Scaffolds a new plugin.
- `make:command` : Creates a new command inside your plugin.
- `plugin:install <name>` : Installs a plugin from the registry.

## 📦 Creating a Plugin

During development, plugins are stored in the `workspace/` directory.

1. Start the bot (`npm start`).
2. In the active bot terminal, type:
   ```text
   make:plugin
   ```
3. Follow the interactive prompts to generate your plugin.
4. Keep the bot running! Modify your code and save. Your changes will apply instantly via the **hot-reloading** system.

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
