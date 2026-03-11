import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 4, className = '' }) => {
    const items = Array.from({ length: count });

    // Base shimmer animation class
    const shimmer = "relative overflow-hidden bg-slate-100 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

    if (type === 'card') {
        return (
            <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 ${className}`}>
                {items.map((_, i) => (
                    <div key={i} className={`rounded-2xl border border-slate-100 overflow-hidden bg-white p-4 flex flex-col gap-4 ${shimmer}`}>
                        <div className="w-full h-48 rounded-xl bg-slate-200/50"></div>
                        <div className="space-y-2 mt-2">
                            <div className="h-5 w-3/4 rounded-md bg-slate-200/50"></div>
                            <div className="h-3 w-1/2 rounded-md bg-slate-200/50"></div>
                        </div>
                        <div className="mt-auto flex justify-between items-end pt-4">
                            <div className="h-6 w-16 rounded-md bg-slate-200/50"></div>
                            <div className="h-8 w-24 rounded-lg bg-slate-200/50"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'list') {
        return (
            <div className={`divide-y divide-slate-100 ${className}`}>
                {items.map((_, i) => (
                    <div key={i} className={`flex items-center gap-4 py-4 ${shimmer}`}>
                        <div className="w-16 h-16 rounded-xl bg-slate-200/50 shrink-0"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 rounded-md bg-slate-200/50"></div>
                            <div className="h-3 w-1/4 rounded-md bg-slate-200/50"></div>
                        </div>
                        <div className="h-6 w-20 rounded-md bg-slate-200/50 shrink-0"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'table') {
        return (
            <div className={`w-full overflow-hidden rounded-2xl border border-slate-200 bg-white ${className}`}>
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex gap-4">
                    <div className="h-4 w-1/4 rounded bg-slate-200/50"></div>
                    <div className="h-4 w-1/4 rounded bg-slate-200/50"></div>
                    <div className="h-4 w-1/4 rounded bg-slate-200/50"></div>
                    <div className="h-4 w-1/4 rounded bg-slate-200/50"></div>
                </div>
                <div className="divide-y divide-slate-100">
                    {items.map((_, i) => (
                        <div key={i} className={`p-4 flex gap-4 items-center ${shimmer}`}>
                            <div className="h-4 w-1/4 rounded bg-slate-200/50"></div>
                            <div className="h-4 w-1/4 rounded bg-slate-200/50"></div>
                            <div className="h-4 w-1/4 rounded bg-slate-200/50"></div>
                            <div className="flex w-1/4 gap-2">
                                <div className="h-8 w-16 rounded-lg bg-slate-200/50"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'stats') {
        return (
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
                {items.map((_, i) => (
                    <div key={i} className={`rounded-xl border border-slate-100 bg-white p-6 ${shimmer}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-4 w-24 rounded bg-slate-200/50"></div>
                            <div className="h-10 w-10 rounded-xl bg-slate-200/50"></div>
                        </div>
                        <div className="h-8 w-32 rounded bg-slate-200/50"></div>
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

export default SkeletonLoader;
