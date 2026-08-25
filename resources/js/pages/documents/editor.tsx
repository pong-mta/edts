import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    FileSpreadsheet,
    FileText,
    LoaderCircle,
    Save,
} from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import WordEditor from '@/components/document-editor/word-editor';
import ExcelEditor from '@/components/document-editor/excel-editor';


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

interface DocumentData {
    id: number;
    title: string;
    document_type: 'word' | 'excel' | 'template';
    content: string | null;
    status: string;
    created_by: number;
    department_id: number;
    department?: Department;
    creator?: User;
}

interface EditorProps {
    document: DocumentData;
}

export default function Editor({
    document,
}: EditorProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Documents',
            href: '/documents',
        },
        {
            title: document.title,
            href: `/documents/${document.id}/edit`,
        },
    ];

    const {
        data,
        setData,
        put,
        processing,
        errors,
    } = useForm({
        title: document.title,
        content: document.content ?? '',
    });

    const saveDocument = () => {
        put(
            route(
                'documents.update',
                document.id,
            ),
        );
    };

    const documentTypeLabel =
        document.document_type === 'word'
            ? 'Word Document'
            : document.document_type === 'excel'
                ? 'Excel Spreadsheet'
                : 'Document Template';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${document.title} | eDTS`} />

            <div className="flex min-h-0 flex-1 flex-col">

                {/* ====================================================== */}
                {/* EDITOR HEADER */}
                {/* ====================================================== */}

                <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex items-center gap-4">

                        <Link
                            href={route(
                                'documents.index',
                            )}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">

                                {document.document_type ===
                                'excel' ? (
                                    <FileSpreadsheet className="h-5 w-5" />
                                ) : (
                                    <FileText className="h-5 w-5" />
                                )}

                            </div>

                            <div>

                                <div className="flex items-center gap-2">

                                    <h1 className="max-w-[400px] truncate text-sm font-bold text-slate-900">
                                        {document.title}
                                    </h1>

                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase text-slate-500">
                                        {documentTypeLabel}
                                    </span>

                                </div>

                                <p className="mt-0.5 text-[10px] text-slate-500">
                                    Draft • {document.department?.name ?? 'Department'}
                                </p>

                            </div>

                        </div>

                    </div>

                    <div className="flex items-center gap-2">

                        <span className="mr-2 text-xs text-slate-400">
                            {processing
                                ? 'Saving...'
                                : 'Saved locally'}
                        </span>

                        <button
                            type="button"
                            onClick={saveDocument}
                            disabled={processing}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0b5cab] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#084b8d] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}

                            Save
                        </button>

                    </div>

                </div>

                {/* ====================================================== */}
                {/* EDITOR AREA */}
                {/* ====================================================== */}

                <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-6">

                    <div className="mx-auto max-w-5xl">

                        {/* TITLE */}

                        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

                            <label
                                htmlFor="document-title"
                                className="mb-2 block text-xs font-semibold text-slate-600"
                            >
                                Document Title
                            </label>

                            <input
                                id="document-title"
                                type="text"
                                value={data.title}
                                onChange={(event) =>
                                    setData(
                                        'title',
                                        event.target.value,
                                    )
                                }
                                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                            />

                            {errors.title && (
                                <p className="mt-2 text-xs text-red-600">
                                    {errors.title}
                                </p>
                            )}

                        </div>

                        {/* ================================================== */}
                        {/* WORD EDITOR */}
                        {/* ================================================== */}

                        {document.document_type === 'word' && (
                            <WordEditor
                                content={data.content}
                                onChange={(content) =>
                                    setData('content', content)
                                }
                            />
                        )}

                        {/* ================================================== */}
                        {/* EXCEL EDITOR */}
                        {/* ================================================== */}

                        {document.document_type === 'excel' && (
                            <ExcelEditor
                                content={data.content}
                                onChange={(content) =>
                                    setData('content', content)
                                }
                            />
                        )}

                        {/* ================================================== */}
                        {/* TEMPLATE */}
                        {/* ================================================== */}

                        {document.document_type === 'template' && (
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">

                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Template Editor
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Create a reusable municipal document template.
                                    </p>

                                </div>

                                <div className="bg-slate-200 p-8">

                                    <div
                                        className="mx-auto min-h-[900px] max-w-[794px] bg-white p-16 shadow-lg outline-none"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={(event) =>
                                            setData(
                                                'content',
                                                event.currentTarget
                                                    .innerHTML,
                                            )
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                data.content ||
                                                '<p>Start designing your template...</p>',
                                        }}
                                    />

                                </div>

                            </div>
                        )}

                    </div>

                </div>

            </div>
        </AppLayout>
    );
}