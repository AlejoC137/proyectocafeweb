import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { clsx } from 'clsx';

export const Trigger = ({ value, icon: Icon, label }) => (
    <Tabs.Trigger
        value={value}
        className={clsx(
            "flex-1 flex items-center justify-center gap-2 py-6 text-sm font-bold text-slate-400 border-b-4 border-transparent hover:text-slate-600 transition-all duration-200",
            "data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 data-[state=active]:bg-white"
        )}
    >
        <Icon className="w-5 h-5" />
        {label}
    </Tabs.Trigger>
);

export const SectionTitle = ({ children }) => (
    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
        {children}
    </h3>
);

export const InfoItem = ({ label, value, sublabel, icon: Icon }) => (
    <div className="flex gap-4">
        {Icon && <Icon className="text-slate-400 w-6 h-6 shrink-0 mt-1" />}
        <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{label}</span>
            <span className="text-lg font-bold text-slate-800">{value}</span>
            {sublabel && <span className="text-xs text-slate-400">{sublabel}</span>}
        </div>
    </div>
);

export const ToggleOption = ({ id, label, description, checked, onChange, disabled }) => (
    <div className="flex items-start gap-3">
        <div className="pt-0.5">
            <input
                type="checkbox"
                id={id}
                name={id}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-default"
            />
        </div>
        <div className="flex flex-col">
            <label htmlFor={id} className={clsx("font-bold text-sm cursor-pointer", disabled ? "text-slate-500" : "text-slate-800")}>
                {label}
            </label>
            <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
        </div>
    </div>
);

export const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
};

export const parseObjectString = (str) => {
    if (!str || typeof str !== 'string') return null;
    try {
        let cleaned = str.trim();
        if ((cleaned.startsWith("'") && cleaned.endsWith("'")) ||
            (cleaned.startsWith('"') && cleaned.endsWith('"'))) {
            cleaned = cleaned.slice(1, -1);
        }
        const jsonString = cleaned
            .replace(/(\w+):/g, '"$1":')
            .replace(/'/g, '"');
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('Failed to parse object string:', str, e);
        return null;
    }
};

export const calculateDuration = (start, end) => {
    if (!start || !end) return '0.00';
    try {
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        const duration = (h2 - h1) + (m2 - m1) / 60;
        return duration > 0 ? duration.toFixed(2) : '0.00';
    } catch (e) { return '0.00'; }
};
