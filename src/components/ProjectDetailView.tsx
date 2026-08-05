import React, { useState, useEffect } from 'react';
import { Project, Profile, Pledge, Receipt, Capacity, DomainEvent, Offer } from '../types';
import { api, getCurrentUserId } from '../lib/api';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Sprout,
  Plus,
  X,
  FileCheck2,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  Check,
  RotateCcw,
} from 'lucide-react';

interface Props {
  projectId: string;
  offers: Array<Offer & { author?: Profile }>;
  onBack: () => void;
  onRefresh: () => void;
}

export const ProjectDetailView: React.FC<Props> = ({
  projectId,
  offers,
  onBack,
  onRefresh,
}) => {
  const [projectData, setProjectData] = useState<
    | (Project & {
        opener?: Profile;
        pledges: Array<Pledge & { pledger?: Profile }>;
        receipt?: Receipt;
        capacities: Capacity[];
        events: DomainEvent[];
      })
    | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pledge modal
  const [openPledgeModal, setOpenPledgeModal] = useState(false);
  const [pledgeOfferId, setPledgeOfferId] = useState<string>('');
  const [pledgeNeedId, setPledgeNeedId] = useState<string>('');
  const [pledgeDesc, setPledgeDesc] = useState('');
  const [pledgeQty, setPledgeQty] = useState('');
  const [pledgeUnit, setPledgeUnit] = useState('');
  const [submittingPledge, setSubmittingPledge] = useState(false);

  // Complete project modal
  const [openCompleteModal, setOpenCompleteModal] = useState(false);
  const [receiptSummary, setReceiptSummary] = useState('');
  const [receiptOutcome, setReceiptOutcome] = useState('');
  const [capacityTitle, setCapacityTitle] = useState('');
  const [capacityDesc, setCapacityDesc] = useState('');
  const [submittingComplete, setSubmittingComplete] = useState(false);

  const activeUserId = getCurrentUserId();

  const loadProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProject(projectId);
      setProjectData(data);
      // pre-fill receipt title
      setReceiptSummary(data.title);
    } catch (err: any) {
      setError(err.message || 'Could not load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="py-12 text-center text-stone-500 font-serif-warm italic">
        Gathering project details around the fire...
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="py-8 space-y-4 text-center">
        <p className="text-sm text-red-700 font-medium">{error || 'Project not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 text-xs font-semibold"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  const isOpener = projectData.openedBy === activeUserId;

  // Keyword / category matching for "Possible neighbors to ask"
  const possibleNeighbors = offers.filter((o) => {
    if (o.status !== 'available') return false;
    const projectText = (
      projectData.title +
      ' ' +
      projectData.story +
      ' ' +
      projectData.needs.map((n) => n.title).join(' ')
    ).toLowerCase();

    const offerText = (o.title + ' ' + (o.description || '') + ' ' + o.category).toLowerCase();

    const keywords = ['truck', 'drill', 'digging', 'lift', 'food', 'soup', 'singing', 'music', 'repair', 'car', 'haul'];
    return keywords.some((kw) => projectText.includes(kw) && offerText.includes(kw));
  });

  const handleCreatePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pledgeDesc.trim()) return;

    setSubmittingPledge(true);
    try {
      await api.createPledge({
        projectId: projectData.id,
        needId: pledgeNeedId || undefined,
        offerId: pledgeOfferId || undefined,
        description: pledgeDesc.trim(),
        quantity: pledgeQty ? Number(pledgeQty) : undefined,
        unit: pledgeUnit.trim() || undefined,
      });

      setPledgeOfferId('');
      setPledgeNeedId('');
      setPledgeDesc('');
      setPledgeQty('');
      setPledgeUnit('');
      setOpenPledgeModal(false);
      await loadProject();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Could not propose pledge');
    } finally {
      setSubmittingPledge(false);
    }
  };

  const handlePledgeTransition = async (
    pledgeId: string,
    action: 'accept' | 'decline' | 'withdraw' | 'report_complete' | 'confirm'
  ) => {
    try {
      await api.transitionPledge(pledgeId, action);
      await loadProject();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Could not update pledge');
    }
  };

  const handleCompleteProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptSummary.trim() || !receiptOutcome.trim()) return;

    setSubmittingComplete(true);
    try {
      await api.completeProject(projectData.id, {
        summary: receiptSummary.trim(),
        outcome: receiptOutcome.trim(),
        newCapacityTitle: capacityTitle.trim() || undefined,
        newCapacityDescription: capacityDesc.trim() || undefined,
      });

      setOpenCompleteModal(false);
      await loadProject();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Could not complete project');
    } finally {
      setSubmittingComplete(false);
    }
  };

  // Pre-fill pledge description if an offer is chosen
  const handleSelectOfferForPledge = (offerId: string) => {
    setPledgeOfferId(offerId);
    if (offerId) {
      const off = offers.find((o) => o.id === offerId);
      if (off && !pledgeDesc) {
        setPledgeDesc(`I can bring my ${off.title}`);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-xl hover:bg-stone-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to All Projects</span>
      </button>

      {/* Main Project Card */}
      <div className="parchment-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8e2d8] pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                projectData.opener?.avatarColor || 'bg-emerald-800 text-emerald-50'
              }`}
            >
              {projectData.opener
                ? projectData.opener.displayName.substring(0, 2).toUpperCase()
                : '?'}
            </div>
            <div>
              <span className="text-xs text-stone-500 font-medium block">Project Opener</span>
              <span className="text-sm font-bold text-[#1c1917]">
                {projectData.opener?.displayName || 'Neighbor'}
              </span>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              projectData.status === 'completed'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            {projectData.status === 'completed' ? 'Completed' : 'Forming & Open'}
          </span>
        </div>

        {/* Title & Story */}
        <div className="space-y-3">
          <h1 className="font-serif-warm font-bold text-2xl sm:text-3xl text-[#1c1917] leading-tight">
            {projectData.title}
          </h1>

          <p className="text-sm text-stone-700 leading-relaxed font-sans whitespace-pre-wrap">
            {projectData.story}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 pt-1">
            {projectData.desiredDate && (
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-amber-800" />
                {projectData.desiredDate}
              </span>
            )}
            {projectData.locationNote && (
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-amber-800" />
                {projectData.locationNote}
              </span>
            )}
          </div>
        </div>

        {/* BananaGram Seed Field */}
        {projectData.futurePossibility && (
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200/80 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-emerald-700" />
              If this succeeds... what becomes possible next?
            </span>
            <p className="font-serif-warm italic text-sm text-emerald-950 leading-relaxed">
              "{projectData.futurePossibility}"
            </p>
          </div>
        )}

        {/* Needed Contributions List */}
        <div className="space-y-3 border-t border-[#e8e2d8] pt-5">
          <h3 className="font-serif-warm font-bold text-lg text-[#1c1917]">
            Needed Contributions
          </h3>

          {projectData.needs.length === 0 ? (
            <p className="text-xs text-stone-500 italic">No specific needs listed.</p>
          ) : (
            <div className="space-y-2">
              {projectData.needs.map((need) => (
                <div
                  key={need.id}
                  className="p-3 rounded-xl border border-[#e2d7c7] bg-white flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[#1c1917] block">{need.title}</span>
                    {need.description && (
                      <span className="text-stone-500 block">{need.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {need.quantity && (
                      <span className="px-2 py-0.5 rounded bg-stone-100 font-mono text-[11px] text-stone-700">
                        {need.quantity} {need.unit || ''}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        need.status === 'met'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {need.status === 'met' ? 'Met' : 'Open'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action to Pledge Contribution */}
          {projectData.status !== 'completed' && (
            <button
              onClick={() => setOpenPledgeModal(true)}
              className="w-full py-3 px-4 rounded-2xl bg-[#c86d51] hover:bg-[#b05a40] text-amber-50 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs mt-2"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              I can bring something (Pledge Contribution)
            </button>
          )}
        </div>

        {/* Transparent Neighbor Matching Box */}
        {possibleNeighbors.length > 0 && projectData.status !== 'completed' && (
          <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-300/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-700" />
                Transparent Neighbor Matching
              </span>
              <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">
                Capability Alignment
              </span>
            </div>

            <p className="text-[11px] text-stone-600 italic font-serif-warm">
              Jubilee intentionally uses transparent capability matching rather than black-box AI recommendation scores.
            </p>

            <div className="space-y-2">
              {possibleNeighbors.map((off) => (
                <div
                  key={off.id}
                  className="bg-white p-3 rounded-xl border border-amber-200 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1c1917]">{off.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-[10px]">
                      {off.category}
                    </span>
                  </div>
                  <p className="text-stone-600 text-[11px]">
                    Offered by <strong>{off.author?.displayName || 'Neighbor'}</strong> ({off.availability || 'Available'})
                  </p>
                  {off.makesPossible && off.makesPossible.length > 0 && (
                    <div className="text-[11px] text-emerald-800 font-medium pt-1 border-t border-amber-100">
                      Matches capability: {off.makesPossible.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pledges & Contributions Section */}
      <div className="parchment-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-[#e8e2d8] pb-3">
          <h3 className="font-serif-warm font-bold text-xl text-[#1c1917]">
            Pledged Contributions ({projectData.pledges.length})
          </h3>

          {/* Complete Project Button for Opener */}
          {isOpener &&
            projectData.status !== 'completed' &&
            projectData.pledges.some((pledge) => pledge.status === 'confirmed') && (
            <button
              onClick={() => setOpenCompleteModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-amber-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <FileCheck2 className="w-4 h-4" />
              Complete & Write Receipt
            </button>
          )}
        </div>

        {projectData.pledges.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-4 text-center">
            No pledges proposed yet. Be the first to bring a gift to this project!
          </p>
        ) : (
          <div className="space-y-3">
            {projectData.pledges.map((pledge) => {
              const isPledgeAuthor = pledge.pledgedBy === activeUserId;

              return (
                <div
                  key={pledge.id}
                  className="p-4 rounded-2xl border border-[#e2d7c7] bg-white space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          pledge.pledger?.avatarColor || 'bg-stone-700 text-stone-50'
                        }`}
                      >
                        {pledge.pledger
                          ? pledge.pledger.displayName.substring(0, 2).toUpperCase()
                          : '?'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1c1917] block">
                          {pledge.pledger?.displayName || 'Neighbor'}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          Pledged {new Date(pledge.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        pledge.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : pledge.status === 'accepted' || pledge.status === 'reported_complete'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : pledge.status === 'declined' || pledge.status === 'withdrawn'
                          ? 'bg-stone-200 text-stone-600'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {pledge.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-stone-800 font-medium leading-relaxed">
                    "{pledge.description}"
                    {pledge.quantity && (
                      <span className="text-stone-500 font-normal ml-1">
                        ({pledge.quantity} {pledge.unit || ''})
                      </span>
                    )}
                  </p>

                  {/* Transition Controls with Strict Authority Checks */}
                  <div className="border-t border-stone-100 pt-2 flex flex-wrap items-center justify-end gap-2 text-xs">
                    {/* Opener Action: Accept or Decline proposed pledge */}
                    {isOpener && pledge.status === 'proposed' && (
                      <>
                        <button
                          onClick={() => handlePledgeTransition(pledge.id, 'decline')}
                          className="px-2.5 py-1 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 font-medium"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handlePledgeTransition(pledge.id, 'accept')}
                          className="px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-emerald-50 font-semibold"
                        >
                          Accept Pledge
                        </button>
                      </>
                    )}

                    {/* Pledge Author Action: Withdraw proposed/accepted pledge */}
                    {isPledgeAuthor &&
                      ['proposed', 'accepted'].includes(pledge.status) && (
                        <button
                          onClick={() => handlePledgeTransition(pledge.id, 'withdraw')}
                          className="px-2.5 py-1 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 font-medium"
                        >
                          Withdraw
                        </button>
                      )}

                    {/* Pledge Author Action: Report complete when accepted */}
                    {isPledgeAuthor && pledge.status === 'accepted' && (
                      <button
                        onClick={() => handlePledgeTransition(pledge.id, 'report_complete')}
                        className="px-3 py-1 rounded-lg bg-[#c86d51] hover:bg-[#b05a40] text-amber-50 font-semibold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Report Completed
                      </button>
                    )}

                    {/* A different human may witness only after the contributor reports. */}
                    {isOpener &&
                      !isPledgeAuthor &&
                      pledge.status === 'reported_complete' && (
                        <button
                          onClick={() => handlePledgeTransition(pledge.id, 'confirm')}
                          className="px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-emerald-50 font-semibold flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Confirm Contribution
                        </button>
                      )}

                    {pledge.status === 'confirmed' && (
                      <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirmed Contribution
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isOpener &&
          projectData.status !== 'completed' &&
          !projectData.pledges.some((pledge) => pledge.status === 'confirmed') && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Harvest unlocks after at least one contributor reports and another
              human confirms the deed.
            </div>
          )}
      </div>

      {/* Permanent Receipt Box if Completed */}
      {projectData.receipt && (
        <div className="parchment-card-warm rounded-3xl p-6 sm:p-8 space-y-4 border border-emerald-300/80">
          <div className="flex items-center gap-2 text-emerald-900 border-b border-emerald-200 pb-3">
            <FileCheck2 className="w-6 h-6" />
            <h3 className="font-serif-warm font-bold text-xl">
              Permanent Circle Receipt
            </h3>
          </div>

          <div className="space-y-2 text-xs text-stone-800">
            <p>
              <strong className="font-semibold text-stone-900">Summary:</strong>{' '}
              {projectData.receipt.summary}
            </p>
            <p className="whitespace-pre-wrap leading-relaxed">
              <strong className="font-semibold text-stone-900">Outcome:</strong>{' '}
              {projectData.receipt.outcome}
            </p>
            <p className="text-[11px] text-stone-500 pt-1">
              Completed on {new Date(projectData.receipt.createdAt).toLocaleDateString()}
            </p>
          </div>

          {projectData.capacities.length > 0 && (
            <div className="bg-emerald-100/60 p-3.5 rounded-2xl border border-emerald-300 space-y-1">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                🌱 Circle Capacity Unlocked
              </span>
              {projectData.capacities.map((cap) => (
                <div key={cap.id} className="text-xs text-emerald-950">
                  <strong className="font-bold">{cap.title}:</strong> {cap.description}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Propose Pledge Modal */}
      {openPledgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="parchment-card-warm w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-8 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setOpenPledgeModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-serif-warm text-xl font-bold text-[#1c1917]">
                I can bring something
              </h3>
              <p className="text-xs text-stone-600">
                Pledge a contribution toward "{projectData.title}".
              </p>
            </div>

            <form onSubmit={handleCreatePledge} className="space-y-4">
              {/* Optional: Connect an existing basket offer */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Connect from your basket offers (Optional)
                </label>
                <select
                  value={pledgeOfferId}
                  onChange={(e) => handleSelectOfferForPledge(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                >
                  <option value="">-- Custom contribution --</option>
                  {offers
                    .filter((o) => o.offeredBy === activeUserId)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title} ({o.category})
                      </option>
                    ))}
                </select>
              </div>

              {/* Optional: Associate with specific project need */}
              {projectData.needs.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Select a project need (Optional)
                  </label>
                  <select
                    value={pledgeNeedId}
                    onChange={(e) => setPledgeNeedId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                  >
                    <option value="">-- General project help --</option>
                    {projectData.needs.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title} ({n.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  What are you committing? *
                </label>
                <textarea
                  required
                  rows={2}
                  value={pledgeDesc}
                  onChange={(e) => setPledgeDesc(e.target.value)}
                  placeholder="e.g. I can bring my pickup truck on Saturday morning and help haul..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={pledgeQty}
                    onChange={(e) => setPledgeQty(e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={pledgeUnit}
                    onChange={(e) => setPledgeUnit(e.target.value)}
                    placeholder="e.g. hours, bundles"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingPledge || !pledgeDesc.trim()}
                className="w-full py-3 px-5 rounded-2xl bg-[#c86d51] hover:bg-[#b05a40] text-amber-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                Pledge Contribution
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complete Project & Write Receipt Modal */}
      {openCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="parchment-card-warm w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-8 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setOpenCompleteModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-serif-warm text-xl font-bold text-[#1c1917]">
                Complete Project & Write Receipt
              </h3>
              <p className="text-xs text-stone-600">
                Record what actually happened and what new capacity the circle gained.
              </p>
            </div>

            <form onSubmit={handleCompleteProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Receipt Summary *
                </label>
                <input
                  type="text"
                  required
                  value={receiptSummary}
                  onChange={(e) => setReceiptSummary(e.target.value)}
                  placeholder="e.g. Saturday Greenhouse Repair Completed"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Outcome Description ("What actually happened?") *
                </label>
                <textarea
                  required
                  rows={4}
                  value={receiptOutcome}
                  onChange={(e) => setReceiptOutcome(e.target.value)}
                  placeholder="e.g. The greenhouse repair was completed. Michael brought the drill. Jen brought soup. Lu transported reclaimed windows..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
                />
              </div>

              <div className="border-t border-[#e8e2d8] pt-3 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900 block">
                  New Capacity Created (Optional)
                </span>

                <div>
                  <input
                    type="text"
                    value={capacityTitle}
                    onChange={(e) => setCapacityTitle(e.target.value)}
                    placeholder="Capacity Name (e.g. Garden Saturdays, Community Baking Day)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={capacityDesc}
                    onChange={(e) => setCapacityDesc(e.target.value)}
                    placeholder="Description (e.g. The circle can now coordinate monthly seedling swaps and greenhouse workdays)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingComplete || !receiptSummary.trim() || !receiptOutcome.trim()}
                className="w-full py-3 px-5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-amber-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <FileCheck2 className="w-4 h-4 text-amber-200" />
                Record Permanent Receipt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
