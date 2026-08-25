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
    ExcelImage,
    ExcelMerge,
    ExcelSheet,
    ExcelWorkbook,
} from '@/types/excel';

const IMPORT_STORAGE_KEY =
    'edts_imported_excel_workbook';

/*
|--------------------------------------------------------------------------
| Types
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
| XML helpers
|--------------------------------------------------------------------------
*/

function normalizePath(
    path: string,
): string {
    return path
        .replace(/\\/g, '/')
        .replace(/^\/+/, '');
}

function resolveZipPath(
    basePath: string,
    target: string,
): string {
    if (
        target.startsWith('/')
    ) {
        return normalizePath(
            target,
        );
    }

    const baseParts =
        normalizePath(
            basePath,
        ).split('/');

    baseParts.pop();

    const targetParts =
        target.split('/');

    const result: string[] = [
        ...baseParts,
    ];

    for (const part of targetParts) {
        if (
            !part ||
            part === '.'
        ) {
            continue;
        }

        if (part === '..') {
            result.pop();
        } else {
            result.push(part);
        }
    }

    return normalizePath(
        result.join('/'),
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

function colorToHex(
    color: Element | null,
): string | undefined {
    if (!color) {
        return undefined;
    }

    let rgb =
        color.getAttribute('rgb');

    if (rgb) {
        if (rgb.length === 8) {
            rgb = rgb.substring(2);
        }

        if (rgb.length === 6) {
            return `#${rgb}`;
        }
    }

    return undefined;
}

/*
|--------------------------------------------------------------------------
| Parse styles.xml
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
        ).map(
            (fontElement) => {
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
            },
        );

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
        ).map(
            (fillElement) => {
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

                    if (
                        patternType &&
                        patternType !==
                            'none'
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
            },
        );

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
        ).map(
            (borderElement) => {
                return {
                    top:
                        parseBorderSide(
                            getFirstChild(
                                borderElement,
                                'top',
                            ),
                        ),

                    right:
                        parseBorderSide(
                            getFirstChild(
                                borderElement,
                                'right',
                            ),
                        ),

                    bottom:
                        parseBorderSide(
                            getFirstChild(
                                borderElement,
                                'bottom',
                            ),
                        ),

                    left:
                        parseBorderSide(
                            getFirstChild(
                                borderElement,
                                'left',
                            ),
                        ),
                };
            },
        );

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
    ).forEach(
        (element) => {
            const id =
                Number(
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
        },
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

    const styles: ParsedStyle[] =
        xfs.map(
            (xf) => {
                const style: ParsedStyle =
                    {};

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
                        fonts[
                            fontId
                        ];
                }

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
                        fills[
                            fillId
                        ];
                }

                const borderId =
                    Number(
                        xf.getAttribute(
                            'borderId',
                        ) ?? '0',
                    );

                if (
                    borders[
                        borderId
                    ]
                ) {
                    style.border =
                        borders[
                            borderId
                        ];
                }

                const numFmtId =
                    Number(
                        xf.getAttribute(
                            'numFmtId',
                        ) ?? '0',
                    );

                style.numberFormat =
                    numFmtMap.get(
                        numFmtId,
                    ) ??
                    builtinNumberFormats[
                        numFmtId
                    ] ??
                    'General';

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

                    const wrap =
                        alignment.getAttribute(
                            'wrapText',
                        );

                    if (
                        wrap ===
                            '1' ||
                        wrap ===
                            'true'
                    ) {
                        parsedAlignment.wrapText =
                            true;
                    }

                    style.alignment =
                        parsedAlignment;
                }

                return style;
            },
        );

    return {
        styles,
    };
}

/*
|--------------------------------------------------------------------------
| Worksheet styles
|--------------------------------------------------------------------------
*/

function parseWorksheetStyles(
    xml: string,
): Map<string, number> {
    const parser =
        new DOMParser();

    const document =
        parser.parseFromString(
            xml,
            'application/xml',
        );

    const result =
        new Map<string, number>();

    const cells =
        Array.from(
            document.getElementsByTagName(
                'c',
            ),
        );

    cells.forEach(
        (cell) => {
            const address =
                cell.getAttribute(
                    'r',
                );

            if (!address) {
                return;
            }

            const styleIndex =
                Number(
                    cell.getAttribute(
                        's',
                    ) ?? '0',
                );

            result.set(
                address,
                Number.isFinite(
                    styleIndex,
                )
                    ? styleIndex
                    : 0,
            );
        },
    );

    return result;
}

/*
|--------------------------------------------------------------------------
| Worksheet dimensions
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

    const rowHeights =
        new Map<number, number>();

    Array.from(
        document.getElementsByTagName(
            'row',
        ),
    ).forEach(
        (row) => {
            const number =
                Number(
                    row.getAttribute(
                        'r',
                    ),
                );

            const height =
                Number(
                    row.getAttribute(
                        'ht',
                    ),
                );

            if (
                Number.isFinite(
                    number,
                ) &&
                Number.isFinite(
                    height,
                )
            ) {
                rowHeights.set(
                    number,
                    height *
                        1.333333,
                );
            }
        },
    );

    const columnWidths =
        new Map<number, number>();

    Array.from(
        document.getElementsByTagName(
            'col',
        ),
    ).forEach(
        (column) => {
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
                let index = min;
                index <= max;
                index++
            ) {
                columnWidths.set(
                    index,
                    width * 7,
                );
            }
        },
    );

    return {
        rowHeights,
        columnWidths,
    };
}

/*
|--------------------------------------------------------------------------
| Apply style
|--------------------------------------------------------------------------
*/

function applyStyle(
    cell: ExcelCell,
    style:
        | ParsedStyle
        | undefined,
): ExcelCell {
    if (!style) {
        return cell;
    }

    if (style.font) {
        cell.bold =
            style.font.bold;

        cell.italic =
            style.font.italic;

        cell.underline =
            style.font.underline;

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
        style.fill
            ?.backgroundColor
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
            (
                cell as ExcelCell & {
                    wrapText?: boolean;
                }
            ).wrapText = true;
        }
    }

    if (style.border) {
        cell.border =
            style.border;
    }

    if (
        style.numberFormat
    ) {
        (
            cell as ExcelCell & {
                numberFormat?: string;
            }
        ).numberFormat =
            style.numberFormat;
    }

    return cell;
}

/*
|--------------------------------------------------------------------------
| EMU → pixels
|--------------------------------------------------------------------------
*/

function emuToPixels(
    value: number,
): number {
    return (
        value *
        (96 / 914400)
    );
}

/*
|--------------------------------------------------------------------------
| Image anchor
|--------------------------------------------------------------------------
*/

function parseImageAnchor(
    anchor: Element,
    columnWidths: number[],
    rowHeights: number[],
) {
    const find = (
        name: string,
    ): Element | null => {
        return (
            Array.from(
                anchor.getElementsByTagName('*'),
            ).find(
                (element) =>
                    element.localName === name,
            ) ?? null
        );
    };

    const from = find('from');
    const to = find('to');
    const ext = find('ext');

    const getNumber = (
        parent: Element | null,
        name: string,
    ): number => {
        if (!parent) {
            return 0;
        }

        const element =
            Array.from(
                parent.getElementsByTagName('*'),
            ).find(
                (child) =>
                    child.localName === name,
            );

        return Number(
            element?.textContent ?? '0',
        );
    };

    const row = getNumber(
        from,
        'row',
    );

    const column = getNumber(
        from,
        'col',
    );

    const rowOffset = getNumber(
        from,
        'rowOff',
    );

    const colOffset = getNumber(
        from,
        'colOff',
    );

    /*
     * Excel drawing coordinates are EMU.
     * Convert the offsets to CSS pixels.
     */
    const offsetX =
        emuToPixels(colOffset);

    const offsetY =
        emuToPixels(rowOffset);

    /*
     * Calculate the actual X position
     * using the real Excel column widths.
     */
    let x = 0;

    for (
        let i = 0;
        i < column;
        i++
    ) {
        x +=
            columnWidths[i] ??
            100;
    }

    x += offsetX;

    /*
     * Calculate the actual Y position
     * using the real Excel row heights.
     */
    let y = 0;

    for (
        let i = 0;
        i < row;
        i++
    ) {
        y +=
            rowHeights[i] ??
            28;
    }

    y += offsetY;

    /*
     * Default image size.
     */
    let width = 120;
    let height = 80;

    /*
     * oneCellAnchor / absoluteAnchor
     */
    if (ext) {
        const cx =
            Number(
                ext.getAttribute(
                    'cx',
                ) ?? '0',
            );

        const cy =
            Number(
                ext.getAttribute(
                    'cy',
                ) ?? '0',
            );

        if (
            Number.isFinite(cx) &&
            cx > 0
        ) {
            width =
                emuToPixels(cx);
        }

        if (
            Number.isFinite(cy) &&
            cy > 0
        ) {
            height =
                emuToPixels(cy);
        }
    }

    /*
     * twoCellAnchor
     *
     * Calculate image size from the
     * REAL Excel column/row dimensions.
     */
    if (to) {
        const toRow =
            getNumber(
                to,
                'row',
            );

        const toColumn =
            getNumber(
                to,
                'col',
            );

        const toRowOffset =
            getNumber(
                to,
                'rowOff',
            );

        const toColOffset =
            getNumber(
                to,
                'colOff',
            );

        /*
         * Calculate the ending X position.
         */
        let endX = 0;

        for (
            let i = 0;
            i < toColumn;
            i++
        ) {
            endX +=
                columnWidths[i] ??
                100;
        }

        endX +=
            emuToPixels(
                toColOffset,
            );

        /*
         * Calculate the ending Y position.
         */
        let endY = 0;

        for (
            let i = 0;
            i < toRow;
            i++
        ) {
            endY +=
                rowHeights[i] ??
                28;
        }

        endY +=
            emuToPixels(
                toRowOffset,
            );

        if (endX > x) {
            width =
                endX - x;
        }

        if (endY > y) {
            height =
                endY - y;
        }
    }

    return {
        row,
        column,

        offsetX,

        offsetY,

        /*
         * Absolute position based on
         * actual worksheet dimensions.
         */
        x,
        y,

        width:
            Math.max(
                20,
                width,
            ),

        height:
            Math.max(
                20,
                height,
            ),
    };
}

/*
|--------------------------------------------------------------------------
| Extract images from XLSX
|--------------------------------------------------------------------------
*/

async function extractSheetImages(
    zip: JSZip,
    sheetIndex: number,
    sheetName: string,
    columnWidths: number[],
    rowHeights: number[],
): Promise<ExcelImage[]> {
    const images: ExcelImage[] = [];

    console.log(
        `========== IMAGE EXTRACTION: ${sheetName} ==========`,
    );

    /*
    |--------------------------------------------------------------------------
    | Helper: find XML elements by localName
    |--------------------------------------------------------------------------
    */

    const findElementsByLocalName = (
        root: Element | Document,
        name: string,
    ): Element[] => {
        return Array.from(
            root.getElementsByTagName('*'),
        ).filter(
            (element) =>
                element.localName === name,
        );
    };

    const findFirstByLocalName = (
        root: Element | Document | null,
        name: string,
    ): Element | null => {
        if (!root) {
            return null;
        }

        return (
            findElementsByLocalName(
                root,
                name,
            )[0] ?? null
        );
    };

    /*
    |--------------------------------------------------------------------------
    | 1. Worksheet relationships
    |--------------------------------------------------------------------------
    */

    const worksheetRelsPath =
        `xl/worksheets/_rels/sheet${
            sheetIndex + 1
        }.xml.rels`;

    console.log(
        'WORKSHEET RELS:',
        worksheetRelsPath,
    );

    const worksheetRelsFile =
        zip.file(
            worksheetRelsPath,
        );

    if (!worksheetRelsFile) {
        console.log(
            `${sheetName}: no worksheet relationships`,
        );

        return images;
    }

    const worksheetRelsXml =
        await worksheetRelsFile.async(
            'text',
        );

    const parser =
        new DOMParser();

    const worksheetRelsDocument =
        parser.parseFromString(
            worksheetRelsXml,
            'application/xml',
        );

    const worksheetRelationships =
        findElementsByLocalName(
            worksheetRelsDocument,
            'Relationship',
        );

    console.log(
        'WORKSHEET RELATIONSHIPS:',
        worksheetRelationships.map(
            (relationship) => ({
                id:
                    relationship.getAttribute(
                        'Id',
                    ),

                type:
                    relationship.getAttribute(
                        'Type',
                    ),

                target:
                    relationship.getAttribute(
                        'Target',
                    ),
            }),
        ),
    );

    /*
    |--------------------------------------------------------------------------
    | 2. Find drawing relationship
    |--------------------------------------------------------------------------
    */

    const drawingRelationship =
        worksheetRelationships.find(
            (relationship) => {
                const type =
                    relationship.getAttribute(
                        'Type',
                    ) ?? '';

                return type
                    .toLowerCase()
                    .includes(
                        'drawing',
                    );
            },
        );

    if (!drawingRelationship) {
        console.log(
            `${sheetName}: drawing relationship not found`,
        );

        return images;
    }

    const drawingTarget =
        drawingRelationship.getAttribute(
            'Target',
        );

    console.log(
        'DRAWING TARGET:',
        drawingTarget,
    );

    if (!drawingTarget) {
        return images;
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Resolve drawing path
    |--------------------------------------------------------------------------
    */

    const worksheetPath =
        `xl/worksheets/sheet${
            sheetIndex + 1
        }.xml`;

    const drawingPath =
        resolveZipPath(
            worksheetPath,
            drawingTarget,
        );

    console.log(
        'DRAWING PATH:',
        drawingPath,
    );

    const drawingFile =
        zip.file(
            drawingPath,
        );

    if (!drawingFile) {
        console.error(
            'DRAWING FILE NOT FOUND:',
            drawingPath,
        );

        return images;
    }

    const drawingXml =
        await drawingFile.async(
            'text',
        );

    console.log(
        'DRAWING XML:',
        drawingXml,
    );

    /*
    |--------------------------------------------------------------------------
    | 4. Drawing relationships
    |--------------------------------------------------------------------------
    */

    const drawingFileName =
        drawingPath
            .split('/')
            .pop() ?? '';

    const drawingDirectory =
        drawingPath
            .split('/')
            .slice(0, -1)
            .join('/');

    const drawingRelsPath =
        `${drawingDirectory}/_rels/${drawingFileName}.rels`;

    console.log(
        'DRAWING RELS PATH:',
        drawingRelsPath,
    );

    const drawingRelsFile =
        zip.file(
            drawingRelsPath,
        );

    if (!drawingRelsFile) {
        console.error(
            'DRAWING RELS NOT FOUND:',
            drawingRelsPath,
        );

        return images;
    }

    const drawingRelsXml =
        await drawingRelsFile.async(
            'text',
        );

    const drawingRelsDocument =
        parser.parseFromString(
            drawingRelsXml,
            'application/xml',
        );

    const drawingRelationships =
        findElementsByLocalName(
            drawingRelsDocument,
            'Relationship',
        );

    console.log(
        'DRAWING RELATIONSHIPS:',
        drawingRelationships.map(
            (relationship) => ({
                id:
                    relationship.getAttribute(
                        'Id',
                    ),

                type:
                    relationship.getAttribute(
                        'Type',
                    ),

                target:
                    relationship.getAttribute(
                        'Target',
                    ),
            }),
        ),
    );

    /*
    |--------------------------------------------------------------------------
    | 5. Parse drawing XML
    |--------------------------------------------------------------------------
    */

    const drawingDocument =
        parser.parseFromString(
            drawingXml,
            'application/xml',
        );

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT:
    |
    | Don't use:
    |
    | getElementsByTagName('twoCellAnchor')
    |
    | because Excel uses namespaces.
    |
    | Use localName instead.
    |--------------------------------------------------------------------------
    */

    const twoCellAnchors =
        findElementsByLocalName(
            drawingDocument,
            'twoCellAnchor',
        );

    const oneCellAnchors =
        findElementsByLocalName(
            drawingDocument,
            'oneCellAnchor',
        );

    const absoluteAnchors =
        findElementsByLocalName(
            drawingDocument,
            'absoluteAnchor',
        );

    const anchors = [
        ...twoCellAnchors,
        ...oneCellAnchors,
        ...absoluteAnchors,
    ];

    console.log(
        'TWO CELL ANCHORS:',
        twoCellAnchors.length,
    );

    console.log(
        'ONE CELL ANCHORS:',
        oneCellAnchors.length,
    );

    console.log(
        'ABSOLUTE ANCHORS:',
        absoluteAnchors.length,
    );

    console.log(
        'DRAWING ANCHORS:',
        anchors.length,
    );

    /*
    |--------------------------------------------------------------------------
    | 6. Process anchors
    |--------------------------------------------------------------------------
    */

    for (
        let index = 0;
        index < anchors.length;
        index++
    ) {
        const anchor =
            anchors[index];

        console.log(
            `========== ANCHOR ${index} ==========`,
        );

        /*
        |--------------------------------------------------------------------------
        | Find picture
        |--------------------------------------------------------------------------
        */

        const picture =
            findFirstByLocalName(
                anchor,
                'pic',
            );

        if (!picture) {
            console.log(
                'ANCHOR HAS NO PIC',
            );

            continue;
        }

        console.log(
            'PIC FOUND',
        );

        /*
        |--------------------------------------------------------------------------
        | Find blip
        |--------------------------------------------------------------------------
        */

        const blip =
            findFirstByLocalName(
                picture,
                'blip',
            );

        if (!blip) {
            console.log(
                'PIC HAS NO BLIP',
            );

            continue;
        }

        /*
        |--------------------------------------------------------------------------
        | Get r:embed
        |--------------------------------------------------------------------------
        */

        const relationshipId =
            blip.getAttribute(
                'r:embed',
            ) ??
            blip.getAttribute(
                'embed',
            ) ??
            blip.getAttributeNS(
                'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
                'embed',
            );

        console.log(
            'IMAGE RELATIONSHIP ID:',
            relationshipId,
        );

        if (!relationshipId) {
            console.error(
                'NO IMAGE RELATIONSHIP ID',
            );

            continue;
        }

        /*
        |--------------------------------------------------------------------------
        | Find image relationship
        |--------------------------------------------------------------------------
        */

        const imageRelationship =
            drawingRelationships.find(
                (relationship) =>
                    relationship.getAttribute(
                        'Id',
                    ) ===
                    relationshipId,
            );

        if (
            !imageRelationship
        ) {
            console.error(
                'IMAGE RELATIONSHIP NOT FOUND:',
                relationshipId,
            );

            continue;
        }

        const imageTarget =
            imageRelationship.getAttribute(
                'Target',
            );

        console.log(
            'IMAGE TARGET:',
            imageTarget,
        );

        if (!imageTarget) {
            continue;
        }

        /*
        |--------------------------------------------------------------------------
        | 7. Resolve image path
        |--------------------------------------------------------------------------
        */

        const imagePath =
            resolveZipPath(
                drawingPath,
                imageTarget,
            );

        console.log(
            'IMAGE PATH:',
            imagePath,
        );

        const imageFile =
            zip.file(
                imagePath,
            );

        if (!imageFile) {
            console.error(
                'IMAGE FILE NOT FOUND:',
                imagePath,
            );

            /*
            |--------------------------------------------------------------------------
            | Fallback:
            |
            | Some XLSX files use a slightly different
            | relative path.
            |--------------------------------------------------------------------------
            */

            const fallbackPath =
                normalizePath(
                    `xl/media/${imageTarget
                        .split('/')
                        .pop()}`,
                );

            console.log(
                'IMAGE FALLBACK PATH:',
                fallbackPath,
            );

            const fallbackFile =
                zip.file(
                    fallbackPath,
                );

            if (!fallbackFile) {
                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | Process fallback
            |--------------------------------------------------------------------------
            */

            const extension =
                fallbackPath
                    .split('.')
                    .pop()
                    ?.toLowerCase();

            let mimeType =
                'image/png';

            if (
                extension ===
                    'jpg' ||
                extension ===
                    'jpeg'
            ) {
                mimeType =
                    'image/jpeg';
            } else if (
                extension === 'gif'
            ) {
                mimeType =
                    'image/gif';
            } else if (
                extension === 'bmp'
            ) {
                mimeType =
                    'image/bmp';
            } else if (
                extension === 'svg'
            ) {
                mimeType =
                    'image/svg+xml';
            }

            const base64 =
                await fallbackFile.async(
                    'base64',
                );

            const position =
                parseImageAnchor(
                    anchor,
                    columnWidths,
                    rowHeights,
                );

            images.push({
                id:
                    `${sheetName}-image-${
                        index + 1
                    }`,

                src:
                    `data:${mimeType};base64,${base64}`,

                row:
                    position.row,

                column:
                    position.column,

                width:
                    position.width,

                height:
                    position.height,

                offsetX:
                    position.offsetX,

                offsetY:
                    position.offsetY,
            });

            console.log(
                'IMAGE SUCCESSFULLY IMPORTED USING FALLBACK',
            );

            continue;
        }

        /*
        |--------------------------------------------------------------------------
        | 8. MIME type
        |--------------------------------------------------------------------------
        */

        const extension =
            imagePath
                .split('.')
                .pop()
                ?.toLowerCase();

        let mimeType =
            'image/png';

        switch (
            extension
        ) {
            case 'jpg':
            case 'jpeg':
                mimeType =
                    'image/jpeg';
                break;

            case 'gif':
                mimeType =
                    'image/gif';
                break;

            case 'bmp':
                mimeType =
                    'image/bmp';
                break;

            case 'svg':
                mimeType =
                    'image/svg+xml';
                break;

            case 'webp':
                mimeType =
                    'image/webp';
                break;
        }

        /*
        |--------------------------------------------------------------------------
        | 9. Convert image
        |--------------------------------------------------------------------------
        */

        const base64 =
            await imageFile.async(
                'base64',
            );

        const src =
            `data:${mimeType};base64,${base64}`;

        /*
        |--------------------------------------------------------------------------
        | 10. Position and size
        |--------------------------------------------------------------------------
        */

        const position =
            parseImageAnchor(
                anchor,
                columnWidths,
                rowHeights,
            );

        const image: ExcelImage = {
            id: `${sheetName}-image-${index + 1}`,
            src,

            row: position.row,
            column: position.column,

            width: position.width,
            height: position.height,

            offsetX: position.offsetX,
            offsetY: position.offsetY,

            x: position.x,
            y: position.y,
        };

        images.push(
            image,
        );

        console.log(
            'IMAGE SUCCESSFULLY IMPORTED:',
            {
                id:
                    image.id,

                row:
                    image.row,

                column:
                    image.column,

                width:
                    image.width,

                height:
                    image.height,

                base64Length:
                    base64.length,
            },
        );
    }

    console.log(
        `========== ${sheetName}: TOTAL IMAGES ${images.length} ==========`,
    );

    return images;
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function ImportExcel() {
    const [file, setFile] =
        useState<File | null>(
            null,
        );

    const [loading, setLoading] =
        useState(false);

    const [workbook, setWorkbook] =
        useState<ExcelWorkbook | null>(
            null,
        );

    const [error, setError] =
        useState<string | null>(
            null,
        );

    /*
    |--------------------------------------------------------------------------
    | File import
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

            return;
        }

        setFile(selected);
        setLoading(true);
        setError(null);
        setWorkbook(null);

        try {
            const buffer =
                await selected.arrayBuffer();

            /*
            |--------------------------------------------------------------------------
            | XLSX
            |--------------------------------------------------------------------------
            */

            const sourceWorkbook =
                XLSX.read(
                    buffer,
                    {
                        type: 'array',

                        cellStyles:
                            true,

                        cellNF:
                            true,

                        cellFormula:
                            true,

                        cellHTML:
                            true,

                        cellText:
                            true,
                    },
                );

            /*
            |--------------------------------------------------------------------------
            | ZIP
            |--------------------------------------------------------------------------
            */

            const zip =
                await JSZip.loadAsync(
                    buffer,
                );

            console.log(
                '========== XLSX ZIP FILES ==========',
            );

            Object.keys(
                zip.files,
            ).forEach(
                (path) => {
                    console.log(
                        path,
                    );
                },
            );

            console.log(
                '====================================',
            );

            /*
            |--------------------------------------------------------------------------
            | Styles
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

            console.log(
                'EDTS PARSED STYLES:',
                parsedStyles,
            );

            /*
            |--------------------------------------------------------------------------
            | Build sheets
            |--------------------------------------------------------------------------
            */

            const edtsSheets: ExcelSheet[] =
                [];

            for (
                let sheetIndex = 0;
                sheetIndex <
                sourceWorkbook
                    .SheetNames
                    .length;
                sheetIndex++
            ) {
                const sheetName =
                    sourceWorkbook
                        .SheetNames[
                        sheetIndex
                    ];

                const worksheet =
                    sourceWorkbook
                        .Sheets[
                        sheetName
                    ];

                /*
                |--------------------------------------------------------------------------
                | Worksheet XML
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

                let styleIndexes =
                    new Map<
                        string,
                        number
                    >();

                let dimensions = {
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
                    const worksheetXml =
                        await worksheetFile.async(
                            'text',
                        );

                    styleIndexes =
                        parseWorksheetStyles(
                            worksheetXml,
                        );

                    dimensions =
                        parseWorksheetDimensions(
                            worksheetXml,
                        );
                }

                /*
                |--------------------------------------------------------------------------
                | Range
                |--------------------------------------------------------------------------
                */

                const range =
                    worksheet[
                        '!ref'
                    ];

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
                    row <= endRow;
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

                        if (
                            sourceCell.f
                        ) {
                            cell.formula =
                                String(
                                    sourceCell.f,
                                );
                        }

                        const styleIndex =
                            styleIndexes.get(
                                address,
                            ) ?? 0;

                        const parsedStyle =
                            parsedStyles
                                .styles[
                                styleIndex
                            ];

                        applyStyle(
                            cell,
                            parsedStyle,
                        );

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
                        (
                            _,
                            index,
                        ) => {
                            const rawWidth =
                                dimensions
                                    .columnWidths
                                    .get(
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
                                dimensions
                                    .rowHeights
                                    .get(
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
                | IMAGES
                |--------------------------------------------------------------------------
                */

                const images =
                    await extractSheetImages(
                        zip,
                        sheetIndex,
                        sheetName,
                        columnWidths,
                        rowHeights,
                    );

                /*
                |--------------------------------------------------------------------------
                | Sheet
                |--------------------------------------------------------------------------
                */

                edtsSheets.push({
                    name:
                        sheetName,

                    cells,

                    columnWidths,

                    rowHeights,

                    mergedCells,

                    images,
                });
            }

            /*
            |--------------------------------------------------------------------------
            | Workbook
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

            console.log(
                'EDTS IMAGES:',
                edtsWorkbook.sheets.map(
                    (sheet) => ({
                        sheet:
                            sheet.name,

                        images:
                            sheet.images,
                    }),
                ),
            );

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
                'Unable to transfer workbook to editor.',
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | UI
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

                        <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">

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

                                        <p className="text-xs text-slate-500">
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
                                                className="text-green-600"
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
                                                            className="text-green-600"
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
                                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
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