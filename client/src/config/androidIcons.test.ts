import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const clientRoot = path.resolve(__dirname, '..', '..');
const androidRoot = path.join(clientRoot, 'android', 'app', 'src', 'main', 'res');
const appConfigPath = path.join(clientRoot, 'app.json');
const launcherIconPath = path.join(androidRoot, 'mipmap-anydpi-v26', 'ic_launcher.xml');

describe('android launcher icon configuration', () => {
  it('declares a monochrome icon in Expo config and native resources', () => {
    const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8')) as {
      expo?: {
        android?: {
          adaptiveIcon?: {
            monochromeImage?: string;
          };
        };
      };
    };
    const launcherIconXml = fs.readFileSync(launcherIconPath, 'utf8');

    expect(appConfig.expo?.android?.adaptiveIcon?.monochromeImage).toBeTruthy();
    expect(launcherIconXml).toContain('<monochrome ');
  });
});
