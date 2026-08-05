import React, { useState } from 'react';
import { Project, Profile, Offer } from '../types';
import { api, getCurrentUserId } from '../lib/api';
import {
  Compass,
  Plus,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  X,
  Sparkles,
  Sprout,
  Trash2,
  ArrowRight,
} from 'lucide-react';

interface Props {
  projects: Array<
    Project & { opener?: Profile; pledges: Array<{ id: string; status: string; pledger?: Profile }> }
  >;
  offers: Array<Offer & { author?: Profile }>;
  onSelectProject: (id: string) => void;
  onRefresh: () => void;
}

export const ProjectsView: React.FC<Props> = ({
  projects,
  offers,
  onSelectProject,
  onRefresh,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'forming' | 'completed'>('all');
  const [openModal, setOpenModal] = useState(false);

  // New Project Form state
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [futurePossibility, setFuturePossibility] = useState('');
  const [needsInput, setNeedsInput] = useState<
    Array<{ title: string; description: string; quantity: string; unit: string }>
  >([
    { title: '', description: '', quantity: '', unit: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddNeedRow = () => {
    setNeedsInput([...needsInput, { title: '', description: '', quantity: '', unit: '' }]);
  };

  const handleRemoveNeedRow = (idx: number) => {
    setNeedsInput(needsInput.filter((_, i) => i !== idx));
  };

  const handleUpdateNeedRow = (
    idx: number,
    field: 'title' | 'description' | 'quantity' | 'unit',
    value: string
  ) => {
    const next = [...needsInput];
    next[idx][field] = value;
    setNeedsInput(next);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !story.trim()) return;

    setLoading(true);
    setError(null);

    const validNeeds = needsInput
      .filter((n) => n.title.trim().length > 0)
      .map((n) => ({
        title: n.title.trim(),
        description: n.description.trim() || undefined,
        quantity: n.quantity ? Number(n.quantity) : undefined,
        unit: n.unit.trim() || undefined,
      }));

    try {
      const res = await api.createProject({
        title: title.trim(),
        story: story.trim(),
        locationNote: locationNote.trim() || undefined,
        desiredDate: desiredDate.trim() || undefined,
        futurePossibility: futurePossibility.trim() || undefined,
        needs: validNeeds,
      });

      setTitle('');
      setStory('');
      setLocationNote('');
      setDesiredDate('');
      setFuturePossibility('');
      setNeedsInput([{ title: '', description: '', quantity: '', unit: '' }]);
      setOpenModal(false);
      onRefresh();
      onSelectProject(res.id);
    } catch (err: any) {
      setError(err.message || 'Could not open project');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filterStatus === 'forming') return p.status !== 'completed';
    if (filterStatus === 'completed') return p.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e2d8] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-800" />
            <h2 className="font-serif-warm text-2xl font-bold text-[#1c1917]">
              The Quest Garden
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Endeavors the circle is bringing into being together through pledged gifts.
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-[#4a6b53] hover:bg-[#3d5a43] text-amber-50 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Open a seed</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e8e2d8] pb-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            filterStatus === 'all'
              ? 'bg-[#2c2825] text-amber-50 font-semibold'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          All Quests ({projects.length})
        </button>
        <button
          onClick={() => setFilterStatus('forming')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            filterStatus === 'forming'
              ? 'bg-[#2c2825] text-amber-50 font-semibold'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Open & Active ({projects.filter((p) => p.status !== 'completed').length})
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            filterStatus === 'completed'
              ? 'bg-[#2c2825] text-amber-50 font-semibold'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Completed ({projects.filter((p) => p.status === 'completed').length})
        </button>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="parchment-card rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm font-serif-warm italic text-stone-600">
            No projects in this view yet.
          </p>
          <button
            onClick={() => setOpenModal(true)}
            className="px-4 py-2 rounded-xl border border-emerald-800 text-emerald-900 text-xs font-semibold hover:bg-emerald-50 transition-colors"
          >
            Open the first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const confirmedCount = project.pledges.filter((p) => p.status === 'confirmed').length;
            const uniquePledgers = new Set(project.pledges.map((p) => p.pledger?.displayName)).size;

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="parchment-card rounded-2xl p-6 hover:border-emerald-700/50 hover:shadow-md transition-all cursor-pointer space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Opener & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          project.opener?.avatarColor || 'bg-emerald-800 text-emerald-50'
                        }`}
                      >
                        {project.opener
                          ? project.opener.displayName.substring(0, 2).toUpperCase()
                          : '?'}
                      </div>
                      <span className="text-xs font-medium text-stone-600">
                        Opened by <strong className="text-stone-900">{project.opener?.displayName || 'Neighbor'}</strong>
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        project.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {project.status === 'completed' ? 'Completed' : 'Forming & Open'}
                    </span>
                  </div>

                  {/* Title & Story */}
                  <div>
                    <h3 className="font-serif-warm font-bold text-xl text-[#1c1917] group-hover:text-emerald-900 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-stone-600 line-clamp-2 mt-1 leading-relaxed">
                      {project.story}
                    </p>
                  </div>

                  {/* BananaGram Future Possibility Quote */}
                  {project.futurePossibility && (
                    <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 text-xs text-emerald-950 flex items-start gap-2">
                      <Sprout className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span className="italic leading-relaxed font-serif-warm">
                        "{project.futurePossibility}"
                      </span>
                    </div>
                  )}

                  {/* Makes Possible List (First-class field) */}
                  {project.makesPossible && project.makesPossible.length > 0 && (
                    <div className="space-y-1 text-xs bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/70">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                        Makes Possible:
                      </span>
                      <ul className="space-y-0.5">
                        {project.makesPossible.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-stone-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Addressable URI Tag */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-emerald-800 pt-1">
                    <span className="bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                      {project.addressHash || `jubilee://seed/${project.id}`}
                    </span>
                    {project.seedStage && (
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold uppercase">
                        {project.seedStage}
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-1">
                    {project.desiredDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {project.desiredDate}
                      </span>
                    )}
                    {project.locationNote && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {project.locationNote}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="border-t border-[#e8e2d8] pt-3 flex items-center justify-between text-xs text-stone-600">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-stone-800">
                      {project.needs.length} {project.needs.length === 1 ? 'need' : 'needs'}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-800 font-medium">
                      <Users className="w-3.5 h-3.5" />
                      {uniquePledgers} {uniquePledgers === 1 ? 'neighbor' : 'neighbors'}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 font-semibold text-emerald-900 group-hover:translate-x-1 transition-transform">
                    <span>View Project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Open Project Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="parchment-card-warm w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setOpenModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-800" />
                <h3 className="font-serif-warm text-xl font-bold text-[#1c1917]">
                  Open a Project
                </h3>
              </div>
              <p className="text-xs text-stone-600">
                Describe something the circle can make possible together through pledged contributions.
              </p>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  What are we trying to make possible? *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Repair the Greenhouse, Record an acoustic album, Saturday Garden Bed"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Why does it matter? (Story) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Tell the circle why this endeavor matters and what outcome it creates..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Desired Date
                  </label>
                  <input
                    type="text"
                    value={desiredDate}
                    onChange={(e) => setDesiredDate(e.target.value)}
                    placeholder="e.g. This Saturday, Next Month"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Location Note
                  </label>
                  <input
                    type="text"
                    value={locationNote}
                    onChange={(e) => setLocationNote(e.target.value)}
                    placeholder="e.g. Back parcel, Community Hearth"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
                  />
                </div>
              </div>

              {/* BananaGram Future Possibility Seed Field */}
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-700" />
                  If this succeeds... what becomes possible next?
                </label>
                <input
                  type="text"
                  value={futurePossibility}
                  onChange={(e) => setFuturePossibility(e.target.value)}
                  placeholder="e.g. The circle can start 200 heirloom tomato seedlings for all neighbors!"
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
                />
              </div>

              {/* Needed Contributions Builder */}
              <div className="space-y-3 border-t border-[#e8e2d8] pt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                    Needed Contributions
                  </label>
                  <button
                    type="button"
                    onClick={handleAddNeedRow}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Need</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {needsInput.map((needRow, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-[#d8cebe] bg-white space-y-2 relative"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={needRow.title}
                          onChange={(e) => handleUpdateNeedRow(idx, 'title', e.target.value)}
                          placeholder="Need title (e.g. Pickup truck, 2 hours digging, Lunch)"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-800"
                        />
                        {needsInput.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveNeedRow(idx)}
                            className="p-1 rounded text-stone-400 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={needRow.quantity}
                          onChange={(e) => handleUpdateNeedRow(idx, 'quantity', e.target.value)}
                          placeholder="Qty (e.g. 2)"
                          className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-800"
                        />
                        <input
                          type="text"
                          value={needRow.unit}
                          onChange={(e) => handleUpdateNeedRow(idx, 'unit', e.target.value)}
                          placeholder="Unit (e.g. people, hours, meal)"
                          className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-700 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading || !title.trim() || !story.trim()}
                className="w-full py-3 px-5 rounded-2xl bg-[#4a6b53] hover:bg-[#3d5a43] text-amber-50 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                Open Project for Circle
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
