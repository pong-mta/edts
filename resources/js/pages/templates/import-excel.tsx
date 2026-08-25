import React, {
    ChangeEvent,
    useState,
} from 'react';

import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

import {
    FileSpreadsheet,
    Upload,
} from 'lucide-react';

export default function ImportExcel() {
    const [file, setFile] =
        useState<File | null>(null);

    const handleFileChange = (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const selected =
            event.target.files?.[0] ?? null;

        if (!selected) {
            return;
        }

        if (
            !selected.name
                .toLowerCase()
                .endsWith('.xlsx')
        ) {
            alert(
                'Please select an Excel .xlsx file.',
            );

            event.target.value = '';

            return;
        }

        setFile(selected);
    };

    return (
        <AppLayout>
            <Head title="Import Excel Template" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}

                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Import Excel Template
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Import an existing Excel workbook
                        into EDTS as a document template.
                    </p>
                </div>

                {/* Upload */}

                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-2xl rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-green-50">
                            <FileSpreadsheet
                                size={32}
                                className="text-green-600"
                            />
                        </div>

                        <h2 className="mt-5 text-lg font-semibold text-slate-900">
                            Import an Excel workbook
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            Select an Excel .xlsx file
                            containing the LGU document
                            template you want to edit.
                        </p>

                        <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
                            <Upload size={17} />

                            Select Excel File

                            <input
                                type="file"
                                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                className="hidden"
                                onChange={
                                    handleFileChange
                                }
                            />
                        </label>

                        {/* Selected file */}

                        {file && (
                            <div className="mx-auto mt-6 max-w-lg rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet
                                        size={24}
                                        className="shrink-0 text-green-600"
                                    />

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-900">
                                            {file.name}
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {(
                                                file.size /
                                                1024
                                            ).toFixed(
                                                1,
                                            )}{' '}
                                            KB
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className="mt-5 text-xs text-slate-400">
                            Supported format: .xlsx
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}