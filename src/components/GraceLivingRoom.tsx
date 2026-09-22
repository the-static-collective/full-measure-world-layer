import React, {useEffect, useMemo, useState} from 'react';
import {
  Armchair,
  BusFront,
  ChevronLeft,
  ChevronRight,
  Clock3,
  HandHeart,
  Leaf,
  Phone,
  ShoppingBag,
  Sparkles,
  Utensils,
  WalletCards,
} from 'lucide-react';

import type {
  DayPhase,
  PlayAction,
  PlayActionId,
  PlayActionPreview,
  PlayScene,
} from '../../specimens/grace-001/playExperience.ts';

interface Props {
  scene: PlayScene;
  phase: DayPhase;
  actions: PlayAction[];
  previews: Map<PlayActionId, PlayActionPreview>;
  selectedActionId: PlayActionId | null;
  projectionsHidden: boolean;
  onSelectAction: (id: PlayActionId) => void;
  onCommit: (id: PlayActionId) => void;
}

const stations = [
  {
    id: 'return-client-call',
    object: 'phone',
    place: 'Telephone',
    Icon: Phone,
  },
  {
    id: 'grocery-run',
    object: 'bag',
    place: 'Grocery bag',
    Icon: ShoppingBag,
  },
  {
    id: 'pray',
    object: 'prayer',
    place: 'Quiet corner',
    Icon: HandHeart,
  },
  {
    id: 'rest',
    object: 'chair',
    place: 'Resting chair',
    Icon: Armchair,
  },
] as const;

const resources = [
  {key: 'time', label: 'Time', Icon: Clock3},
  {key: 'cash', label: 'Cash', Icon: WalletCards},
  {key: 'food', label: 'Food', Icon: Utensils},
  {key: 'transport', label: 'Transport', Icon: BusFront},
  {key: 'attention', label: 'Attention', Icon: Sparkles},
] as const;

function formatCost(cost: PlayActionPreview['cost']): string {
  return Object.entries(cost)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .map(([key, value]) => key === 'cash' ? `$${value}` : `${value} ${key}`)
    .join(' · ');
}

/**
 * A faithful visual projection over the existing Grace campaign. Room focus
 * and movement choose what to inspect; only the explicit commit callback
 * advances the campaign.
 */
