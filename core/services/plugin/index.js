import fs from 'fs/promises';
import { dirPlugins, dirWorkspace } from '@lazy/core/utils/path';
import path from 'path';
import { pathToFileURL } from 'url';
import semver from 'semver';
import { CommandSchema, MiddlewareSchema, EventSchema, } from '@lazy/core/services/plugin/schema';
import { setNestedValue, getNestedValue } from '@lazy/core/utils/helpers';
import { t } from '@lazy/core/services/i18n/index';
import logger from '@lazy/core/utils/logger';
import { CacheService } from '@lazy/core/services/cache/index';
import { db } from '@lazy/core/services/database/index';
import PluginMigrationSource from '@lazy/core/services/plugin/migration-source';
class PluginManager {
    pluginDir = dirPlugins();
    workspaceDir = dirWorkspace();
    plugins = new Map();
    pluginPaths = new Map();
    commands = new Map();
    commandsIndex = new Map();
    middlewares = new Map();
    events = new Map();
    configs = new Map();
    languages = new Map();
    loadedPlugins = new Set();
    failedPlugins = new Set();
    _cachedMiddlewares = [];
    _cachedEvents = [];
    constructor() { }
    getLogPrefix(pluginKey, customPath) {
        const pPath = customPath || this.pluginPaths.get(pluginKey);
        if (pPath &&
            (pPath.startsWith(this.workspaceDir) || pPath.includes('workspace'))) {
            return `[WORKSPACE: ${pluginKey}]`;
        }
        return `[PLUGIN: ${pluginKey}]`;
    }
    getLogger(pluginKey) {
        const prefix = this.getLogPrefix(pluginKey);
        return {
            info: (...args) => logger.info(prefix, ...args),
            warn: (...args) => logger.warn(prefix, ...args),
            error: (...args) => logger.error(prefix, ...args),
            success: (...args) => logger.success(prefix, ...args),
            ready: (...args) => logger.ready(prefix, ...args),
            debug: (...args) => logger.debug(prefix, ...args),
            fatal: (...args) => logger.fatal(prefix, ...args),
        };
    }
    async load(isReload = false) {
        if (isReload) {
            this.plugins.clear();
            this.commands.clear();
            this.commandsIndex.clear();
            this.middlewares.clear();
            this.events.clear();
            this.configs.clear();
            this.languages.clear();
        }
        this.loadedPlugins.clear();
        this.failedPlugins.clear();
        try {
            const pluginDirItems = await fs.readdir(this.pluginDir).catch(() => []);
            const loadPromises = [];
            for (const item of pluginDirItems) {
                const itemPath = path.join(this.pluginDir, item);
                const stats = await fs.stat(itemPath).catch(() => null);
                if (!stats || !stats.isDirectory())
                    continue;
                if (item.startsWith('@')) {
                    const pluginFolders = await fs.readdir(itemPath).catch(() => []);
                    for (const folder of pluginFolders) {
                        loadPromises.push(this.loadPlugin(`${item}/${folder}`, isReload).catch(() => { }));
                    }
                }
                else {
                    loadPromises.push(this.loadPlugin(item, isReload).catch(() => { }));
                }
            }
            await Promise.all(loadPromises);
            if (global.AUTH_TOKEN && global.AUTH_USER?.username) {
                const currentUsername = global.AUTH_USER.username;
                const workspaceFolders = await fs
                    .readdir(this.workspaceDir)
                    .catch(() => []);
                await Promise.all(workspaceFolders.map(async (folder) => {
                    const folderPath = path.join(this.workspaceDir, folder);
                    const stats = await fs.stat(folderPath).catch(() => null);
                    if (!stats || !stats.isDirectory())
                        return;
                    let pluginKey = '';
                    try {
                        const manifestStr = await fs.readFile(path.join(folderPath, 'package.json'), 'utf-8');
                        const manifest = JSON.parse(manifestStr);
                        if (manifest.name) {
                            pluginKey = manifest.name;
                        }
                    }
                    catch (err) { }
                    if (!pluginKey) {
                        const ns = `@${currentUsername}`;
                        pluginKey = `${ns}/${folder}`;
                    }
                    await this.loadPlugin(pluginKey, isReload, folderPath).catch(() => { });
                }));
            }
            else {
                logger.warn('[PLUGIN]', t('plugin.workspace_login_required') ||
                    'Skipping workspace plugins because you are not logged in. Login to load workspace plugins.');
            }
            this.checkDependencies();
            this.updateMiddlewareCache();
            this.updateEventCache();
            logger.info(`[PLUGIN]`, t('plugin.loaded_count', {
                loaded: this.loadedPlugins.size,
                failed: this.failedPlugins.size,
            }));
        }
        catch (err) {
            return;
        }
    }
    async reloadPlugin(pluginKey) {
        const pluginPath = this.pluginPaths.get(pluginKey);
        let newPluginKey = pluginKey;
        if (pluginPath) {
            try {
                const manifestStr = await fs.readFile(path.join(pluginPath, 'package.json'), 'utf-8');
                const manifest = JSON.parse(manifestStr);
                if (manifest.name) {
                    newPluginKey = manifest.name;
                }
            }
            catch (err) { }
        }
        this.cleanupPluginData(pluginKey);
        this.failedPlugins.delete(pluginKey);
        if (newPluginKey !== pluginKey) {
            this.cleanupPluginData(newPluginKey);
            this.failedPlugins.delete(newPluginKey);
        }
        try {
            await this.loadPlugin(newPluginKey, true, pluginPath);
            this.checkDependencies();
        }
        finally {
            this.updateMiddlewareCache();
            this.updateEventCache();
        }
    }
    cleanupPluginData(pluginKey) {
        const prefix = `${pluginKey}:`;
        for (const key of Array.from(this.commands.keys())) {
            if (key.startsWith(prefix)) {
                this.commands.delete(key);
            }
        }
        for (const [alias, entries] of Array.from(this.commandsIndex.entries())) {
            const filtered = entries.filter((entry) => !entry.startsWith(prefix));
            if (filtered.length > 0) {
                this.commandsIndex.set(alias, filtered);
            }
            else {
                this.commandsIndex.delete(alias);
            }
        }
        const maps = [this.configs, this.events, this.languages, this.middlewares];
        for (const map of maps) {
            for (const key of Array.from(map.keys())) {
                if (key.startsWith(prefix)) {
                    map.delete(key);
                }
            }
        }
        this.plugins.delete(pluginKey);
        this.pluginPaths.delete(pluginKey);
        this.loadedPlugins.delete(pluginKey);
    }
    checkDependencies() {
        let hasFailedDependencies = true;
        while (hasFailedDependencies) {
            hasFailedDependencies = false;
            for (const [pluginKey, manifest] of Array.from(this.plugins.entries())) {
                if (!manifest.dependencies ||
                    typeof manifest.dependencies !== 'object' ||
                    Array.isArray(manifest.dependencies))
                    continue;
                for (const [dep, requiredVersion] of Object.entries(manifest.dependencies)) {
                    const depManifest = this.plugins.get(dep);
                    if (!depManifest) {
                        logger.warn(this.getLogPrefix(pluginKey), t('plugin.dependency_missing', { dep }));
                        this.cleanupPluginData(pluginKey);
                        this.failedPlugins.add(pluginKey);
                        hasFailedDependencies = true;
                        break;
                    }
                    else if (typeof requiredVersion === 'string' &&
                        !semver.satisfies(depManifest.version, requiredVersion)) {
                        logger.warn(this.getLogPrefix(pluginKey), t('plugin.dependency_version_mismatch', {
                            dep,
                            required: requiredVersion,
                            installed: depManifest.version,
                        }));
                        this.cleanupPluginData(pluginKey);
                        this.failedPlugins.add(pluginKey);
                        hasFailedDependencies = true;
                        break;
                    }
                }
            }
        }
    }
    async loadPlugin(providedKey, isReload = false, customPath) {
        const pluginPath = customPath || path.join(this.pluginDir, providedKey);
        let pluginManifest;
        let pluginKey = providedKey;
        let mainTmpFile = '';
        try {
            const manifestPath = path.join(pluginPath, 'package.json');
            const rawManifest = await fs.readFile(manifestPath, 'utf-8');
            pluginManifest = JSON.parse(rawManifest);
            if (!pluginManifest.name) {
                throw new Error(t('plugin.missing_manifest_name'));
            }
            const nameRegex = /^@[a-z0-9_-]+\/[a-z0-9_-]+$/;
            if (!nameRegex.test(pluginManifest.name)) {
                throw new Error(t('plugin.invalid_manifest_name', { name: pluginManifest.name }));
            }
            pluginKey = pluginManifest.name;
        }
        catch (err) {
            this.failedPlugins.add(pluginKey);
            logger.error(this.getLogPrefix(pluginKey, pluginPath), t('plugin.error_reading_manifest', { error: err.message ?? err }));
            throw err;
        }
        const manifest = {
            name: pluginManifest.name,
            version: pluginManifest.version || '1.0.0',
            author: pluginManifest.author,
            description: pluginManifest.description || '',
            dependencies: pluginManifest.pluginDependencies || {},
            commands: [],
            configs: [],
            events: [],
            languages: [],
            middlewares: [],
        };
        try {
            await Promise.all([
                this.loadJsDir(path.join(pluginPath, 'commands'), pluginKey, isReload, async (name, data) => {
                    const command = CommandSchema.parse(data);
                    const key = `${pluginKey}:${name}`;
                    manifest.commands.push(key);
                    this.commands.set(key, command);
                    if (command.aliases && Array.isArray(command.aliases)) {
                        command.aliases.forEach((alias) => {
                            const existing = this.commandsIndex.get(alias) || [];
                            existing.push(key);
                            this.commandsIndex.set(alias, existing);
                        });
                    }
                }),
                this.loadJsDir(path.join(pluginPath, 'events'), pluginKey, isReload, async (name, data) => {
                    const event = EventSchema.parse(data);
                    const key = `${pluginKey}:${name}`;
                    manifest.events.push(key);
                    this.events.set(key, event);
                }),
                this.loadJsDir(path.join(pluginPath, 'middlewares'), pluginKey, isReload, async (name, data) => {
                    const middleware = MiddlewareSchema.parse(data);
                    const key = `${pluginKey}:${name}`;
                    manifest.middlewares.push(key);
                    this.middlewares.set(key, middleware);
                }),
                this.loadJsonDir(path.join(pluginPath, 'configs'), pluginKey, async (name, data) => {
                    const key = `${pluginKey}:${name}`;
                    manifest.configs.push(key);
                    this.configs.set(key, data);
                }),
                this.loadJsonDir(path.join(pluginPath, 'lang'), pluginKey, async (name, data) => {
                    const key = `${pluginKey}:${name}`;
                    manifest.languages.push(key);
                    this.languages.set(key, data);
                }),
            ]);
            const mainFile = pluginManifest.main || 'index.js';
            const mainPath = path.join(pluginPath, mainFile);
            const mainStats = await fs.stat(mainPath).catch(() => null);
            if (mainStats && mainStats.isFile()) {
                let module;
                if (isReload) {
                    const isTsx = import.meta.url.endsWith('.ts');
                    if (isTsx) {
                        const tmpFile = `.${mainFile.replace('.js', `_${Date.now()}.tmp.js`)}`;
                        mainTmpFile = tmpFile;
                        const tmpPath = path.join(pluginPath, tmpFile);
                        await fs.copyFile(mainPath, tmpPath);
                        const fileUrl = pathToFileURL(tmpPath).href;
                        try {
                            module = await import(fileUrl);
                        }
                        finally {
                            await fs.unlink(tmpPath).catch(() => { });
                        }
                    }
                    else {
                        const fileUrl = pathToFileURL(mainPath).href + `?update=${Date.now()}`;
                        module = await import(fileUrl);
                    }
                }
                else {
                    const fileUrl = pathToFileURL(mainPath).href;
                    module = await import(fileUrl);
                }
                if (typeof module.default === 'function') {
                    await module.default({ pluginKey, pluginPath, manager: this });
                }
                else {
                    logger.warn(this.getLogPrefix(pluginKey, pluginPath), `Boot file '${mainFile}' found but it does not export a default function. Make sure to use 'export default function...'`);
                }
            }
            this.loadedPlugins.add(pluginKey);
            this.plugins.set(pluginKey, manifest);
            this.pluginPaths.set(pluginKey, pluginPath);
        }
        catch (err) {
            if (mainTmpFile && err && err.message && typeof err.message === 'string') {
                err.message = err.message.split(mainTmpFile).join(pluginManifest?.main || 'index.js');
            }
            this.cleanupPluginData(pluginKey);
            this.failedPlugins.add(pluginKey);
            logger.error(this.getLogPrefix(pluginKey), t('plugin.failed_to_load'));
            throw err;
        }
    }
    async runMigrations(pluginKey, options) {
        const pluginPath = options?.customPath || this.pluginPaths.get(pluginKey);
        if (!pluginPath) {
            throw new Error(`Plugin path not found for ${pluginKey}`);
        }
        const migrationsPath = path.join(pluginPath, 'migrations');
        try {
            const stats = await fs.stat(migrationsPath);
            if (!stats.isDirectory())
                return;
        }
        catch {
            return;
        }
        try {
            if (!db) {
                throw new Error('Database not initialized');
            }
            const config = {
                migrationSource: new PluginMigrationSource(migrationsPath, pluginKey),
                tableName: 'plugin_migrations',
                disableMigrationsListValidation: true,
            };
            const results = {};
            if (options?.fresh) {
                const [, rolledBackLog] = await db.migrate.rollback(config, true);
                const [, migratedLog] = await db.migrate.latest(config);
                results.rolledBack = rolledBackLog;
                results.migrated = migratedLog;
            }
            else if (options?.rollback) {
                const [, rolledBackLog] = await db.migrate.rollback(config);
                results.rolledBack = rolledBackLog;
            }
            else {
                const [, migratedLog] = await db.migrate.latest(config);
                results.migrated = migratedLog;
            }
            return results;
        }
        catch (err) {
            logger.error(this.getLogPrefix(pluginKey), `Migration failed: ${err.message ?? err}`);
            throw err;
        }
    }
    async loadJsDir(dir, pluginKey, isReload, handler) {
        let files;
        try {
            files = await fs.readdir(dir);
        }
        catch (err) {
            return;
        }
        const componentType = path.basename(dir);
        await Promise.all(files
            .filter((f) => f.endsWith('.js'))
            .map(async (file) => {
            let currentTmpFile = '';
            try {
                let module;
                if (isReload) {
                    const tmpFile = `.${file.replace('.js', `_${Date.now()}.tmp.js`)}`;
                    currentTmpFile = tmpFile;
                    const tmpPath = path.join(dir, tmpFile);
                    let content = await fs.readFile(path.join(dir, file), 'utf-8');
                    const updateQuery = `?update=${Date.now()}`;
                    content = content.replace(/(from\s+['"])(\.\.?\/[^'"]+)(['"])/g, `$1$2${updateQuery}$3`);
                    content = content.replace(/(import\s+['"])(\.\.?\/[^'"]+)(['"])/g, `$1$2${updateQuery}$3`);
                    content = content.replace(/(import\s*\(\s*['"])(\.\.?\/[^'"]+)(['"])/g, `$1$2${updateQuery}$3`);
                    const linesCount = content.split('\n').length;
                    const mappings = 'AAAA;' +
                        Array(Math.max(0, linesCount - 1))
                            .fill('AACA')
                            .join(';');
                    const sm = {
                        version: 3,
                        file: tmpFile,
                        sources: [file],
                        names: [],
                        mappings,
                    };
                    const sm64 = Buffer.from(JSON.stringify(sm)).toString('base64');
                    content += `\n//# sourceMappingURL=data:application/json;base64,${sm64}`;
                    await fs.writeFile(tmpPath, content, 'utf-8');
                    const fileUrl = pathToFileURL(tmpPath).href;
                    try {
                        module = await import(fileUrl);
                    }
                    finally {
                        await fs.unlink(tmpPath).catch(() => { });
                    }
                }
                else {
                    const fileUrl = pathToFileURL(path.join(dir, file)).href;
                    module = await import(fileUrl);
                }
                await handler(file.replace('.js', ''), module.default);
            }
            catch (err) {
                let errorMessage = err?.message || err || '';
                if (currentTmpFile && typeof errorMessage === 'string') {
                    errorMessage = errorMessage.split(currentTmpFile).join(file);
                }
                logger.error(this.getLogPrefix(pluginKey), t('plugin.error_in_component', {
                    type: componentType,
                    file,
                    error: errorMessage,
                }));
                throw new Error(`Component failure in ${componentType}/${file}`);
            }
        }));
    }
    async loadJsonDir(dir, pluginKey, handler) {
        let files;
        try {
            files = await fs.readdir(dir);
        }
        catch (err) {
            return;
        }
        const componentType = path.basename(dir);
        await Promise.all(files
            .filter((f) => f.endsWith('.json'))
            .map(async (file) => {
            try {
                const raw = await fs.readFile(path.join(dir, file), 'utf-8');
                await handler(file.replace('.json', ''), JSON.parse(raw));
            }
            catch (err) {
                logger.error(this.getLogPrefix(pluginKey), t('plugin.error_in_component', {
                    type: componentType,
                    file,
                    error: err?.message || err,
                }));
                throw new Error(`Component failure in ${componentType}/${file}`);
            }
        }));
    }
    updateMiddlewareCache() {
        this._cachedMiddlewares = Array.from(this.middlewares.entries()).sort((a, b) => {
            const priorityA = a[1]?.priority ?? 0;
            const priorityB = b[1]?.priority ?? 0;
            return priorityA - priorityB;
        });
    }
    updateEventCache() {
        this._cachedEvents = Array.from(this.events.entries()).sort((a, b) => {
            const priorityA = a[1]?.priority ?? 0;
            const priorityB = b[1]?.priority ?? 0;
            return priorityA - priorityB;
        });
    }
    async runEvents(eventName, eventData, sock) {
        const events = this._cachedEvents.filter(([_, data]) => data.event === eventName);
        if (events.length === 0) {
            return;
        }
        await Promise.all(events.map(async ([eventKey, event]) => {
            const namespace = eventKey.split(':')[0];
            try {
                const manifest = this.plugins.get(namespace);
                const context = {
                    sock,
                    db,
                    eventData,
                    cache: new CacheService(namespace),
                    plugin: { key: namespace, ...manifest },
                    t: (path, params) => t(`${namespace}:${path}`, params),
                    logger: this.getLogger(namespace),
                    config: {
                        get: (configPath) => {
                            return this.getConfig(namespace, configPath);
                        },
                        set: async (configPath, newData) => {
                            return await this.setConfig(namespace, configPath, newData);
                        },
                    },
                };
                await event.execute(context);
            }
            catch (error) {
                logger.error(`[EVENT: ${eventKey}]`, error);
            }
        }));
    }
    async runMiddlewares(eventName, payload, sock) {
        const middlewares = this._cachedMiddlewares.filter(([_, data]) => {
            return data.event === eventName;
        });
        if (middlewares.length === 0) {
            return true;
        }
        const next = () => true;
        const abort = (logMessage) => ({
            _isAbort: true,
            log: logMessage,
        });
        for (const [middlewareKey, middleware] of middlewares) {
            const namespace = middlewareKey.split(':')[0];
            try {
                const originalPlugin = this.plugins.get(namespace);
                const executionContext = {
                    sock,
                    db,
                    payload,
                    eventName,
                    plugin: { key: namespace, ...originalPlugin },
                    t: (path, params) => t(`${namespace}:${path}`, params),
                    cache: new CacheService(namespace),
                    logger: this.getLogger(namespace),
                    config: {
                        get: (configPath) => {
                            return this.getConfig(namespace, configPath);
                        },
                        set: async (configPath, newData) => {
                            return await this.setConfig(namespace, configPath, newData);
                        },
                    },
                    getPluginMsg: (path) => {
                        const base = `plugins.${namespace}`;
                        return path
                            ? getNestedValue(payload, `${base}.${path}`)
                            : getNestedValue(payload, base) || {};
                    },
                    setPluginMsg: (path, val, pos) => {
                        setNestedValue(payload, `plugins.${namespace}.${path}`, val, pos);
                    },
                    next,
                    abort,
                };
                const result = await middleware.handler(executionContext);
                if (result === true) {
                    continue;
                }
                if (result === false) {
                    return false;
                }
                if (typeof result === 'object' && result !== null && result._isAbort) {
                    if (result.log) {
                        logger.warn(`[MIDDLEWARE: ${middlewareKey}]`, result.log);
                    }
                    return false;
                }
            }
            catch (error) {
                logger.error(`[MIDDLEWARE: ${middlewareKey}]`, error);
                return false;
            }
        }
        return true;
    }
    getConfig(pluginKey, configPath) {
        const parts = configPath.split('.');
        const baseConfigName = parts.shift();
        const key = `${pluginKey}:${baseConfigName}`;
        const configData = this.configs.get(key);
        if (!configData || parts.length === 0) {
            return configData;
        }
        return getNestedValue(configData, parts.join('.'));
    }
    async setConfig(pluginKey, configPath, newData) {
        const parts = configPath.split('.');
        const baseConfigName = parts.shift();
        const key = `${pluginKey}:${baseConfigName}`;
        const existingData = this.configs.get(key) || {};
        let updatedConfig = { ...existingData };
        if (parts.length === 0) {
            updatedConfig = { ...existingData, ...newData };
        }
        else {
            setNestedValue(updatedConfig, parts.join('.'), newData);
        }
        this.configs.set(key, updatedConfig);
        try {
            const pluginPath = this.pluginPaths.get(pluginKey);
            if (!pluginPath)
                throw new Error(`Path not found for plugin: ${pluginKey}`);
            const configFilePath = path.join(pluginPath, 'configs', `${baseConfigName}.json`);
            await fs.writeFile(configFilePath, JSON.stringify(updatedConfig, null, 2), 'utf-8');
            return true;
        }
        catch (err) {
            logger.error(this.getLogPrefix(pluginKey), t('plugin.error_set_config', {
                config: baseConfigName,
                error: err.message ?? err,
            }));
            throw err;
        }
    }
}
const pluginManager = new PluginManager();
export default pluginManager;
