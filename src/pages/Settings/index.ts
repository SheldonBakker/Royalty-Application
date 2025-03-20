import { lazy } from 'react';

// Use lazy loading for Settings component
const Settings = lazy(() => import('./Settings').then(module => ({
  default: module.Settings
})));

export { Settings }; 