export function GraceLivingRoom({
  scene,
  phase,
  actions,
  previews,
  selectedActionId,
  projectionsHidden,
  onSelectAction,
  onCommit,
}: Props) {
  const availableStations = useMemo(
    () => stations.filter((station) => actions.some((action) => action.id === station.id)),
    [actions],
  );
  const [nearbyId, setNearbyId] = useState<PlayActionId>(
    availableStations[0]?.id ?? 'return-client-call',
  );

  useEffect(() => {
    if (!availableStations.some((station) => station.id === nearbyId)) {
      setNearbyId(availableStations[0]?.id ?? 'return-client-call');
    }
  }, [availableStations, nearbyId]);

  useEffect(() => {
    if (
      selectedActionId &&
      availableStations.some((station) => station.id === selectedActionId)
    ) {
      setNearbyId(selectedActionId);
    }
  }, [availableStations, selectedActionId]);

  const nearbyStation =
    availableStations.find((station) => station.id === nearbyId) ?? availableStations[0];
  const nearbyAction = actions.find((action) => action.id === nearbyStation?.id);
  const preview = nearbyAction ? previews.get(nearbyAction.id) : undefined;
  const selected = Boolean(nearbyAction && selectedActionId === nearbyAction.id);

  const cycleStation = (delta: number) => {
    if (availableStations.length === 0) return;
    const current = Math.max(
      0,
      availableStations.findIndex((station) => station.id === nearbyId),
    );
    const next = (current + delta + availableStations.length) % availableStations.length;
    setNearbyId(availableStations[next].id);
  };

  const onRoomKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (['w', 'W', 'd', 'D', 'ArrowRight', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      cycleStation(1);
    }
    if (['a', 'A', 's', 'S', 'ArrowLeft', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      cycleStation(-1);
    }
  };

  return (
    <section
      className={`grace-living-room grace-living-room--${phase}`}
      aria-label="Grace's Tuesday room · Grace Under Pressure · An Ordinary Tuesday"
      tabIndex={0}
      onKeyDown={onRoomKeyDown}
    >
      <div className="grace-living-room__scene">
        <picture className="grace-living-room__picture">
          <source media="(max-width: 680px)" srcSet="/assets/grace-living-room-mobile.webp" />
          <img
            src="/assets/grace-living-room-desktop.webp"
            alt="Morning light in Grace's kitchen and living room, with a table, telephone, quiet prayer corner, and closed screen door."
          />
        </picture>
        <div className="grace-living-room__shade" aria-hidden="true" />

        <header className="grace-living-room__title">
          <Leaf className="grace-living-room__sprig" aria-hidden="true" size={31} strokeWidth={1.8} />
          <div>
            <h1>Grace Under Pressure</h1>
            <p>Tuesday · {phase}</p>
          </div>
        </header>

        <div className="grace-living-room__story">
          <span>{scene.title}</span>
          <strong>{scene.focus}</strong>
        </div>

        <div className="grace-living-room__stations" aria-label="Objects in the room">
          {availableStations.map((station) => {
            const action = actions.find((candidate) => candidate.id === station.id);
            const isNearby = nearbyId === station.id;
            return action ? (
              <button
                key={station.id}
                type="button"
                className={`grace-living-room__station grace-living-room__station--${station.object}${isNearby ? ' is-nearby' : ''}`}
                aria-label={`Move near ${station.place.toLowerCase()} to inspect ${action.label}`}
                aria-pressed={isNearby}
                onClick={() => setNearbyId(station.id)}
              >
                <station.Icon aria-hidden="true" size={20} strokeWidth={2.1} />
                <span>{station.place}</span>
              </button>
            ) : null;
          })}
        </div>

        {nearbyStation && nearbyAction && preview && (
          <aside className="grace-living-room__choice" aria-live="polite">
            <div className="grace-living-room__choice-place">
              <nearbyStation.Icon aria-hidden="true" size={20} strokeWidth={2.25} />
              <span>{nearbyStation.place} nearby</span>
            </div>
            <div className="grace-living-room__choice-rule" />
            <h2>{nearbyAction.label}</h2>
            <p className="grace-living-room__cost">{formatCost(preview.cost)}</p>
            {selected ? (
              <>
                <p className="grace-living-room__preview-note">
                  {preview.foreclosed.length > 0
                    ? `Closes for now: ${preview.foreclosed.join(', ')}.`
                    : 'No previously affordable move closes immediately.'}
                </p>
                <button
                  type="button"
                  className="grace-living-room__primary"
                  onClick={() => onCommit(nearbyAction.id)}
                >
                  Do it
                </button>
                <button
                  type="button"
                  className="grace-living-room__secondary"
                  onClick={() => onSelectAction(nearbyAction.id)}
                >
                  Step away
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="grace-living-room__primary"
                  onClick={() => onSelectAction(nearbyAction.id)}
                >
                  Preview choice
                </button>
                <button
                  type="button"
                  className="grace-living-room__secondary"
                  onClick={() => cycleStation(1)}
                >
                  Step away
                </button>
              </>
            )}
            <p className="grace-living-room__boundary">Looking is not doing.</p>
          </aside>
        )}

        <footer className="grace-living-room__dock">
          <div className="grace-living-room__resources" aria-label="Current supply">
            {resources.map(({key, label, Icon}) => (
              <div className="grace-living-room__resource" key={key}>
                <Icon aria-hidden="true" size={25} strokeWidth={1.8} />
                <span>{label}</span>
                <strong>
                  {projectionsHidden
                    ? '—'
                    : `${key === 'cash' ? '$' : ''}${scene.resources[key]}`}
                </strong>
              </div>
            ))}
          </div>
          <div className="grace-living-room__movement" aria-label="Move around the room">
            <span>Move around</span>
            <button type="button" onClick={() => cycleStation(-1)} aria-label="Move to previous object">
              <ChevronLeft aria-hidden="true" size={20} />
            </button>
            <span className="grace-living-room__keys" aria-hidden="true">W A S D</span>
            <button type="button" onClick={() => cycleStation(1)} aria-label="Move to next object">
              <ChevronRight aria-hidden="true" size={20} />
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
