import { HashRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { PlacesProvider } from './contexts/PlacesContext';
import { EventsProvider } from './contexts/EventsContext';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import MapPage from './pages/MapPage';
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <HashRouter>
      <LanguageProvider>
        <AuthProvider>
          <PlacesProvider>
            <EventsProvider>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/mapa" element={<MapPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </ErrorBoundary>
            </EventsProvider>
          </PlacesProvider>
        </AuthProvider>
      </LanguageProvider>
    </HashRouter>
  );
}

export default App;
