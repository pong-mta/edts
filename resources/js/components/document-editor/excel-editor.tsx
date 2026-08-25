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
};

type CellPosition = {
    row: number;
    col: number;
};

type CellRange = {
    start: CellPosition;
    end: CellPosition;
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

const createEmptyRows = (): Cell[][] =>
    Array.from(
        { length: DEFAULT_ROWS },
        () =>
            Array.from(
                { length: DEFAULT_COLUMNS },
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
        })),
    );

const normalizePosition = (
    position: CellPosition,
): CellPosition => ({
    row: Math.max(
        0,
        Math.min(
            position.row,
            DEFAULT_ROWS - 1,
        ),
    ),

    col: Math.max(
        0,
        Math.min(
            position.col,
            DEFAULT_COLUMNS - 1,
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

    const [selectedCell, setSelectedCell] =
        useState<CellPosition>({
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
    | LOAD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!content) {
            setRows(createEmptyRows());

            setColumnWidths(
                createDefaultColumnWidths(),
            );

            setRowHeights(
                createDefaultRowHeights(),
            );

            return;
        }

        try {
            const parsed =
                JSON.parse(content);

            /*
             * New spreadsheet structure
             */

            if (
                parsed &&
                typeof parsed ===
                    'object' &&
                !Array.isArray(parsed) &&
                Array.isArray(
                    parsed.rows,
                )
            ) {
                const normalized =
                    createEmptyRows();

                parsed.rows.forEach(
                    (
                        row: Cell[],
                        rowIndex: number,
                    ) => {
                        if (
                            rowIndex >=
                            DEFAULT_ROWS
                        ) {
                            return;
                        }

                        if (
                            !Array.isArray(
                                row,
                            )
                        ) {
                            return;
                        }

                        row.forEach(
                            (
                                cell: Cell,
                                colIndex: number,
                            ) => {
                                if (
                                    colIndex >=
                                    DEFAULT_COLUMNS
                                ) {
                                    return;
                                }

                                normalized[
                                    rowIndex
                                ][colIndex] = {
                                    value:
                                        cell?.value ??
                                        '',
                                };
                            },
                        );
                    },
                );

                setRows(normalized);

                /*
                 * Column widths
                 */

                const widths =
                    createDefaultColumnWidths();

                if (
                    Array.isArray(
                        parsed.columnWidths,
                    )
                ) {
                    parsed.columnWidths.forEach(
                        (
                            width: number,
                            index: number,
                        ) => {
                            if (
                                index >=
                                DEFAULT_COLUMNS
                            ) {
                                return;
                            }

                            if (
                                Number.isFinite(
                                    width,
                                )
                            ) {
                                widths[
                                    index
                                ] = Math.max(
                                    MIN_COLUMN_WIDTH,
                                    Math.min(
                                        MAX_COLUMN_WIDTH,
                                        width,
                                    ),
                                );
                            }
                        },
                    );
                }

                setColumnWidths(
                    widths,
                );

                /*
                 * Row heights
                 */

                const heights =
                    createDefaultRowHeights();

                if (
                    Array.isArray(
                        parsed.rowHeights,
                    )
                ) {
                    parsed.rowHeights.forEach(
                        (
                            height: number,
                            index: number,
                        ) => {
                            if (
                                index >=
                                DEFAULT_ROWS
                            ) {
                                return;
                            }

                            if (
                                Number.isFinite(
                                    height,
                                )
                            ) {
                                heights[
                                    index
                                ] = Math.max(
                                    MIN_ROW_HEIGHT,
                                    Math.min(
                                        MAX_ROW_HEIGHT,
                                        height,
                                    ),
                                );
                            }
                        },
                    );
                }

                setRowHeights(
                    heights,
                );

                return;
            }

            /*
             * Backward compatibility
             * with previous array format.
             */

            if (
                Array.isArray(parsed)
            ) {
                const normalized =
                    createEmptyRows();

                parsed.forEach(
                    (
                        row: Cell[],
                        rowIndex: number,
                    ) => {
                        if (
                            rowIndex >=
                            DEFAULT_ROWS
                        ) {
                            return;
                        }

                        if (
                            !Array.isArray(
                                row,
                            )
                        ) {
                            return;
                        }

                        row.forEach(
                            (
                                cell: Cell,
                                colIndex: number,
                            ) => {
                                if (
                                    colIndex >=
                                    DEFAULT_COLUMNS
                                ) {
                                    return;
                                }

                                normalized[
                                    rowIndex
                                ][colIndex] = {
                                    value:
                                        cell?.value ??
                                        '',
                                };
                            },
                        );
                    },
                );

                setRows(normalized);
            }
        } catch {
            setRows(
                createEmptyRows(),
            );

            setColumnWidths(
                createDefaultColumnWidths(),
            );

            setRowHeights(
                createDefaultRowHeights(),
            );
        }
    }, [content]);

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    const emitSpreadsheet = (
        nextRows: Cell[][],
        nextWidths: number[],
        nextHeights: number[],
    ) => {
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
    | SELECTION
    |--------------------------------------------------------------------------
    */

    const selectCell = (
        position: CellPosition,
        extend = false,
    ) => {
        const normalized =
            normalizePosition(
                position,
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
    | EDITING
    |--------------------------------------------------------------------------
    */

    const beginEditing = (
        position: CellPosition,
        initialValue?: string,
    ) => {
        const normalized =
            normalizePosition(
                position,
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

        setEditingValue(value);

        requestAnimationFrame(() => {
            inputRef.current?.focus();

            inputRef.current?.setSelectionRange(
                inputRef.current.value.length,
                inputRef.current.value.length,
            );
        });
    };

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
        ][editingCell.col].value =
            editingValue;

        setRows(nextRows);

        emitSpreadsheet(
            nextRows,
            columnWidths,
            rowHeights,
        );

        const current =
            editingCell;

        setEditingCell(null);

        if (move === 'down') {
            selectCell({
                row: Math.min(
                    current.row + 1,
                    DEFAULT_ROWS - 1,
                ),
                col: current.col,
            });
        }

        if (move === 'right') {
            selectCell({
                row: current.row,
                col: Math.min(
                    current.col + 1,
                    DEFAULT_COLUMNS - 1,
                ),
            });
        }
    };

    const cancelEditing = () => {
        setEditingCell(null);

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

        emitSpreadsheet(
            nextRows,
            columnWidths,
            rowHeights,
        );

        if (
            isSameCell(
                selectedCell,
                {
                    row,
                    col,
                },
            )
        ) {
            setFormulaValue(value);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | CLEAR CELLS
    |--------------------------------------------------------------------------
    */

    const clearSelectedCells = () => {
        const range =
            getActiveRange();

        const nextRows =
            cloneRows(rows);

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
                nextRows[row][col].value =
                    '';
            }
        }

        setRows(nextRows);

        emitSpreadsheet(
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

        const text =
            Array.from(
                {
                    length:
                        maxRow -
                        minRow +
                        1,
                },
                (_, rowOffset) =>
                    Array.from(
                        {
                            length:
                                maxCol -
                                minCol +
                                1,
                        },
                        (_, colOffset) =>
                            rows[
                                minRow +
                                    rowOffset
                            ][
                                minCol +
                                    colOffset
                            ].value,
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
                    DEFAULT_ROWS
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
                            DEFAULT_COLUMNS
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

        emitSpreadsheet(
            nextRows,
            columnWidths,
            rowHeights,
        );

        const pastedRows =
            pasted.length;

        const pastedColumns =
            pasted.reduce(
                (max, row) =>
                    Math.max(
                        max,
                        row.length,
                    ),
                1,
            );

        setSelectionRange({
            start: selectedCell,
            end: {
                row: Math.min(
                    selectedCell.row +
                        pastedRows -
                        1,
                    DEFAULT_ROWS - 1,
                ),

                col: Math.min(
                    selectedCell.col +
                        pastedColumns -
                        1,
                    DEFAULT_COLUMNS - 1,
                ),
            },
        });
    };

    /*
    |--------------------------------------------------------------------------
    | COLUMN RESIZE
    |--------------------------------------------------------------------------
    */

    const startColumnResize = (
        event: MouseEvent,
        col: number,
    ) => {
        event.preventDefault();
        event.stopPropagation();

        setResizingColumn(col);
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
    | ROW RESIZE
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
    | RESIZE HANDLERS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (
            resizingColumn === null
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

        const handleMouseUp = () => {
            setColumnWidths(
                (current) => {
                    const next = [
                        ...current,
                    ];

                    emitSpreadsheet(
                        rows,
                        next,
                        rowHeights,
                    );

                    return next;
                },
            );

            setResizingColumn(null);
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
    ]);

    useEffect(() => {
        if (
            resizingRow === null
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

                    next[resizingRow] =
                        nextHeight;

                    return next;
                },
            );
        };

        const handleMouseUp = () => {
            setRowHeights(
                (current) => {
                    const next = [
                        ...current,
                    ];

                    emitSpreadsheet(
                        rows,
                        columnWidths,
                        next,
                    );

                    return next;
                },
            );

            setResizingRow(null);
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

        /*
        |--------------------------------------------------------------------------
        | SELECT ALL
        |--------------------------------------------------------------------------
        */

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
                        DEFAULT_ROWS - 1,
                    col:
                        DEFAULT_COLUMNS - 1,
                },
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | DELETE
        |--------------------------------------------------------------------------
        */

        if (
            key === 'Delete' ||
            key === 'Backspace'
        ) {
            event.preventDefault();

            clearSelectedCells();

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | ENTER
        |--------------------------------------------------------------------------
        */

        if (key === 'Enter') {
            event.preventDefault();

            beginEditing(
                selectedCell,
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | F2
        |--------------------------------------------------------------------------
        */

        if (key === 'F2') {
            event.preventDefault();

            beginEditing(
                selectedCell,
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | TAB
        |--------------------------------------------------------------------------
        */

        if (key === 'Tab') {
            event.preventDefault();

            selectCell({
                row: selectedCell.row,

                col: shiftKey
                    ? Math.max(
                          selectedCell.col -
                              1,
                          0,
                      )
                    : Math.min(
                          selectedCell.col +
                              1,
                          DEFAULT_COLUMNS -
                              1,
                      ),
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | ARROWS
        |--------------------------------------------------------------------------
        */

        let nextPosition:
            | CellPosition
            | null = null;

        if (key === 'ArrowUp') {
            nextPosition = {
                row:
                    selectedCell.row -
                    1,
                col:
                    selectedCell.col,
            };
        }

        if (key === 'ArrowDown') {
            nextPosition = {
                row:
                    selectedCell.row +
                    1,
                col:
                    selectedCell.col,
            };
        }

        if (key === 'ArrowLeft') {
            nextPosition = {
                row:
                    selectedCell.row,
                col:
                    selectedCell.col -
                    1,
            };
        }

        if (key === 'ArrowRight') {
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
        setFormulaValue(value);

        updateCell(
            selectedCell.row,
            selectedCell.col,
            value,
        );
    };

    /*
    |--------------------------------------------------------------------------
    | CELL MOUSE
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
            rows[row]?.[col]?.value ??
                '',
        );
    };

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

    const handleColumnHeaderClick = (
        col: number,
    ) => {
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
                    DEFAULT_ROWS - 1,
                col,
            },
        });
    };

    /*
    |--------------------------------------------------------------------------
    | ROW HEADER
    |--------------------------------------------------------------------------
    */

    const handleRowHeaderClick = (
        row: number,
    ) => {
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
                    DEFAULT_COLUMNS - 1,
            },
        });
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
                )}${selectedCell.row + 1}`,
            [selectedCell],
        );

    /*
    |--------------------------------------------------------------------------
    | FOCUS
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
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
            {/* ============================================================
                FORMULA BAR
            ============================================================ */}

            <div className="flex h-11 shrink-0 items-center border-b border-slate-300 bg-slate-50">
                <div className="flex h-full w-20 shrink-0 items-center justify-center border-r border-slate-300 bg-white text-xs font-semibold text-slate-600">
                    {currentCellAddress}
                </div>

                <div className="flex h-full w-10 shrink-0 items-center justify-center border-r border-slate-300 text-sm font-semibold text-slate-500">
                    fx
                </div>

                <input
                    value={formulaValue}
                    onChange={(event) =>
                        handleFormulaBarChange(
                            event.target.value,
                        )
                    }
                    className="h-full min-w-0 flex-1 border-0 bg-white px-3 text-sm text-slate-800 outline-none"
                />
            </div>

            {/* ============================================================
                GRID
            ============================================================ */}

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
                <table
                    className="border-collapse text-sm"
                    style={{
                        tableLayout:
                            'fixed',
                    }}
                >
                    <colgroup>
                        <col
                            style={{
                                width: 48,
                            }}
                        />

                        {Array.from(
                            {
                                length:
                                    DEFAULT_COLUMNS,
                            },
                            (_, col) => (
                                <col
                                    key={col}
                                    style={{
                                        width:
                                            columnWidths[
                                                col
                                            ] ??
                                            DEFAULT_COLUMN_WIDTH,
                                    }}
                                />
                            ),
                        )}
                    </colgroup>

                    <thead>
                        <tr>
                            <th className="sticky left-0 top-0 z-40 h-8 w-12 border border-slate-300 bg-slate-100" />

                            {Array.from(
                                {
                                    length:
                                        DEFAULT_COLUMNS,
                                },
                                (_, col) => (
                                    <th
                                        key={col}
                                        onClick={() =>
                                            handleColumnHeaderClick(
                                                col,
                                            )
                                        }
                                        className="group sticky top-0 z-30 h-8 select-none border border-slate-300 bg-slate-100 px-2 text-center text-xs font-semibold text-slate-600"
                                    >
                                        <div className="relative flex h-full items-center justify-center">
                                            {columnName(
                                                col,
                                            )}

                                            {/* COLUMN RESIZE HANDLE */}

                                            <div
                                                onMouseDown={(
                                                    event,
                                                ) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();

                                                    startColumnResize(
                                                        event,
                                                        col,
                                                    );
                                                }}
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
                                    key={row}
                                    style={{
                                        height:
                                            rowHeights[
                                                row
                                            ] ??
                                            DEFAULT_ROW_HEIGHT,
                                    }}
                                >
                                    {/* ROW HEADER */}

                                    <th
                                        onClick={() =>
                                            handleRowHeaderClick(
                                                row,
                                            )
                                        }
                                        className="group sticky left-0 z-20 cursor-pointer select-none border border-slate-300 bg-slate-100 text-center text-xs font-medium text-slate-500"
                                    >
                                        <div className="relative flex h-full items-center justify-center">
                                            {row + 1}

                                            {/* ROW RESIZE HANDLE */}

                                            <div
                                                onMouseDown={(
                                                    event,
                                                ) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();

                                                    startRowResize(
                                                        event,
                                                        row,
                                                    );
                                                }}
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

                                            return (
                                                <td
                                                    key={
                                                        col
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
                                                        'relative min-w-0 border border-slate-300 bg-white p-0 align-middle',
                                                        'cursor-cell select-none',
                                                        inRange
                                                            ? 'bg-blue-50'
                                                            : '',
                                                        selected
                                                            ? 'z-10 outline outline-2 outline-blue-500'
                                                            : '',
                                                    ].join(
                                                        ' ',
                                                    )}
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
                                                            className="absolute inset-0 z-20 h-full w-full border-0 bg-white px-2 text-sm text-slate-800 outline-none"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full min-h-0 w-full min-w-0 items-center overflow-hidden whitespace-nowrap px-2 text-sm text-slate-800">
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
            </div>

            {/* ============================================================
                STATUS BAR
            ============================================================ */}

            <div className="flex h-7 shrink-0 items-center border-t border-slate-300 bg-slate-50 px-3 text-[10px] text-slate-500">
                <span>
                    {selectionRange
                        ? 'Range selected'
                        : 'Ready'}
                </span>

                <span className="ml-auto">
                    {DEFAULT_ROWS} rows ×{' '}
                    {DEFAULT_COLUMNS}{' '}
                    columns
                </span>
            </div>
        </div>
    );
}