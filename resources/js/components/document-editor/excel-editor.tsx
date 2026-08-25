import React, {
    ClipboardEvent,
    KeyboardEvent,
    MouseEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

type Cell = {
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

    wrapText?: boolean;

    numberFormat?: string;

    border?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };
};

type CellPosition = {
    row: number;
    col: number;
};

type CellRange = {
    start: CellPosition;
    end: CellPosition;
};

type ExcelMerge = {
    startRow: number;
    startColumn: number;
    endRow: number;
    endColumn: number;
};

type ExcelImage = {
    id: string;
    src: string;

    row: number;
    column: number;

    width: number;
    height: number;

    offsetX?: number;
    offsetY?: number;
};

type ExcelSheet = {
    name: string;

    cells: Cell[][];

    columnWidths?: number[];
    rowHeights?: number[];

    mergedCells?: ExcelMerge[];

    images?: ExcelImage[];
};

type ExcelWorkbook = {
    version?: number;
    type?: string;

    sheets: ExcelSheet[];

    activeSheet?: number;
};

interface ExcelEditorProps {
    content: string | null;
    onChange: (content: string) => void;
}

const DEFAULT_ROWS = 50;
const DEFAULT_COLUMNS = 26;

const DEFAULT_COLUMN_WIDTH = 100;

const MIN_COLUMN_WIDTH = 40;
const MAX_COLUMN_WIDTH = 500;

const DEFAULT_ROW_HEIGHT = 28;

const MIN_ROW_HEIGHT = 18;
const MAX_ROW_HEIGHT = 200;

const ROW_HEADER_WIDTH = 48;
const COLUMN_HEADER_HEIGHT = 32;

const createEmptyRows = (): Cell[][] =>
    Array.from(
        {
            length: DEFAULT_ROWS,
        },
        () =>
            Array.from(
                {
                    length: DEFAULT_COLUMNS,
                },
                () => ({
                    value: '',
                }),
            ),
    );

const createDefaultColumnWidths = (): number[] =>
    Array.from(
        {
            length: DEFAULT_COLUMNS,
        },
        () => DEFAULT_COLUMN_WIDTH,
    );

const createDefaultRowHeights = (): number[] =>
    Array.from(
        {
            length: DEFAULT_ROWS,
        },
        () => DEFAULT_ROW_HEIGHT,
    );

const cloneRows = (
    rows: Cell[][],
): Cell[][] =>
    rows.map((row) =>
        row.map((cell) => ({
            ...cell,

            border: cell.border
                ? {
                      ...cell.border,
                  }
                : undefined,
        })),
    );

const columnName = (
    index: number,
) => {
    let name = '';

    let number = index + 1;

    while (number > 0) {
        const remainder =
            (number - 1) % 26;

        name =
            String.fromCharCode(
                65 + remainder,
            ) + name;

        number = Math.floor(
            (number - 1) / 26,
        );
    }

    return name;
};

const normalizePosition = (
    position: CellPosition,
    rowsCount: number,
    columnsCount: number,
): CellPosition => ({
    row: Math.max(
        0,
        Math.min(
            position.row,
            Math.max(
                rowsCount - 1,
                0,
            ),
        ),
    ),

    col: Math.max(
        0,
        Math.min(
            position.col,
            Math.max(
                columnsCount - 1,
                0,
            ),
        ),
    ),
});

const isSameCell = (
    a: CellPosition | null,
    b: CellPosition | null,
) => {
    if (!a || !b) {
        return false;
    }

    return (
        a.row === b.row &&
        a.col === b.col
    );
};

const isCellInRange = (
    position: CellPosition,
    range: CellRange | null,
) => {
    if (!range) {
        return false;
    }

    const minRow = Math.min(
        range.start.row,
        range.end.row,
    );

    const maxRow = Math.max(
        range.start.row,
        range.end.row,
    );

    const minCol = Math.min(
        range.start.col,
        range.end.col,
    );

    const maxCol = Math.max(
        range.start.col,
        range.end.col,
    );

    return (
        position.row >= minRow &&
        position.row <= maxRow &&
        position.col >= minCol &&
        position.col <= maxCol
    );
};

const parseClipboard = (
    text: string,
): string[][] =>
    text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map((row) =>
            row.split('\t'),
        );

