import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Bell,
    CheckCircle2,
    Clock3,
    FileCheck2,
    FileText,
    FolderOpen,
    Plus,
    Send,
    Users,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface Department {
    id: number;
    name: string;
    code: string;
}

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    phone: string;
    department?: Department | null;
    roles?: Role[];
}

interface DashboardProps {
    user: User;
}

export default function Dashboard({
    user,
}: DashboardProps) {
    const departmentName =
        user.department?.name ??
        'No Department';

    const roleName =
        user.roles?.[0]?.name ??
        'User';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-6">

                {/* ====================================================== */}
                {/* HEADER */}
                {/* ====================================================== */}

                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                    <div>

                        <p className="text-sm font-medium text-blue-700">
                            Municipality of Estancia
                        </p>

                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                            Good day, {user.name}
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Welcome to the Electronic Document Tracking System.
                        </p>

                    </div>

                    <div className="flex items-center gap-3">

                        <button
                            type="button"
                            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                        >

                            <Bell className="h-5 w-5" />

                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />

                        </button>

                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                {user.name
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div className="hidden sm:block">

                                <p className="text-xs font-semibold text-slate-900">
                                    {user.name}
                                </p>

                                <p className="text-[10px] text-slate-500">
                                    {departmentName}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

                {/* ====================================================== */}
                {/* USER / DEPARTMENT CARD */}
                {/* ====================================================== */}

                <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b1f3a] to-[#0b5cab] p-6 text-white shadow-lg">

                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                        <div className="flex items-center gap-4">

                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold ring-1 ring-white/20">

                                {user.name
                                    .charAt(0)
                                    .toUpperCase()}

                            </div>

                            <div>

                                <p className="text-xs font-medium text-blue-200">
                                    Signed in as
                                </p>

                                <h2 className="mt-1 text-lg font-bold">
                                    {user.name}
                                </h2>

                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-blue-100">

                                    <span>
                                        {departmentName}
                                    </span>

                                    <span className="text-blue-300">
                                        •
                                    </span>

                                    <span className="capitalize">
                                        {roleName.replace(
                                            /_/g,
                                            ' ',
                                        )}
                                    </span>

                                </div>

                            </div>

                        </div>

                        <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">

                            <p className="text-[10px] uppercase tracking-wider text-blue-200">
                                Mobile Number
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                                {user.phone}
                            </p>

                        </div>

                    </div>

                </div>

                {/* ====================================================== */}
                {/* STATISTICS */}
                {/* ====================================================== */}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <StatCard
                        title="Pending Documents"
                        value="0"
                        description="Awaiting action"
                        icon={
                            <Clock3 className="h-5 w-5" />
                        }
                    />

                    <StatCard
                        title="For Review"
                        value="0"
                        description="Documents requiring review"
                        icon={
                            <FileText className="h-5 w-5" />
                        }
                    />

                    <StatCard
                        title="Completed"
                        value="0"
                        description="Completed documents"
                        icon={
                            <CheckCircle2 className="h-5 w-5" />
                        }
                    />

                    <StatCard
                        title="Total Documents"
                        value="0"
                        description="Documents in your department"
                        icon={
                            <FolderOpen className="h-5 w-5" />
                        }
                    />

                </div>

                {/* ====================================================== */}
                {/* MAIN CONTENT */}
                {/* ====================================================== */}

                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">

                    {/* RECENT DOCUMENTS */}

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

                            <div>

                                <h3 className="font-semibold text-slate-900">
                                    Recent Documents
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    Latest document activity
                                </p>

                            </div>

                            <button
                                type="button"
                                className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                            >
                                View all
                            </button>

                        </div>

                        <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                                <FileCheck2 className="h-7 w-7" />

                            </div>

                            <h4 className="mt-4 text-sm font-semibold text-slate-800">
                                No documents yet
                            </h4>

                            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                                Documents assigned to your department will appear here.
                            </p>

                            <Link
                                href={route('documents.create')}
                                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800"
                            >
                                <Plus className="h-4 w-4" />
                                Create Document
                            </Link>

                        </div>

                    </section>

                    {/* QUICK ACTIONS */}

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div>

                            <h3 className="font-semibold text-slate-900">
                                Quick Actions
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Common document operations
                            </p>

                        </div>

                        <div className="mt-5 space-y-3">

                            <QuickAction
                                icon={
                                    <Plus className="h-5 w-5" />
                                }
                                title="Create Document"
                                description="Start a new municipal document"
                                href={route('documents.create')}
                            />

                            <QuickAction
                                icon={
                                    <Send className="h-5 w-5" />
                                }
                                title="Send Document"
                                description="Route a document to another office"
                            />

                            <QuickAction
                                icon={
                                    <FolderOpen className="h-5 w-5" />
                                }
                                title="My Documents"
                                description="View documents assigned to you"
                            />

                            <QuickAction
                                icon={
                                    <Users className="h-5 w-5" />
                                }
                                title="Department"
                                description="View your department activity"
                            />

                        </div>

                    </section>

                </div>

            </div>
        </AppLayout>
    );
}

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({
    title,
    value,
    description,
    icon,
}: {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

                <div>

                    <p className="text-xs font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>

                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    {icon}
                </div>

            </div>

            <p className="mt-3 text-[11px] text-slate-400">
                {description}
            </p>

        </div>
    );
}

/*
|--------------------------------------------------------------------------
| QUICK ACTION
|--------------------------------------------------------------------------
*/

function QuickAction({
    icon,
    title,
    description,
    href,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    href?: string;
}) {
    const content = (
        <>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                {icon}
            </div>

            <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800">
                    {title}
                </p>

                <p className="mt-0.5 truncate text-[10px] text-slate-500">
                    {description}
                </p>
            </div>
        </>
    );

    if (href) {
        return (
            <Link
                href={href}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-100 hover:bg-blue-50"
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-100 hover:bg-blue-50"
        >
            {content}
        </button>
    );
}