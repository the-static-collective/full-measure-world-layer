import React, { useState } from 'react';
import { Offer, OfferCategory, Profile } from '../types';
import { api, getCurrentUserId } from '../lib/api';
import {
  ShoppingBag,
  Plus,
  Search,
  Clock,
  ShieldAlert,
  MapPin,
  X,
  Sparkles,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Tag,
} from 'lucide-react';

interface Props {
  offers: Array<Offer & { author?: Profile }>;
  onRefresh: () => void;
  openNewOfferModal: boolean;
  onCloseNewOfferModal: () => void;
  onOpenNewOfferModal: () => void;
}

export const BasketView: React.FC<Props> = ({
  offers,
  onRefresh,
  openNewOfferModal,
  onCloseNewOfferModal,
  onOpenNewOfferModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<OfferCategory>('time');
  const [availability, setAvailability] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [boundaries, setBoundaries] = useState('');
  const [makesPossibleInput, setMakesPossibleInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeUserId = getCurrentUserId();

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    const makesPossibleArr = makesPossibleInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      await api.createOffer({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        availability: availability.trim() || undefined,
        locationNote: locationNote.trim() || undefined,
        boundaries: boundaries.trim() || undefined,
        makesPossible: makesPossibleArr.length > 0 ? makesPossibleArr : undefined,
      });
      setTitle('');
      setDescription('');
      setAvailability('');
      setLocationNote('');
      setBoundaries('');
      setMakesPossibleInput('');
      onCloseNewOfferModal();
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Could not place offer in basket');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (offer: Offer) => {
    const newStatus = offer.status === 'available' ? 'paused' : 'available';
    try {
      await api.updateOfferStatus(offer.id, newStatus);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Could not update status');
    }
  };

  const categories: Array<{ key: string; label: string }> = [
    { key: 'all', label: 'All Gifts' },
    { key: 'skill', label: 'Skills' },
    { key: 'tool', label: 'Tools' },
    { key: 'time', label: 'Time' },
    { key: 'space', label: 'Spaces' },
    { key: 'material', label: 'Materials' },
    { key: 'food', label: 'Food' },
    { key: 'transport', label: 'Transport' },
    { key: 'care', label: 'Care' },
    { key: 'creative', label: 'Creative' },
    { key: 'other', label: 'Other' },
  ];

  const filteredOffers = offers.filter((o) => {
    const matchesCategory = selectedCategory === 'all' || o.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.description && o.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.author?.displayName && o.author.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e2d8] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-800" />
            <h2 className="font-serif-warm text-2xl font-bold text-[#1c1917]">
              The Shared Satchel
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Gifts, tools, skills, and capacities offered freely to neighbors in The First Campfire.
          </p>
        </div>

        <button
          onClick={onOpenNewOfferModal}
          className="px-4 py-2.5 rounded-2xl bg-[#c86d51] hover:bg-[#b05a40] text-amber-50 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Place a gift in the satchel</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gifts, tools, or neighbor names..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/30"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-amber-900 text-amber-50 shadow-2xs'
                  : 'bg-white border border-[#e2d7c7] text-stone-600 hover:bg-stone-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Grid */}
      {filteredOffers.length === 0 ? (
        <div className="parchment-card rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm font-serif-warm italic text-stone-600">
            No offers match this search or category yet.
          </p>
          <button
            onClick={onOpenNewOfferModal}
            className="px-4 py-2 rounded-xl border border-amber-800 text-amber-900 text-xs font-semibold hover:bg-amber-50 transition-colors"
          >
            Be the first to offer something
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOffers.map((offer) => {
            const isOwner = offer.offeredBy === activeUserId;
            return (
              <div
                key={offer.id}
                className={`parchment-card rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                  offer.status === 'paused' ? 'opacity-70 bg-stone-50/70' : ''
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Author & Category */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          offer.author?.avatarColor || 'bg-amber-800 text-amber-50'
                        }`}
                      >
                        {offer.author ? offer.author.displayName.substring(0, 2).toUpperCase() : '?'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1c1917] block leading-tight">
                          {offer.author?.displayName || 'Neighbor'}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          Added {new Date(offer.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                        {offer.category}
                      </span>
                      {offer.status === 'paused' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200 text-stone-700">
                          Paused
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-serif-warm font-bold text-lg text-[#1c1917] leading-snug">
                      {offer.title}
                    </h3>
                    {offer.description && (
                      <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                        {offer.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Fields */}
                  <div className="space-y-1.5 text-xs text-stone-600 border-t border-[#e8e2d8] pt-3">
                    {offer.availability && (
                      <div className="flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-stone-800 font-medium">Availability:</strong>{' '}
                          {offer.availability}
                        </span>
                      </div>
                    )}

                    {offer.locationNote && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-stone-800 font-medium">Location:</strong>{' '}
                          {offer.locationNote}
                        </span>
                      </div>
                    )}

                    {offer.boundaries && (
                      <div className="flex items-start gap-2 text-stone-700 bg-amber-50/60 p-2 rounded-lg border border-amber-200/50">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-amber-900 font-medium">Boundaries & Limits:</strong>{' '}
                          {offer.boundaries}
                        </span>
                      </div>
                    )}

                    {/* Makes Possible Section */}
                    {offer.makesPossible && offer.makesPossible.length > 0 && (
                      <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                          Makes Possible:
                        </span>
                        <ul className="space-y-0.5 text-[11px] text-stone-800">
                          {offer.makesPossible.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0"></span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls for Owner */}
                {isOwner && (
                  <div className="border-t border-[#e8e2d8] pt-3 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-stone-500 font-medium">Your Gift</span>
                    <button
                      onClick={() => handleToggleStatus(offer)}
                      className="px-2.5 py-1 rounded-lg border border-stone-300 hover:bg-stone-100 font-medium text-stone-700 flex items-center gap-1.5 transition-colors"
                    >
                      {offer.status === 'available' ? (
                        <>
                          <PauseCircle className="w-3.5 h-3.5 text-amber-800" />
                          <span>Pause Offer</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Reactivate Offer</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Put Something in Basket Modal */}
      {openNewOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="parchment-card-warm w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-8 relative animate-in fade-in zoom-in-95">
            <button
              onClick={onCloseNewOfferModal}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-800" />
                <h3 className="font-serif-warm text-xl font-bold text-[#1c1917]">
                  Put something in the basket
                </h3>
              </div>
              <p className="text-xs text-stone-600">
                Offer a gift, tool, skill, space, or time to neighbors in The First Campfire.
              </p>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  What can you bring? *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sourdough baking, Cordless drill, Pickup truck"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as OfferCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                  >
                    <option value="skill">Skill & Craft</option>
                    <option value="tool">Tool & Equipment</option>
                    <option value="time">Time & Labor</option>
                    <option value="space">Space & Place</option>
                    <option value="material">Material & Goods</option>
                    <option value="care">Care & Support</option>
                    <option value="food">Food & Cooking</option>
                    <option value="transport">Transport & Hauling</option>
                    <option value="creative">Creative & Music</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    When is it available?
                  </label>
                  <input
                    type="text"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    placeholder="e.g. Weekends, Saturday mornings"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Location Note (Optional)
                </label>
                <input
                  type="text"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  placeholder="e.g. Mobile / North neighborhood"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Limits or Boundaries (Optional)
                </label>
                <input
                  type="text"
                  value={boundaries}
                  onChange={(e) => setBoundaries(e.target.value)}
                  placeholder="e.g. Please give 1 day notice; safety gear required"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe what you can bring and how neighbors can make use of it..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              {/* Makes Possible Field */}
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  What capabilities does this gift make possible? (Comma separated)
                </label>
                <input
                  type="text"
                  value={makesPossibleInput}
                  onChange={(e) => setMakesPossibleInput(e.target.value)}
                  placeholder="e.g. Backyard construction, Weekend baking, Heavy hauling"
                  className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
                />
              </div>

              {error && <p className="text-xs text-red-700 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full py-3 px-5 rounded-2xl bg-[#c86d51] hover:bg-[#b05a40] text-amber-50 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                Place Gift in Basket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
