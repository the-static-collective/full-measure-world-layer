import React, { useState } from 'react';
import { OfferCategory, Profile } from '../types';
import { api } from '../lib/api';
import { Sparkles, Heart, CheckCircle2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile | null;
  onOfferCreated: () => void;
}

export const ArrivalModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onOfferCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<OfferCategory>('time');
  const [availability, setAvailability] = useState('');
  const [boundaries, setBoundaries] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await api.createOffer({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        availability: availability.trim() || undefined,
        boundaries: boundaries.trim() || undefined,
      });
      setSubmitted(true);
      onOfferCreated();
    } catch (err: any) {
      setError(err.message || 'Could not place gift in basket');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setSubmitted(false);
    setTitle('');
    setDescription('');
    setAvailability('');
    setBoundaries('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="parchment-card-warm w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-800/10 text-amber-800 mx-auto flex items-center justify-center">
                <Heart className="w-6 h-6 fill-amber-700 text-amber-700" />
              </div>
              <h2 className="font-serif-warm text-2xl font-bold text-[#1c1917]">
                Welcome to The First Campfire
              </h2>
              <p className="text-stone-600 text-sm italic font-serif-warm">
                "What is one thing you can offer another person this week?"
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  What can you bring? *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sourdough loaf, Pickup truck, 2 hours of garden help"
                  className="w-full px-4 py-3 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Kind of Gift
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as OfferCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                  >
                    <option value="time">Time & Presence</option>
                    <option value="skill">Skill & Craft</option>
                    <option value="tool">Tool & Equipment</option>
                    <option value="space">Space & Place</option>
                    <option value="food">Food & Hospitality</option>
                    <option value="transport">Transport & Hauling</option>
                    <option value="material">Material & Goods</option>
                    <option value="care">Care & Support</option>
                    <option value="creative">Creative & Song</option>
                    <option value="other">Other Gift</option>
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
                    placeholder="e.g. Weekends / Saturday mornings"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Limits or Boundaries (Optional)
                </label>
                <input
                  type="text"
                  value={boundaries}
                  onChange={(e) => setBoundaries(e.target.value)}
                  placeholder="e.g. Please give 1 day notice; local neighborhood only"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Short Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Add a few details so neighbors understand what you are sharing..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              {error && <p className="text-xs text-red-700 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full py-3 px-5 rounded-2xl bg-[#c86d51] hover:bg-[#b05a40] text-amber-50 text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                Place Gift in the Basket
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-700" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif-warm text-2xl font-bold text-[#1c1917]">
                Your first gift is in the basket.
              </h2>
              <p className="text-stone-600 text-sm max-w-sm mx-auto">
                Thank you for bringing your capacity to {currentUser?.displayName || 'the circle'}.
                Neighbors can now see your gift and invite you to join growing projects.
              </p>
            </div>
            <button
              onClick={handleFinish}
              className="py-3 px-8 rounded-2xl bg-[#2c2825] hover:bg-[#1c1917] text-amber-50 text-sm font-semibold transition-colors"
            >
              Enter Campfire
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
