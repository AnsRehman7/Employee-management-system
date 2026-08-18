import React from 'react';
import { ThemeProvider } from './src/ThemeContext';
import StaffFlowApp from './src/StaffFlowApp';

/**
 * The theme provider wraps the whole app so every screen re-renders with the active
 * palette when the device appearance changes.
 */
const App = () => (
  <ThemeProvider>
    <StaffFlowApp />
  </ThemeProvider>
);

export default App;
