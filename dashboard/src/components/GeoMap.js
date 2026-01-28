"use client";

import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function GeoMap({ data = {} }) {
    // data format: { "US": 100, "IN": 50 }

    const maxValue = Math.max(...Object.values(data), 0);

    const colorScale = scaleLinear()
        .domain([0, maxValue || 1])
        .range(["#344d66", "#10b981"]); // From base border color to Emerald-500

    return (
        <div className="w-full h-[300px] bg-background-dark/50 rounded-lg overflow-hidden relative">
            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 100 }}>
                <ZoomableGroup center={[0, 20]} zoom={1}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const cur = data[geo.properties.iso_a2];
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={cur ? colorScale(cur) : "#233648"} // specific color or default dark
                                        stroke="#0f172a"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { fill: "#34d399", outline: "none" },
                                            pressed: { fill: "#059669", outline: "none" },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>

            {/* Legend / Overlay */}
            <div className="absolute bottom-4 left-4 bg-surface-dark/90 p-3 rounded-lg border border-[#344d66] text-xs">
                <p className="font-bold mb-2">Top Sources</p>
                <div className="space-y-1">
                    {Object.entries(data)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([code, count]) => (
                            <div key={code} className="flex justify-between gap-4">
                                <span className="text-text-secondary">{code}</span>
                                <span className="font-mono">{count}</span>
                            </div>
                        ))}
                    {Object.keys(data).length === 0 && <span className="text-text-secondary">No Data</span>}
                </div>
            </div>
        </div>
    );
}
