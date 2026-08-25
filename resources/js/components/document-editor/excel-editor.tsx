import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

type Cell = {
    value: string;
};

const DEFAULT_ROWS = 30;
const DEFAULT_COLUMNS = 15;

interface ExcelEditorProps {
    content: string | null;
    onChange: (content: string) => void;
}

export default function ExcelEditor({
    content,
    onChange,
}: ExcelEditorProps) {
    const [rows, setRows] = useState<
        Cell[][]
    >(() =>
        Array.from(
            { length: DEFAULT_ROWS },
            () =>
                Array.from(
                    { length: DEFAULT_COLUMNS },
                    () => ({
                        value: '',
                    }),
                ),
        ),
    );

    const [selectedCell, setSelectedCell] =
        useState<{
            row: number;
            col: number;
        } | null>(null);

    const inputRef =
        useRef<HTMLInputElement>(null);

    const columnName = (index: number) => {
        let name = '';
        let n = index + 1;

        while (n > 0) {
            const remainder = (n - 1) % 26;

            name =
                String.fromCharCode(
                    65 + remainder,
                ) + name;

            n = Math.floor(
                (n - 1) / 26,
            );
        }

        return name;
    };

    const updateCell = (
        row: number,
        col: number,
        value: string,
    ) => {
        setRows((current) => {
            const next = current.map(
                (rowData) =>
                    rowData.map(
                        (cell) => ({
                            ...cell,
                        }),
                    ),
            );

            next[row][col].value =
                value;

            onChange(
                JSON.stringify(next),
            );

            return next;
        });
    };

    useEffect(() => {
        if (selectedCell) {
            inputRef.current?.focus();
        }
    }, [selectedCell]);

    useEffect(() => {
        if (!content) {
            return;
        }

        try {
            const savedRows =
                JSON.parse(content);

            if (Array.isArray(savedRows)) {
                setRows(savedRows);
            }
        } catch {
            // Ignore invalid or legacy content.
        }
    }, [content]);

    return (
        <div className="w-full overflow-auto rounded-lg border border-slate-300 bg-white">
            <table className="border-collapse text-sm">
                <thead>
                    <tr>
                        <th className="sticky left-0 top-0 z-20 h-8 w-12 min-w-12 border border-slate-300 bg-slate-100" />

                        {Array.from(
                            {
                                length: DEFAULT_COLUMNS,
                            },
                            (_, col) => (
                                <th
                                    key={col}
                                    className="sticky top-0 z-10 h-8 min-w-[100px] border border-slate-300 bg-slate-100 px-2 text-center font-medium text-slate-700"
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
                            <tr key={row}>
                                <th className="sticky left-0 z-10 h-8 w-12 min-w-12 border border-slate-300 bg-slate-100 text-center font-medium text-slate-700">
                                    {row + 1}
                                </th>

                                {rowData.map(
                                    (
                                        cell,
                                        col,
                                    ) => {
                                        const active =
                                            selectedCell?.row ===
                                                row &&
                                            selectedCell?.col ===
                                                col;

                                        return (
                                            <td
                                                key={col}
                                                className={`h-8 min-w-[100px] border border-slate-300 p-0 ${
                                                    active
                                                        ? 'ring-2 ring-blue-500 ring-inset'
                                                        : ''
                                                }`}
                                                onClick={() => {
                                                    setSelectedCell({
                                                        row,
                                                        col,
                                                    });
                                                }}
                                                onDoubleClick={() => {
                                                    inputRef.current?.focus();
                                                }}
                                            >
                                                {active ? (
                                                    <input
                                                        ref={
                                                            inputRef
                                                        }
                                                        value={
                                                            cell.value
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            updateCell(
                                                                row,
                                                                col,
                                                                event
                                                                    .target
                                                                    .value,
                                                            )
                                                        }
                                                        onKeyDown={(event) => {
                                                            if (!selectedCell) {
                                                                return;
                                                            }

                                                            const { row, col } =
                                                                selectedCell;

                                                            if (event.key === 'ArrowDown') {
                                                                event.preventDefault();

                                                                setSelectedCell({
                                                                    row: Math.min(
                                                                        row + 1,
                                                                        rows.length - 1,
                                                                    ),
                                                                    col,
                                                                });
                                                            }

                                                            if (event.key === 'ArrowUp') {
                                                                event.preventDefault();

                                                                setSelectedCell({
                                                                    row: Math.max(row - 1, 0),
                                                                    col,
                                                                });
                                                            }

                                                            if (event.key === 'ArrowRight') {
                                                                event.preventDefault();

                                                                setSelectedCell({
                                                                    row,
                                                                    col: Math.min(
                                                                        col + 1,
                                                                        DEFAULT_COLUMNS - 1,
                                                                    ),
                                                                });
                                                            }

                                                            if (event.key === 'ArrowLeft') {
                                                                event.preventDefault();

                                                                setSelectedCell({
                                                                    row,
                                                                    col: Math.max(
                                                                        col - 1,
                                                                        0,
                                                                    ),
                                                                });
                                                            }

                                                            if (event.key === 'Enter') {
                                                                event.preventDefault();

                                                                setSelectedCell({
                                                                    row: Math.min(
                                                                        row + 1,
                                                                        rows.length - 1,
                                                                    ),
                                                                    col,
                                                                });
                                                            }
                                                        }}
                                                        onBlur={() =>
                                                            setSelectedCell(
                                                                null,
                                                            )
                                                        }
                                                        className="h-full w-full border-0 bg-transparent px-2 outline-none"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full px-2 py-1">
                                                        {
                                                            cell.value
                                                        }
                                                    </div>
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
    );
}