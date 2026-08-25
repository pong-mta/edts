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

import * as XLSX from 'xlsx-js-style';

import {
    ExcelCell,
    ExcelMerge,
    ExcelSheet,
    ExcelWorkbook,
} from '@/types/excel';

const IMPORT_STORAGE_KEY =
    'edts_imported_excel_workbook';

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function colorToHex(
    color: any,
): string | undefined {
    if (!color) {
        return undefined;
    }

    let rgb: string | undefined;

    if (
        typeof color.rgb === 'string'
    ) {
        rgb = color.rgb;
    }

    /*
    |--------------------------------------------------------------------------
    | Theme / indexed colors
    |--------------------------------------------------------------------------
    */

    if (!rgb && color.theme !== undefined) {
        /*
        We cannot reliably reproduce every
        Excel theme color without the workbook
        theme table.
        */
        return undefined;
    }

    if (!rgb && color.indexed !== undefined) {
        const indexedColors: Record<
            number,
            string
        > = {
            0: '#000000',
            1: '#FFFFFF',
            2: '#FF0000',
            3: '#00FF00',
            4: '#0000FF',
            5: '#FFFF00',
            6: '#FF00FF',
            7: '#00FFFF',
            8: '#000000',
            9: '#FFFFFF',
            10: '#FF0000',
            11: '#00FF00',
            12: '#0000FF',
            13: '#FFFF00',
            14: '#FF00FF',
            15: '#00FFFF',
        };

        return indexedColors[color.indexed];
    }

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

    if (rgb.length !== 6) {
        return undefined;
    }

    return `#${rgb}`;
}

function borderToString(
    border: any,
): string | undefined {
    if (!border) {
        return undefined;
    }

    if (!border.style) {
        return undefined;
    }

    const color =
        colorToHex(border.color);

    if (color) {
        return `${border.style}:${color}`;
    }

    return border.style;
}

/*
|--------------------------------------------------------------------------
| Convert XLSX cell → EDTS cell
|--------------------------------------------------------------------------
*/

