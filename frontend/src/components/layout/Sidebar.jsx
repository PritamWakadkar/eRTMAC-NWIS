import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    RiMenuLine,
    RiCloseLine,
    RiDashboardLine,
    RiSearchLine,
    RiBrainLine,
    RiPulseLine,
    RiMapPinRangeLine,
} from "@remixicon/react";

function Sidebar() {
    const [open, setOpen] = useState(false);

    const links = [
        {
            to: "/",
            label: "Dashboard",
            icon: RiDashboardLine,
        },
        {
            to: "/analysis",
            label: "Well Analysis",
            icon: RiSearchLine,
        },
        {
            to: "/event-analysis",
            label: "Event Analysis",
            icon: RiPulseLine,
        },
        {
            to: "/prediction",
            label: "Prediction",
            icon: RiBrainLine,
        },
        {
            to: "/well-map",
            label: "Well Map",
            icon: RiMapPinRangeLine,
        },
    ];

    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition ${
            isActive
                ? "bg-blue-50 text-blue-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`;

    return (
        <>
            {/* Mobile Menu Button */}

            <button
                type="button"
                onClick={() => setOpen(true)}
                className="fixed bottom-5 left-5 z-[90] flex h-12 w-12 items-center justify-center rounded-full bg-[#172033] text-white shadow-lg md:hidden"
                aria-label="Open navigation"
            >
                <RiMenuLine className="h-5 w-5" />
            </button>


            {/* Desktop Sidebar */}

            <aside className="fixed left-0 top-0 z-[80] hidden h-screen w-64 border-r border-slate-200 bg-white md:block">

                <div className="flex h-full flex-col">

                    {/* Logo */}

                    <div className="border-b border-slate-200 p-5">

                        <NavLink
                            to="/"
                            className="flex items-center gap-3"
                        >

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172033] text-xs font-extrabold text-white">
                                NW
                            </div>

                            <div>

                                <h1 className="text-sm font-extrabold text-[#172033]">
                                    eRTMAC-NWIS
                                </h1>

                                <p className="mt-0.5 text-[9px] text-slate-400">
                                    Well Intelligence System
                                </p>

                            </div>

                        </NavLink>

                    </div>


                    {/* Navigation */}

                    <nav className="flex-1 p-4">

                       

                        <div className="space-y-1">

                            {links.map((link) => {

                                const Icon = link.icon;

                                return (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        className={navLinkClass}
                                    >
                                        <Icon className="h-4 w-4" />

                                        {link.label}
                                    </NavLink>
                                );
                            })}

                        </div>

                    </nav>


                    {/* System Status */}

                   

                </div>

            </aside>


            {/* Mobile Overlay */}

            {open && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-900/40 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}


            {/* Mobile Sidebar */}

            <aside
                className={`fixed left-0 top-0 z-[110] h-screen w-72 bg-white shadow-2xl transition-transform duration-300 md:hidden ${
                    open
                        ? "translate-x-0"
                        : "-translate-x-full"
                }`}
            >

                <div className="flex h-full flex-col">

                    {/* Mobile Header */}

                    <div className="flex items-center justify-between border-b border-slate-200 p-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172033] text-xs font-extrabold text-white">
                                NW
                            </div>

                            <div>

                                <h1 className="text-sm font-extrabold text-[#172033]">
                                    eRTMAC-NWIS
                                </h1>

                                <p className="text-[9px] text-slate-400">
                                    Well Intelligence System
                                </p>

                            </div>

                        </div>


                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                            aria-label="Close navigation"
                        >
                            <RiCloseLine className="h-5 w-5" />
                        </button>

                    </div>


                    {/* Mobile Navigation */}

                    <nav className="flex-1 p-4">

                        <p className="mb-3 px-3 text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                            Navigation
                        </p>

                        <div className="space-y-1">

                            {links.map((link) => {

                                const Icon = link.icon;

                                return (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        onClick={() => setOpen(false)}
                                        className={navLinkClass}
                                    >
                                        <Icon className="h-4 w-4" />

                                        {link.label}
                                    </NavLink>
                                );
                            })}

                        </div>

                    </nav>


                    {/* Mobile Status */}

                    <div className="border-t border-slate-200 p-4">

                        <div className="rounded-xl bg-slate-50 p-3">

                            <div className="flex items-center gap-2">

                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                                <span className="text-[10px] font-extrabold text-slate-700">
                                    System Online
                                </span>

                            </div>

                        </div>

                    </div>

                </div>

            </aside>
        </>
    );
}

export default Sidebar;