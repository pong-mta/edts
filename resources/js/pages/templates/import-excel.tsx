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

import {
    ExcelWorkbook,
    ExcelSheet,
    ExcelCell,
    ExcelMerge,
} from '@/types/excel';

export default function ImportExcel() {
    const [file, setFile] =
        useState<File | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [workbook, setWorkbook] =
        useState<ExcelWorkbook | null>(
            null,
        );

    const [error, setError] =
        useState<string | null>(null);

    /*
    |--------------------------------------------------------------------------
    | IMPORT EXCEL
    |--------------------------------------------------------------------------
    */

    const handleFileChange = async (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const selected =
            event.target.files?.[0] ??
            null;

        if (!selected) {
            return;
        }

        if (
            !selected.name
                .toLowerCase()
                .endsWith('.xlsx')
        ) {
            setError(
                'Please select an Excel .xlsx file.',
            );

            event.target.value = '';

            return;
        }

        setFile(selected);
        setWorkbook(null);
        setError(null);
        setLoading(true);

        try {
            /*
            |--------------------------------------------------------------------------
            | Read file
            |--------------------------------------------------------------------------
            */

            const buffer =
                await selected.arrayBuffer();

            const sourceWorkbook =
                XLSX.read(buffer, {
                    type: 'array',
                    cellFormula: true,
                    cellStyles: true,
                });

            /*
            |--------------------------------------------------------------------------
            | Convert worksheets
            |--------------------------------------------------------------------------
            */

            const sheets: ExcelSheet[] =
                sourceWorkbook.SheetNames.map(
                    (sheetName) => {
                        const worksheet =
                            sourceWorkbook
                                .Sheets[
                                sheetName
                            ];

                        /*
                        |--------------------------------------------------------------------------
                        | Determine worksheet range
                        |--------------------------------------------------------------------------
                        */

                        const range =
                            worksheet['!ref'];

                        let startRow = 0;
                        let startColumn = 0;
                        let endRow = 0;
                        let endColumn = 0;

                        if (range) {
                            const decoded =
                                XLSX.utils.decode_range(
                                    range,
                                );

                            startRow =
                                decoded.s.r;

                            startColumn =
                                decoded.s.c;

                            endRow =
                                decoded.e.r;

                            endColumn =
                                decoded.e.c;
                        }

                        const rowCount =
                            Math.max(
                                endRow -
                                    startRow +
                                    1,
                                1,
                            );

                        const columnCount =
                            Math.max(
                                endColumn -
                                    startColumn +
                                    1,
                                1,
                            );

                        /*
                        |--------------------------------------------------------------------------
                        | Cells
                        |--------------------------------------------------------------------------
                        */

                        const cells: ExcelCell[][] =
                            Array.from(
                                {
                                    length:
                                        rowCount,
                                },
                                () =>
                                    Array.from(
                                        {
                                            length:
                                                columnCount,
                                        },
                                        () => ({
                                            value: '',
                                        }),
                                    ),
                            );

                        for (
                            let row =
                                startRow;
                            row <=
                            endRow;
                            row++
                        ) {
                            for (
                                let column =
                                    startColumn;
                                column <=
                                endColumn;
                                column++
                            ) {
                                const address =
                                    XLSX.utils.encode_cell(
                                        {
                                            r: row,
                                            c: column,
                                        },
                                    );

                                const sourceCell =
                                    worksheet[
                                        address
                                    ];

                                if (
                                    !sourceCell
                                ) {
                                    continue;
                                }

                                const targetRow =
                                    row -
                                    startRow;

                                const targetColumn =
                                    column -
                                    startColumn;

                                let value =
                                    '';

                                if (
                                    sourceCell.v !==
                                    undefined &&
                                    sourceCell.v !==
                                        null
                                ) {
                                    value =
                                        String(
                                            sourceCell.v,
                                        );
                                }

                                const cell: ExcelCell =
                                    {
                                        value,
                                    };

                                /*
                                |--------------------------------------------------------------------------
                                | Formula
                                |--------------------------------------------------------------------------
                                */

                                if (
                                    sourceCell.f
                                ) {
                                    cell.formula =
                                        sourceCell.f;
                                }

                                /*
                                |--------------------------------------------------------------------------
                                | Basic formatting
                                |--------------------------------------------------------------------------
                                */

                                if (
                                    sourceCell.s
                                ) {
                                    const style =
                                        sourceCell.s;

                                    if (
                                        style.font
                                    ) {
                                        if (
                                            style
                                                .font
                                                .bold
                                        ) {
                                            cell.bold =
                                                true;
                                        }

                                        if (
                                            style
                                                .font
                                                .italic
                                        ) {
                                            cell.italic =
                                                true;
                                        }

                                        if (
                                            style
                                                .font
                                                .underline
                                        ) {
                                            cell.underline =
                                                true;
                                        }

                                        if (
                                            style
                                                .font
                                                .sz
                                        ) {
                                            cell.fontSize =
                                                style
                                                    .font
                                                    .sz;
                                        }

                                        if (
                                            style
                                                .font
                                                .name
                                        ) {
                                            cell.fontFamily =
                                                style
                                                    .font
                                                    .name;
                                        }
                                    }
                                }

                                cells[
                                    targetRow
                                ][
                                    targetColumn
                                ] = cell;
                            }
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | Column widths
                        |--------------------------------------------------------------------------
                        */

                        const columnWidths =
                            Array.from(
                                {
                                    length:
                                        columnCount,
                                },
                                () => 100,
                            );

                        const columnInfo =
                            worksheet[
                                '!cols'
                            ];

                        if (
                            Array.isArray(
                                columnInfo,
                            )
                        ) {
                            columnInfo.forEach(
                                (
                                    column,
                                    index,
                                ) => {
                                    if (
                                        index >=
                                        columnCount
                                    ) {
                                        return;
                                    }

                                    if (
                                        typeof column.wpx ===
                                        'number'
                                    ) {
                                        columnWidths[
                                            index
                                        ] =
                                            column.wpx;
                                    } else if (
                                        typeof column.wch ===
                                        'number'
                                    ) {
                                        columnWidths[
                                            index
                                        ] =
                                            column.wch *
                                            7;
                                    }
                                },
                            );
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | Row heights
                        |--------------------------------------------------------------------------
                        */

                        const rowHeights =
                            Array.from(
                                {
                                    length:
                                        rowCount,
                                },
                                () => 28,
                            );

                        const rowInfo =
                            worksheet[
                                '!rows'
                            ];

                        if (
                            Array.isArray(
                                rowInfo,
                            )
                        ) {
                            rowInfo.forEach(
                                (
                                    row,
                                    index,
                                ) => {
                                    if (
                                        index >=
                                        rowCount
                                    ) {
                                        return;
                                    }

                                    if (
                                        typeof row.hpx ===
                                        'number'
                                    ) {
                                        rowHeights[
                                            index
                                        ] =
                                            row.hpx;
                                    } else if (
                                        typeof row.hpt ===
                                        'number'
                                    ) {
                                        rowHeights[
                                            index
                                        ] =
                                            row.hpt *
                                            1.333333;
                                    }
                                },
                            );
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | Merged cells
                        |--------------------------------------------------------------------------
                        */

                        const mergedCells: ExcelMerge[] =
                            [];

                        const merges =
                            worksheet[
                                '!merges'
                            ];

                        if (
                            Array.isArray(
                                merges,
                            )
                        ) {
                            merges.forEach(
                                (merge) => {
                                    mergedCells.push(
                                        {
                                            startRow:
                                                merge
                                                    .s
                                                    .r -
                                                startRow,

                                            startColumn:
                                                merge
                                                    .s
                                                    .c -
                                                startColumn,

                                            endRow:
                                                merge
                                                    .e
                                                    .r -
                                                startRow,

                                            endColumn:
                                                merge
                                                    .e
                                                    .c -
                                                startColumn,
                                        },
                                    );
                                },
                            );
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | Images
                        |--------------------------------------------------------------------------
                        |
                        | XLSX image extraction will be handled
                        | separately. For now we preserve the
                        | image collection in our data model.
                        |
                        */

                        return {
                            name: sheetName,

                            cells,

                            columnWidths,

                            rowHeights,

                            mergedCells,

                            images: [],
                        };
                    },
                );

            /*
            |--------------------------------------------------------------------------
            | EDTS Workbook
            |--------------------------------------------------------------------------
            */

            const edtsWorkbook: ExcelWorkbook = {
                version: 1,

                type: 'spreadsheet',

                sheets,

                activeSheet: 0,
            };

            setWorkbook(
                edtsWorkbook,
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
                    IMPORT CARD
                ============================================================ */}

                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-3xl rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">

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
                            Select an Excel workbook
                            and EDTS will convert it
                            into an editable template.
                        </p>

                        {/* ====================================================
                            SELECT BUTTON
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
                            FILE
                        ==================================================== */}

                        {file && (
                            <div className="mx-auto mt-6 max-w-xl rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
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
                            <div className="mx-auto mt-5 max-w-xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* ====================================================
                            SHEETS
                        ==================================================== */}

                        {workbook && (
                            <div className="mx-auto mt-6 max-w-xl text-left">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Workbook Imported
                                    </h3>

                                    <span className="text-xs text-slate-500">
                                        {
                                            workbook
                                                .sheets
                                                .length
                                        }{' '}
                                        sheet
                                        {workbook
                                            .sheets
                                            .length !==
                                        1
                                            ? 's'
                                            : ''}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {workbook.sheets.map(
                                        (
                                            sheet,
                                        ) => (
                                            <div
                                                key={
                                                    sheet.name
                                                }
                                                className="rounded-lg border border-slate-200 bg-white p-4"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <FileSpreadsheet
                                                            size={
                                                                18
                                                            }
                                                            className="shrink-0 text-green-600"
                                                        />

                                                        <span className="truncate text-sm font-semibold text-slate-800">
                                                            {
                                                                sheet.name
                                                            }
                                                        </span>
                                                    </div>

                                                    <span className="text-xs text-slate-500">
                                                        {
                                                            sheet
                                                                .cells
                                                                .length
                                                        }{' '}
                                                        rows
                                                    </span>
                                                </div>

                                                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                                    <div className="rounded bg-slate-50 p-2">
                                                        <div className="text-slate-400">
                                                            Columns
                                                        </div>

                                                        <div className="font-semibold text-slate-700">
                                                            {
                                                                sheet
                                                                    .columnWidths
                                                                    .length
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className="rounded bg-slate-50 p-2">
                                                        <div className="text-slate-400">
                                                            Merged
                                                        </div>

                                                        <div className="font-semibold text-slate-700">
                                                            {
                                                                sheet
                                                                    .mergedCells
                                                                    .length
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className="rounded bg-slate-50 p-2">
                                                        <div className="text-slate-400">
                                                            Images
                                                        </div>

                                                        <div className="font-semibold text-slate-700">
                                                            {
                                                                sheet
                                                                    .images
                                                                    .length
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
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