function convertCell(
    sourceCell: any,
): ExcelCell {
    let value = '';

    /*
    |--------------------------------------------------------------------------
    | Value
    |--------------------------------------------------------------------------
    */

    if (
        sourceCell?.v !== undefined &&
        sourceCell?.v !== null
    ) {
        value = String(sourceCell.v);
    }

    const cell: ExcelCell = {
        value,
    };

    /*
    |--------------------------------------------------------------------------
    | Formula
    |--------------------------------------------------------------------------
    */

    if (sourceCell?.f) {
        cell.formula =
            String(sourceCell.f);
    }

    /*
    |--------------------------------------------------------------------------
    | Number format
    |--------------------------------------------------------------------------
    */

    if (
        typeof sourceCell?.z ===
        'string'
    ) {
        cell.numberFormat =
            sourceCell.z;
    }

    /*
    |--------------------------------------------------------------------------
    | Style
    |--------------------------------------------------------------------------
    */

    const style =
        sourceCell?.s;

    if (!style) {
        return cell;
    }

    /*
    |--------------------------------------------------------------------------
    | Font
    |--------------------------------------------------------------------------
    */

    if (style.font) {
        const font =
            style.font;

        if (font.bold) {
            cell.bold = true;
        }

        if (font.italic) {
            cell.italic = true;
        }

        if (
            font.underline
        ) {
            cell.underline = true;
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
            colorToHex(
                font.color,
            );

        if (fontColor) {
            cell.color =
                fontColor;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Fill
    |--------------------------------------------------------------------------
    */

    if (style.fill) {
        const fill =
            style.fill;

        let backgroundColor =
            colorToHex(
                fill.fgColor,
            );

        /*
        |--------------------------------------------------------------------------
        | Some Excel files use bgColor
        |--------------------------------------------------------------------------
        */

        if (
            !backgroundColor
        ) {
            backgroundColor =
                colorToHex(
                    fill.bgColor,
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Only use an actual fill
        |--------------------------------------------------------------------------
        */

        if (
            backgroundColor &&
            (
                fill.patternType ||
                fill.pattern
            )
        ) {
            cell.backgroundColor =
                backgroundColor;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Alignment
    |--------------------------------------------------------------------------
    */

    if (style.alignment) {
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

    if (style.border) {
        const border: ExcelCell['border'] =
            {};

        border.top =
            borderToString(
                style.border.top,
            );

        border.right =
            borderToString(
                style.border.right,
            );

        border.bottom =
            borderToString(
                style.border.bottom,
            );

        border.left =
            borderToString(
                style.border.left,
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

    return cell;
}

/*
|--------------------------------------------------------------------------
| Main component
|--------------------------------------------------------------------------
*/

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
            | Read XLSX
            |--------------------------------------------------------------------------
            */

            const buffer =
                await selected.arrayBuffer();

            const sourceWorkbook =
                XLSX.read(buffer, {
                    type: 'array',

                    /*
                    |--------------------------------------------------------------------------
                    | Important
                    |--------------------------------------------------------------------------
                    */

                    cellStyles: true,

                    cellNF: true,

                    cellFormula: true,

                    cellHTML: true,

                    cellText: true,
                });

            /*
            |--------------------------------------------------------------------------
            | Debug
            |--------------------------------------------------------------------------
            */

            console.log(
                'SOURCE WORKBOOK:',
                sourceWorkbook,
            );

            /*
            |--------------------------------------------------------------------------
            | Convert sheets
            |--------------------------------------------------------------------------
            */

            const sheets: ExcelSheet[] =
                sourceWorkbook.SheetNames.map(
                    (
                        sheetName,
                    ) => {
                        const worksheet =
                            sourceWorkbook
                                .Sheets[
                                sheetName
                            ];

                        /*
                        |--------------------------------------------------------------------------
                        | Range
                        |--------------------------------------------------------------------------
                        */

                        const range =
                            worksheet[
                                '!ref'
                            ];

                        let startRow =
                            0;

                        let startColumn =
                            0;

                        let endRow =
                            0;

                        let endColumn =
                            0;

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

                                    if (address === 'A1') {
                                        console.log(
                                            'A1 CELL OBJECT:',
                                            sourceCell,
                                        );

                                        console.log(
                                            'A1 CELL KEYS:',
                                            Object.keys(
                                                sourceCell,
                                            ),
                                        );

                                        console.log(
                                            'WORKBOOK CELLXFS:',
                                            sourceWorkbook.Styles?.CellXf,
                                        );
                                    }

                                if (
                                    !sourceCell
                                ) {
                                    continue;
                                }

                                /*
                                |--------------------------------------------------------------------------
                                | Debug A1
                                |--------------------------------------------------------------------------
                                */

                                if (
                                    address ===
                                    'A1'
                                ) {
                                    console.log(
                                        'XLSX A1:',
                                        sourceCell,
                                    );

                                    console.log(
                                        'XLSX A1 STYLE:',
                                        sourceCell.s,
                                    );
                                }

                                const converted =
                                    convertCell(
                                        sourceCell,
                                    );

                                cells[
                                    row -
                                        startRow
                                ][
                                    column -
                                        startColumn
                                ] =
                                    converted;
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

                        const columns =
                            worksheet[
                                '!cols'
                            ];

                        if (
                            Array.isArray(
                                columns,
                            )
                        ) {
                            columns.forEach(
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

                        const rows =
                            worksheet[
                                '!rows'
                            ];

                        if (
                            Array.isArray(
                                rows,
                            )
                        ) {
                            rows.forEach(
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
                                (
                                    merge,
                                ) => {
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
                        */

                        const images: any[] =
                            [];

                        /*
                        |--------------------------------------------------------------------------
                        | xlsx-js-style does not provide
                        | a simple browser-side image API
                        | compatible with our EDTS model.
                        |
                        | We keep this ready for the
                        | next image extraction step.
                        |--------------------------------------------------------------------------
                        */

                        return {
                            name:
                                sheetName,

                            cells,

                            columnWidths,

                            rowHeights,

                            mergedCells,

                            images,
                        };
                    },
                );

            /*
            |--------------------------------------------------------------------------
            | EDTS Workbook
            |--------------------------------------------------------------------------
            */

            const edtsWorkbook: ExcelWorkbook =
                {
                    version: 1,

                    type: 'spreadsheet',

                    sheets,

                    activeSheet: 0,
                };

            /*
            |--------------------------------------------------------------------------
            | Debug EDTS workbook
            |--------------------------------------------------------------------------
            */

            console.log(
                'EDTS IMPORTED WORKBOOK:',
                edtsWorkbook,
            );

            console.log(
                'PPMP A1:',
                edtsWorkbook
                    .sheets[0]
                    ?.cells[0]?.[0],
            );

            /*
            |--------------------------------------------------------------------------
            | Save
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
                err instanceof Error
                    ? err.message
                    : 'Unable to read this Excel file.',
            );
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Open editor
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

                        {error && (
                            <div className="mx-auto mt-5 max-w-xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                {error}
                            </div>
                        )}

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