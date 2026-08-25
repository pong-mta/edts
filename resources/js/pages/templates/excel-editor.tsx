import React, {
    useEffect,
    useState,
} from 'react';

import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

import ExcelEditor from '@/components/document-editor/excel-editor';

const IMPORT_STORAGE_KEY =
    'edts_imported_excel_workbook';

export default function ExcelEditorPage() {
    const [content, setContent] =
        useState<string | null>(null);

    useEffect(() => {
        const stored =
            sessionStorage.getItem(
                IMPORT_STORAGE_KEY,
            );

        if (stored) {
            setContent(stored);
        }
    }, []);

    return (
        <AppLayout>
            <Head title="Excel Template Editor" />

            <div className="flex h-full min-h-0 flex-1 flex-col p-4">

                <div className="mb-4 shrink-0">
                    <h1 className="text-xl font-semibold text-slate-900">
                        Excel Template Editor
                    </h1>

                    <p className="text-sm text-slate-500">
                        Edit your imported Excel
                        template.
                    </p>
                </div>

                <div className="min-h-0 flex-1">
                    {content ? (
                        <ExcelEditor
                            content={content}
                            onChange={(
                                nextContent,
                            ) => {
                                setContent(
                                    nextContent,
                                );

                                sessionStorage.setItem(
                                    IMPORT_STORAGE_KEY,
                                    nextContent,
                                );
                            }}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white">
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700">
                                    No Excel workbook
                                    loaded.
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Import an Excel
                                    workbook first.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}