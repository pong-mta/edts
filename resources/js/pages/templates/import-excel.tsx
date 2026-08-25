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
import JSZip from 'jszip';

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
| XML helpers
|--------------------------------------------------------------------------
*/

function xmlValue(
    element: Element | null,
    attribute: string,
): string | undefined {
    if (!element) {
        return undefined;
    }

    return (
        element.getAttribute(
            attribute,
        ) ?? undefined
    );
}

function xmlBool(
    value: string | null,
): boolean {
    if (!value) {
        return false;
    }

    return (
        value === '1' ||
        value === 'true' ||
        value === 'on'
    );
}

function colorToHex(
    color: Element | null,
): string | undefined {
    if (!color) {
        return undefined;
    }

    let value =
        color.getAttribute('rgb');

    if (value) {
        if (value.length === 8) {
            value = value.substring(2);
        }

        if (value.length === 6) {
            return `#${value}`;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Indexed Excel colors
    |--------------------------------------------------------------------------
    */

    const indexed =
        color.getAttribute(
            'indexed',
        );

    if (indexed !== null) {
        const indexedColors: Record<
            string,
            string
        > = {
            '0': '#000000',
            '1': '#FFFFFF',
            '2': '#FF0000',
            '3': '#00FF00',
            '4': '#0000FF',
            '5': '#FFFF00',
            '6': '#FF00FF',
            '7': '#00FFFF',
            '8': '#000000',
            '9': '#FFFFFF',
            '10': '#FF0000',
            '11': '#00FF00',
            '12': '#0000FF',
            '13': '#FFFF00',
            '14': '#FF00FF',
            '15': '#00FFFF',
        };

        return indexedColors[indexed];
    }

    return undefined;
}

function getChildren(
    parent: Element | null,
    localName: string,
): Element[] {
    if (!parent) {
        return [];
    }

    return Array.from(
        parent.children,
    ).filter(
        (child) =>
            child.localName ===
            localName,
    );
}

function getFirstChild(
    parent: Element | null,
    localName: string,
): Element | null {
    if (!parent) {
        return null;
    }

    return (
        Array.from(
            parent.children,
        ).find(
            (child) =>
                child.localName ===
                localName,
        ) ?? null
    );
}

/*
|--------------------------------------------------------------------------
| Excel style model
|--------------------------------------------------------------------------
*/

type ParsedFont = {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
};

type ParsedFill = {
    backgroundColor?: string;
};

type ParsedBorder = {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
};

type ParsedAlignment = {
    horizontal?:
        | 'left'
        | 'center'
        | 'right';

    vertical?:
        | 'top'
        | 'middle'
        | 'bottom';

    wrapText?: boolean;
};

type ParsedStyle = {
    font?: ParsedFont;
    fill?: ParsedFill;
    border?: ParsedBorder;
    alignment?: ParsedAlignment;
    numberFormat?: string;
};

type ParsedStyles = {
    styles: ParsedStyle[];
};

/*
|--------------------------------------------------------------------------
| Border style
|--------------------------------------------------------------------------
*/

function parseBorderSide(
    side: Element | null,
): string | undefined {
    if (!side) {
        return undefined;
    }

    const style =
        side.getAttribute('style');

    if (!style) {
        return undefined;
    }

    const color =
        colorToHex(
            getFirstChild(
                side,
                'color',
            ),
        );

    if (color) {
        return `${style}:${color}`;
    }

    return style;
}

/*
|--------------------------------------------------------------------------
| Parse styles.xml
|--------------------------------------------------------------------------
*/

function parseStylesXml(
    xml: string,
): ParsedStyles {
    const parser =
        new DOMParser();

    const document =
        parser.parseFromString(
            xml,
            'application/xml',
        );

    /*
    |--------------------------------------------------------------------------
    | Fonts
    |--------------------------------------------------------------------------
    */

    const fontsElement =
        getFirstChild(
            document.documentElement,
            'fonts',
        );

    const fonts: ParsedFont[] =
        getChildren(
            fontsElement,
            'font',
        ).map((fontElement) => {
            const font: ParsedFont =
                {};

            if (
                getFirstChild(
                    fontElement,
                    'b',
                )
            ) {
                font.bold = true;
            }

            if (
                getFirstChild(
                    fontElement,
                    'i',
                )
            ) {
                font.italic = true;
            }

            if (
                getFirstChild(
                    fontElement,
                    'u',
                )
            ) {
                font.underline =
                    true;
            }

            const size =
                getFirstChild(
                    fontElement,
                    'sz',
                );

            if (size) {
                const value =
                    Number(
                        size.getAttribute(
                            'val',
                        ),
                    );

                if (
                    Number.isFinite(
                        value,
                    )
                ) {
                    font.fontSize =
                        value;
                }
            }

            const name =
                getFirstChild(
                    fontElement,
                    'name',
                );

            if (name) {
                font.fontFamily =
                    name.getAttribute(
                        'val',
                    ) ??
                    undefined;
            }

            font.color =
                colorToHex(
                    getFirstChild(
                        fontElement,
                        'color',
                    ),
                );

            return font;
        });

    /*
    |--------------------------------------------------------------------------
    | Fills
    |--------------------------------------------------------------------------
    */

    const fillsElement =
        getFirstChild(
            document.documentElement,
            'fills',
        );

    const fills: ParsedFill[] =
        getChildren(
            fillsElement,
            'fill',
        ).map((fillElement) => {
            const fill: ParsedFill =
                {};

            const pattern =
                getFirstChild(
                    fillElement,
                    'patternFill',
                );

            if (pattern) {
                const patternType =
                    pattern.getAttribute(
                        'patternType',
                    );

                /*
                |--------------------------------------------------------------------------
                | Ignore "none"
                |--------------------------------------------------------------------------
                */

                if (
                    patternType &&
                    patternType !== 'none'
                ) {
                    const foreground =
                        colorToHex(
                            getFirstChild(
                                pattern,
                                'fgColor',
                            ),
                        );

                    if (
                        foreground
                    ) {
                        fill.backgroundColor =
                            foreground;
                    }
                }
            }

            return fill;
        });

    /*
    |--------------------------------------------------------------------------
    | Borders
    |--------------------------------------------------------------------------
    */

    const bordersElement =
        getFirstChild(
            document.documentElement,
            'borders',
        );

    const borders: ParsedBorder[] =
        getChildren(
            bordersElement,
            'border',
        ).map((borderElement) => {
            const border: ParsedBorder =
                {};

            border.top =
                parseBorderSide(
                    getFirstChild(
                        borderElement,
                        'top',
                    ),
                );

            border.right =
                parseBorderSide(
                    getFirstChild(
                        borderElement,
                        'right',
                    ),
                );

            border.bottom =
                parseBorderSide(
                    getFirstChild(
                        borderElement,
                        'bottom',
                    ),
                );

            border.left =
                parseBorderSide(
                    getFirstChild(
                        borderElement,
                        'left',
                    ),
                );

            return border;
        });

    /*
    |--------------------------------------------------------------------------
    | Number formats
    |--------------------------------------------------------------------------
    */

    const numFmtMap =
        new Map<
            number,
            string
        >();

    const numFmtsElement =
        getFirstChild(
            document.documentElement,
            'numFmts',
        );

    getChildren(
        numFmtsElement,
        'numFmt',
    ).forEach((element) => {
        const id = Number(
            element.getAttribute(
                'numFmtId',
            ),
        );

        const format =
            element.getAttribute(
                'formatCode',
            );

        if (
            Number.isFinite(id) &&
            format
        ) {
            numFmtMap.set(
                id,
                format,
            );
        }
    });

    /*
    |--------------------------------------------------------------------------
    | Cell XFs
    |--------------------------------------------------------------------------
    */

    const cellXfsElement =
        getFirstChild(
            document.documentElement,
            'cellXfs',
        );

    const xfs =
        getChildren(
            cellXfsElement,
            'xf',
        );

    const builtinNumberFormats: Record<
        number,
        string
    > = {
        0: 'General',
        1: '0',
        2: '0.00',
        3: '#,##0',
        4: '#,##0.00',
        9: '0%',
        10: '0.00%',
        11: '0.00E+00',
        12: '# ?/?',
        13: '# ??/??',
        14: 'm/d/yy',
        15: 'd-mmm-yy',
        16: 'd-mmm',
        17: 'mmm-yy',
        18: 'h:mm AM/PM',
        19: 'h:mm:ss AM/PM',
        20: 'h:mm',
        21: 'h:mm:ss',
        22: 'm/d/yy h:mm',
        37: '#,##0 ;(#,##0)',
        38: '#,##0 ;[Red](#,##0)',
        39: '#,##0.00;(#,##0.00)',
        40: '#,##0.00;[Red](#,##0.00)',
        45: 'mm:ss',
        46: '[h]:mm:ss',
        47: 'mmss.0',
        48: '##0.0E+0',
        49: '@',
    };

    const styles: ParsedStyle[] =
        xfs.map((xf) => {
            const style: ParsedStyle =
                {};

            /*
            |--------------------------------------------------------------------------
            | Font
            |--------------------------------------------------------------------------
            */

            const fontId =
                Number(
                    xf.getAttribute(
                        'fontId',
                    ) ?? '0',
                );

            if (
                fonts[fontId]
            ) {
                style.font =
                    fonts[fontId];
            }

            /*
            |--------------------------------------------------------------------------
            | Fill
            |--------------------------------------------------------------------------
            */

            const fillId =
                Number(
                    xf.getAttribute(
                        'fillId',
                    ) ?? '0',
                );

            if (
                fills[fillId]
            ) {
                style.fill =
                    fills[fillId];
            }

            /*
            |--------------------------------------------------------------------------
            | Border
            |--------------------------------------------------------------------------
            */

            const borderId =
                Number(
                    xf.getAttribute(
                        'borderId',
                    ) ?? '0',
                );

            if (
                borders[borderId]
            ) {
                style.border =
                    borders[
                        borderId
                    ];
            }

            /*
            |--------------------------------------------------------------------------
            | Number format
            |--------------------------------------------------------------------------
            */

            const numFmtId =
                Number(
                    xf.getAttribute(
                        'numFmtId',
                    ) ?? '0',
                );

            if (
                numFmtMap.has(
                    numFmtId,
                )
            ) {
                style.numberFormat =
                    numFmtMap.get(
                        numFmtId,
                    );
            } else if (
                builtinNumberFormats[
                    numFmtId
                ]
            ) {
                style.numberFormat =
                    builtinNumberFormats[
                        numFmtId
                    ];
            }

            /*
            |--------------------------------------------------------------------------
            | Alignment
            |--------------------------------------------------------------------------
            */

            const alignment =
                getFirstChild(
                    xf,
                    'alignment',
                );

            if (alignment) {
                const parsedAlignment: ParsedAlignment =
                    {};

                const horizontal =
                    alignment.getAttribute(
                        'horizontal',
                    );

                if (
                    horizontal ===
                        'left' ||
                    horizontal ===
                        'center' ||
                    horizontal ===
                        'right'
                ) {
                    parsedAlignment.horizontal =
                        horizontal;
                }

                const vertical =
                    alignment.getAttribute(
                        'vertical',
                    );

                if (
                    vertical ===
                        'top' ||
                    vertical ===
                        'center' ||
                    vertical ===
                        'bottom'
                ) {
                    parsedAlignment.vertical =
                        vertical ===
                        'center'
                            ? 'middle'
                            : vertical;
                }

                if (
                    xmlBool(
                        alignment.getAttribute(
                            'wrapText',
                        ),
                    )
                ) {
                    parsedAlignment.wrapText =
                        true;
                }

                if (
                    parsedAlignment.horizontal ||
                    parsedAlignment.vertical ||
                    parsedAlignment.wrapText
                ) {
                    style.alignment =
                        parsedAlignment;
                }
            }

            return style;
        });

    return {
        styles,
    };
}

/*
|--------------------------------------------------------------------------
| Parse worksheet style indexes
|--------------------------------------------------------------------------
*/

function parseWorksheetStyles(
    xml: string,
): Map<
    string,
    number
> {
    const parser =
        new DOMParser();

    const document =
        parser.parseFromString(
            xml,
            'application/xml',
        );

    const result =
        new Map<
            string,
            number
        >();

    const cells =
        Array.from(
            document.getElementsByTagName(
                'c',
            ),
        );

    cells.forEach((cell) => {
        const reference =
            cell.getAttribute('r');

        if (!reference) {
            return;
        }

        const styleIndex =
            Number(
                cell.getAttribute('s') ??
                    '0',
            );

        result.set(
            reference,
            Number.isFinite(
                styleIndex,
            )
                ? styleIndex
                : 0,
        );
    });

    return result;
}

/*
|--------------------------------------------------------------------------
| Parse worksheet dimensions
|--------------------------------------------------------------------------
*/

function parseWorksheetDimensions(
    xml: string,
) {
    const parser =
        new DOMParser();

    const document =
        parser.parseFromString(
            xml,
            'application/xml',
        );

    const rows =
        Array.from(
            document.getElementsByTagName(
                'row',
            ),
        );

    const rowHeights =
        new Map<
            number,
            number
        >();

    rows.forEach((row) => {
        const rowNumber =
            Number(
                row.getAttribute('r'),
            );

        const height =
            Number(
                row.getAttribute(
                    'ht',
                ),
            );

        if (
            Number.isFinite(
                rowNumber,
            ) &&
            Number.isFinite(
                height,
            )
        ) {
            rowHeights.set(
                rowNumber,
                height * 1.333333,
            );
        }
    });

    const cols =
        Array.from(
            document.getElementsByTagName(
                'col',
            ),
        );

    const columnWidths =
        new Map<
            number,
            number
        >();

    cols.forEach((column) => {
        const min =
            Number(
                column.getAttribute(
                    'min',
                ),
            );

        const max =
            Number(
                column.getAttribute(
                    'max',
                ),
            );

        const width =
            Number(
                column.getAttribute(
                    'width',
                ),
            );

        if (
            !Number.isFinite(
                min,
            ) ||
            !Number.isFinite(
                max,
            ) ||
            !Number.isFinite(
                width,
            )
        ) {
            return;
        }

        for (
            let i = min;
            i <= max;
            i++
        ) {
            columnWidths.set(
                i,
                width * 7,
            );
        }
    });

    return {
        rowHeights,
        columnWidths,
    };
}

/*
|--------------------------------------------------------------------------
| Apply parsed style
|--------------------------------------------------------------------------
*/

function applyStyle(
    cell: ExcelCell,
    style: ParsedStyle | undefined,
): ExcelCell {
    if (!style) {
        return cell;
    }

    if (style.font) {
        if (
            style.font.bold
        ) {
            cell.bold = true;
        }

        if (
            style.font.italic
        ) {
            cell.italic = true;
        }

        if (
            style.font.underline
        ) {
            cell.underline =
                true;
        }

        if (
            style.font.fontSize !==
            undefined
        ) {
            cell.fontSize =
                style.font.fontSize;
        }

        if (
            style.font.fontFamily
        ) {
            cell.fontFamily =
                style.font.fontFamily;
        }

        if (
            style.font.color
        ) {
            cell.color =
                style.font.color;
        }
    }

    if (
        style.fill?.backgroundColor
    ) {
        cell.backgroundColor =
            style.fill.backgroundColor;
    }

    if (style.alignment) {
        if (
            style.alignment
                .horizontal
        ) {
            cell.horizontalAlign =
                style.alignment.horizontal;
        }

        if (
            style.alignment
                .vertical
        ) {
            cell.verticalAlign =
                style.alignment.vertical;
        }

        if (
            style.alignment.wrapText
        ) {
            cell.wrapText =
                true;
        }
    }

    if (style.border) {
        cell.border =
            style.border;
    }

    if (
        style.numberFormat
    ) {
        cell.numberFormat =
            style.numberFormat;
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
    | Import
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
            | SheetJS workbook
            |--------------------------------------------------------------------------
            */

            const sourceWorkbook =
                XLSX.read(buffer, {
                    type: 'array',
                    cellStyles: true,
                    cellNF: true,
                    cellFormula: true,
                    cellHTML: true,
                    cellText: true,
                });

            /*
            |--------------------------------------------------------------------------
            | JSZip
            |--------------------------------------------------------------------------
            */

            const zip =
                await JSZip.loadAsync(
                    buffer,
                );

            /*
            |--------------------------------------------------------------------------
            | styles.xml
            |--------------------------------------------------------------------------
            */

            const stylesFile =
                zip.file(
                    'xl/styles.xml',
                );

            let parsedStyles: ParsedStyles =
                {
                    styles: [],
                };

            if (stylesFile) {
                const stylesXml =
                    await stylesFile.async(
                        'text',
                    );

                parsedStyles =
                    parseStylesXml(
                        stylesXml,
                    );
            }

            /*
            |--------------------------------------------------------------------------
            | Debug styles
            |--------------------------------------------------------------------------
            */

            console.log(
                'EDTS PARSED STYLES:',
                parsedStyles,
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
                        sheetIndex,
                    ) => {
                        const worksheet =
                            sourceWorkbook
                                .Sheets[
                                sheetName
                            ];

                        /*
                        |--------------------------------------------------------------------------
                        | Raw worksheet XML
                        |--------------------------------------------------------------------------
                        */

                        const worksheetPath =
                            `xl/worksheets/sheet${
                                sheetIndex + 1
                            }.xml`;

                        const worksheetFile =
                            zip.file(
                                worksheetPath,
                            );

                        /*
                        |--------------------------------------------------------------------------
                        | Style index map
                        |--------------------------------------------------------------------------
                        */

                        let styleIndexes =
                            new Map<
                                string,
                                number
                            >();

                        let rawDimensions =
                            {
                                rowHeights:
                                    new Map<
                                        number,
                                        number
                                    >(),

                                columnWidths:
                                    new Map<
                                        number,
                                        number
                                    >(),
                            };

                        if (
                            worksheetFile
                        ) {
                            return worksheetFile
                                .async(
                                    'text',
                                )
                                .then(
                                    (
                                        xml,
                                    ) => {
                                        styleIndexes =
                                            parseWorksheetStyles(
                                                xml,
                                            );

                                        rawDimensions =
                                            parseWorksheetDimensions(
                                                xml,
                                            );

                                        return {
                                            xml,
                                            styleIndexes,
                                            rawDimensions,
                                        };
                                    },
                                );
                        }

                        return Promise.resolve(
                            {
                                xml: '',
                                styleIndexes,
                                rawDimensions,
                            },
                        );
                    },
                );

            /*
            |--------------------------------------------------------------------------
            | Promise.all because raw XML is async
            |--------------------------------------------------------------------------
            */

            const rawSheets =
                await Promise.all(
                    sheets,
                );

            /*
            |--------------------------------------------------------------------------
            | Build EDTS sheets
            |--------------------------------------------------------------------------
            */

            const edtsSheets: ExcelSheet[] =
                sourceWorkbook.SheetNames.map(
                    (
                        sheetName,
                        sheetIndex,
                    ) => {
                        const worksheet =
                            sourceWorkbook
                                .Sheets[
                                sheetName
                            ];

                        const raw =
                            rawSheets[
                                sheetIndex
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

                                if (
                                    !sourceCell
                                ) {
                                    continue;
                                }

                                /*
                                |--------------------------------------------------------------------------
                                | Base cell
                                |--------------------------------------------------------------------------
                                */

                                const cell: ExcelCell =
                                    {
                                        value:
                                            sourceCell.v !==
                                                undefined &&
                                            sourceCell.v !==
                                                null
                                                ? String(
                                                      sourceCell.v,
                                                  )
                                                : '',
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
                                        String(
                                            sourceCell.f,
                                        );
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
                                | Raw XML style index
                                |--------------------------------------------------------------------------
                                */

                                const styleIndex =
                                    raw.styleIndexes.get(
                                        address,
                                    ) ?? 0;

                                const parsedStyle =
                                    parsedStyles
                                        .styles[
                                        styleIndex
                                    ];

                                /*
                                |--------------------------------------------------------------------------
                                | Apply actual Excel style
                                |--------------------------------------------------------------------------
                                */

                                applyStyle(
                                    cell,
                                    parsedStyle,
                                );

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
                                        'RAW A1 STYLE INDEX:',
                                        styleIndex,
                                    );

                                    console.log(
                                        'RAW A1 PARSED STYLE:',
                                        parsedStyle,
                                    );

                                    console.log(
                                        'FINAL A1:',
                                        cell,
                                    );
                                }

                                cells[
                                    row -
                                        startRow
                                ][
                                    column -
                                        startColumn
                                ] =
                                    cell;
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
                                (
                                    _,
                                    index,
                                ) => {
                                    const rawWidth =
                                        raw
                                            .rawDimensions
                                            .columnWidths.get(
                                                index +
                                                    1,
                                            );

                                    if (
                                        rawWidth
                                    ) {
                                        return rawWidth;
                                    }

                                    const column =
                                        worksheet[
                                            '!cols'
                                        ]?.[
                                            index
                                        ];

                                    if (
                                        column
                                    ) {
                                        if (
                                            typeof column.wpx ===
                                            'number'
                                        ) {
                                            return column.wpx;
                                        }

                                        if (
                                            typeof column.wch ===
                                            'number'
                                        ) {
                                            return (
                                                column.wch *
                                                7
                                            );
                                        }
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
                                    const rawHeight =
                                        raw
                                            .rawDimensions
                                            .rowHeights.get(
                                                index +
                                                    1,
                                            );

                                    if (
                                        rawHeight
                                    ) {
                                        return rawHeight;
                                    }

                                    const row =
                                        worksheet[
                                            '!rows'
                                        ]?.[
                                            index
                                        ];

                                    if (
                                        row
                                    ) {
                                        if (
                                            typeof row.hpx ===
                                            'number'
                                        ) {
                                            return row.hpx;
                                        }

                                        if (
                                            typeof row.hpt ===
                                            'number'
                                        ) {
                                            return (
                                                row.hpt *
                                                1.333333
                                            );
                                        }
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
                        | Return sheet
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
            | EDTS workbook
            |--------------------------------------------------------------------------
            */

            const edtsWorkbook: ExcelWorkbook =
                {
                    version: 1,

                    type: 'spreadsheet',

                    sheets:
                        edtsSheets,

                    activeSheet: 0,
                };

            /*
            |--------------------------------------------------------------------------
            | Debug
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
            | Save state
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