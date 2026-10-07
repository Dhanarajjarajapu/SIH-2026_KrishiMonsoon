import React from 'react';
import {
  CropType,
  GrowthStage,
  CROP_OPTIONS,
  GROWTH_STAGE_OPTIONS,
  CropAdvisory,
} from '../types';
import { Sprout, Calendar, ChevronRight, CheckCircle2 } from 'lucide-react';

interface Props {
  selectedCrop: CropType;
  onSelectCrop: (crop: CropType) => void;
  selectedStage: GrowthStage;
  onSelectStage: (stage: GrowthStage) => void;
  onTriggerAdvisory: (crop: CropType, stage: GrowthStage) => void;
  activeAdvisory?: CropAdvisory | null;
  locationName: string;
}

export const CropSelector: React.FC<Props> = ({
  selectedCrop,
  onSelectCrop,
  selectedStage,
  onSelectStage,
  onTriggerAdvisory,
  activeAdvisory,
  locationName,
}) => {
  return (
    <div className="bg-gradient-to-r from-stone-900 via-emerald-950/80 to-stone-900 border border-emerald-900/60 rounded-2xl p-3 shadow-md space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-200">
          <Sprout className="w-4 h-4 text-emerald-400" />
          <span>Kharif Crop Context</span>
          <span className="text-[10px] text-emerald-400/80 font-normal">({locationName})</span>
        </div>
        <button
          onClick={() => onTriggerAdvisory(selectedCrop, selectedStage)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all shadow-xs"
        >
          <span>Get Advisory</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Crop Selector Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 flex items-center gap-1">
            <span>Crop</span>
          </label>
          <div className="relative">
            <select
              value={selectedCrop}
              onChange={(e) => onSelectCrop(e.target.value as CropType)}
              className="w-full bg-stone-800/90 text-stone-100 border border-stone-700/80 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500 transition-colors"
            >
              {CROP_OPTIONS.map((c) => (
                <option key={c.type} value={c.type} className="bg-stone-900 text-stone-100">
                  {c.icon} {c.name} ({c.localHindi})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Growth Stage Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>Growth Stage</span>
          </label>
          <div className="relative">
            <select
              value={selectedStage}
              onChange={(e) => onSelectStage(e.target.value as GrowthStage)}
              className="w-full bg-stone-800/90 text-stone-100 border border-stone-700/80 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500 transition-colors"
            >
              {GROWTH_STAGE_OPTIONS.map((s) => (
                <option key={s.stage} value={s.stage} className="bg-stone-900 text-stone-100">
                  {s.name} ({s.localHindi})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Advisory Snippet if available */}
      {activeAdvisory && activeAdvisory.crop === selectedCrop && (
        <div className="p-2 rounded-xl bg-stone-950/70 border border-stone-800 text-[11px] text-stone-300">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Expert Decision: {activeAdvisory.action}</span>
          </div>
        </div>
      )}
    </div>
  );
};
