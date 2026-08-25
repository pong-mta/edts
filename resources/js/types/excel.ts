export type ExcelBorder = {
    style?: string;
    color?: string;
};

export type ExcelCell = {
    value: string;

    formula?: string | null;

    // Font
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;

    fontSize?: number;
    fontFamily?: string;
    color?: string;

    // Cell background
    backgroundColor?: string;

    // Alignment
    horizontalAlign?:
        | 'left'
        | 'center'
        | 'right';

    verticalAlign?:
        | 'top'
        | 'middle'
        | 'bottom';

    // Text
    wrapText?: boolean;

    // Borders
    border?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };

    // Optional number formatting
    numberFormat?: string;
};

export type ExcelMerge = {
    startRow: number;
    startColumn: number;
    endRow: number;
    endColumn: number;
};

export type ExcelImage = {
    id: string;

    src: string;

    row: number;
    column: number;

    width: number;
    height: number;

    offsetX?: number;
    offsetY?: number;

    toRow?: number;
    toColumn?: number;

    toOffsetX?: number;
    toOffsetY?: number;
    x?: number;
    y?: number;
};

export type ExcelSheet = {
    name: string;

    cells: ExcelCell[][];

    columnWidths: number[];

    rowHeights: number[];

    mergedCells: ExcelMerge[];

    images: ExcelImage[];
};

export type ExcelWorkbook = {
    version: 1;

    type: 'spreadsheet';

    sheets: ExcelSheet[];

    activeSheet: number;
};