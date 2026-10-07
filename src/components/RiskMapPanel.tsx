import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RiskGridPoint, RiskCategory } from '../types';
import {
  MapPin,
  Layers,
  Maximize2,
  Minimize2,
  X,
  AlertTriangle,
  CloudRain,
  ShieldCheck,
  Compass,
} from 'lucide-react';

interface Props {
  gridPoints: RiskGridPoint[];
  center: { lat: number; lon: number; location: string };
  selectedPointId?: string;
  onSelectPoint?: (pt: RiskGridPoint) => void;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const CATEGORY_COLORS: Record<RiskCategory, { hex: string; bg: string; text: string; label: string }> = {
  GREEN: { hex: '#16a34a', bg: 'bg-emerald-600', text: 'text-emerald-100', label: 'Onset Likely / Favorable (<25% Break)' },
  YELLOW: { hex: '#eab308', bg: 'bg-amber-500', text: 'text-amber-950', label: 'Moderate / Mixed (25–50% Break)' },
  ORANGE: { hex: '#f97316', bg: 'bg-orange-500', text: 'text-orange-950', label: 'Break Risk Elevated (50–75% Break)' },
  RED: { hex: '#dc2626', bg: 'bg-rose-600', text: 'text-rose-100', label: 'High Dry-Spell / Downpour (>75%)' },
};

export const RiskMapPanel: React.FC<Props> = ({
  gridPoints,
  center,
  selectedPointId,
  onSelectPoint,
  onClose,
  isExpanded = false,
  onToggleExpand,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const [activePoint, setActivePoint] = useState<RiskGridPoint | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lon],
        zoom: 12,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap free tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (gridPoints.length === 0) return;

    const bounds = L.latLngBounds([]);

    gridPoints.forEach((pt) => {
      const colorConf = CATEGORY_COLORS[pt.risk_category] || CATEGORY_COLORS.YELLOW;
      const isSelected = pt.id === selectedPointId;

      const circle = L.circleMarker([pt.lat, pt.lon], {
        radius: isSelected ? 16 : 13,
        fillColor: colorConf.hex,
        color: isSelected ? '#ffffff' : '#f8fafc',
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      // Custom Popup HTML
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 190px; color: #1e293b; padding: 2px;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 3px; color: #0f172a;">
            ${pt.name}
          </div>
          <div style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-weight: 600; font-size: 10px; background: ${colorConf.hex}; color: #ffffff; margin-bottom: 6px;">
            ${pt.risk_category} RISK
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; font-size: 11px;">
            <div style="background: #f1f5f9; padding: 4px; border-radius: 6px;">
              <span style="color: #64748b; font-size: 10px;">Onset:</span>
              <div style="font-weight: bold; color: #16a34a;">${pt.onset_probability_pct}%</div>
            </div>
            <div style="background: #f1f5f9; padding: 4px; border-radius: 6px;">
              <span style="color: #64748b; font-size: 10px;">Break Risk:</span>
              <div style="font-weight: bold; color: #dc2626;">${pt.break_probability_pct}%</div>
            </div>
          </div>
          ${
            pt.heavy_rain_flag
              ? '<div style="color: #b91c1c; font-size: 10px; font-weight: 600; margin-bottom: 4px;">⚠️ Heavy downpour risk flag</div>'
              : ''
          }
          <div style="color: #64748b; font-size: 10px;">
            Confidence: <strong>${pt.confidence.toUpperCase()}</strong> (14-day)
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml, { closeButton: false });

      circle.on('click', () => {
        setActivePoint(pt);
        if (onSelectPoint) {
          onSelectPoint(pt);
        }
      });

      markersRef.current.push(circle);
      bounds.extend([pt.lat, pt.lon]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
    }

    // Leaflet needs resize invalidation after DOM render
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [gridPoints, center.lat, center.lon, selectedPointId]);

  // Recalculate size on expansion
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    }
  }, [isExpanded]);

  return (
    <div
      className={`relative bg-stone-900 border border-emerald-900/60 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col ${
        isExpanded ? 'h-[480px] sm:h-[560px]' : 'h-72 sm:h-80'
      }`}
    >
      {/* Panel Top Bar */}
      <div className="bg-stone-950/90 backdrop-blur-md px-3 py-2 border-b border-stone-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-stone-100 flex items-center gap-1.5 leading-none">
              <span>Hyperlocal 3×3 Panchayat Risk Grid</span>
              <span className="text-[10px] text-emerald-400 font-normal">~5km spacing</span>
            </h3>
            <p className="text-[10px] text-stone-400 mt-0.5 leading-none">
              Centered on {center.location} ({center.lat.toFixed(2)}°, {center.lon.toFixed(2)}°)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
              title={isExpanded ? 'Collapse map' : 'Expand map'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
              title="Close map"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Map Surface */}
      <div className="relative flex-1 w-full bg-stone-950">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Compact Legend Fixed on Map */}
        <div className="absolute bottom-2.5 left-2.5 z-10 bg-stone-950/85 backdrop-blur-md rounded-xl p-2 border border-stone-800/90 shadow-lg text-[10px] text-stone-300 space-y-1 max-w-[210px] pointer-events-auto">
          <div className="font-semibold text-stone-200 border-b border-stone-800 pb-1 flex items-center justify-between">
            <span>Risk Matrix</span>
            <span className="text-[9px] text-stone-400">14-Day Horizon</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate">Green: Onset likely (Break &lt;25%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
            <span className="truncate">Yellow: Mixed (Break 25–50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
            <span className="truncate">Orange: Break risk elevated (50–75%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></span>
            <span className="truncate">Red: Dry-spell / Heavy rain (&gt;75%)</span>
          </div>
        </div>

        {/* Selected Sector Quick Callout if active */}
        {activePoint && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-stone-900/95 backdrop-blur-md rounded-xl p-2.5 border border-stone-700 shadow-xl max-w-[260px] animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-stone-100 truncate">{activePoint.name}</span>
              <button
                onClick={() => setActivePoint(null)}
                className="text-stone-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="text-[11px] text-stone-300 mt-1 flex items-center gap-2">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  CATEGORY_COLORS[activePoint.risk_category].bg
                } ${CATEGORY_COLORS[activePoint.risk_category].text}`}
              >
                {activePoint.risk_category}
              </span>
              <span>Onset: {activePoint.onset_probability_pct}%</span>
              <span>Break: {activePoint.break_probability_pct}%</span>
            </div>
            {activePoint.heavy_rain_flag && (
              <div className="text-[10px] text-rose-400 font-semibold mt-1">
                ⚠️ Heavy downpour risk flag
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
