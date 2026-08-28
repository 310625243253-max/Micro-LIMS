import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { BioMeshCanvas } from './components/3d/BioMeshCanvas';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { SamplesView } from './views/SamplesView';
import { SampleDetailView } from './views/SampleDetailView';
import { CulturesView } from './views/CulturesView';
import { IncubationsView } from './views/IncubationsView';
import { ObservationsView } from './views/ObservationsView';
import { TestsView } from './views/TestsView';
import { AstView } from './views/AstView';
import { ContaminationView } from './views/ContaminationView';
import { ReviewsView } from './views/ReviewsView';
import { ReportsView } from './views/ReportsView';
import { MediaView } from './views/MediaView';
import { AuditView } from './views/AuditView';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [isAccessionModalOpen, setIsAccessionModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-secondary)' }}>
        Loading MicroLIMS Laboratory Workspace...
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    setCurrentView('sample-detail');
    setIsMobileSidebarOpen(false);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setSelectedSampleId(null);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', position: 'relative', overflowX: 'hidden' }}>
      {/* Persistent 3D WebGL Molecular & Particle Mesh across all pages */}
      <BioMeshCanvas
        particleColor="#0284c7"
        helixColorA="#0284c7"
        helixColorB="#8b5cf6"
        interactive={true}
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0.42,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 1 }}>
        <Navbar
          currentView={currentView}
          onOpenAccessionModal={() => {
            setCurrentView('samples');
            setIsAccessionModalOpen(true);
          }}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main className="main-content-layout" style={{ flex: 1, padding: '28px', maxWidth: '1440px', width: '100%', margin: '0 auto', position: 'relative' }}>
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onSelectSample={handleSelectSample}
            />
          )}

          {currentView === 'samples' && (
            <SamplesView
              onSelectSample={handleSelectSample}
              isAccessionModalOpen={isAccessionModalOpen}
              onCloseAccessionModal={() => setIsAccessionModalOpen(false)}
            />
          )}

          {currentView === 'sample-detail' && selectedSampleId && (
            <SampleDetailView
              sampleId={selectedSampleId}
              onBack={() => handleNavigate('samples')}
            />
          )}

          {currentView === 'cultures' && (
            <CulturesView onSelectSample={handleSelectSample} />
          )}

          {currentView === 'incubations' && (
            <IncubationsView />
          )}

          {currentView === 'observations' && (
            <ObservationsView />
          )}

          {currentView === 'tests' && (
            <TestsView />
          )}

          {currentView === 'ast' && (
            <AstView />
          )}

          {currentView === 'contamination' && (
            <ContaminationView />
          )}

          {currentView === 'reviews' && (
            <ReviewsView onSelectSample={handleSelectSample} />
          )}

          {currentView === 'reports' && (
            <ReportsView />
          )}

          {currentView === 'media' && (
            <MediaView />
          )}

          {currentView === 'audit' && (
            <AuditView />
          )}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;


