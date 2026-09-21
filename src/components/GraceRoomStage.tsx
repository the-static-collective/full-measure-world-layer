import React from 'react';
import {Armchair, HandHeart, Phone, ShoppingBag} from 'lucide-react';
import type {
  DayPhase,
  PlayAction,
  PlayActionId,
  PlayScene,
} from '../../specimens/grace-001/playExperience.ts';

interface GraceRoomStageProps {
  scene: PlayScene;
  phase: DayPhase;
  actions: PlayAction[];
  selectedActionId: PlayActionId | null;
  onSelectAction: (id: PlayActionId) => void;
  projectionsHidden: boolean;
}

const stations = [
  {id: 'return-client-call', object: 'phone', place: 'telephone', Icon: Phone},
  {id: 'grocery-run', object: 'bag', place: 'grocery bag', Icon: ShoppingBag},
  {id: 'pray', object: 'prayer', place: 'quiet corner', Icon: HandHeart},
  {id: 'rest', object: 'chair', place: 'resting chair', Icon: Armchair},
] as const;

const supplies = [
  {key: 'time', label: 'Time'},
  {key: 'cash', label: 'Cash'},
  {key: 'food', label: 'Food'},
  {key: 'transport', label: 'Trip'},
  {key: 'attention', label: 'Attention'},
] as const;

/**
 * The room is a presentation over the existing Grace campaign, not a new game
 * state machine. Object selection only previews an action. Commit remains with
 * GracePlaySurface's separate explicit confirmation and replay-checked engine.
 */
export function GraceRoomStage({
  scene, phase, actions, selectedActionId, onSelectAction, projectionsHidden,
}: GraceRoomStageProps) {
  return (
    <section className={`grace-room-stage grace-room-stage--${phase}`} aria-label="Grace's Tuesday room">
      <div className="grace-room-stage__heading">
        <span className="grace-room-stage__kicker">GRACE-001 / AN ORDINARY TUESDAY</span>
        <span className="grace-room-stage__clock">{phase} · the house keeps living</span>
      </div>

      <div className="grace-room-stage__scene" aria-label="Choose a visible object to preview an available move">
        <div className="grace-room-stage__window" aria-hidden="true"><span /></div>
        <div className="grace-room-stage__floor" aria-hidden="true" />
        <div className="grace-room-stage__rug" aria-hidden="true" />
        <div className="grace-room-stage__table" aria-hidden="true"><span /></div>
        <div className="grace-room-stage__frame" aria-hidden="true" />
        <div className="grace-room-stage__screen-door" aria-hidden="true" />

        {stations.map(({id, object, place, Icon}) => {
          const action = actions.find((candidate) => candidate.id === id);
          const selected = selectedActionId === id;
          return action ? (
            <button
              key={id}
              type="button"
              className={`grace-room-stage__hotspot grace-room-stage__hotspot--${object}${selected ? ' is-selected' : ''}`}
              aria-label={`Preview ${action.label} at the ${place}`}
              aria-pressed={selected}
              onClick={() => onSelectAction(id)}
            >
              <span className="grace-room-stage__hotspot-icon"><Icon aria-hidden="true" size={22} strokeWidth={2.1} /></span>
              <span className="grace-room-stage__hotspot-text">{action.shortLabel}</span>
              <span className="grace-room-stage__hotspot-caret" aria-hidden="true">↗</span>
            </button>
          ) : (
            <span key={id} className={`grace-room-stage__object grace-room-stage__object--${object}`} aria-hidden="true">
              <Icon size={18} />
            </span>
          );
        })}

        <span className="grace-room-stage__ground-label">A room that was here before any visitor.</span>
      </div>

      <div className="grace-room-stage__narration">
        <div className="grace-room-stage__story">
          <p className="grace-room-stage__eyebrow">{scene.eyebrow}</p>
          <h2>{scene.title}</h2>
          <p>{scene.body}</p>
        </div>
        <div className="grace-room-stage__focus">
          <span>ONE THING NOW</span>
          <strong>{scene.focus}</strong>
          <p>Choose an object in the room or use the hand below. Looking is not doing.</p>
        </div>
      </div>

      {projectionsHidden ? (
        <p className="grace-room-stage__hidden">The numeric projections are covered for this turn. The underlying game state is unchanged.</p>
      ) : (
        <div className="grace-room-stage__supplies" aria-label="Current supply">
          {supplies.map(({key, label}) => (
            <div key={key} className="grace-room-stage__supply">
              <strong>{key === 'cash' ? '$' : ''}{scene.resources[key]}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
