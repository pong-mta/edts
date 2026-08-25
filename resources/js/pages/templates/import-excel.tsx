import React, {
    ChangeEvent,
    useState,
} from 'react';

import AppLayout from '@/layouts/app-layout';

import {
    Head,
    router,
} from '@inertiajs/react';

import {
    CheckCircle2,
    FileSpreadsheet,
    Loader2,
    Pencil,
    Upload,
} from 'lucide-react';

import ExcelJS from 'exceljs';

import {
    ExcelCell,
    ExcelMerge,
    ExcelSheet,
    ExcelWorkbook,
} from '@/types/excel';

const IMPORT_STORAGE_KEY =
    'edts_imported_excel_workbook';

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
    | Convert Excel Color
    |--------------------------------------------------------------------------
    */

    const excelColorToHex = (
        color: any,
    ): string | undefined => {
        if (!color) {
            return undefined;
        }

        let rgb: string | undefined;

        if (
            typeof color.rgb ===
            'string'
        ) {
            rgb = color.rgb;
        }

        /*
        |--------------------------------------------------------------------------
        | Theme colors
        |--------------------------------------------------------------------------
        |
        | SheetJS may return theme colors instead
        | of RGB colors. We don't try to guess
        | the actual theme color here.
        |
        */

        if (!rgb) {
            return undefined;
        }

        /*
        |--------------------------------------------------------------------------
        | Excel ARGB → RGB
        |--------------------------------------------------------------------------
        */

        if (rgb.length === 8) {
            rgb = rgb.substring(2);
        }

        if (
            rgb.length !== 6
        ) {
            return undefined;
        }

        return `#${rgb}`;
    };

    /*
    |--------------------------------------------------------------------------
    | Convert Border
    |--------------------------------------------------------------------------
    */

    const convertBorder = (
        borderSide: any,
    ): string | undefined => {
        if (!borderSide) {
            return undefined;
        }

        const style =
            borderSide.style;

        if (!style) {
            return undefined;
        }

        const color =
            excelColorToHex(
                borderSide.color,
            );

        if (color) {
            return `${style}:${color}`;
        }

        return style;
    };

    /*
    |--------------------------------------------------------------------------
    | Import Excel
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
            | Read workbook
            |--------------------------------------------------------------------------
            */

            const buffer =
                await selected.arrayBuffer();

            const sourceWorkbook =
                XLSX.read(buffer, {
                    type: 'array',

                    /*
                    |--------------------------------------------------------------------------
                    | Preserve formulas
                    |--------------------------------------------------------------------------
                    */

                    cellFormula: true,

                    /*
                    |--------------------------------------------------------------------------
                    | Preserve styles
                    |--------------------------------------------------------------------------
                    */

                    cellStyles: true,

                    /*
                    |--------------------------------------------------------------------------
                    | Preserve cell dates
                    |--------------------------------------------------------------------------
                    */

                    cellDates: true,
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
                        | Worksheet range
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

                        /*
                        |--------------------------------------------------------------------------
                        | Dimensions
                        |--------------------------------------------------------------------------
                        */

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
                        | Create cells
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

                        /*
                        |--------------------------------------------------------------------------
                        | Read cells
                        |--------------------------------------------------------------------------
                        */

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

                                /*
                                |--------------------------------------------------------------------------
                                | Cell value
                                |--------------------------------------------------------------------------
                                */

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
                                | Excel Style
                                |--------------------------------------------------------------------------
                                */

                                const style =
                                    sourceCell.s;

                                if (style) {
                                    /*
                                    |--------------------------------------------------------------------------
                                    | Font
                                    |--------------------------------------------------------------------------
                                    */

                                    if (
                                        style.font
                                    ) {
                                        const font =
                                            style.font;

                                        if (
                                            font.bold
                                        ) {
                                            cell.bold =
                                                true;
                                        }

                                        if (
                                            font.italic
                                        ) {
                                            cell.italic =
                                                true;
                                        }

                                        if (
                                            font.underline
                                        ) {
                                            cell.underline =
                                                true;
                                        }

                                        if (
                                            typeof font.sz ===
                                            'number'
                                        ) {
                                            cell.fontSize =
                                                font.sz;
                                        }

                                        if (
                                            typeof font.name ===
                                            'string'
                                        ) {
                                            cell.fontFamily =
                                                font.name;
                                        }

                                        const fontColor =
                                            excelColorToHex(
                                                font.color,
                                            );

                                        if (
                                            fontColor
                                        ) {
                                            cell.color =
                                                fontColor;
                                        }
                                    }

                                    /*
                                    |--------------------------------------------------------------------------
                                    | Fill
                                    |--------------------------------------------------------------------------
                                    */

                                    if (
                                        style.fill
                                    ) {
                                        const fill =
                                            style.fill;

                                        /*
                                        |--------------------------------------------------------------------------
                                        | Foreground color
                                        |--------------------------------------------------------------------------
                                        */

                                        const foregroundColor =
                                            excelColorToHex(
                                                fill.fgColor,
                                            );

                                        if (
                                            foregroundColor
                                        ) {
                                            cell.backgroundColor =
                                                foregroundColor;
                                        }

                                        /*
                                        |--------------------------------------------------------------------------
                                        | Background color
                                        |--------------------------------------------------------------------------
                                        */

                                        if (
                                            !cell.backgroundColor
                                        ) {
                                            const backgroundColor =
                                                excelColorToHex(
                                                    fill.bgColor,
                                                );

                                            if (
                                                backgroundColor
                                            ) {
                                                cell.backgroundColor =
                                                    backgroundColor;
                                            }
                                        }
                                    }

                                    /*
                                    |--------------------------------------------------------------------------
                                    | Alignment
                                    |--------------------------------------------------------------------------
                                    */

                                    if (
                                        style.alignment
                                    ) {
                                        const alignment =
                                            style.alignment;

                                        if (
                                            alignment.horizontal ===
                                                'left' ||
                                            alignment.horizontal ===
                                                'center' ||
                                            alignment.horizontal ===
                                                'right'
                                        ) {
                                            cell.horizontalAlign =
                                                alignment.horizontal;
                                        }

                                        if (
                                            alignment.vertical ===
                                                'top' ||
                                            alignment.vertical ===
                                                'center' ||
                                            alignment.vertical ===
                                                'bottom'
                                        ) {
                                            cell.verticalAlign =
                                                alignment.vertical ===
                                                'center'
                                                    ? 'middle'
                                                    : alignment.vertical;
                                        }

                                        if (
                                            alignment.wrapText
                                        ) {
                                            cell.wrapText =
                                                true;
                                        }
                                    }

                                    /*
                                    |--------------------------------------------------------------------------
                                    | Borders
                                    |--------------------------------------------------------------------------
                                    */

                                    if (
                                        style.border
                                    ) {
                                        const border: ExcelCell['border'] =
                                            {};

                                        border.top =
                                            convertBorder(
                                                style
                                                    .border
                                                    .top,
                                            );

                                        border.right =
                                            convertBorder(
                                                style
                                                    .border
                                                    .right,
                                            );

                                        border.bottom =
                                            convertBorder(
                                                style
                                                    .border
                                                    .bottom,
                                            );

                                        border.left =
                                            convertBorder(
                                                style
                                                    .border
                                                    .left,
                                            );

                                        if (
                                            border.top ||
                                            border.right ||
                                            border.bottom ||
                                            border.left
                                        ) {
                                            cell.border =
                                                border;
                                        }
                                    }
                                }

                                /*
                                |--------------------------------------------------------------------------
                                | Number format
                                |--------------------------------------------------------------------------
                                */

                                if (
                                    typeof sourceCell.z ===
                                    'string'
                                ) {
                                    cell.numberFormat =
                                        sourceCell.z;
                                }

                                /*
                                |--------------------------------------------------------------------------
                                | Store cell
                                |--------------------------------------------------------------------------
                                */

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
                        | Sheet
                        |--------------------------------------------------------------------------
                        */

                        return {
                            name: sheetName,

                            cells,

                            columnWidths,

                            rowHeights,

                            mergedCells,

                            /*
                            |--------------------------------------------------------------------------
                            | Images
                            |--------------------------------------------------------------------------
                            |
                            | We will handle embedded XLSX
                            | images separately.
                            |
                            */

                            images: [],
                        };
                    },
                );

            /*
            |--------------------------------------------------------------------------
            | Create EDTS workbook
            |--------------------------------------------------------------------------
            */

            const edtsWorkbook: ExcelWorkbook = {
                version: 1,

                type: 'spreadsheet',

                sheets,

                activeSheet: 0,
            };

            /*
            |--------------------------------------------------------------------------
            | Store workbook in state
            |--------------------------------------------------------------------------
            */

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

    /*
    |--------------------------------------------------------------------------
    | Open in editor
    |--------------------------------------------------------------------------
    */

    const openInEditor = () => {
        if (!workbook) {
            return;
        }

        try {
            sessionStorage.setItem(
                IMPORT_STORAGE_KEY,
                JSON.stringify(
                    workbook,
                ),
            );

            router.visit(
                '/templates/import/excel/editor',
            );
        } catch (err) {
            console.error(
                'Unable to open workbook:',
                err,
            );

            setError(
                'Unable to transfer the imported workbook to the editor.',
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

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
                            SELECT FILE
                        ==================================================== */}

                        <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">

                            {loading ? (
                                <Loader2
                                    size={17}
                                    className="animate-spin"
                                />
                            ) : (
                                <Upload
                                    size={17}
                                />
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
                            WORKBOOK
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

                                {/* =================================================
                                    OPEN EDITOR
                                ================================================= */}

                                <button
                                    type="button"
                                    onClick={
                                        openInEditor
                                    }
                                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                    <Pencil
                                        size={17}
                                    />

                                    Open in Excel Editor
                                </button>

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