export type ExcelCell = {
    value: string;
    formula?: string | null;

    bold?: boolean;
    italic?: boolean;
    underline?: boolean;

    fontSize?: number;
    fontFamily?: string;

    color?: string;
    backgroundColor?: string;

    horizontalAlign?:
        | 'left'
        | 'center'
        | 'right';

    verticalAlign?:
        | 'top'
        | 'middle'
        | 'bottom';

    border?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };
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