export default function ExcelEditor({
    content,
    onChange,
}: ExcelEditorProps) {
    const [workbook, setWorkbook] =
        useState<ExcelWorkbook | null>(
            null,
        );

    const [
        activeSheetIndex,
        setActiveSheetIndex,
    ] = useState(0);

    const [rows, setRows] =
        useState<Cell[][]>(
            createEmptyRows,
        );

    const [
        columnWidths,
        setColumnWidths,
    ] = useState<number[]>(
        createDefaultColumnWidths,
    );

    const [
        rowHeights,
        setRowHeights,
    ] = useState<number[]>(
        createDefaultRowHeights,
    );

    const [
        mergedCells,
        setMergedCells,
    ] = useState<ExcelMerge[]>([]);

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    | Imported Excel images live on the sheet.
    |
    | The importer already creates:
    |
    | sheet.images = [...]
    |
    | We keep those images in state and render them as an absolute layer
    | above the spreadsheet table.
    |--------------------------------------------------------------------------
    */

    const [images, setImages] =
        useState<ExcelImage[]>([]);

    const [
        selectedCell,
        setSelectedCell,
    ] = useState<CellPosition>({
        row: 0,
        col: 0,
    });

    const [
        selectionRange,
        setSelectionRange,
    ] = useState<CellRange | null>(
        null,
    );

    const [
        editingCell,
        setEditingCell,
    ] = useState<CellPosition | null>(
        null,
    );

    const [
        editingValue,
        setEditingValue,
    ] = useState('');

    const [
        formulaValue,
        setFormulaValue,
    ] = useState('');

    const [
        resizingColumn,
        setResizingColumn,
    ] = useState<number | null>(
        null,
    );

    const [
        resizingRow,
        setResizingRow,
    ] = useState<number | null>(
        null,
    );

    const [
        resizeStartX,
        setResizeStartX,
    ] = useState(0);

    const [
        resizeStartY,
        setResizeStartY,
    ] = useState(0);

    const [
        resizeStartWidth,
        setResizeStartWidth,
    ] = useState(
        DEFAULT_COLUMN_WIDTH,
    );

    const [
        resizeStartHeight,
        setResizeStartHeight,
    ] = useState(
        DEFAULT_ROW_HEIGHT,
    );

    const inputRef =
        useRef<HTMLInputElement>(null);

    const gridRef =
        useRef<HTMLDivElement>(null);

    /*
    |--------------------------------------------------------------------------
    | WORKBOOK WIDTH
    |--------------------------------------------------------------------------
    */

    const tableWidth = useMemo(() => {
        return (
            ROW_HEADER_WIDTH +
            columnWidths.reduce(
                (
                    total,
                    width,
                ) =>
                    total + width,
                0,
            )
        );
    }, [columnWidths]);

    /*
    |--------------------------------------------------------------------------
    | TOTAL GRID HEIGHT
    |--------------------------------------------------------------------------
    */

    const tableHeight = useMemo(() => {
        return rowHeights.reduce(
            (
                total,
                height,
            ) =>
                total + height,
            0,
        );
    }, [rowHeights]);

    /*
    |--------------------------------------------------------------------------
    | IMAGE POSITION
    |--------------------------------------------------------------------------
    |
    | Excel image coordinates:
    |
    | row
    | column
    | offsetX
    | offsetY
    |
    | Convert them into CSS absolute coordinates.
    |--------------------------------------------------------------------------
    */

    const EMU_PER_PIXEL = 9525;

    const getImagePosition = (
        image: ExcelImage,
    ) => {
        /*
        * The absolute image layer covers the entire
        * spreadsheet container.
        *
        * The table itself has:
        *
        * - 48px row-header column on the left
        * - 32px column-header row on top
        *
        * Excel drawing coordinates start at the
        * worksheet cell area, NOT at those headers.
        */

        let left = ROW_HEADER_WIDTH;

        for (
            let col = 0;
            col < image.column;
            col++
        ) {
            left +=
                columnWidths[col] ??
                DEFAULT_COLUMN_WIDTH;
        }

        let top = COLUMN_HEADER_HEIGHT;

        for (
            let row = 0;
            row < image.row;
            row++
        ) {
            top +=
                rowHeights[row] ??
                DEFAULT_ROW_HEIGHT;
        }

        /*
        * Excel stores drawing offsets in EMU.
        */
        const offsetX =
            (image.offsetX ?? 0) /
            EMU_PER_PIXEL;

        const offsetY =
            (image.offsetY ?? 0) /
            EMU_PER_PIXEL;

        return {
            left: left + offsetX,
            top: top + offsetY,
        };
    };

    /*
    |--------------------------------------------------------------------------
    | LOAD WORKBOOK
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!content) {
            setWorkbook(null);

            setActiveSheetIndex(0);

            setRows(
                createEmptyRows(),
            );

            setColumnWidths(
                createDefaultColumnWidths(),
            );

            setRowHeights(
                createDefaultRowHeights(),
            );

            setMergedCells([]);

            setImages([]);

            return;
        }

        try {
            const parsed =
                JSON.parse(
                    content,
                ) as ExcelWorkbook;

            if (
                parsed &&
                parsed.type ===
                    'spreadsheet' &&
                Array.isArray(
                    parsed.sheets,
                ) &&
                parsed.sheets.length > 0
            ) {
                setWorkbook(parsed);

                const initialSheet =
                    Math.max(
                        0,
                        Math.min(
                            parsed.activeSheet ??
                                0,
                            parsed.sheets
                                .length - 1,
                        ),
                    );

                setActiveSheetIndex(
                    initialSheet,
                );

                loadSheet(
                    parsed.sheets[
                        initialSheet
                    ],
                );

                return;
            }

            throw new Error(
                'Invalid EDTS workbook format.',
            );
        } catch (error) {
            console.error(
                'Failed to load Excel workbook:',
                error,
            );

            setWorkbook(null);

            setRows(
                createEmptyRows(),
            );

            setColumnWidths(
                createDefaultColumnWidths(),
            );

            setRowHeights(
                createDefaultRowHeights(),
            );

            setMergedCells([]);

            setImages([]);
        }
    }, [content]);

    /*
    |--------------------------------------------------------------------------
    | LOAD SHEET
    |--------------------------------------------------------------------------
    */

    const loadSheet = (
        sheet: ExcelSheet,
    ) => {
        const sourceRows =
            Array.isArray(sheet.cells)
                ? sheet.cells
                : [];

        const sourceRowCount =
            sourceRows.length;

        const sourceColumnCount =
            sourceRows.reduce(
                (
                    maximum,
                    row,
                ) =>
                    Math.max(
                        maximum,
                        Array.isArray(row)
                            ? row.length
                            : 0,
                    ),
                0,
            );

        const rowCount = Math.max(
            DEFAULT_ROWS,
            sourceRowCount,
        );

        const columnCount =
            Math.max(
                DEFAULT_COLUMNS,
                sourceColumnCount,
            );

        /*
        |--------------------------------------------------------------------------
        | PRESERVE COMPLETE CELL OBJECT
        |--------------------------------------------------------------------------
        */

        const normalized: Cell[][] =
            Array.from(
                {
                    length: rowCount,
                },
                (
                    _,
                    rowIndex,
                ) =>
                    Array.from(
                        {
                            length: columnCount,
                        },
                        (
                            _,
                            colIndex,
                        ) => {
                            const cell =
                                sourceRows[
                                    rowIndex
                                ]?.[
                                    colIndex
                                ];

                            if (!cell) {
                                return {
                                    value: '',
                                };
                            }

                            return {
                                ...cell,

                                value:
                                    cell.value ??
                                    '',

                                formula:
                                    cell.formula ??
                                    null,

                                border:
                                    cell.border
                                        ? {
                                              ...cell.border,
                                          }
                                        : undefined,
                            };
                        },
                    ),
            );

        setRows(normalized);

        /*
        |--------------------------------------------------------------------------
        | COLUMN WIDTHS
        |--------------------------------------------------------------------------
        */

        const widths =
            Array.from(
                {
                    length: columnCount,
                },
                (
                    _,
                    index,
                ) => {
                    const importedWidth =
                        sheet
                            .columnWidths?.[
                            index
                        ];

                    if (
                        typeof importedWidth ===
                            'number' &&
                        Number.isFinite(
                            importedWidth,
                        )
                    ) {
                        return Math.max(
                            MIN_COLUMN_WIDTH,
                            Math.min(
                                MAX_COLUMN_WIDTH,
                                importedWidth,
                            ),
                        );
                    }

                    return DEFAULT_COLUMN_WIDTH;
                },
            );

        setColumnWidths(
            widths,
        );

        /*
        |--------------------------------------------------------------------------
        | ROW HEIGHTS
        |--------------------------------------------------------------------------
        */

        const heights =
            Array.from(
                {
                    length: rowCount,
                },
                (
                    _,
                    index,
                ) => {
                    const importedHeight =
                        sheet
                            .rowHeights?.[
                            index
                        ];

                    if (
                        typeof importedHeight ===
                            'number' &&
                        Number.isFinite(
                            importedHeight,
                        )
                    ) {
                        return Math.max(
                            MIN_ROW_HEIGHT,
                            Math.min(
                                MAX_ROW_HEIGHT,
                                importedHeight,
                            ),
                        );
                    }

                    return DEFAULT_ROW_HEIGHT;
                },
            );

        setRowHeights(
            heights,
        );

        /*
        |--------------------------------------------------------------------------
        | MERGED CELLS
        |--------------------------------------------------------------------------
        */

        setMergedCells(
            Array.isArray(
                sheet.mergedCells,
            )
                ? sheet.mergedCells
                : [],
        );

        /*
        |--------------------------------------------------------------------------
        | IMAGES
        |--------------------------------------------------------------------------
        |
        | THIS IS THE IMPORTANT FIX.
        |
        | The importer successfully extracted the image.
        | We now actually load it into the editor.
        |--------------------------------------------------------------------------
        */

        const importedImages =
            Array.isArray(
                sheet.images,
            )
                ? sheet.images
                : [];

        console.log(
            `${sheet.name}: loading images`,
            importedImages,
        );

        setImages(
            importedImages,
        );

        /*
        |--------------------------------------------------------------------------
        | RESET SELECTION
        |--------------------------------------------------------------------------
        */

        setSelectedCell({
            row: 0,
            col: 0,
        });

        setSelectionRange(null);

        setEditingCell(null);

        setEditingValue('');

        setFormulaValue(
            normalized[0]?.[0]
                ?.value ?? '',
        );
    };

    /*
    |--------------------------------------------------------------------------
    | SAVE CURRENT WORKBOOK STATE
    |--------------------------------------------------------------------------
    */

    const emitWorkbook = (
        nextRows: Cell[][],
        nextWidths: number[],
        nextHeights: number[],
    ) => {
        if (workbook) {
            const nextSheets =
                workbook.sheets.map(
                    (
                        sheet,
                        index,
                    ) => {
                        if (
                            index !==
                            activeSheetIndex
                        ) {
                            return sheet;
                        }

                        return {
                            ...sheet,

                            cells:
                                nextRows,

                            columnWidths:
                                nextWidths,

                            rowHeights:
                                nextHeights,

                            mergedCells:
                                mergedCells,

                            /*
                            |--------------------------------------------------------------------------
                            | PRESERVE IMAGES
                            |--------------------------------------------------------------------------
                            */

                            images:
                                images,
                        };
                    },
                );

            const nextWorkbook: ExcelWorkbook =
                {
                    ...workbook,

                    version:
                        workbook.version ??
                        1,

                    type: 'spreadsheet',

                    sheets:
                        nextSheets,

                    activeSheet:
                        activeSheetIndex,
                };

            setWorkbook(
                nextWorkbook,
            );

            onChange(
                JSON.stringify(
                    nextWorkbook,
                ),
            );

            return;
        }

        onChange(
            JSON.stringify({
                version: 1,
                type: 'spreadsheet',
                rows: nextRows,
                columnWidths:
                    nextWidths,
                rowHeights:
                    nextHeights,
            }),
        );
    };

    /*
    |--------------------------------------------------------------------------
    | SELECT CELL
    |--------------------------------------------------------------------------
    */

    const selectCell = (
        position: CellPosition,
        extend = false,
    ) => {
        const normalized =
            normalizePosition(
                position,
                rows.length,
                columnWidths.length,
            );

        setSelectedCell(
            normalized,
        );

        if (extend) {
            setSelectionRange(
                (current) => ({
                    start:
                        current?.start ??
                        selectedCell,

                    end: normalized,
                }),
            );
        } else {
            setSelectionRange(
                null,
            );
        }

        setEditingCell(null);

        setFormulaValue(
            rows[
                normalized.row
            ]?.[
                normalized.col
            ]?.value ?? '',
        );
    };

    const getActiveRange =
        (): CellRange => {
            if (selectionRange) {
                return selectionRange;
            }

            return {
                start: selectedCell,
                end: selectedCell,
            };
        };

    /*
    |--------------------------------------------------------------------------
    | EDIT CELL
    |--------------------------------------------------------------------------
    */

    const beginEditing = (
        position: CellPosition,
        initialValue?: string,
    ) => {
        const normalized =
            normalizePosition(
                position,
                rows.length,
                columnWidths.length,
            );

        const value =
            initialValue ??
            rows[
                normalized.row
            ]?.[
                normalized.col
            ]?.value ??
            '';

        setSelectedCell(
            normalized,
        );

        setSelectionRange(
            null,
        );

        setEditingCell(
            normalized,
        );

        setEditingValue(
            value,
        );

        requestAnimationFrame(
            () => {
                inputRef.current?.focus();

                inputRef.current?.setSelectionRange(
                    inputRef.current
                        .value
                        .length,
                    inputRef.current
                        .value
                        .length,
                );
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | COMMIT EDIT
    |--------------------------------------------------------------------------
    */

    const commitEditing = (
        move:
            | 'none'
            | 'down'
            | 'right' = 'none',
    ) => {
        if (!editingCell) {
            return;
        }

        const nextRows =
            cloneRows(rows);

        nextRows[
            editingCell.row
        ][
            editingCell.col
        ].value =
            editingValue;

        setRows(nextRows);

        emitWorkbook(
            nextRows,
            columnWidths,
            rowHeights,
        );

        const current =
            editingCell;

        setEditingCell(null);

        setFormulaValue(
            editingValue,
        );

        if (
            move === 'down'
        ) {
            selectCell({
                row: Math.min(
                    current.row + 1,
                    rows.length - 1,
                ),

                col: current.col,
            });
        }

        if (
            move === 'right'
        ) {
            selectCell({
                row: current.row,

                col: Math.min(
                    current.col + 1,
                    columnWidths.length -
                        1,
                ),
            });
        }
    };

    /*
    |--------------------------------------------------------------------------
    | CANCEL EDIT
    |--------------------------------------------------------------------------
    */

    const cancelEditing =
        () => {
            setEditingCell(
                null,
            );

            setEditingValue(
                rows[
                    selectedCell.row
                ]?.[
                    selectedCell.col
                ]?.value ?? '',
            );
        };

    /*
    |--------------------------------------------------------------------------
    | UPDATE CELL
    |--------------------------------------------------------------------------
    */

    const updateCell = (
        row: number,
        col: number,
        value: string,
    ) => {
        const nextRows =
            cloneRows(rows);

        nextRows[row][col].value =
            value;

        setRows(nextRows);

        setFormulaValue(
            value,
        );

        emitWorkbook(
            nextRows,
            columnWidths,
            rowHeights,
        );
    };

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    const clearSelectedCells =
        () => {
            const range =
                getActiveRange();

            const nextRows =
                cloneRows(rows);

            const minRow =
                Math.min(
                    range.start.row,
                    range.end.row,
                );

            const maxRow =
                Math.max(
                    range.start.row,
                    range.end.row,
                );

            const minCol =
                Math.min(
                    range.start.col,
                    range.end.col,
                );

            const maxCol =
                Math.max(
                    range.start.col,
                    range.end.col,
                );

            for (
                let row = minRow;
                row <= maxRow;
                row++
            ) {
                for (
                    let col = minCol;
                    col <= maxCol;
                    col++
                ) {
                    nextRows[
                        row
                    ][
                        col
                    ].value = '';
                }
            }

            setRows(nextRows);

            emitWorkbook(
                nextRows,
                columnWidths,
                rowHeights,
            );

            setFormulaValue('');
        };

    /*
    |--------------------------------------------------------------------------
    | COPY
    |--------------------------------------------------------------------------
    */

    const copySelection = (
        event: ClipboardEvent<HTMLDivElement>,
    ) => {
        event.preventDefault();

        const range =
            getActiveRange();

        const minRow =
            Math.min(
                range.start.row,
                range.end.row,
            );

        const maxRow =
            Math.max(
                range.start.row,
                range.end.row,
            );

        const minCol =
            Math.min(
                range.start.col,
                range.end.col,
            );

        const maxCol =
            Math.max(
                range.start.col,
                range.end.col,
            );

        const text =
            Array.from(
                {
                    length:
                        maxRow -
                        minRow +
                        1,
                },
                (
                    _,
                    rowOffset,
                ) =>
                    Array.from(
                        {
                            length:
                                maxCol -
                                minCol +
                                1,
                        },
                        (
                            _,
                            colOffset,
                        ) =>
                            rows[
                                minRow +
                                    rowOffset
                            ][
                                minCol +
                                    colOffset
                            ]?.value ??
                            '',
                    ).join('\t'),
            ).join('\n');

        event.clipboardData.setData(
            'text/plain',
            text,
        );
    };

    /*
    |--------------------------------------------------------------------------
    | PASTE
    |--------------------------------------------------------------------------
    */

    const pasteSelection = (
        event: ClipboardEvent<HTMLDivElement>,
    ) => {
        event.preventDefault();

        const text =
            event.clipboardData.getData(
                'text/plain',
            );

        if (!text) {
            return;
        }

        const pasted =
            parseClipboard(text);

        const nextRows =
            cloneRows(rows);

        pasted.forEach(
            (
                pasteRow,
                rowOffset,
            ) => {
                const targetRow =
                    selectedCell.row +
                    rowOffset;

                if (
                    targetRow >=
                    nextRows.length
                ) {
                    return;
                }

                pasteRow.forEach(
                    (
                        value,
                        colOffset,
                    ) => {
                        const targetCol =
                            selectedCell.col +
                            colOffset;

                        if (
                            targetCol >=
                            nextRows[
                                targetRow
                            ].length
                        ) {
                            return;
                        }

                        nextRows[
                            targetRow
                        ][
                            targetCol
                        ].value =
                            value;
                    },
                );
            },
        );

        setRows(nextRows);

        emitWorkbook(
            nextRows,
            columnWidths,
            rowHeights,
        );

        const pastedRows =
            pasted.length;

        const pastedColumns =
            pasted.reduce(
                (
                    max,
                    row,
                ) =>
                    Math.max(
                        max,
                        row.length,
                    ),
                1,
            );

        setSelectionRange({
            start:
                selectedCell,

            end: {
                row: Math.min(
                    selectedCell.row +
                        pastedRows -
                        1,
                    nextRows.length -
                        1,
                ),

                col: Math.min(
                    selectedCell.col +
                        pastedColumns -
                        1,
                    nextRows[0]
                        .length -
                        1,
                ),
            },
        });
    };

    /*
    |--------------------------------------------------------------------------
    | COLUMN RESIZE START
    |--------------------------------------------------------------------------
    */

    const startColumnResize = (
        event: MouseEvent,
        col: number,
    ) => {
        event.preventDefault();
        event.stopPropagation();

        setResizingColumn(
            col,
        );

        setResizingRow(null);

        setResizeStartX(
            event.clientX,
        );

        setResizeStartWidth(
            columnWidths[col] ??
                DEFAULT_COLUMN_WIDTH,
        );
    };

    /*
    |--------------------------------------------------------------------------
    | ROW RESIZE START
    |--------------------------------------------------------------------------
    */

    const startRowResize = (
        event: MouseEvent,
        row: number,
    ) => {
        event.preventDefault();
        event.stopPropagation();

        setResizingRow(row);

        setResizingColumn(null);

        setResizeStartY(
            event.clientY,
        );

        setResizeStartHeight(
            rowHeights[row] ??
                DEFAULT_ROW_HEIGHT,
        );
    };

    /*
    |--------------------------------------------------------------------------
    | COLUMN RESIZE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (
            resizingColumn ===
            null
        ) {
            return;
        }

        const handleMouseMove = (
            event: globalThis.MouseEvent,
        ) => {
            const delta =
                event.clientX -
                resizeStartX;

            const nextWidth =
                Math.max(
                    MIN_COLUMN_WIDTH,
                    Math.min(
                        MAX_COLUMN_WIDTH,
                        resizeStartWidth +
                            delta,
                    ),
                );

            setColumnWidths(
                (current) => {
                    const next = [
                        ...current,
                    ];

                    next[
                        resizingColumn
                    ] = nextWidth;

                    return next;
                },
            );
        };

        const handleMouseUp =
            () => {
                setColumnWidths(
                    (current) => {
                        const next = [
                            ...current,
                        ];

                        emitWorkbook(
                            rows,
                            next,
                            rowHeights,
                        );

                        return next;
                    },
                );

                setResizingColumn(
                    null,
                );
            };

        document.addEventListener(
            'mousemove',
            handleMouseMove,
        );

        document.addEventListener(
            'mouseup',
            handleMouseUp,
        );

        return () => {
            document.removeEventListener(
                'mousemove',
                handleMouseMove,
            );

            document.removeEventListener(
                'mouseup',
                handleMouseUp,
            );
        };
    }, [
        resizingColumn,
        resizeStartX,
        resizeStartWidth,
        rows,
        rowHeights,
        workbook,
        activeSheetIndex,
        mergedCells,
        images,
    ]);

    /*
    |--------------------------------------------------------------------------
    | ROW RESIZE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (
            resizingRow ===
            null
        ) {
            return;
        }

        const handleMouseMove = (
            event: globalThis.MouseEvent,
        ) => {
            const delta =
                event.clientY -
                resizeStartY;

            const nextHeight =
                Math.max(
                    MIN_ROW_HEIGHT,
                    Math.min(
                        MAX_ROW_HEIGHT,
                        resizeStartHeight +
                            delta,
                    ),
                );

            setRowHeights(
                (current) => {
                    const next = [
                        ...current,
                    ];

                    next[
                        resizingRow
                    ] = nextHeight;

                    return next;
                },
            );
        };

        const handleMouseUp =
            () => {
                setRowHeights(
                    (current) => {
                        const next = [
                            ...current,
                        ];

                        emitWorkbook(
                            rows,
                            columnWidths,
                            next,
                        );

                        return next;
                    },
                );

                setResizingRow(
                    null,
                );
            };

        document.addEventListener(
            'mousemove',
            handleMouseMove,
        );

        document.addEventListener(
            'mouseup',
            handleMouseUp,
        );

        return () => {
            document.removeEventListener(
                'mousemove',
                handleMouseMove,
            );

            document.removeEventListener(
                'mouseup',
                handleMouseUp,
            );
        };
    }, [
        resizingRow,
        resizeStartY,
        resizeStartHeight,
        rows,
        columnWidths,
        workbook,
        activeSheetIndex,
        mergedCells,
        images,
    ]);

    /*
    |--------------------------------------------------------------------------
    | KEYBOARD
    |--------------------------------------------------------------------------
    */

    const handleGridKeyDown = (
        event: KeyboardEvent<HTMLDivElement>,
    ) => {
        const {
            key,
            ctrlKey,
            metaKey,
            shiftKey,
        } = event;

        const commandKey =
            ctrlKey || metaKey;

        if (
            editingCell &&
            key === 'Escape'
        ) {
            event.preventDefault();

            cancelEditing();

            return;
        }

        if (editingCell) {
            return;
        }

        if (
            commandKey &&
            key.toLowerCase() === 'a'
        ) {
            event.preventDefault();

            setSelectedCell({
                row: 0,
                col: 0,
            });

            setSelectionRange({
                start: {
                    row: 0,
                    col: 0,
                },

                end: {
                    row:
                        rows.length - 1,

                    col:
                        rows[0]?.length -
                        1,
                },
            });

            return;
        }

        if (
            key === 'Delete' ||
            key === 'Backspace'
        ) {
            event.preventDefault();

            clearSelectedCells();

            return;
        }

        if (key === 'Enter') {
            event.preventDefault();

            beginEditing(
                selectedCell,
            );

            return;
        }

        if (key === 'F2') {
            event.preventDefault();

            beginEditing(
                selectedCell,
            );

            return;
        }

        if (key === 'Tab') {
            event.preventDefault();

            selectCell({
                row:
                    selectedCell.row,

                col: shiftKey
                    ? Math.max(
                          selectedCell.col -
                              1,
                          0,
                      )
                    : Math.min(
                          selectedCell.col +
                              1,
                          columnWidths.length -
                              1,
                      ),
            });

            return;
        }

        let nextPosition:
            | CellPosition
            | null = null;

        if (
            key === 'ArrowUp'
        ) {
            nextPosition = {
                row:
                    selectedCell.row -
                    1,

                col:
                    selectedCell.col,
            };
        }

        if (
            key === 'ArrowDown'
        ) {
            nextPosition = {
                row:
                    selectedCell.row +
                    1,

                col:
                    selectedCell.col,
            };
        }

        if (
            key === 'ArrowLeft'
        ) {
            nextPosition = {
                row:
                    selectedCell.row,

                col:
                    selectedCell.col -
                    1,
            };
        }

        if (
            key === 'ArrowRight'
        ) {
            nextPosition = {
                row:
                    selectedCell.row,

                col:
                    selectedCell.col +
                    1,
            };
        }

        if (nextPosition) {
            event.preventDefault();

            const normalized =
                normalizePosition(
                    nextPosition,
                    rows.length,
                    columnWidths.length,
                );

            setSelectedCell(
                normalized,
            );

            if (shiftKey) {
                setSelectionRange(
                    (current) => ({
                        start:
                            current?.start ??
                            selectedCell,

                        end: normalized,
                    }),
                );
            } else {
                setSelectionRange(
                    null,
                );
            }

            setFormulaValue(
                rows[
                    normalized.row
                ]?.[
                    normalized.col
                ]?.value ?? '',
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | DIRECT TYPING
    |--------------------------------------------------------------------------
    */

    const handleGridKeyPress = (
        event: KeyboardEvent<HTMLDivElement>,
    ) => {
        if (editingCell) {
            return;
        }

        if (
            event.ctrlKey ||
            event.metaKey ||
            event.altKey
        ) {
            return;
        }

        if (
            event.key.length !== 1
        ) {
            return;
        }

        event.preventDefault();

        beginEditing(
            selectedCell,
            event.key,
        );
    };

    /*
    |--------------------------------------------------------------------------
    | FORMULA BAR
    |--------------------------------------------------------------------------
    */

    const handleFormulaBarChange = (
        value: string,
    ) => {
        setFormulaValue(
            value,
        );

        updateCell(
            selectedCell.row,
            selectedCell.col,
            value,
        );
    };

    /*
    |--------------------------------------------------------------------------
    | CELL MOUSE DOWN
    |--------------------------------------------------------------------------
    */

    const handleCellMouseDown = (
        event: MouseEvent,
        row: number,
        col: number,
    ) => {
        event.preventDefault();

        const position = {
            row,
            col,
        };

        if (event.shiftKey) {
            setSelectionRange(
                (current) => ({
                    start:
                        current?.start ??
                        selectedCell,

                    end: position,
                }),
            );
        } else {
            setSelectionRange(
                null,
            );
        }

        setSelectedCell(
            position,
        );

        setEditingCell(null);

        setFormulaValue(
            rows[row]?.[col]
                ?.value ?? '',
        );
    };

    /*
    |--------------------------------------------------------------------------
    | DOUBLE CLICK
    |--------------------------------------------------------------------------
    */

    const handleCellDoubleClick = (
        row: number,
        col: number,
    ) => {
        beginEditing({
            row,
            col,
        });
    };

    /*
    |--------------------------------------------------------------------------
    | COLUMN HEADER
    |--------------------------------------------------------------------------
    */

    const handleColumnHeaderClick =
        (col: number) => {
            setSelectedCell({
                row: 0,
                col,
            });

            setSelectionRange({
                start: {
                    row: 0,
                    col,
                },

                end: {
                    row:
                        rows.length - 1,

                    col,
                },
            });
        };

    /*
    |--------------------------------------------------------------------------
    | ROW HEADER
    |--------------------------------------------------------------------------
    */

    const handleRowHeaderClick =
        (row: number) => {
            setSelectedCell({
                row,
                col: 0,
            });

            setSelectionRange({
                start: {
                    row,
                    col: 0,
                },

                end: {
                    row,

                    col:
                        columnWidths.length -
                        1,
                },
            });
        };

    /*
    |--------------------------------------------------------------------------
    | CHANGE SHEET
    |--------------------------------------------------------------------------
    */

    const handleSheetChange = (
        index: number,
    ) => {
        if (!workbook) {
            return;
        }

        const sheet =
            workbook.sheets[index];

        if (!sheet) {
            return;
        }

        setActiveSheetIndex(
            index,
        );

        loadSheet(sheet);

        const nextWorkbook = {
            ...workbook,

            activeSheet: index,
        };

        setWorkbook(
            nextWorkbook,
        );

        onChange(
            JSON.stringify(
                nextWorkbook,
            ),
        );
    };

    /*
    |--------------------------------------------------------------------------
    | CURRENT CELL
    |--------------------------------------------------------------------------
    */

    const currentCellAddress =
        useMemo(
            () =>
                `${columnName(
                    selectedCell.col,
                )}${
                    selectedCell.row +
                    1
                }`,
            [selectedCell],
        );

    /*
    |--------------------------------------------------------------------------
    | FOCUS GRID
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!editingCell) {
            gridRef.current?.focus();
        }
    }, [
        selectedCell,
        editingCell,
    ]);

    /*
    |--------------------------------------------------------------------------
    | MERGE HELPERS
    |--------------------------------------------------------------------------
    */

    const getMergeForCell = (
        row: number,
        col: number,
    ) => {
        return mergedCells.find(
            (merge) =>
                row >=
                    merge.startRow &&
                row <=
                    merge.endRow &&
                col >=
                    merge.startColumn &&
                col <=
                    merge.endColumn,
        );
    };

    const isMergeStart = (
        row: number,
        col: number,
    ) => {
        const merge =
            getMergeForCell(
                row,
                col,
            );

        return (
            !!merge &&
            merge.startRow === row &&
            merge.startColumn === col
        );
    };

    const isInsideMergeButNotStart =
        (
            row: number,
            col: number,
        ) => {
            const merge =
                getMergeForCell(
                    row,
                    col,
                );

            if (!merge) {
                return false;
            }

            return !(
                merge.startRow === row &&
                merge.startColumn === col
            );
        };

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">

            {/* SHEET TABS */}

            {workbook &&
                workbook.sheets.length >
                    0 && (
                    <div className="flex h-9 shrink-0 items-end overflow-x-auto border-b border-slate-300 bg-slate-100 px-2">
                        {workbook.sheets.map(
                            (
                                sheet,
                                index,
                            ) => (
                                <button
                                    key={
                                        sheet.name
                                    }
                                    type="button"
                                    onClick={() =>
                                        handleSheetChange(
                                            index,
                                        )
                                    }
                                    className={[
                                        'h-8 min-w-[120px] border-x border-t px-4 text-xs font-medium transition',

                                        index ===
                                        activeSheetIndex
                                            ? 'border-slate-300 bg-white text-slate-900'
                                            : 'border-transparent text-slate-500 hover:bg-slate-200',
                                    ].join(
                                        ' ',
                                    )}
                                >
                                    {
                                        sheet.name
                                    }
                                </button>
                            ),
                        )}
                    </div>
                )}

            {/* FORMULA BAR */}

            <div className="flex h-11 shrink-0 items-center border-b border-slate-300 bg-slate-50">

                <div className="flex h-full w-20 shrink-0 items-center justify-center border-r border-slate-300 bg-white text-xs font-semibold text-slate-600">
                    {
                        currentCellAddress
                    }
                </div>

                <div className="flex h-full w-10 shrink-0 items-center justify-center border-r border-slate-300 text-sm font-semibold text-slate-500">
                    fx
                </div>

                <input
                    value={
                        formulaValue
                    }
                    onChange={(
                        event,
                    ) =>
                        handleFormulaBarChange(
                            event.target
                                .value,
                        )
                    }
                    className="h-full min-w-0 flex-1 border-0 bg-white px-3 text-sm text-slate-800 outline-none"
                />
            </div>

            {/* GRID */}

            <div
                ref={gridRef}
                tabIndex={0}
                onKeyDown={
                    handleGridKeyDown
                }
                onKeyPress={
                    handleGridKeyPress
                }
                onCopy={
                    copySelection
                }
                onPaste={
                    pasteSelection
                }
                className="max-h-[700px] overflow-auto outline-none"
            >
                {/*
                |--------------------------------------------------------------------------
                | IMPORTANT IMAGE CONTAINER
                |--------------------------------------------------------------------------
                |
                | The table and images share the same coordinate system.
                |
                | Images are rendered above the table.
                |--------------------------------------------------------------------------
                */}

                <div
                    className="relative"
                    style={{
                        width:
                            `${tableWidth}px`,

                        minWidth:
                            `${tableWidth}px`,

                        minHeight:
                            `${tableHeight}px`,
                    }}
                >
                    <table
                        className="border-collapse text-sm"
                        style={{
                            tableLayout:
                                'fixed',

                            width:
                                `${tableWidth}px`,

                            minWidth:
                                `${tableWidth}px`,
                        }}
                    >
                        <colgroup>
                            <col
                                style={{
                                    width: `${ROW_HEADER_WIDTH}px`,
                                    minWidth: `${ROW_HEADER_WIDTH}px`,
                                    maxWidth: `${ROW_HEADER_WIDTH}px`,
                                }}
                            />

                            {columnWidths.map(
                                (
                                    width,
                                    col,
                                ) => (
                                    <col
                                        key={
                                            col
                                        }
                                        style={{
                                            width: `${width}px`,
                                            minWidth: `${width}px`,
                                            maxWidth: `${width}px`,
                                        }}
                                    />
                                ),
                            )}
                        </colgroup>

                        <thead>
                            <tr>

                                {/* CORNER */}

                                <th
                                    className="sticky left-0 top-0 z-50 h-8 border border-slate-300 bg-slate-100"
                                    style={{
                                        width: `${ROW_HEADER_WIDTH}px`,
                                        minWidth: `${ROW_HEADER_WIDTH}px`,
                                        maxWidth: `${ROW_HEADER_WIDTH}px`,
                                    }}
                                />

                                {/* COLUMN HEADERS */}

                                {columnWidths.map(
                                    (
                                        width,
                                        col,
                                    ) => (
                                        <th
                                            key={
                                                col
                                            }
                                            onClick={() =>
                                                handleColumnHeaderClick(
                                                    col,
                                                )
                                            }
                                            className="group sticky top-0 z-40 h-8 select-none border border-slate-300 bg-slate-100 px-2 text-center text-xs font-semibold text-slate-600"
                                            style={{
                                                width: `${width}px`,
                                                minWidth: `${width}px`,
                                                maxWidth: `${width}px`,
                                            }}
                                        >
                                            <div className="relative flex h-full w-full items-center justify-center">

                                                {
                                                    columnName(
                                                        col,
                                                    )
                                                }

                                                <div
                                                    onMouseDown={(
                                                        event,
                                                    ) =>
                                                        startColumnResize(
                                                            event,
                                                            col,
                                                        )
                                                    }
                                                    onClick={(
                                                        event,
                                                    ) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                    }}
                                                    className="absolute right-[-4px] top-0 z-[60] h-full w-[8px] cursor-col-resize"
                                                    title="Resize column"
                                                />
                                            </div>
                                        </th>
                                    ),
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map(
                                (
                                    rowData,
                                    row,
                                ) => (
                                    <tr
                                        key={
                                            row
                                        }
                                        style={{
                                            height:
                                                `${rowHeights[row] ?? DEFAULT_ROW_HEIGHT}px`,
                                        }}
                                    >

                                        {/* ROW HEADER */}

                                        <th
                                            onClick={() =>
                                                handleRowHeaderClick(
                                                    row,
                                                )
                                            }
                                            className="group sticky left-0 z-30 cursor-pointer select-none border border-slate-300 bg-slate-100 text-center text-xs font-medium text-slate-500"
                                            style={{
                                                width: `${ROW_HEADER_WIDTH}px`,
                                                minWidth: `${ROW_HEADER_WIDTH}px`,
                                                maxWidth: `${ROW_HEADER_WIDTH}px`,
                                                height: `${rowHeights[row] ?? DEFAULT_ROW_HEIGHT}px`,
                                            }}
                                        >
                                            <div className="relative flex h-full items-center justify-center">

                                                {
                                                    row +
                                                    1
                                                }

                                                <div
                                                    onMouseDown={(
                                                        event,
                                                    ) =>
                                                        startRowResize(
                                                            event,
                                                            row,
                                                        )
                                                    }
                                                    onClick={(
                                                        event,
                                                    ) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                    }}
                                                    className="absolute bottom-[-4px] left-0 z-[60] h-[8px] w-full cursor-row-resize"
                                                    title="Resize row"
                                                />
                                            </div>
                                        </th>

                                        {rowData.map(
                                            (
                                                cell,
                                                col,
                                            ) => {
                                                const position =
                                                    {
                                                        row,
                                                        col,
                                                    };

                                                const selected =
                                                    isSameCell(
                                                        selectedCell,
                                                        position,
                                                    );

                                                const inRange =
                                                    isCellInRange(
                                                        position,
                                                        selectionRange,
                                                    );

                                                const editing =
                                                    isSameCell(
                                                        editingCell,
                                                        position,
                                                    );

                                                const merge =
                                                    getMergeForCell(
                                                        row,
                                                        col,
                                                    );

                                                const mergeStart =
                                                    isMergeStart(
                                                        row,
                                                        col,
                                                    );

                                                const hiddenByMerge =
                                                    isInsideMergeButNotStart(
                                                        row,
                                                        col,
                                                    );

                                                if (
                                                    hiddenByMerge
                                                ) {
                                                    return null;
                                                }

                                                const rowSpan =
                                                    mergeStart &&
                                                    merge
                                                        ? merge.endRow -
                                                          merge.startRow +
                                                          1
                                                        : undefined;

                                                const colSpan =
                                                    mergeStart &&
                                                    merge
                                                        ? merge.endColumn -
                                                          merge.startColumn +
                                                          1
                                                        : undefined;

                                                const mergedWidth =
                                                    mergeStart &&
                                                    merge
                                                        ? columnWidths
                                                              .slice(
                                                                  merge.startColumn,
                                                                  merge.endColumn +
                                                                      1,
                                                              )
                                                              .reduce(
                                                                  (
                                                                      total,
                                                                      width,
                                                                  ) =>
                                                                      total +
                                                                      width,
                                                                  0,
                                                              )
                                                        : undefined;

                                                return (
                                                    <td
                                                        key={
                                                            col
                                                        }
                                                        rowSpan={
                                                            rowSpan
                                                        }
                                                        colSpan={
                                                            colSpan
                                                        }
                                                        onMouseDown={(
                                                            event,
                                                        ) =>
                                                            handleCellMouseDown(
                                                                event,
                                                                row,
                                                                col,
                                                            )
                                                        }
                                                        onDoubleClick={() =>
                                                            handleCellDoubleClick(
                                                                row,
                                                                col,
                                                            )
                                                        }
                                                        className={[
                                                            'relative cursor-cell select-none p-0',

                                                            inRange
                                                                ? 'bg-blue-50'
                                                                : '',

                                                            selected
                                                                ? 'z-10 outline outline-2 outline-blue-500'
                                                                : '',
                                                        ].join(
                                                            ' ',
                                                        )}
                                                        style={{
                                                            width:
                                                                mergedWidth ??
                                                                columnWidths[
                                                                    col
                                                                ],

                                                            minWidth:
                                                                mergedWidth ??
                                                                columnWidths[
                                                                    col
                                                                ],

                                                            maxWidth:
                                                                mergedWidth ??
                                                                columnWidths[
                                                                    col
                                                                ],

                                                            height:
                                                                rowHeights[
                                                                    row
                                                                ],

                                                            backgroundColor:
                                                                cell.backgroundColor ||
                                                                '#ffffff',

                                                            color:
                                                                cell.color ||
                                                                '#1e293b',

                                                            fontFamily:
                                                                cell.fontFamily ||
                                                                'Calibri',

                                                            fontSize:
                                                                cell.fontSize ||
                                                                11,

                                                            fontWeight:
                                                                cell.bold
                                                                    ? 700
                                                                    : 400,

                                                            fontStyle:
                                                                cell.italic
                                                                    ? 'italic'
                                                                    : 'normal',

                                                            textDecoration:
                                                                cell.underline
                                                                    ? 'underline'
                                                                    : 'none',

                                                            textAlign:
                                                                cell.horizontalAlign ||
                                                                'left',

                                                            verticalAlign:
                                                                cell.verticalAlign ||
                                                                'middle',

                                                            borderTop:
                                                                cell.border
                                                                    ?.top ||
                                                                '1px solid #cbd5e1',

                                                            borderRight:
                                                                cell.border
                                                                    ?.right ||
                                                                '1px solid #cbd5e1',

                                                            borderBottom:
                                                                cell.border
                                                                    ?.bottom ||
                                                                '1px solid #cbd5e1',

                                                            borderLeft:
                                                                cell.border
                                                                    ?.left ||
                                                                '1px solid #cbd5e1',
                                                        }}
                                                    >
                                                        {editing ? (
                                                            <input
                                                                ref={
                                                                    inputRef
                                                                }
                                                                autoFocus
                                                                value={
                                                                    editingValue
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setEditingValue(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                onBlur={() =>
                                                                    commitEditing()
                                                                }
                                                                onKeyDown={(
                                                                    event,
                                                                ) => {
                                                                    if (
                                                                        event.key ===
                                                                        'Enter'
                                                                    ) {
                                                                        event.preventDefault();

                                                                        commitEditing(
                                                                            'down',
                                                                        );
                                                                    }

                                                                    if (
                                                                        event.key ===
                                                                        'Tab'
                                                                    ) {
                                                                        event.preventDefault();

                                                                        commitEditing(
                                                                            'right',
                                                                        );
                                                                    }

                                                                    if (
                                                                        event.key ===
                                                                        'Escape'
                                                                    ) {
                                                                        event.preventDefault();

                                                                        cancelEditing();
                                                                    }
                                                                }}
                                                                className="absolute inset-0 z-20 h-full w-full border-0 px-2 outline-none"
                                                                style={{
                                                                    fontFamily:
                                                                        cell.fontFamily ||
                                                                        'Calibri',

                                                                    fontSize:
                                                                        cell.fontSize ||
                                                                        11,

                                                                    fontWeight:
                                                                        cell.bold
                                                                            ? 700
                                                                            : 400,

                                                                    fontStyle:
                                                                        cell.italic
                                                                            ? 'italic'
                                                                            : 'normal',

                                                                    textDecoration:
                                                                        cell.underline
                                                                            ? 'underline'
                                                                            : 'none',

                                                                    color:
                                                                        cell.color ||
                                                                        '#1e293b',

                                                                    backgroundColor:
                                                                        cell.backgroundColor ||
                                                                        '#ffffff',

                                                                    textAlign:
                                                                        cell.horizontalAlign ||
                                                                        'left',
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="flex h-full w-full"
                                                                style={{
                                                                    minWidth:
                                                                        mergedWidth ??
                                                                        columnWidths[
                                                                            col
                                                                        ],

                                                                    alignItems:
                                                                        cell.verticalAlign ===
                                                                        'top'
                                                                            ? 'flex-start'
                                                                            : cell.verticalAlign ===
                                                                                'bottom'
                                                                              ? 'flex-end'
                                                                              : 'center',

                                                                    justifyContent:
                                                                        cell.horizontalAlign ===
                                                                        'right'
                                                                            ? 'flex-end'
                                                                            : cell.horizontalAlign ===
                                                                                'center'
                                                                              ? 'center'
                                                                              : 'flex-start',

                                                                    overflow:
                                                                        cell.wrapText
                                                                            ? 'visible'
                                                                            : 'hidden',

                                                                    whiteSpace:
                                                                        cell.wrapText
                                                                            ? 'normal'
                                                                            : 'nowrap',

                                                                    overflowWrap:
                                                                        cell.wrapText
                                                                            ? 'break-word'
                                                                            : 'normal',

                                                                    wordBreak:
                                                                        cell.wrapText
                                                                            ? 'break-word'
                                                                            : 'normal',

                                                                    padding:
                                                                        '4px 8px',
                                                                }}
                                                            >
                                                                {
                                                                    cell.value
                                                                }
                                                            </div>
                                                        )}

                                                        {selected &&
                                                            !editing && (
                                                                <div className="pointer-events-none absolute -bottom-[2px] -right-[2px] z-30 h-1.5 w-1.5 bg-blue-600" />
                                                            )}
                                                    </td>
                                                );
                                            },
                                        )}
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>

                    {/*
                    |--------------------------------------------------------------------------
                    | EXCEL IMAGE LAYER
                    |--------------------------------------------------------------------------
                    |
                    | Images are rendered AFTER the table.
                    |
                    | pointerEvents = none means the image does not prevent
                    | selecting/editing cells underneath it.
                    |--------------------------------------------------------------------------
                    */}

                    {images.length > 0 && (
                        <div
                            className="pointer-events-none absolute left-0 top-0 z-[35]"
                            style={{
                                width:
                                    `${tableWidth}px`,

                                height:
                                    `${tableHeight}px`,
                            }}
                        >
                            {images.map(
                                (
                                    image,
                                    index,
                                ) => {
                                    const position =
                                        getImagePosition(
                                            image,
                                        );

                                    return (
                                        <img
                                            key={
                                                image.id ||
                                                `excel-image-${index}`
                                            }
                                            src={
                                                image.src
                                            }
                                            alt=""
                                            draggable={
                                                false
                                            }
                                            className="absolute block object-contain"
                                            style={{
                                                left:
                                                    `${position.left}px`,

                                                top:
                                                    `${position.top}px`,

                                                width:
                                                    `${image.width}px`,

                                                height:
                                                    `${image.height}px`,

                                                maxWidth:
                                                    'none',

                                                maxHeight:
                                                    'none',

                                                objectFit:
                                                    'contain',
                                            }}
                                        />
                                    );
                                },
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* STATUS BAR */}

            <div className="flex h-7 shrink-0 items-center border-t border-slate-300 bg-slate-50 px-3 text-[10px] text-slate-500">
                <span>
                    {selectionRange
                        ? 'Range selected'
                        : 'Ready'}
                </span>

                <span className="ml-4">
                    {images.length}{' '}
                    image
                    {images.length ===
                    1
                        ? ''
                        : 's'}
                </span>

                <span className="ml-auto">
                    {rows.length} rows ×{' '}
                    {columnWidths.length}{' '}
                    columns
                </span>
            </div>
        </div>
    );
}