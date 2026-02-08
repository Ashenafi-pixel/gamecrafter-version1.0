import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from './store';
import LoginScreen from './components/LoginScreen';
const PremiumApp = lazy(() => import('./components/PremiumApp'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const BackofficeDashboard = lazy(() => import('./rgs/BackofficeDashboard'));
const CasinoLobby = lazy(() => import('./rgs/pages/CasinoLobby'));
const PlayerPage = lazy(() => import('./rgs/pages/PlayerPage'));
const StoreDebugTest = lazy(() => import('./components/standalone/StoreDebugTest'));
import { PopupProvider } from './components/popups';

// Add window augmentation for emergency navigation method
declare global {
  interface Window {
    manuallyNavigateToNextStep?: () => void;
    PIXI_ANIMATION_TICKER?: any;
    PIXI_APPS?: any[];
    PIXI_ANIMATIONS_ACTIVE?: boolean;
    MEMORY_TRACKER?: any;
    gc?: () => void;
    _originalRAF?: (callback: FrameRequestCallback) => number;
    timestamp?: number;
    useGameStore?: any;
    isSafeMode?: boolean;
    isErrorEmergency?: boolean;
  }
}


const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('slotai_logged_in') === 'true';
    if (!isLoggedIn) {

      const returnPath = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${returnPath}`);
    }
  }, [navigate, location]);

  return <>{children}</>;
};

/**
 * Loading component to show while lazy components are loading
 */
const Loading: React.FC = () => (
  <div className="w-full h-screen flex items-center justify-center">
    <div className="animate-spin h-8 w-8 uw:w-24 uw:h-24 border-4 uw:border-8 border-blue-500 rounded-full border-t-transparent"></div>
  </div>
);

// StoreLogger: logs the full Zustand store whenever any value changes
const StoreLogger: React.FC = () => {
  const store = useGameStore((state) => state);
  const prevStoreRef = useRef<any>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip logging on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      try {
        prevStoreRef.current = JSON.parse(JSON.stringify(store)); // Deep clone
      } catch (error) {
        console.warn('⚠️ Could not clone store for comparison:', error);
        prevStoreRef.current = store;
      }
      return;
    }

    const prevStore = prevStoreRef.current;
    const changes: Array<{
      path: string;
      previousValue: any;
      newValue: any;
    }> = [];

    // Deep comparison function to find all changes
    const findChanges = (obj1: any, obj2: any, path: string = '') => {
      // Handle null/undefined cases
      if (obj1 === null && obj2 === null) return;
      if (obj1 === undefined && obj2 === undefined) return;

      // Check if one is null/undefined and the other isn't
      if ((obj1 === null || obj1 === undefined) && (obj2 !== null && obj2 !== undefined)) {
        changes.push({
          path: path || 'root',
          previousValue: obj1,
          newValue: obj2
        });
        return;
      }
      if ((obj2 === null || obj2 === undefined) && (obj1 !== null && obj1 !== undefined)) {
        changes.push({
          path: path || 'root',
          previousValue: obj1,
          newValue: obj2
        });
        return;
      }

      // Get all keys from both objects
      const allKeys = new Set([
        ...(obj1 && typeof obj1 === 'object' ? Object.keys(obj1) : []),
        ...(obj2 && typeof obj2 === 'object' ? Object.keys(obj2) : [])
      ]);

      allKeys.forEach(key => {
        const currentPath = path ? `${path}.${key}` : key;
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];

        // Skip functions (Zustand action methods)
        if (typeof val1 === 'function' || typeof val2 === 'function') {
          return;
        }

        // Check if values are different
        if (val1 !== val2) {
          // If both are objects/arrays, recurse
          if (
            val1 !== null && val2 !== null &&
            typeof val1 === 'object' && typeof val2 === 'object' &&
            !(val1 instanceof Date) && !(val2 instanceof Date) &&
            !(val1 instanceof RegExp) && !(val2 instanceof RegExp)
          ) {
            // Check if they're arrays
            const isArray1 = Array.isArray(val1);
            const isArray2 = Array.isArray(val2);

            if (isArray1 && isArray2) {
              // Compare arrays
              const maxLength = Math.max(val1.length, val2.length);
              for (let i = 0; i < maxLength; i++) {
                if (i >= val1.length) {
                  changes.push({
                    path: `${currentPath}[${i}]`,
                    previousValue: undefined,
                    newValue: val2[i]
                  });
                } else if (i >= val2.length) {
                  changes.push({
                    path: `${currentPath}[${i}]`,
                    previousValue: val1[i],
                    newValue: undefined
                  });
                } else if (val1[i] !== val2[i]) {
                  // Recurse for nested objects in arrays
                  if (
                    val1[i] !== null && val2[i] !== null &&
                    typeof val1[i] === 'object' && typeof val2[i] === 'object' &&
                    !(val1[i] instanceof Date) && !(val2[i] instanceof Date)
                  ) {
                    findChanges(val1[i], val2[i], `${currentPath}[${i}]`);
                  } else {
                    changes.push({
                      path: `${currentPath}[${i}]`,
                      previousValue: val1[i],
                      newValue: val2[i]
                    });
                  }
                }
              }
            } else {
              // Recurse for nested objects
              findChanges(val1, val2, currentPath);
            }
          } else {
            // Primitive values or different types
            changes.push({
              path: currentPath,
              previousValue: val1,
              newValue: val2
            });
          }
        }
      });
    };

    // Find all changes
    findChanges(prevStore, store);

    // Log the changes
    if (changes.length > 0) {
      console.group(`🟢 Store Updated - ${changes.length} Change${changes.length > 1 ? 's' : ''} Detected`);

      // Log each change with clear formatting
      changes.forEach((change, index) => {
        console.group(`%c${index + 1}. ${change.path}`, 'font-weight: bold; color: #4CAF50;');
        console.log('%cPrevious:', 'color: #FF9800; font-weight: bold;', change.previousValue);
        console.log('%cNew:', 'color: #2196F3; font-weight: bold;', change.newValue);
        console.groupEnd();
      });

      console.log('%c📦 Full Store:', 'font-weight: bold;', store);
      console.groupEnd();
    } else {
      console.log('🟢 Store updated (no changes detected)');
    }

    // Update previous store reference
    try {
      prevStoreRef.current = JSON.parse(JSON.stringify(store)); // Deep clone
    } catch (error) {
      console.warn('⚠️ Could not clone store for next comparison:', error);
      prevStoreRef.current = store;
    }
  }, [store]);

  return null;
};

function App() {

  // Define app routes
  return (
    <PopupProvider>
      <StoreLogger />
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Login route - public */}
            <Route path="/login" element={<LoginScreen />} />
            {/* Home route - always shows the dashboard */}
            <Route
              path="/home"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />

            {/* Legacy dashboard route - redirect to /home */}
            <Route
              path="/dashboard"
              element={<Navigate to="/home" replace />}
            />

            {/* Game Creator route with updated path for clarity */}
            <Route
              path="/new-game"
              element={
                <AuthGuard>
                  <PremiumApp />
                </AuthGuard>
              }
            />

            {/* Legacy create route - redirect to new-game */}
            <Route
              path="/create"
              element={<Navigate to="/new-game" replace />}
            />

            {/* Legacy slot-creator route - redirect to new-game */}
            <Route
              path="/slot-creator"
              element={<Navigate to="/new-game" replace />}
            />

            {/* Store Debug Test route */}
            <Route
              path="/debug-store"
              element={
                <AuthGuard>
                  <StoreDebugTest />
                </AuthGuard>
              }
            />

            {/* RGS Backoffice Route */}
            <Route
              path="/admin/rgs"
              element={
                <AuthGuard>
                  <BackofficeDashboard />
                </AuthGuard>
              }
            />

            {/* Standalone Player Route */}
            <Route
              path="/play/demo/:draftId"
              element={
                <Suspense fallback={<Loading />}>
                  <PlayerPage />
                </Suspense>
              }
            />

            {/* Casino Lobby (Public) */}
            <Route
              path="/casino"
              element={
                <Suspense fallback={<Loading />}>
                  <CasinoLobby />
                </Suspense>
              }
            />

            {/* Root route - Check auth and redirect appropriately */}
            <Route
              path="/"
              element={
                <RootRedirect />
              }
            />

            {/* Fallback route for undefined paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

      </BrowserRouter>
    </PopupProvider>
  );
}

/**
 * Root Redirect Component
 * Handles redirect from root path based on authentication state
 */
const RootRedirect: React.FC = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check authentication status
    const isLoggedIn = localStorage.getItem('slotai_logged_in') === 'true';

    // Always redirect to the dashboard if logged in
    if (isLoggedIn) {
      // Redirect to the Game Crafter dashboard
      navigate('/home', { replace: true });
    } else {
      // Redirect to login if not authenticated
      navigate('/login', { replace: true });
    }

    setIsCheckingAuth(false);
  }, [navigate]);

  // Show minimal loading indicator while checking
  if (isCheckingAuth) {
    return <Loading />;
  }

  return null;
};

export default App;