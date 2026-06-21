import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import logger from '@lazy/core/utils/logger';
import { t } from '@lazy/core/services/i18n/index';
import { Http } from '@lazy/core/utils/http';
import pc from 'picocolors';
import semver from 'semver';
class VersionService {
    async check() {
        try {
            const pkgPath = path.join(process.cwd(), 'package.json');
            const pkgRaw = await fs.readFile(pkgPath, 'utf8');
            const pkg = JSON.parse(pkgRaw);
            const currentVersion = pkg.version || '1.0.0';
            const response = await Http.get(`${global.API_BASE_URL.replace(/\/$/, '')}/api/version`).catch(() => null);
            if (response) {
                if (response.ok()) {
                    const data = await response.json().catch(() => null);
                    if (data && data.version) {
                        const latestVersion = data.version.replace(/^v/, '');
                        if (semver.gt(latestVersion, currentVersion)) {
                            logger.warn('[SYSTEM]', t('system.new_version_available', {
                                latest: pc.greenBright('v' + latestVersion),
                                url: pc.underline(data.url),
                            }));
                        }
                    }
                }
                else {
                    const data = await response.json().catch(() => null);
                    if (data && data.code) {
                        const translationKey = `system.errors.${data.code}`;
                        const translated = t(translationKey);
                        const errorMsg = translated === translationKey ? data.message : translated;
                        logger.warn('[SYSTEM]', t('system.version_check_failed', { error: errorMsg }));
                    }
                }
            }
        }
        catch {
        }
    }
}
export default new VersionService();
