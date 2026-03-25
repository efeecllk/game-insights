/**
 * Game Insights Application Root
 *
 * Keeps global providers and error handling at the top level.
 * Route wiring and page shell live in `src/app/AppRouter.tsx`.
 */

import { MotionConfig } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { GameProvider } from './context/GameContext';
import AppRouter from './app/AppRouter';

function App() {
    return (
        <ErrorBoundary>
            <MotionConfig reducedMotion="user">
                <ThemeProvider>
                    <ToastProvider position="bottom-right" maxToasts={5}>
                        <DataProvider>
                            <GameProvider>
                                <AppRouter />
                            </GameProvider>
                        </DataProvider>
                    </ToastProvider>
                </ThemeProvider>
            </MotionConfig>
        </ErrorBoundary>
    );
}

export default App;
