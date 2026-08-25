import { Head, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    FileSpreadsheet,
    FileText,
    FileType2,
    LoaderCircle,
} from 'lucide-react';
import { FormEventHandler } from 'react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Documents',
        href: '/documents',
    },
    {
        title: 'Create',
        href: '/documents/create',
    },
];

type DocumentType =
    | 'word'
    | 'excel'
    | 'template';

interface CreateDocumentForm {
    title: string;
    document_type: DocumentType;
}

export default function CreateDocument() {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm<CreateDocumentForm>({
        title: '',
        document_type: 'word',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post(route('documents.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Document" />

            <div className="flex flex-1 flex-col p-6">

                {/* ====================================================== */}
                {/* HEADER */}
                {/* ====================================================== */}

                <div className="mx-auto w-full max-w-5xl">

                    <button
                        type="button"
                        onClick={() =>
                            window.history.back()
                        }
                        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    <div className="mb-8">

                        <p className="text-sm font-semibold text-blue-700">
                            Documents
                        </p>

                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                            Create Document
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Choose what kind of document you want to create.
                        </p>

                    </div>

                    {/* ================================================== */}
                    {/* FORM */}
                    {/* ================================================== */}

                    <form
                        onSubmit={submit}
                        className="space-y-8"
                    >

                        {/* ================================================== */}
                        {/* TITLE */}
                        {/* ================================================== */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                            <label
                                htmlFor="title"
                                className="block text-sm font-semibold text-slate-900"
                            >
                                Document Title
                            </label>

                            <p className="mt-1 text-xs text-slate-500">
                                Give your document a name so you can easily find it later.
                            </p>

                            <input
                                id="title"
                                type="text"
                                value={data.title}
                                onChange={(event) =>
                                    setData(
                                        'title',
                                        event.target.value,
                                    )
                                }
                                disabled={processing}
                                autoFocus
                                placeholder="e.g. Memorandum on Barangay Meeting"
                                className="mt-4 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                            />

                            {errors.title && (
                                <p className="mt-2 text-xs font-medium text-red-600">
                                    {errors.title}
                                </p>
                            )}

                        </div>

                        {/* ================================================== */}
                        {/* DOCUMENT TYPE */}
                        {/* ================================================== */}

                        <div>

                            <div className="mb-4">

                                <h2 className="text-lg font-semibold text-slate-900">
                                    Document Type
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Select the editor you want to use.
                                </p>

                            </div>

                            <div className="grid gap-4 md:grid-cols-3">

                                <DocumentTypeCard
                                    type="word"
                                    selected={
                                        data.document_type ===
                                        'word'
                                    }
                                    disabled={processing}
                                    onClick={() =>
                                        setData(
                                            'document_type',
                                            'word',
                                        )
                                    }
                                    icon={
                                        <FileText className="h-7 w-7" />
                                    }
                                    title="Word Document"
                                    description="Create a document with text, tables, images, formatting, and pages."
                                    badge="Document Editor"
                                />

                                <DocumentTypeCard
                                    type="excel"
                                    selected={
                                        data.document_type ===
                                        'excel'
                                    }
                                    disabled={processing}
                                    onClick={() =>
                                        setData(
                                            'document_type',
                                            'excel',
                                        )
                                    }
                                    icon={
                                        <FileSpreadsheet className="h-7 w-7" />
                                    }
                                    title="Excel Spreadsheet"
                                    description="Create a spreadsheet with rows, columns, cells, formulas, and tables."
                                    badge="Spreadsheet"
                                />

                                <DocumentTypeCard
                                    type="template"
                                    selected={
                                        data.document_type ===
                                        'template'
                                    }
                                    disabled={processing}
                                    onClick={() =>
                                        setData(
                                            'document_type',
                                            'template',
                                        )
                                    }
                                    icon={
                                        <FileType2 className="h-7 w-7" />
                                    }
                                    title="Document Template"
                                    description="Create a reusable blank template for future municipal documents."
                                    badge="Reusable"
                                />

                            </div>

                            {errors.document_type && (
                                <p className="mt-2 text-xs font-medium text-red-600">
                                    {errors.document_type}
                                </p>
                            )}

                        </div>

                        {/* ================================================== */}
                        {/* ACTIONS */}
                        {/* ================================================== */}

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">

                            <button
                                type="button"
                                disabled={processing}
                                onClick={() =>
                                    window.history.back()
                                }
                                className="h-11 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    processing ||
                                    !data.title.trim()
                                }
                                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0b5cab] px-7 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#084b8d] disabled:cursor-not-allowed disabled:opacity-50"
                            >

                                {processing ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                                        Creating...
                                    </>
                                ) : (
                                    'Create Document'
                                )}

                            </button>

                        </div>

                    </form>

                </div>

            </div>
        </AppLayout>
    );
}

/*
|--------------------------------------------------------------------------
| DOCUMENT TYPE CARD
|--------------------------------------------------------------------------
*/

interface DocumentTypeCardProps {
    type: DocumentType;
    selected: boolean;
    disabled: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    description: string;
    badge: string;
}

function DocumentTypeCard({
    selected,
    disabled,
    onClick,
    icon,
    title,
    description,
    badge,
}: DocumentTypeCardProps) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={[
                'relative rounded-2xl border p-6 text-left transition',
                'disabled:cursor-not-allowed disabled:opacity-60',
                selected
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50',
            ].join(' ')}
        >

            {/* SELECTED INDICATOR */}

            {selected && (
                <div className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">

                    <div className="h-2 w-2 rounded-full bg-white" />

                </div>
            )}

            {/* ICON */}

            <div
                className={[
                    'flex h-14 w-14 items-center justify-center rounded-2xl',
                    selected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600',
                ].join(' ')}
            >
                {icon}
            </div>

            {/* BADGE */}

            <div className="mt-5">

                <span
                    className={[
                        'rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide',
                        selected
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-500',
                    ].join(' ')}
                >
                    {badge}
                </span>

            </div>

            {/* TITLE */}

            <h3 className="mt-4 text-base font-bold text-slate-900">
                {title}
            </h3>

            {/* DESCRIPTION */}

            <p className="mt-2 text-xs leading-5 text-slate-500">
                {description}
            </p>

        </button>
    );
}