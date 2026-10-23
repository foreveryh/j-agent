module.exports = {
  packagerConfig: {
    executableName: 'electron-platform-probe',
    appBundleId: 'com.jagent.experiment.platformprobe',
    asar: { unpack: '**/*.node' },
    ignore: [/^\/results(?:\/|$)/, /^\/smoke\.mjs$/, /^\/README\.md$/],
  },
  makers: [
    { name: '@electron-forge/maker-zip', platforms: ['darwin'], config: {} },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: { name: 'electron_platform_probe', setupExe: 'ElectronPlatformProbeSetup.exe' },
    },
  ],
};
