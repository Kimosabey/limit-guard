"use client";

import { useState } from 'react';
import axios from 'axios';

export default function RulesManager({ rules, onUpdate }) {
    // rules format: { global: { limit: 10, window: 60 } }
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ limit: '', window: '' });

    const handleEdit = () => {
        if (rules?.global) {
            setFormData({ limit: rules.global.limit, window: rules.global.window });
        }
        setEditing(true);
    };

    const handleSave = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL
                ? `${process.env.NEXT_PUBLIC_API_URL.replace('/api/test', '')}/api/rules`
                : 'http://localhost:8800/api/rules';

            await axios.post(apiUrl, formData);
            setEditing(false);
            if (onUpdate) onUpdate(); // Trigger refresh
        } catch (err) {
            console.error("Failed to update rule", err);
            alert("Failed to update rule");
        }
    };

    return (
        <div className="bg-surface-dark border border-[#344d66] rounded-xl overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-[#344d66] flex items-center justify-between">
                <h3 className="text-lg font-bold">Rule Management</h3>
                <button
                    onClick={editing ? () => setEditing(false) : handleEdit}
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                    {editing ? 'CANCEL' : 'EDIT GLOBAL RULE'}
                </button>
            </div>

            <div className="p-6">
                <div className="flex items-center justify-between p-4 bg-background-dark/50 rounded-lg border border-[#344d66]">
                    <div>
                        <p className="font-bold text-sm text-text-secondary mb-1">GLOBAL LIMIT</p>
                        {editing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    className="bg-[#233648] border border-[#344d66] rounded px-2 py-1 w-20 text-white text-sm focus:outline-none focus:border-primary"
                                    value={formData.limit}
                                    onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                                />
                                <span className="text-text-secondary text-sm">reqs</span>
                            </div>
                        ) : (
                            <p className="text-2xl font-bold">{rules?.global?.limit || '-'}</p>
                        )}
                    </div>

                    <div className="text-right">
                        <p className="font-bold text-sm text-text-secondary mb-1">WINDOW</p>
                        {editing ? (
                            <div className="flex items-center gap-2 justify-end">
                                <input
                                    type="number"
                                    className="bg-[#233648] border border-[#344d66] rounded px-2 py-1 w-20 text-white text-sm focus:outline-none focus:border-primary"
                                    value={formData.window}
                                    onChange={(e) => setFormData({ ...formData, window: e.target.value })}
                                />
                                <span className="text-text-secondary text-sm">sec</span>
                            </div>
                        ) : (
                            <p className="text-2xl font-bold">{rules?.global?.window || '-'}s</p>
                        )}
                    </div>
                </div>

                {editing && (
                    <button
                        onClick={handleSave}
                        className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                    >
                        SAVE CHANGES
                    </button>
                )}

                {!editing && (
                    <div className="mt-4 flex gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                            <span className="material-symbols-outlined text-[14px]">public</span> Global
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                            <span className="material-symbols-outlined text-[14px]">sync</span> Dynamic
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
