import React, { useState, useEffect } from 'react';
import { Profile, Offer, Project, Pledge, Capacity } from '../types';
import { api, getCurrentUserId } from '../lib/api';
import {
  User,
  ShoppingBag,
  Compass,
  CheckCircle2,
  Sprout,
  Calendar,
  Heart,
} from 'lucide-react';

interface Props {
  profiles: Profile[];
  onRefresh: () => void;
}

export const ParticipantView: React.FC<Props> = ({ profiles, onRefresh }) => {
  const activeUserId = getCurrentUserId();
  const [selectedUserId, setSelectedUserId] = useState<string>(activeUserId);
  const [lineageData, setLineageData] = useState<{
    profile: Profile;
    offers: Offer[];
    openedProjects: Project[];
    userPledges: Array<Pledge & { project?: Project }>;
    confirmedContributions: Array<Pledge & { project?: Project }>;
    capacitiesHelped: Capacity[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const loadParticipantLineage = async (userId: string) => {
    setLoading(true);
    try {
      const data = await api.getParticipantLineage(userId);
      setLineageData(data);
    } catch (err) {
      console.error('Failed to load participant lineage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipantLineage(selectedUserId);
  }, [selectedUserId]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="border-b border-[#e8e2d8] pb-4 space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-amber-800" />
          <h2 className="font-serif-warm text-2xl font-bold text-[#1c1917]">
            Character Lineage
          </h2>
        </div>
        <p className="text-xs text-stone-600">
          The evidence beneath the sheet. No rankings, ratings, or hidden scores.
        </p>

        {/* Participant Switcher Dropdown */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedUserId(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                selectedUserId === p.id
                  ? 'bg-amber-900 text-amber-50 shadow-2xs'
                  : 'bg-white border border-[#e2d7c7] text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  p.avatarColor || 'bg-amber-800 text-amber-50'
                }`}
              >
                {p.displayName.substring(0, 2).toUpperCase()}
              </div>
              <span>{p.displayName}</span>
            </button>
          ))}
        </div>
      </div>

      {loading || !lineageData ? (
        <div className="py-12 text-center text-stone-500 font-serif-warm italic text-xs">
          Loading neighbor participation history...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="parchment-card-warm rounded-3xl p-6 border border-[#e2d7c7] flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                lineageData.profile.avatarColor || 'bg-amber-800 text-amber-50'
              }`}
            >
              {lineageData.profile.displayName.substring(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <h3 className="font-serif-warm font-bold text-2xl text-[#1c1917]">
                {lineageData.profile.displayName}
              </h3>
              <p className="text-xs text-stone-600 italic">
                {lineageData.profile.note || 'Participant at The First Campfire'}
              </p>
            </div>
          </div>

          {/* Active Offers */}
          <div className="parchment-card rounded-2xl p-5 space-y-3">
            <h4 className="font-serif-warm font-bold text-base text-[#1c1917] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-800" />
              Gifts in the Satchel ({lineageData.offers.length})
            </h4>

            {lineageData.offers.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No offers currently in basket.</p>
            ) : (
              <div className="space-y-2">
                {lineageData.offers.map((off) => (
                  <div
                    key={off.id}
                    className="p-3 rounded-xl border border-[#e2d7c7] bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#1c1917] block">{off.title}</span>
                      <span className="text-stone-500 text-[11px]">
                        {off.availability || 'Available'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-[10px]">
                      {off.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirmed Contributions */}
          <div className="parchment-card rounded-2xl p-5 space-y-3">
            <h4 className="font-serif-warm font-bold text-base text-[#1c1917] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
              Human-Witnessed Deeds ({lineageData.confirmedContributions.length})
            </h4>

            {lineageData.confirmedContributions.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No confirmed contributions yet.</p>
            ) : (
              <div className="space-y-2">
                {lineageData.confirmedContributions.map((pl) => (
                  <div
                    key={pl.id}
                    className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#1c1917] block">{pl.description}</span>
                      <span className="text-stone-600 text-[11px] block">
                        Project: <strong>{pl.project?.title || 'Shared Project'}</strong>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-semibold text-[10px] shrink-0">
                      Confirmed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Opened Projects */}
          <div className="parchment-card rounded-2xl p-5 space-y-3">
            <h4 className="font-serif-warm font-bold text-base text-[#1c1917] flex items-center gap-2">
              <Compass className="w-4 h-4 text-stone-800" />
              Seeds Opened ({lineageData.openedProjects.length})
            </h4>

            {lineageData.openedProjects.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No projects opened yet.</p>
            ) : (
              <div className="space-y-2">
                {lineageData.openedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3 rounded-xl border border-[#e2d7c7] bg-white flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#1c1917] block">{proj.title}</span>
                      <span className="text-stone-500 text-[11px] block line-clamp-1">
                        {proj.story}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 font-mono text-[10px] uppercase">
                      {proj.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Capacities Helped Create */}
          <div className="parchment-card rounded-2xl p-5 space-y-3">
            <h4 className="font-serif-warm font-bold text-base text-[#1c1917] flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-800" />
              Harvest Capacities Helped Unlock ({lineageData.capacitiesHelped.length})
            </h4>

            {lineageData.capacitiesHelped.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No capacities unlocked yet.</p>
            ) : (
              <div className="space-y-2">
                {lineageData.capacitiesHelped.map((cap) => (
                  <div
                    key={cap.id}
                    className="p-3 rounded-xl border border-emerald-300 bg-emerald-100/40 text-xs space-y-1"
                  >
                    <span className="font-bold text-emerald-950 block">🌱 {cap.title}</span>
                    <span className="text-stone-700 block">{cap.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
