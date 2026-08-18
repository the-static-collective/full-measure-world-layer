import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { FullMeasureView } from './components/FullMeasureView';
import { HumanTerminalPanel } from './components/HumanTerminalPanel';
import { WorldEncounterPanel } from './components/WorldEncounterPanel';
import { BasketView } from './components/BasketView';
import { ProjectsView } from './components/ProjectsView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { RememberView } from './components/RememberView';
import { ParticipantView } from './components/ParticipantView';
import { UserSwitcherModal } from './components/UserSwitcherModal';
import { ArrivalModal } from './components/ArrivalModal';
import { BringAFriendModal } from './components/BringAFriendModal';
import { JoinCircleModal } from './components/JoinCircleModal';
import { api, getCurrentUserId } from './lib/api';
import type { WorldEncounterResidue } from './lib/worldRuntime/types';
import {
  Profile,
  Offer,
  Project,
  Pledge,
  Receipt,
  Capacity,
  DomainEvent,
  Circle,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('campfire');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [lastWorldResidue, setLastWorldResidue] = useState<WorldEncounterResidue | null>(null);

  // Store data
  const [circle, setCircle] = useState<Circle | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [offers, setOffers] = useState<Array<Offer & { author?: Profile }>>([]);
  const [projects, setProjects] = useState<
    Array<
      Project & {
        opener?: Profile;
        pledges: Array<Pledge & { pledger?: Profile }>;
      }
    >
  >([]);
  const [receipts, setReceipts] = useState<
    Array<
      Receipt & {
        project?: Project;
        author?: Profile;
        confirmedPledges: Array<any>;
      }
    >
  >([]);
  const [capacities, setCapacities] = useState<
    Array<Capacity & { receipt?: Receipt; project?: Project }>
  >([]);
  const [events, setEvents] = useState<Array<DomainEvent & { actor?: Profile }>>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // Modal flags
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);
  const [isNewOfferModalOpen, setIsNewOfferModalOpen] = useState(false);
  const [isBringAFriendOpen, setIsBringAFriendOpen] = useState(false);
  const [isJoinCircleOpen, setIsJoinCircleOpen] = useState(false);
  const [inviteCodeFromUrl, setInviteCodeFromUrl] = useState('');

  const loadAllData = async () => {
    try {
      const [profsData, circleData, offersData, projectsData, receiptsData, capsData, eventsData] =
        await Promise.all([
          api.getProfiles(),
          api.getCircle(),
          api.getOffers(),
          api.getProjects(),
          api.getReceipts(),
          api.getCapacities(),
          api.getEvents(),
        ]);

      setProfiles(profsData);
      if (circleData?.circle) setCircle(circleData.circle);
      setOffers(offersData);
      setProjects(projectsData);
      setReceipts(receiptsData);
      setCapacities(capsData);
      setEvents(eventsData);

      const activeId = getCurrentUserId();
      const current = profsData.find((p) => p.id === activeId) || profsData[0] || null;
      setCurrentUser(current);
    } catch (err) {
      console.error('Failed to load circle data:', err);
    }
  };

  useEffect(() => {
    loadAllData();

    // Check URL query parameters for invite link (e.g. ?invite=CAMPFIRE1)
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('invite') || urlParams.get('code');
    if (codeParam) {
      setInviteCodeFromUrl(codeParam);
      setIsJoinCircleOpen(true);
    }

    // Real-time polling every 3 seconds for multi-device sync
    const interval = setInterval(loadAllData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUserChanged = (newProfile: Profile) => {
    setCurrentUser(newProfile);
    loadAllData();
  };

  const handleResetSeed = async () => {
    try {
      await api.resetSeedData();
      await loadAllData();
    } catch (err) {
      alert('Could not reset seed data');
    }
  };

  const handleTabChange = (tab: NavTab) => {
    setSelectedProjectId(null);
    setActiveTab(tab);
  };

  const handleBeginWorldCrossing = () => {
    document.getElementById('world-threshold')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="min-h-screen bg-[#fbf8f3] text-[#2c2825] flex flex-col font-sans selection:bg-amber-200">
      {/* Navigation Header & Bottom Mobile Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentUser={currentUser}
        onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
        onOpenArrivalModal={() => setIsArrivalModalOpen(true)}
        onOpenBringAFriend={() => setIsBringAFriendOpen(true)}
        onOpenJoinCircle={() => setIsJoinCircleOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-6 pb-20">
        {selectedProjectId ? (
          <ProjectDetailView
            projectId={selectedProjectId}
            offers={offers}
            onBack={() => setSelectedProjectId(null)}
            onRefresh={loadAllData}
          />
        ) : (
          <>
            {activeTab === 'campfire' && (
              <>
                <HumanTerminalPanel
                  lastResidueRef={lastWorldResidue?.residueRef}
                  onBeginCrossing={handleBeginWorldCrossing}
                />
                <WorldEncounterPanel onResidue={setLastWorldResidue} />
                <FullMeasureView
                  offers={offers}
                  projects={projects}
                  receipts={receipts}
                  capacities={capacities}
                  events={events}
                  onNavigate={handleTabChange}
                  onSelectProject={(id) => setSelectedProjectId(id)}
                  onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
                  currentUser={currentUser}
                />
              </>
            )}

            {activeTab === 'basket' && (
              <BasketView
                offers={offers}
                onRefresh={loadAllData}
                openNewOfferModal={isNewOfferModalOpen}
                onOpenNewOfferModal={() => setIsNewOfferModalOpen(true)}
                onCloseNewOfferModal={() => setIsNewOfferModalOpen(false)}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectsView
                projects={projects}
                offers={offers}
                onSelectProject={(id) => setSelectedProjectId(id)}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'remember' && (
              <RememberView
                receipts={receipts}
                capacities={capacities}
                events={events}
                projects={projects}
                onSelectProject={(id) => {
                  setSelectedProjectId(id);
                  setActiveTab('projects');
                }}
              />
            )}

            {activeTab === 'lineage' && (
              <ParticipantView profiles={profiles} onRefresh={loadAllData} />
            )}
          </>
        )}
      </main>

      {/* Bring a Friend Modal */}
      <BringAFriendModal
        isOpen={isBringAFriendOpen}
        onClose={() => setIsBringAFriendOpen(false)}
        circle={circle}
        currentUser={currentUser}
        onInvitationCreated={loadAllData}
      />

      {/* Join Circle Modal */}
      <JoinCircleModal
        isOpen={isJoinCircleOpen}
        onClose={() => setIsJoinCircleOpen(false)}
        initialCode={inviteCodeFromUrl}
        onJoined={(profile) => {
          handleUserChanged(profile);
          loadAllData();
        }}
      />

      {/* Identity & User Switcher Modal */}
      <UserSwitcherModal
        isOpen={isUserSwitcherOpen}
        onClose={() => setIsUserSwitcherOpen(false)}
        profiles={profiles}
        onUserChanged={handleUserChanged}
        onResetSeed={handleResetSeed}
      />

      {/* Arrival & Onboarding Modal */}
      <ArrivalModal
        isOpen={isArrivalModalOpen}
        onClose={() => setIsArrivalModalOpen(false)}
        currentUser={currentUser}
        onOfferCreated={loadAllData}
      />
    </div>
  );
}
