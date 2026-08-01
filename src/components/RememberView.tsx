import React, { useState } from 'react';
import { Receipt, Capacity, DomainEvent, Profile, Project, Pledge } from '../types';
import { CapacityGrowthMap } from './CapacityGrowthMap';
import {
  BookOpen,
  FileCheck2,
  Sprout,
  Clock,
  GitBranch,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  Compass,
} from 'lucide-react';

interface Props {
  receipts: Array<
    Receipt & {
      project?: Project;
      author?: Profile;
      confirmedPledges: Array<Pledge & { pledger?: Profile }>;
    }
  >;
  capacities: Array<Capacity & { receipt?: Receipt; project?: Project }>;
  events: Array<DomainEvent & { actor?: Profile }>;
  projects?: Array<
    Project & { opener?: Profile; pledges: Array<Pledge & { pledger?: Profile }> }
  >;
  onSelectProject?: (projectId: string) => void;
}

export const RememberView: React.FC<Props> = ({
  receipts,
  capacities,
  events,
  projects = [],
  onSelectProject,
}) => {
  const [subTab, setSubTab] = useState<'growth_map' | 'receipts' | 'capacities' | 'ecology' | 'events'>('growth_map');

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="border-b border-[#e8e2d8] pb-4 space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-stone-800" />
          <h2 className="font-serif-warm text-2xl font-bold text-[#1c1917]">
            The Chronicle
          </h2>
        </div>
        <p className="text-xs text-stone-600">
          Permanent receipts, unlocked capacities, and the living world map of The First Campfire.
        </p>
      </div>

      {/* Sub-Tab Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#e8e2d8] no-scrollbar">
        <button
          onClick={() => setSubTab('growth_map')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            subTab === 'growth_map'
              ? 'bg-[#2c2825] text-amber-50 shadow-2xs'
              : 'bg-white border border-[#e2d7c7] text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-amber-300" />
          <span>Capacity Growth Map</span>
        </button>

        <button
          onClick={() => setSubTab('receipts')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            subTab === 'receipts'
              ? 'bg-[#2c2825] text-amber-50 shadow-2xs'
              : 'bg-white border border-[#e2d7c7] text-stone-600 hover:bg-stone-50'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Receipts ({receipts.length})</span>
        </button>

        <button
          onClick={() => setSubTab('capacities')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            subTab === 'capacities'
              ? 'bg-[#2c2825] text-amber-50 shadow-2xs'
              : 'bg-white border border-[#e2d7c7] text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Sprout className="w-3.5 h-3.5" />
          <span>Unlocked Capacities ({capacities.length})</span>
        </button>

        <button
          onClick={() => setSubTab('ecology')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            subTab === 'ecology'
              ? 'bg-[#2c2825] text-amber-50 shadow-2xs'
              : 'bg-white border border-[#e2d7c7] text-stone-600 hover:bg-stone-50'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Possibility Graph</span>
        </button>

        <button
          onClick={() => setSubTab('events')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            subTab === 'events'
              ? 'bg-[#2c2825] text-amber-50 shadow-2xs'
              : 'bg-white border border-[#e2d7c7] text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Domain Event Log ({events.length})</span>
        </button>
      </div>

      {/* 0. Capacity Growth Map View */}
      {subTab === 'growth_map' && (
        <CapacityGrowthMap
          capacities={capacities}
          receipts={receipts}
          projects={projects}
          onSelectProject={onSelectProject}
        />
      )}

      {/* 1. Receipts View */}
      {subTab === 'receipts' && (
        <div className="space-y-4">
          {receipts.length === 0 ? (
            <div className="parchment-card rounded-2xl p-10 text-center text-stone-500 font-serif-warm italic text-xs">
              No project receipts recorded yet. Complete an active project to record the first receipt!
            </div>
          ) : (
            receipts.map((receipt) => (
              <div key={receipt.id} className="parchment-card-warm rounded-3xl p-6 sm:p-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2d7c7] pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
                      Permanent Receipt
                    </span>
                    <h3 className="font-serif-warm font-bold text-xl text-[#1c1917]">
                      {receipt.summary}
                    </h3>
                  </div>
                  <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    {new Date(receipt.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-stone-800">
                  <p className="whitespace-pre-wrap leading-relaxed font-sans text-sm">
                    {receipt.outcome}
                  </p>
                </div>

                {/* Confirmed Neighbors & Contributions */}
                {receipt.confirmedPledges.length > 0 && (
                  <div className="bg-white/80 p-3.5 rounded-2xl border border-[#e2d7c7] space-y-2 text-xs">
                    <span className="font-bold text-[#1c1917] block flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-800" />
                      Participating Neighbors & Confirmed Contributions
                    </span>
                    <div className="space-y-1.5">
                      {receipt.confirmedPledges.map((pl) => (
                        <div key={pl.id} className="flex items-center gap-2 text-stone-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>
                            <strong className="text-stone-900">{pl.pledger?.displayName}:</strong>{' '}
                            {pl.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. What We Can Do Now (Capacities) */}
      {subTab === 'capacities' && (
        <div className="space-y-4">
          <p className="text-xs text-stone-600 font-serif-warm italic">
            "Capacities are capabilities the circle can now execute together that were not reliably available before."
          </p>

          {capacities.length === 0 ? (
            <div className="parchment-card rounded-2xl p-10 text-center text-stone-500 font-serif-warm italic text-xs">
              No circle capacities created yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {capacities.map((cap) => (
                <div
                  key={cap.id}
                  className="parchment-card rounded-2xl p-5 space-y-3 border-l-4 border-l-emerald-800"
                >
                  <div className="flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-emerald-800 shrink-0" />
                    <h3 className="font-serif-warm font-bold text-lg text-[#1c1917]">
                      {cap.title}
                    </h3>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed font-sans">
                    {cap.description}
                  </p>

                  {cap.project && (
                    <div className="text-[11px] text-stone-500 border-t border-[#e8e2d8] pt-2">
                      Created through project:{' '}
                      <strong className="text-stone-800">{cap.project.title}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Possibility Graph / Ecology */}
      {subTab === 'ecology' && (
        <div className="space-y-6">
          <div className="parchment-card-warm rounded-3xl p-6 sm:p-8 space-y-4 border border-emerald-300">
            <div className="flex items-center gap-2 text-emerald-950">
              <GitBranch className="w-6 h-6 text-emerald-800" />
              <h3 className="font-serif-warm font-bold text-xl">
                The Possibility & Grafting Graph
              </h3>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              Every completed project in Jubilee Campfire leaves behind reusable community capacity.
              One seed unlocks future grafts that adjacent neighbors can harvest and expand upon.
            </p>

            <div className="space-y-4 pt-2">
              {capacities.map((cap) => (
                <div
                  key={cap.id}
                  className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase tracking-wider">
                      Unlocked Capacity
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {new Date(cap.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="font-serif-warm font-bold text-base text-[#1c1917]">
                    🌱 {cap.title}
                  </h4>
                  <p className="text-xs text-stone-700">{cap.description}</p>

                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1">
                    <span className="font-bold text-stone-800 block text-[11px] uppercase tracking-wider">
                      Future Grafts Enabled:
                    </span>
                    <ul className="list-disc list-inside text-stone-600 space-y-0.5 text-[11px]">
                      <li>Neighbor seedling swaps and heirloom seed bank</li>
                      <li>Seasonal communal dinners and harvest hearth bakes</li>
                      <li>Shared tool shed & maintenance workdays</li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Domain Event History */}
      {subTab === 'events' && (
        <div className="space-y-3">
          <p className="text-xs text-stone-600 font-serif-warm italic">
            "Domain events are append-only memory. Historical transitions are preserved forever."
          </p>

          <div className="space-y-2">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="parchment-card rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${
                      evt.actor?.avatarColor || 'bg-stone-700 text-stone-50'
                    }`}
                  >
                    {evt.actor ? evt.actor.displayName.substring(0, 2).toUpperCase() : '?'}
                  </div>
                  <div>
                    <span className="font-bold text-[#1c1917]">{evt.eventType}</span>
                    <span className="text-stone-500 text-[11px] ml-2">
                      by {evt.actor?.displayName || 'Neighbor'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px] text-stone-500 shrink-0">
                  <span>{new Date(evt.createdAt).toLocaleTimeString()}</span>
                  <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                    {evt.aggregateType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
