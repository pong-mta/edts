import { Head, Link } from '@inertiajs/react';
import {
    FileSpreadsheet,
    FileText,
    FileType2,
    Plus,
} from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Department {
    id: number;
    name: string;
    code: string;
}

interface User {
    id: number;
    name: string;
    phone: string;
}

interface DocumentItem {
    id: number;
    title: string;
    document_type: 'word' | 'excel' | 'template';
    status: string;
    created_by: number;
    department_id: number;
    created_at: string;
    updated_at: string;
    department?: Department;
    creator?: User;
}

interface DocumentsProps {
    documents: DocumentItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Documents',
        href: '/documents',
    },
];

export default function Documents({
    documents,
}: DocumentsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Documents" />

            <div className="flex flex-1 flex-col p-6">

                <div className="mx-auto w-full max-w-6xl">

                    {/* ================================================== */}
                    {/* HEADER */}
                    {/* ================================================== */}

                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                        <div>
                            <p className="text-sm font-semibold text-blue-700">
                                eDTS
                            </p>

                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                                My Documents
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Documents created by you.
                            </p>
                        </div>

                        <Link
                            href={route('documents.create')}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0b5cab] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#084b8d]"
                        >
                            <Plus className="h-4 w-4" />
                            Create Document
                        </Link>

                    </div>

                    {/* ================================================== */}
                    {/* DOCUMENT LIST */}
                    {/* ================================================== */}

                    <div className="mt-8">

                        {documents.length === 0 ? (
                            <EmptyDocuments />
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                                {documents.map(
                                    (document) => (
                                        <DocumentCard
                                            key={
                                                document.id
                                            }
                                            document={
                                                document
                                            }
                                        />
                                    ),
                                )}

                            </div>
                        )}

                    </div>

                </div>

            </div>
        </AppLayout>
    );
}

/*
|--------------------------------------------------------------------------
| DOCUMENT CARD
|--------------------------------------------------------------------------
*/

function DocumentCard({
    document,
}: {
    document: DocumentItem;
}) {
    const typeInfo =
        document.document_type === 'word'
            ? {
                  label: 'Word Document',
                  icon: (
                      <FileText className="h-6 w-6" />
                  ),
              }
            : document.document_type === 'excel'
                ? {
                      label: 'Excel Spreadsheet',
                      icon: (
                          <FileSpreadsheet className="h-6 w-6" />
                      ),
                  }
                : {
                      label: 'Document Template',
                      icon: (
                          <FileType2 className="h-6 w-6" />
                      ),
                  };

    return (
        <Link
            href={route(
                'documents.edit',
                document.id,
            )}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >

            <div className="flex items-start justify-between gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    {typeInfo.icon}
                </div>

                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    {document.status}
                </span>

            </div>

            <h2 className="mt-5 line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-blue-700">
                {document.title}
            </h2>

            <p className="mt-2 text-xs text-slate-500">
                {typeInfo.label}
            </p>

            <div className="mt-5 border-t border-slate-100 pt-4">

                <div className="flex items-center justify-between">

                    <span className="text-[10px] text-slate-400">
                        Created
                    </span>

                    <span className="text-[10px] font-medium text-slate-500">
                        {formatDate(
                            document.created_at,
                        )}
                    </span>

                </div>

            </div>

        </Link>
    );
}

/*
|--------------------------------------------------------------------------
| EMPTY STATE
|--------------------------------------------------------------------------
*/

function EmptyDocuments() {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FileText className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-sm font-bold text-slate-900">
                No documents yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">
                Create your first Word document,
                Excel spreadsheet, or reusable
                template.
            </p>

            <Link
                href={route('documents.create')}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0b5cab] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#084b8d]"
            >
                <Plus className="h-4 w-4" />
                Create Document
            </Link>

        </div>
    );
}

/*
|--------------------------------------------------------------------------
| DATE FORMAT
|--------------------------------------------------------------------------
*/

function formatDate(
    value: string,
): string {
    if (!value) {
        return '';
    }

    return new Intl.DateTimeFormat(
        'en-PH',
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        },
    ).format(new Date(value));
}