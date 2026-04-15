import path from 'path';

/**
 * Returns the absolute path to the settings.json file.
 * Prioritizes the SETTINGS_PATH environment variable if defined,
 * otherwise falls back to the project-local 'data/settings.json'.
 */
export function getSettingsPath() {
  if (process.env.SETTINGS_PATH) {
    return path.resolve(process.env.SETTINGS_PATH);
  }
  return path.join(process.cwd(), 'data', 'settings.json');
}
