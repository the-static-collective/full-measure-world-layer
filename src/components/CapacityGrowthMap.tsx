import React, { useState } from 'react';
import { Capacity, Receipt, Project, Pledge, Profile } from '../types';
import {
  Sprout,
  FileCheck2,
  Compass,
  Calendar,
  Users,
  GitBranch,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Search,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
  Layers,
  MapPin,
  Clock,
  Trees,
  Copy,
  Check,
  Tag,
  Share2,
} from 'lucide-react';

interface Props {
  capacities: Array<Capacity & { receipt?: Receipt; project?: Project }>;
  receipts: Array<
    Receipt & {
      project?: Project;
      author?: Profile;
      confirmedPledges: Array<Pledge & { pledger?: Profile }>;
    }
  >;
  projects: Array<
    Project & { opener?: Profile; pledges: Array<Pledge & { pledger?: Profile }> }
  >;
  onSelectProject?: (projectId: string) => void;
}

export const CapacityGrowthMap: React.FC<Props> = ({
  capacities,
  receipts,
  projects,
  onSelectProject,
}) => {
  const [viewMode, setViewMode] = useState<'forest' | 'tree' | 'timeline'>('forest');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedCapacityId, setSelectedCapacityId] = useState<string | null>(
    capacities[0]?.id || null
  );

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtered capacities based on search query
  const filteredCapacities = capacities.filter((cap) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = cap.title.toLowerCase().includes(q);
    const descMatch = cap.description.toLowerCase().includes(q);
    const projMatch = cap.project?.title.toLowerCase().includes(q);
    return titleMatch || descMatch || projMatch;
  });

  const selectedCapacity = capacities.find((c) => c.id === selectedCapacityId) || filteredCapacities[0];
  const selectedReceipt = selectedCapacity
    ? receipts.find((r) => r.id === selectedCapacity.sourceReceiptId)
    : null;
  const selectedProject = selectedCapacity?.project || (selectedReceipt ? projects.find((p) => p.id === selectedReceipt.projectId) : null);

  // Count total distinct neighbors who contributed to capacities
  const totalContributorsCount = new Set(
    receipts.flatMap((r) => r.confirmedPledges.map((p) => p.pledgedBy))
  ).size;

  return (
    <div className="space-y-6 pb-8 animate-in fade-in">
      {/* World Map Header Stats */}
      <div className="parchment-card-warm rounded-3xl p-6 sm:p-7 border border-emerald-300/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-amber-100 flex items-center justify-center shadow-2xs">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-warm font-bold text-2xl text-[#1c1917]">
                Community Forest & Growth Map
              </h2>
              <p className="text-xs text-stone-600">
                Participation made addressable: seeds, sprouts, fruit harvests, and ecological graph edges.
              </p>
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-2xl border border-stone-300/60">
            <button
              onClick={() => setViewMode('forest')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'forest'
                  ? 'bg-emerald-900 text-amber-50 shadow-2xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <Trees className="w-3.5 h-3.5" />
              <span>Forest View</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'tree'
                  ? 'bg-emerald-900 text-amber-50 shadow-2xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Node Lineage</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'timeline'
                  ? 'bg-emerald-900 text-amber-50 shadow-2xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Chrono Growth</span>
            </button>
          </div>
        </div>

        {/* Milestone Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/80 p-3 rounded-2xl border border-emerald-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Capacities Unlocked
            </span>
            <span className="font-serif-warm font-bold text-2xl text-emerald-900">
              {capacities.length}
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-2xl border border-emerald-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Projects & Seeds
            </span>
            <span className="font-serif-warm font-bold text-2xl text-stone-900">
              {projects.length}
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-2xl border border-emerald-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Neighbors Involved
            </span>
            <span className="font-serif-warm font-bold text-2xl text-amber-900">
              {totalContributorsCount || 4}
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search capacities by name, project, or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
          />
        </div>
      </div>

      {/* Mode 0: Forest View (Zoom Out Ecological Tree) */}
      {viewMode === 'forest' && (
        <div className="space-y-6">
          <div className="parchment-card-warm rounded-3xl p-6 sm:p-8 space-y-6 border border-emerald-300">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/80 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-900 block">
                  Ecological Civilization Tree
                </span>
                <h3 className="font-serif-warm font-bold text-2xl text-[#1c1917]">
                  🌳 Jubilee Forest Graph
                </h3>
              </div>
              <p className="text-xs text-stone-600 max-w-md italic font-serif-warm">
                "Projects are seeds. Completed seeds drop new seeds, form branches, and grow civilizational capacity."
              </p>
            </div>

            {/* Visual Forest Tree Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Forest Trunk A: Community Oven & Hearth */}
              <div className="bg-white/90 rounded-2xl p-5 border border-amber-300/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-800 text-amber-50 flex items-center justify-center font-bold text-sm">
                      🌳
                    </div>
                    <div>
                      <h4 className="font-serif-warm font-bold text-base text-stone-900">
                        Community Oven Hearth
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-800 font-semibold">
                        jubilee://seed/oven_hearth_01
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                    Harvest Stage
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-stone-700">
                    <strong>Fruit:</strong> Fired Cob Oven & Shared Hearth
                  </p>
                  <div>
                    <strong className="text-stone-800 block mb-1">Makes Possible (Graph Edges):</strong>
                    <ul className="space-y-1 pl-1">
                      <li className="flex items-center gap-1.5 text-stone-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
                        Weekly Sourdough Bake Club
                      </li>
                      <li className="flex items-center gap-1.5 text-stone-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
                        Neighborhood Pizza Nights
                      </li>
                      <li className="flex items-center gap-1.5 text-stone-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
                        Harvest Festival Roasting
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Branches / Descendants */}
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                    Grafts & Descendant Seeds (3):
                  </span>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-stone-200">
                      <span className="font-semibold text-stone-800">🥖 Bread Club</span>
                      <span className="text-[10px] font-mono text-stone-500">2 Harvests</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-stone-200">
                      <span className="font-semibold text-stone-800">🍕 School Lunch Bake</span>
                      <span className="text-[10px] font-mono text-amber-700">Growing</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Forest Trunk B: Community Garden & Greenhouse */}
              <div className="bg-white/90 rounded-2xl p-5 border border-emerald-300/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-50 flex items-center justify-center font-bold text-sm">
                      🌱
                    </div>
                    <div>
                      <h4 className="font-serif-warm font-bold text-base text-stone-900">
                        Greenhouse & Garden Seed Bank
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-800 font-semibold">
                        jubilee://seed/project_greenhouse
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                    Sprout Stage
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-stone-700">
                    <strong>Fruit:</strong> 200 Heirloom Tomato & Pepper Seedlings
                  </p>
                  <div>
                    <strong className="text-stone-800 block mb-1">Makes Possible (Graph Edges):</strong>
                    <ul className="space-y-1 pl-1">
                      <li className="flex items-center gap-1.5 text-stone-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
                        Circle Seedling Bank
                      </li>
                      <li className="flex items-center gap-1.5 text-stone-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
                        Spring Neighborhood Plant Swap
                      </li>
                      <li className="flex items-center gap-1.5 text-stone-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
                        Year-round winter greens propagation
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Branches / Descendants */}
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                    Grafts & Descendant Seeds (2):
                  </span>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-stone-200">
                      <span className="font-semibold text-stone-800">🍂 Compost Hub</span>
                      <span className="text-[10px] font-mono text-emerald-800">Flowering</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-stone-200">
                      <span className="font-semibold text-stone-800">🌻 Seed Library</span>
                      <span className="text-[10px] font-mono text-stone-500">4 Grafts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Addressable Participation Explorer Box */}
            <div className="bg-emerald-900 text-amber-50 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="font-serif-warm font-bold text-sm">
                    Addressable Participation Reference
                  </span>
                </div>
                <span className="text-[10px] uppercase font-mono text-emerald-200">
                  Append-Only Witness Hash
                </span>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed font-sans">
                Every offer, seed, receipt, and pledge is permanently addressable with a unique URI scheme. Anyone in the circle can reference or graft onto past acts of participation.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {projects.map((p) => {
                  const hash = p.addressHash || `jubilee://seed/${p.id}`;
                  const isCopied = copiedHash === hash;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleCopyHash(hash)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-100 text-[11px] font-mono flex items-center gap-2 border border-emerald-700 transition-colors"
                      title="Click to copy URI address"
                    >
                      <span>{hash}</span>
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-300 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-emerald-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 1: Graphical Grafting Tree Map */}
      {viewMode === 'tree' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Node Tree Navigation (4 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="font-serif-warm font-bold text-base text-[#1c1917] flex items-center justify-between">
              <span>Unlocked Capacity Nodes</span>
              <span className="text-xs text-emerald-800 font-semibold">
                {filteredCapacities.length} Active
              </span>
            </h3>

            {filteredCapacities.length === 0 ? (
              <div className="parchment-card rounded-2xl p-8 text-center text-xs text-stone-500 font-serif-warm italic">
                No capacities match your search query.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCapacities.map((cap) => {
                  const isSelected = selectedCapacity?.id === cap.id;
                  return (
                    <button
                      key={cap.id}
                      onClick={() => setSelectedCapacityId(cap.id)}
                      className={`w-full text-left p-4 rounded-2xl transition-all border ${
                        isSelected
                          ? 'bg-emerald-900 text-amber-50 border-emerald-950 shadow-md ring-2 ring-emerald-600/30'
                          : 'bg-white hover:bg-stone-50 text-stone-900 border-[#e2d7c7]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sprout
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-amber-200' : 'text-emerald-800'
                            }`}
                          />
                          <span className="font-serif-warm font-bold text-sm leading-tight">
                            {cap.title}
                          </span>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isSelected ? 'text-amber-200 translate-x-1' : 'text-stone-400'
                          }`}
                        />
                      </div>

                      <p
                        className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${
                          isSelected ? 'text-emerald-100' : 'text-stone-600'
                        }`}
                      >
                        {cap.description}
                      </p>

                      {cap.project && (
                        <div
                          className={`mt-2.5 pt-2 border-t text-[11px] flex items-center justify-between ${
                            isSelected
                              ? 'border-emerald-800/80 text-emerald-200'
                              : 'border-stone-100 text-stone-500'
                          }`}
                        >
                          <span className="truncate">From: {cap.project.title}</span>
                          <span className="font-mono text-[10px] shrink-0 ml-1">
                            {new Date(cap.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Lineage Visualization Card (7 cols) */}
          <div className="lg:col-span-7">
            {selectedCapacity ? (
              <div className="parchment-card-warm rounded-3xl p-6 sm:p-7 space-y-6 border border-emerald-300 sticky top-24">
                {/* Node Lineage Badge */}
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5 text-emerald-800" />
                    Living Capacity Lineage
                  </span>

                  <span className="text-xs text-stone-500 font-mono">
                    Unlocked {new Date(selectedCapacity.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* 1. Unlocked Capacity Header */}
                <div className="space-y-2">
                  <h3 className="font-serif-warm font-bold text-2xl text-emerald-950 leading-tight">
                    🌱 {selectedCapacity.title}
                  </h3>
                  <p className="text-sm text-stone-800 leading-relaxed font-sans bg-white/70 p-4 rounded-2xl border border-emerald-200/60">
                    {selectedCapacity.description}
                  </p>
                </div>

                {/* Relational Chain Connector Graphic */}
                <div className="relative pl-6 space-y-6 border-l-2 border-dashed border-emerald-400/80 my-2">
                  {/* Step A: Origin Project */}
                  <div className="relative space-y-1.5">
                    <div className="absolute -left-[31px] top-0 w-5 h-5 rounded-full bg-amber-800 text-amber-50 flex items-center justify-center font-bold text-[10px]">
                      1
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                      Enabling Project
                    </span>

                    {selectedProject ? (
                      <div className="bg-white p-4 rounded-2xl border border-[#e2d7c7] space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif-warm font-bold text-sm text-[#1c1917]">
                            {selectedProject.title}
                          </h4>
                          {onSelectProject && (
                            <button
                              onClick={() => onSelectProject(selectedProject.id)}
                              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                            >
                              <span>View Project</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-stone-600 line-clamp-2">{selectedProject.story}</p>
                        {selectedProject.locationNote && (
                          <span className="text-[11px] text-stone-500 flex items-center gap-1 pt-1">
                            <MapPin className="w-3 h-3 text-amber-800" />
                            {selectedProject.locationNote}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500 italic">Project details archived.</p>
                    )}
                  </div>

                  {/* Step B: Permanent Circle Receipt */}
                  <div className="relative space-y-1.5">
                    <div className="absolute -left-[31px] top-0 w-5 h-5 rounded-full bg-emerald-800 text-emerald-50 flex items-center justify-center font-bold text-[10px]">
                      2
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block">
                      Permanent Receipt Record
                    </span>

                    {selectedReceipt ? (
                      <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                        <span className="font-bold text-[#1c1917] block">
                          {selectedReceipt.summary}
                        </span>
                        <p className="text-stone-700 leading-relaxed">
                          {selectedReceipt.outcome}
                        </p>

                        {/* Confirmed Contributors */}
                        {selectedReceipt.confirmedPledges &&
                          selectedReceipt.confirmedPledges.length > 0 && (
                            <div className="pt-2 border-t border-emerald-100 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                                Confirmed Neighbor Contributions:
                              </span>
                              <div className="space-y-1">
                                {selectedReceipt.confirmedPledges.map((pl) => (
                                  <div
                                    key={pl.id}
                                    className="flex items-center gap-1.5 text-stone-800 text-[11px]"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                    <span>
                                      <strong>{pl.pledger?.displayName || 'Neighbor'}:</strong>{' '}
                                      {pl.description}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500 italic">Receipt logged in circle archive.</p>
                    )}
                  </div>

                  {/* Step C: Future Grafting Possibility */}
                  {selectedProject?.futurePossibility && (
                    <div className="relative space-y-1.5">
                      <div className="absolute -left-[31px] top-0 w-5 h-5 rounded-full bg-[#c86d51] text-amber-50 flex items-center justify-center font-bold text-[10px]">
                        3
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        Grafted Future Possibility
                      </span>
                      <div className="bg-emerald-100/60 p-4 rounded-2xl border border-emerald-300 italic text-xs text-emerald-950 font-serif-warm leading-relaxed">
                        "{selectedProject.futurePossibility}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="parchment-card rounded-3xl p-12 text-center text-stone-500 font-serif-warm italic text-xs">
                Select a capacity node on the left to inspect its living world map lineage.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Chrono Timeline Stream */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          <div className="relative pl-8 space-y-8 border-l-2 border-emerald-300 ml-4">
            {capacities.map((cap, idx) => (
              <div key={cap.id} className="relative space-y-3">
                {/* Timeline Dot */}
                <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-emerald-800 border-2 border-amber-50 text-amber-50 flex items-center justify-center font-bold text-[10px] shadow-2xs">
                  {capacities.length - idx}
                </div>

                <div className="parchment-card rounded-3xl p-6 space-y-3 border border-emerald-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8e2d8] pb-3">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-5 h-5 text-emerald-800" />
                      <h3 className="font-serif-warm font-bold text-xl text-[#1c1917]">
                        {cap.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-stone-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {new Date(cap.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed font-sans">
                    {cap.description}
                  </p>

                  {/* Origin link */}
                  {cap.project && (
                    <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                          Enabled By Project
                        </span>
                        <span className="font-bold text-[#1c1917]">{cap.project.title}</span>
                      </div>
                      {onSelectProject && (
                        <button
                          onClick={() => onSelectProject(cap.project!.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-amber-50 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>Open Project</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
