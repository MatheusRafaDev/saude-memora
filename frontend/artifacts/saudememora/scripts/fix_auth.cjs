const fs = require('fs');

// 1. Update store.tsx
const storePath = 'C:/Users/rafae/Documents/GitHub/saude-memora/frontend/artifacts/saudememora/src/lib/store.tsx';
let storeCode = fs.readFileSync(storePath, 'utf8');
storeCode = storeCode.replace(
  /signOut: \(\) => setAuthenticated\(false\)/,
  `signOut: () => { setAuthenticated(false); localStorage.removeItem('auth_token'); window.location.href = '/entrar'; }`
);
storeCode = storeCode.replace(
  /const \[isAuthenticated, setAuthenticated\] = useState\(false\);/,
  `const [isAuthenticated, setAuthenticated] = useState(!!localStorage.getItem('auth_token'));`
);
fs.writeFileSync(storePath, storeCode, 'utf8');

// 2. Update App.tsx
const appPath = 'C:/Users/rafae/Documents/GitHub/saude-memora/frontend/artifacts/saudememora/src/App.tsx';
let appCode = fs.readFileSync(appPath, 'utf8');

const queryClientReplace = `import { QueryCache } from '@tanstack/react-query';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      if (error?.status === 401 || error?.response?.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/entrar';
      }
    }
  })
});`;

appCode = appCode.replace(/const queryClient = new QueryClient\(\);/, queryClientReplace);

// add ProtectedRoute
const protectedRouteCode = `
function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!localStorage.getItem('auth_token')) {
    window.location.href = '/entrar';
    return null;
  }
  return <AppPage>{children}</AppPage>;
}
`;

appCode = appCode.replace(/function AppPage/, protectedRouteCode + '\nfunction AppPage');

// Replace <AppPage> with <ProtectedRoute> in the Switch
appCode = appCode.replace(/<AppPage>/g, '<ProtectedRoute>').replace(/<\/AppPage>/g, '</ProtectedRoute>');

fs.writeFileSync(appPath, appCode, 'utf8');
