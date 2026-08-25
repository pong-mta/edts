import React, {
    ClipboardEvent,
    KeyboardEvent,
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
const ROW_HEIGHT = 28;

const createEmptyRows = (): Cell[][] => {
    return Array.from(
        { length: DEFAULT_ROWS },
        () =>
            Array.from(
                { length: DEFAULT_COLUMNS },
                () => ({
                    value: '',
                }),
            ),
    );
};

const cloneRows = (rows: Cell[][]): Cell[][] => {
    return rows.map((row) =>
        row.map((cell) => ({
            ...cell,
        })),
    );
};

const normalizePosition = (
    position: CellPosition,
): CellPosition => {
    return {
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
    };
};

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

const columnName = (index: number) => {
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
): string[][] => {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map((row) => row.split('\t'));
};

export default function ExcelEditor({
    content,
    onChange,
}: ExcelEditorProps) {
    const [rows, setRows] =
        useState<Cell[][]>(
            createEmptyRows,
        );

    const [selectedCell, setSelectedCell] =
        useState<CellPosition>({
            row: 0,
            col: 0,
        });

    const [selectionRange, setSelectionRange] =
        useState<CellRange | null>(null);

    const [editingCell, setEditingCell] =
        useState<CellPosition | null>(null);

    const [editingValue, setEditingValue] =
        useState('');

    const [formulaValue, setFormulaValue] =
        useState('');

    const inputRef =
        useRef<HTMLInputElement>(null);

    const gridRef =
        useRef<HTMLDivElement>(null);

    const skipInitialContent =
        useRef(false);

    /*
    |--------------------------------------------------------------------------
    | LOAD SAVED CONTENT
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!content) {
            setRows(createEmptyRows());
            return;
        }

        try {
            const parsed =
                JSON.parse(content);

            if (
                Array.isArray(parsed) &&
                parsed.length > 0
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
            setRows(createEmptyRows());
        }
    }, [content]);

    /*
    |--------------------------------------------------------------------------
    | SERIALIZE
    |--------------------------------------------------------------------------
    */

    const emitRows = (
        nextRows: Cell[][],
    ) => {
        onChange(
            JSON.stringify(nextRows),
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
            setSelectionRange(null);
        }

        setEditingCell(null);
        setEditingValue(
            rows[normalized.row]?.[
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
            rows[normalized.row]?.[
                normalized.col
            ]?.value ??
            '';

        setSelectedCell(
            normalized,
        );

        setSelectionRange(null);

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
        move: 'none' | 'down' | 'right' = 'none',
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
        emitRows(nextRows);

        const current =
            editingCell;

        setEditingCell(null);

        if (move === 'down') {
            selectCell({
                row:
                    Math.min(
                        current.row + 1,
                        DEFAULT_ROWS - 1,
                    ),
                col: current.col,
            });
        }

        if (move === 'right') {
            selectCell({
                row: current.row,
                col:
                    Math.min(
                        current.col + 1,
                        DEFAULT_COLUMNS - 1,
                    ),
            });
        }
    };

    const cancelEditing = () => {
        setEditingCell(null);

        setEditingValue(
            rows[selectedCell.row]?.[
                selectedCell.col
            ]?.value ?? '',
        );
    };

    /*
    |--------------------------------------------------------------------------
    | CELL UPDATE
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
        emitRows(nextRows);

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
    | DELETE SELECTED CELLS
    |--------------------------------------------------------------------------
    */

    const clearSelectedCells = () => {
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
                nextRows[row][col].value =
                    '';
            }
        }

        setRows(nextRows);
        emitRows(nextRows);

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
        emitRows(nextRows);

        setSelectionRange({
            start: selectedCell,
            end: {
                row:
                    Math.min(
                        selectedCell.row +
                            pasted.length -
                            1,
                        DEFAULT_ROWS - 1,
                    ),
                col:
                    Math.min(
                        selectedCell.col +
                            Math.max(
                                ...pasted.map(
                                    (row) =>
                                        row.length,
                                ),
                            ) -
                            1,
                        DEFAULT_COLUMNS - 1,
                    ),
            },
        });
    };

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

        if (
            editingCell
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | CTRL/CMD + A
        |--------------------------------------------------------------------------
        */

        if (
            commandKey &&
            key.toLowerCase() === 'a'
        ) {
            event.preventDefault();

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

            setSelectedCell({
                row: 0,
                col: 0,
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
        | ARROW KEYS
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
    | TYPING DIRECTLY INTO SELECTED CELL
    |--------------------------------------------------------------------------
    */

    const handleGridKeyPress = (
        event: KeyboardEvent<HTMLDivElement>,
    ) => {
        if (
            editingCell
        ) {
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
    | CELL SELECTION
    |--------------------------------------------------------------------------
    */

    const handleCellMouseDown = (
        event: React.MouseEvent,
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
    | COLUMN / ROW HEADERS
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
        useMemo(() => {
            return `${columnName(
                selectedCell.col,
            )}${selectedCell.row + 1}`;
        }, [selectedCell]);

    /*
    |--------------------------------------------------------------------------
    | FOCUS GRID
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!editingCell) {
            gridRef.current?.focus();
        }
    }, [selectedCell, editingCell]);

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="flex w-full flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
            {/* ============================================================
                FORMULA BAR
            ============================================================ */}

            <div className="flex h-11 items-center border-b border-slate-300 bg-slate-50">
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
                    placeholder=""
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
                                            DEFAULT_COLUMN_WIDTH,
                                    }}
                                />
                            ),
                        )}
                    </colgroup>

                    <thead>
                        <tr>
                            {/* Corner */}

                            <th
                                className="sticky left-0 top-0 z-40 h-8 w-12 border border-slate-300 bg-slate-100"
                            />

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
                                        className={`sticky top-0 z-30 h-8 cursor-pointer select-none border border-slate-300 px-2 text-center text-xs font-semibold ${
                                            isCellInRange(
                                                {
                                                    row: 0,
                                                    col,
                                                },
                                                selectionRange,
                                            )
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {columnName(
                                            col,
                                        )}
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
                                            ROW_HEIGHT,
                                    }}
                                >
                                    {/* Row number */}

                                    <th
                                        onClick={() =>
                                            handleRowHeaderClick(
                                                row,
                                            )
                                        }
                                        className={`sticky left-0 z-20 h-7 w-12 cursor-pointer select-none border border-slate-300 text-center text-xs font-medium ${
                                            isCellInRange(
                                                {
                                                    row,
                                                    col: 0,
                                                },
                                                selectionRange,
                                            )
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                    >
                                        {row + 1}
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
                                                        'relative h-7 min-w-[100px] border border-slate-300 bg-white p-0 align-middle',
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
                                                        <div className="flex h-full min-h-7 w-full items-center overflow-hidden whitespace-nowrap px-2 text-sm text-slate-800">
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

            <div className="flex h-7 items-center border-t border-slate-300 bg-slate-50 px-3 text-[10px] text-slate-500">
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