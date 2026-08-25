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
    | ExcelJS Color → HEX
    |--------------------------------------------------------------------------
    */

    const excelColorToHex = (
        color: any,
    ): string | undefined => {
        if (!color) {
            return undefined;
        }

        let value: string | undefined;

        if (
            typeof color.argb ===
            'string'
        ) {
            value = color.argb;
        } else if (
            typeof color.rgb ===
            'string'
        ) {
            value = color.rgb;
        }

        if (!value) {
            return undefined;
        }

        /*
        |--------------------------------------------------------------------------
        | ExcelJS usually gives ARGB:
        |
        | FFFF0000
        |
        | Remove the alpha channel.
        |--------------------------------------------------------------------------
        */

        if (
            value.length === 8
        ) {
            value =
                value.substring(2);
        }

        if (
            value.length !== 6
        ) {
            return undefined;
        }

        return `#${value}`;
    };

    /*
    |--------------------------------------------------------------------------
    | Border conversion
    |--------------------------------------------------------------------------
    */

    const convertBorder = (
        side: any,
    ): string | undefined => {
        if (!side) {
            return undefined;
        }

        if (!side.style) {
            return undefined;
        }

        const color =
            excelColorToHex(
                side.color,
            );

        if (color) {
            return `${side.style}:${color}`;
        }

        return side.style;
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
            | Read file
            |--------------------------------------------------------------------------
            */

            const buffer =
                await selected.arrayBuffer();

            /*
            |--------------------------------------------------------------------------
            | ExcelJS workbook
            |--------------------------------------------------------------------------
            */

            const sourceWorkbook =
                new ExcelJS.Workbook();

            await sourceWorkbook.xlsx.load(
                buffer,
            );

            /*
            |--------------------------------------------------------------------------
            | Convert sheets
            |--------------------------------------------------------------------------
            */

            const sheets: ExcelSheet[] =
                sourceWorkbook.worksheets.map(
                    (worksheet) => {
                        /*
                        |--------------------------------------------------------------------------
                        | Dimensions
                        |--------------------------------------------------------------------------
                        */

                        const rowCount =
                            Math.max(
                                worksheet.rowCount,
                                1,
                            );

                        const columnCount =
                            Math.max(
                                worksheet.columnCount,
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
                        | Read every cell
                        |--------------------------------------------------------------------------
                        */

                        worksheet.eachRow(
                            {
                                includeEmpty: true,
                            },
                            (
                                excelRow,
                                rowNumber,
                            ) => {
                                excelRow.eachCell(
                                    {
                                        includeEmpty:
                                            true,
                                    },
                                    (
                                        excelCell,
                                        columnNumber,
                                    ) => {
                                        const rowIndex =
                                            rowNumber -
                                            1;

                                        const columnIndex =
                                            columnNumber -
                                            1;

                                        if (
                                            rowIndex <
                                            0 ||
                                            columnIndex <
                                            0
                                        ) {
                                            return;
                                        }

                                        /*
                                        |--------------------------------------------------------------------------
                                        | Value
                                        |--------------------------------------------------------------------------
                                        */

                                        let value =
                                            '';

                                        const rawValue =
                                            excelCell.value;

                                        if (
                                            rawValue !==
                                                null &&
                                            rawValue !==
                                                undefined
                                        ) {
                                            /*
                                            |--------------------------------------------------------------------------
                                            | Formula
                                            |--------------------------------------------------------------------------
                                            */

                                            if (
                                                typeof rawValue ===
                                                    'object' &&
                                                'formula' in
                                                    rawValue
                                            ) {
                                                value =
                                                    String(
                                                        (
                                                            rawValue as any
                                                        ).result ??
                                                            '',
                                                    );
                                            }

                                            /*
                                            |--------------------------------------------------------------------------
                                            | Rich text
                                            |--------------------------------------------------------------------------
                                            */

                                            else if (
                                                typeof rawValue ===
                                                    'object' &&
                                                'richText' in
                                                    rawValue
                                            ) {
                                                value = (
                                                    rawValue as any
                                                ).richText
                                                    .map(
                                                        (
                                                            item: any,
                                                        ) =>
                                                            item.text ??
                                                            '',
                                                    )
                                                    .join(
                                                        '',
                                                    );
                                            }

                                            /*
                                            |--------------------------------------------------------------------------
                                            | Date
                                            |--------------------------------------------------------------------------
                                            */

                                            else if (
                                                rawValue instanceof
                                                Date
                                            ) {
                                                value =
                                                    rawValue.toLocaleDateString();
                                            }

                                            /*
                                            |--------------------------------------------------------------------------
                                            | Normal value
                                            |--------------------------------------------------------------------------
                                            */

                                            else {
                                                value =
                                                    String(
                                                        rawValue,
                                                    );
                                            }
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
                                            typeof rawValue ===
                                                'object' &&
                                            rawValue !==
                                                null &&
                                            'formula' in
                                                rawValue
                                        ) {
                                            cell.formula =
                                                String(
                                                    (
                                                        rawValue as any
                                                    ).formula,
                                                );
                                        }

                                        /*
                                        |--------------------------------------------------------------------------
                                        | Font
                                        |--------------------------------------------------------------------------
                                        */

                                        const font =
                                            excelCell.font;

                                        if (
                                            font
                                        ) {
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
                                                typeof font.size ===
                                                'number'
                                            ) {
                                                cell.fontSize =
                                                    font.size;
                                            }

                                            if (
                                                typeof font.name ===
                                                'string'
                                            ) {
                                                cell.fontFamily =
                                                    font.name;
                                            }

                                            const color =
                                                excelColorToHex(
                                                    font.color,
                                                );

                                            if (
                                                color
                                            ) {
                                                cell.color =
                                                    color;
                                            }
                                        }

                                        /*
                                        |--------------------------------------------------------------------------
                                        | Fill
                                        |--------------------------------------------------------------------------
                                        */

                                        const fill =
                                            excelCell.fill as any;

                                        if (
                                            fill
                                        ) {
                                            /*
                                            |--------------------------------------------------------------------------
                                            | Pattern fill
                                            |--------------------------------------------------------------------------
                                            */

                                            if (
                                                fill.type ===
                                                    'pattern' &&
                                                fill.fgColor
                                            ) {
                                                const background =
                                                    excelColorToHex(
                                                        fill.fgColor,
                                                    );

                                                if (
                                                    background
                                                ) {
                                                    cell.backgroundColor =
                                                        background;
                                                }
                                            }

                                            /*
                                            |--------------------------------------------------------------------------
                                            | Gradient fill
                                            |--------------------------------------------------------------------------
                                            */

                                            if (
                                                fill.type ===
                                                    'gradient'
                                            ) {
                                                const firstStop =
                                                    fill.stops?.[0];

                                                if (
                                                    firstStop?.color
                                                ) {
                                                    const background =
                                                        excelColorToHex(
                                                            firstStop.color,
                                                        );

                                                    if (
                                                        background
                                                    ) {
                                                        cell.backgroundColor =
                                                            background;
                                                    }
                                                }
                                            }
                                        }

                                        /*
                                        |--------------------------------------------------------------------------
                                        | Alignment
                                        |--------------------------------------------------------------------------
                                        */

                                        const alignment =
                                            excelCell.alignment;

                                        if (
                                            alignment
                                        ) {
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
                                                    'middle' ||
                                                alignment.vertical ===
                                                    'bottom'
                                            ) {
                                                cell.verticalAlign =
                                                    alignment.vertical;
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
                                        | Number format
                                        |--------------------------------------------------------------------------
                                        */

                                        if (
                                            typeof excelCell.numFmt ===
                                            'string'
                                        ) {
                                            cell.numberFormat =
                                                excelCell.numFmt;
                                        }

                                        /*
                                        |--------------------------------------------------------------------------
                                        | Borders
                                        |--------------------------------------------------------------------------
                                        */

                                        const border =
                                            excelCell.border;

                                        if (
                                            border
                                        ) {
                                            const convertedBorder: ExcelCell['border'] =
                                                {};

                                            convertedBorder.top =
                                                convertBorder(
                                                    border.top,
                                                );

                                            convertedBorder.right =
                                                convertBorder(
                                                    border.right,
                                                );

                                            convertedBorder.bottom =
                                                convertBorder(
                                                    border.bottom,
                                                );

                                            convertedBorder.left =
                                                convertBorder(
                                                    border.left,
                                                );

                                            if (
                                                convertedBorder.top ||
                                                convertedBorder.right ||
                                                convertedBorder.bottom ||
                                                convertedBorder.left
                                            ) {
                                                cell.border =
                                                    convertedBorder;
                                            }
                                        }

                                        /*
                                        |--------------------------------------------------------------------------
                                        | Store
                                        |--------------------------------------------------------------------------
                                        */

                                        if (
                                            !cells[
                                                rowIndex
                                            ]
                                        ) {
                                            cells[
                                                rowIndex
                                            ] =
                                                [];
                                        }

                                        cells[
                                            rowIndex
                                        ][
                                            columnIndex
                                        ] = cell;
                                    },
                                );
                            },
                        );

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
                                (
                                    _,
                                    index,
                                ) => {
                                    const column =
                                        worksheet.getColumn(
                                            index +
                                                1,
                                        );

                                    /*
                                    |--------------------------------------------------------------------------
                                    | ExcelJS width is approximately
                                    | character units.
                                    |--------------------------------------------------------------------------
                                    */

                                    if (
                                        typeof column.width ===
                                        'number'
                                    ) {
                                        return Math.max(
                                            40,
                                            Math.min(
                                                500,
                                                column.width *
                                                    7,
                                            ),
                                        );
                                    }

                                    return 100;
                                },
                            );

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
                                (
                                    _,
                                    index,
                                ) => {
                                    const row =
                                        worksheet.getRow(
                                            index +
                                                1,
                                        );

                                    /*
                                    |--------------------------------------------------------------------------
                                    | ExcelJS row.height is points.
                                    |--------------------------------------------------------------------------
                                    */

                                    if (
                                        typeof row.height ===
                                        'number'
                                    ) {
                                        return (
                                            row.height *
                                            1.333333
                                        );
                                    }

                                    return 28;
                                },
                            );

                        /*
                        |--------------------------------------------------------------------------
                        | Merged cells
                        |--------------------------------------------------------------------------
                        */

                        const mergedCells: ExcelMerge[] =
                            [];

                        const model =
                            (worksheet as any)
                                .model;

                        if (
                            model &&
                            Array.isArray(
                                model.merges,
                            )
                        ) {
                            model.merges.forEach(
                                (
                                    merge: string,
                                ) => {
                                    /*
                                    |--------------------------------------------------------------------------
                                    | ExcelJS returns ranges:
                                    |
                                    | A1:N1
                                    | A20:D20
                                    |--------------------------------------------------------------------------
                                    */

                                    const parts =
                                        merge.split(
                                            ':',
                                        );

                                    if (
                                        parts.length !==
                                        2
                                    ) {
                                        return;
                                    }

                                    const start =
                                        worksheet.getCell(
                                            parts[0],
                                        );

                                    const end =
                                        worksheet.getCell(
                                            parts[1],
                                        );

                                    mergedCells.push(
                                        {
                                            startRow:
                                                start.row -
                                                1,

                                            startColumn:
                                                start.col -
                                                1,

                                            endRow:
                                                end.row -
                                                1,

                                            endColumn:
                                                end.col -
                                                1,
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

                        try {
                            const worksheetImages =
                                worksheet.getImages();

                            worksheetImages.forEach(
                                (
                                    image,
                                ) => {
                                    const range =
                                        image.range;

                                    if (
                                        !range
                                    ) {
                                        return;
                                    }

                                    /*
                                    |--------------------------------------------------------------------------
                                    | We store the image
                                    | reference for now.
                                    |
                                    | Actual image extraction
                                    | will be handled separately.
                                    |--------------------------------------------------------------------------
                                    */

                                    images.push(
                                        {
                                            id: image.imageId,
                                            src: '',
                                            row:
                                                range.tl
                                                    .row,
                                            column:
                                                range.tl
                                                    .col,
                                            width:
                                                0,
                                            height:
                                                0,
                                            offsetX:
                                                range
                                                    .tl
                                                    .nativeColOff ??
                                                0,
                                            offsetY:
                                                range
                                                    .tl
                                                    .nativeRowOff ??
                                                0,
                                        },
                                    );
                                },
                            );
                        } catch (
                            imageError
                        ) {
                            console.warn(
                                'Unable to read Excel images:',
                                imageError,
                            );
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | Return EDTS sheet
                        |--------------------------------------------------------------------------
                        */

                        return {
                            name:
                                worksheet.name,

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
            | Create EDTS workbook
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
            | Save to state
            |--------------------------------------------------------------------------
            */

            setWorkbook(
                edtsWorkbook,
            );

            /*
            |--------------------------------------------------------------------------
            | Debug first cell
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