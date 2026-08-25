import React, {
    ChangeEvent,
    useState,
} from 'react';

import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

import {
    FileSpreadsheet,
    Upload,
    CheckCircle2,
    Loader2,
} from 'lucide-react';

import * as XLSX from 'xlsx';

type SheetInfo = {
    name: string;
    rows: number;
    columns: number;
};

export default function ImportExcel() {
    const [file, setFile] =
        useState<File | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [sheets, setSheets] =
        useState<SheetInfo[]>([]);

    const [error, setError] =
        useState<string | null>(null);

    const handleFileChange = async (
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
        setSheets([]);
        setError(null);
        setLoading(true);

        try {
            /*
            |--------------------------------------------------------------------------
            | Read Excel file
            |--------------------------------------------------------------------------
            */

            const buffer =
                await selected.arrayBuffer();

            const workbook =
                XLSX.read(buffer, {
                    type: 'array',
                });

            /*
            |--------------------------------------------------------------------------
            | Read worksheet information
            |--------------------------------------------------------------------------
            */

            const sheetInformation: SheetInfo[] =
                workbook.SheetNames.map(
                    (sheetName) => {
                        const worksheet =
                            workbook.Sheets[
                                sheetName
                            ];

                        const range =
                            worksheet['!ref'];

                        if (!range) {
                            return {
                                name: sheetName,
                                rows: 0,
                                columns: 0,
                            };
                        }

                        const decoded =
                            XLSX.utils.decode_range(
                                range,
                            );

                        return {
                            name: sheetName,

                            rows:
                                decoded.e.r -
                                decoded.s.r +
                                1,

                            columns:
                                decoded.e.c -
                                decoded.s.c +
                                1,
                        };
                    },
                );

            setSheets(
                sheetInformation,
            );
        } catch (err) {
            console.error(
                'Excel import error:',
                err,
            );

            setError(
                'Unable to read this Excel file.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Import Excel Template" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* ============================================================
                    HEADER
                ============================================================ */}

                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Import Excel Template
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Import an existing Excel
                        workbook into EDTS as a
                        document template.
                    </p>
                </div>

                {/* ============================================================
                    UPLOAD
                ============================================================ */}

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
                            Select an Excel .xlsx
                            file containing the LGU
                            document template you
                            want to edit.
                        </p>

                        {/* ====================================================
                            BUTTON
                        ==================================================== */}

                        <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
                            {loading ? (
                                <Loader2
                                    size={17}
                                    className="animate-spin"
                                />
                            ) : (
                                <Upload size={17} />
                            )}

                            {loading
                                ? 'Reading Excel...'
                                : 'Select Excel File'}

                            <input
                                type="file"
                                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                className="hidden"
                                onChange={
                                    handleFileChange
                                }
                                disabled={
                                    loading
                                }
                            />
                        </label>

                        {/* ====================================================
                            SELECTED FILE
                        ==================================================== */}

                        {file && (
                            <div className="mx-auto mt-6 max-w-lg rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet
                                        size={24}
                                        className="shrink-0 text-green-600"
                                    />

                                    <div className="min-w-0 flex-1">
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

                                    {!loading &&
                                        !error && (
                                            <CheckCircle2
                                                size={
                                                    20
                                                }
                                                className="shrink-0 text-green-600"
                                            />
                                        )}
                                </div>
                            </div>
                        )}

                        {/* ====================================================
                            ERROR
                        ==================================================== */}

                        {error && (
                            <div className="mx-auto mt-5 max-w-lg rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* ====================================================
                            WORKBOOK
                        ==================================================== */}

                        {sheets.length > 0 && (
                            <div className="mx-auto mt-6 max-w-lg text-left">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Workbook Sheets
                                    </h3>

                                    <span className="text-xs text-slate-500">
                                        {
                                            sheets.length
                                        }{' '}
                                        sheet
                                        {sheets.length !==
                                        1
                                            ? 's'
                                            : ''}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {sheets.map(
                                        (
                                            sheet,
                                        ) => (
                                            <div
                                                key={
                                                    sheet.name
                                                }
                                                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <FileSpreadsheet
                                                        size={
                                                            18
                                                        }
                                                        className="shrink-0 text-green-600"
                                                    />

                                                    <span className="truncate text-sm font-medium text-slate-800">
                                                        {
                                                            sheet.name
                                                        }
                                                    </span>
                                                </div>

                                                <span className="ml-4 shrink-0 text-xs text-slate-500">
                                                    {
                                                        sheet.rows
                                                    }{' '}
                                                    rows ×{' '}
                                                    {
                                                        sheet.columns
                                                    }{' '}
                                                    columns
                                                </span>
                                            </div>
                                        ),
                                    )}
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