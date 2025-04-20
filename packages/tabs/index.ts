// Reexport the native module. On web, it will be resolved to RNToolsTabsModule.web.ts
// and on native platforms to RNToolsTabsModule.ts
export { default } from './src/RNToolsTabsModule';
export { default as RNToolsTabsView } from './src/RNToolsTabsView';
export * from  './src/RNToolsTabs.types';
