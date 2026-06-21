import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
if (typeof process.setSourceMapsEnabled === 'function') {
    process.setSourceMapsEnabled(true);
}
import { initDirectories } from '@lazy/core/utils/path';
import { initDatabase } from '@lazy/core/services/database/index';
import { initCache } from '@lazy/core/services/cache/index';
import env from '@lazy/core/services/env/index';
import whatsapp from '@lazy/core/socket/index';
import pluginLoader from '@lazy/core/services/plugin/index';
import pluginWatcher from '@lazy/core/services/plugin/watcher';
import authService from '@lazy/core/services/auth/index';
import cliService from '@lazy/core/services/cli/index';
import versionService from '@lazy/core/services/version/index';
import { initI18n, t } from '@lazy/core/services/i18n/index';
import logger from '@lazy/core/utils/logger';
import pc from 'picocolors';
import { Storage } from '@lazy/core/utils/storage';
import { messageBatcher } from '@lazy/core/services/store/batcher';
global.API_BASE_URL = env.API_BASE_URL;
global.AUTH_TOKEN = null;
global.AUTH_USER = null;
const bootScreen = () => {
    console.clear();
};
const bootstrap = async () => {
    bootScreen();
    await initI18n();
    try {
        initDirectories();
        await Storage.clearTmp();
        initCache();
        await initDatabase();
        await authService.init();
        await pluginLoader.load();
        await versionService.check();
        if (env.PLUGIN_WATCHER && global.AUTH_USER) {
            pluginWatcher.init();
        }
        await whatsapp.initSession({
            sessionId: env.WA_SESSION_NAME,
            usePairingCode: env.WA_USE_PAIRING_CODE,
        });
        logger.info('[SYSTEM]', t('system.plugin_website', {
            url: pc.underline(pc.cyanBright(`${global.API_BASE_URL}/plugins`)),
        }));
        await cliService.init();
    }
    catch (error) {
        logger.fatal('[SYSTEM]', t('system.failed_to_start', { error: error.message ?? error }));
        await gracefulShutdown('STARTUP_ERROR');
    }
};
bootstrap();
let isShuttingDown = false;
const gracefulShutdown = async (signal) => {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    logger.info('[SYSTEM]', `Received ${signal}, executing graceful shutdown...`);
    try {
        await messageBatcher.flush();
        logger.success('[SYSTEM]', 'Message buffer flushed to database.');
        await whatsapp.shutdown();
        logger.success('[SYSTEM]', 'WhatsApp sessions closed gracefully.');
    }
    catch (err) {
        logger.error('[SYSTEM]', `Error during shutdown: ${err.message}`);
    }
    finally {
        process.exit(signal === 'STARTUP_ERROR' ||
            signal === 'uncaughtException' ||
            signal === 'unhandledRejection'
            ? 1
            : 0);
    }
};
process.on('unhandledRejection', async (reason) => {
    logger.fatal('[SYSTEM]', t('system.unhandled_rejection', { reason }));
    await gracefulShutdown('unhandledRejection');
});
process.on('uncaughtException', async (error) => {
    logger.fatal('[SYSTEM]', t('system.uncaught_exception', { error: error.message ?? error }));
    await gracefulShutdown('uncaughtException');
});
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));
