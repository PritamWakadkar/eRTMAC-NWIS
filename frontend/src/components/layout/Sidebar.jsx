import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    RiMenuLine,
    RiCloseLine,
    RiHome4Line,
    RiSearchEyeLine,
    RiFileList3Line,
    RiBrainLine,
    RiMapPin2Line,
} from "@remixicon/react";
import swarnaLogo from "../../assets/swarna_logo.jpg";

function Sidebar() {
    const [open, setOpen] = useState(false);

    const links = [
        {
            to: "/",
            label: "Home / Overview",
            icon: RiHome4Line,
        },
        {
            to: "/well-map",
            label: "Explore Map",
            icon: RiMapPin2Line,
        },
        {
            to: "/analysis",
            label: "Ask & Search Wells",
            icon: RiSearchEyeLine,
        },
        {
            to: "/prediction",
            label: "Risk Prediction",
            icon: RiBrainLine,
        },
        {
            to: "/event-analysis",
            label: "Event Logs",
            icon: RiFileList3Line,
        },
    ];

    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
            isActive
                ? "bg-black text-white shadow-md shadow-black/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`;

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="fixed bottom-5 left-5 z-[90] flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl md:hidden active:scale-95 transition"
                aria-label="Open navigation"
            >
                <RiMenuLine className="h-6 w-6" />
            </button>

            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 z-[80] hidden h-screen w-64 border-r border-slate-200 bg-white md:block">
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="border-b border-slate-100 p-5">
                        <NavLink to="/" className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-black text-white shadow-md shadow-black/20">
                                NW
                            </div>
                            <div>
                                <h1 className="text-base font-extrabold text-slate-900">
                                    eRTMAC-NWIS
                                </h1>
                                <p className="text-xs text-slate-500 font-medium">
                                    Well Intelligence Portal
                                </p>
                            </div>
                        </NavLink>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        <p className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Main Menu
                        </p>
                        {links.map((link) => {
                            const Icon = link.icon;
                            return (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={navLinkClass}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />
                                    <span>{link.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Swarna AI Sidebar Card */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat"))}
                            className="w-full text-left rounded-2xl bg-gradient-to-br from-slate-900 to-black p-3.5 text-white shadow-lg shadow-black/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 group border border-slate-700/50"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <img
                                        src={swarnaLogo}
                                        alt="Swarna AI"
                                        className="h-8 w-8 rounded-full object-cover border border-amber-300 shadow-xs"
                                    />
                                    <div>
                                        <span className="text-xs font-extrabold text-white block">
                                            Swarna AI
                                        </span>
                                        <span className="text-[10px] text-slate-400 block">
                                            Smart Assistant
                                        </span>
                                    </div>
                                </div>
                                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-400/30">
                                    Online
                                </span>
                            </div>
                            <p className="mt-2 text-[11px] text-slate-400 leading-relaxed font-medium">
                                Ask Swarna any question about wells in plain English.
                            </p>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <aside
                className={`fixed left-0 top-0 z-[110] h-screen w-72 bg-white shadow-2xl transition-transform duration-300 md:hidden ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-slate-100 p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-black text-white">
                                NW
                            </div>
                            <div>
                                <h1 className="text-base font-extrabold text-slate-900">
                                    eRTMAC-NWIS
                                </h1>
                                <p className="text-xs text-slate-500">
                                    Well Intelligence Portal
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        >
                            <RiCloseLine className="h-6 w-6" />
                        </button>
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        {links.map((link) => {
                            const Icon = link.icon;
                            return (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setOpen(false)}
                                    className={navLinkClass}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />
                                    <span>{link.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                window.dispatchEvent(new CustomEvent("open-ai-chat"));
                            }}
                            className="w-full text-left rounded-2xl bg-gradient-to-br from-slate-900 to-black p-3.5 text-white shadow-lg shadow-black/30 active:scale-[0.98] transition-all border border-slate-700/50"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <img
                                        src={swarnaLogo}
                                        alt="Swarna AI"
                                        className="h-8 w-8 rounded-full object-cover border border-amber-300 shadow-xs"
                                    />
                                    <div>
                                        <span className="text-xs font-extrabold text-white block">
                                            Swarna AI
                                        </span>
                                        <span className="text-[10px] text-slate-400 block">
                                            Smart Assistant
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-2 text-[11px] text-slate-400 leading-relaxed font-medium">
                                Tap to ask Swarna questions in plain English.
                            </p>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;