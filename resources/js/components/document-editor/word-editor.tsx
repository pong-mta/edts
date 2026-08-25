import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { FontSize } from '@/components/document-editor/extensions/font-size';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { TableRowHeight } from '@/components/document-editor/extensions/table-row-height';
import { TableCellAlignment } from '@/components/document-editor/extensions/table-cell-alignment';
import { TableHeaderAlignment } from '@/components/document-editor/extensions/table-header-alignment';


import {
    Bold,
    Highlighter,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Redo2,
    Strikethrough,
    Type,
    Underline as UnderlineIcon,
    Undo2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface WordEditorProps {
    content: string;
    onChange: (content: string) => void;
}

const FONT_FAMILIES = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Arial Black', value: 'Arial Black' },
    { label: 'Calibri', value: 'Calibri' },
    { label: 'Cambria', value: 'Cambria' },
    { label: 'Candara', value: 'Candara' },
    { label: 'Century Gothic', value: 'Century Gothic' },
    { label: 'Comic Sans MS', value: 'Comic Sans MS' },
    { label: 'Consolas', value: 'Consolas' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Helvetica', value: 'Helvetica' },
    { label: 'Impact', value: 'Impact' },
    { label: 'Tahoma', value: 'Tahoma' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS' },
    { label: 'Verdana', value: 'Verdana' },
];

const FONT_SIZES = [
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    14,
    16,
    18,
    20,
    22,
    24,
    26,
    28,
    32,
    36,
    40,
    44,
    48,
    54,
    60,
    72,
    80,
    90,
    100,
    110,
    120,
    130,
    140,
    150,
];

export default function WordEditor({
    content,
    onChange,
}: WordEditorProps) {
    const [fontSize, setFontSize] = useState('11');
    const [fontFamily, setFontFamily] =
    useState('Arial');

    const [showTableGrid, setShowTableGrid] =
    useState(false);

    const [tableGridSize, setTableGridSize] =
    useState({
        rows: 0,
        cols: 0,
    });

    const [rowHeight, setRowHeight] =
    useState('15');
    const [borderWidth, setBorderWidth] =
        useState('1');

    const [borderStyle, setBorderStyle] =
        useState('solid');

    const [showCellColorPicker, setShowCellColorPicker] =
    useState(false);
    const [selectedCellColor, setSelectedCellColor] =
    useState('#ffffff');

    const [showBorderColorPicker, setShowBorderColorPicker] =
    useState(false);
    const [selectedBorderColor, setSelectedBorderColor] =
    useState('#000000');

    const [isTableActive, setIsTableActive] =
    useState(false);

    const setCellBorderColor = (
        value: string | null,
    ) => {
        if (!editor) {
            return;
        }

        setSelectedBorderColor(
            value || '#000000',
        );

        const { state } = editor;
        const { $from } = state.selection;

        for (
            let depth = $from.depth;
            depth > 0;
            depth--
        ) {
            const node = $from.node(depth);

            if (
                node.type.name === 'tableCell' ||
                node.type.name === 'tableHeader'
            ) {
                const pos = $from.before(depth);

                const tr = state.tr.setNodeMarkup(
                    pos,
                    undefined,
                    {
                        ...node.attrs,
                        borderColor: value,
                    },
                );

                editor.view.dispatch(tr);

                return;
            }
        }
    };

    const setCellBorderWidth = (
        value: number | null,
    ) => {
        if (!editor || value === null) {
            return;
        }

        if (
            !Number.isFinite(value) ||
            value < 1 ||
            value > 10
        ) {
            return;
        }

        editor
            .chain()
            .focus()
            .updateAttributes('tableCell', {
                borderWidth: value,
            })
            .updateAttributes('tableHeader', {
                borderWidth: value,
            })
            .run();

        setBorderWidth(String(value));
    };

    const setCellBorderStyle = (
        value: string | null,
    ) => {
        if (!editor) {
            return;
        }

        const { state } = editor;
        const { $from } = state.selection;

        for (
            let depth = $from.depth;
            depth > 0;
            depth--
        ) {
            const node = $from.node(depth);

            if (
                node.type.name === 'tableCell' ||
                node.type.name === 'tableHeader'
            ) {
                const pos = $from.before(depth);

                const tr = state.tr.setNodeMarkup(
                    pos,
                    undefined,
                    {
                        ...node.attrs,
                        borderStyle: value,
                    },
                );
                setBorderStyle(value ?? 'solid');
                editor.view.dispatch(tr);

                return;
            }
        }
    };

    

    const setCellBackgroundColor = (
            value: string | null,
        ) => {
            if (!editor) {
                return;
            }
            setSelectedCellColor(
                value || '#ffffff',
            );

            const { state } = editor;
            const { $from } = state.selection;

            for (
                let depth = $from.depth;
                depth > 0;
                depth--
            ) {
                const node = $from.node(depth);

                if (
                    node.type.name === 'tableCell' ||
                    node.type.name === 'tableHeader'
                ) {
                    const pos = $from.before(depth);

                    const tr = state.tr.setNodeMarkup(
                        pos,
                        undefined,
                        {
                            ...node.attrs,
                            backgroundColor: value,
                        },
                    );

                    editor.view.dispatch(tr);

                    return;
                }
            }
        };

 
    

    const editor = useEditor({
        extensions: [
            StarterKit,

            Table.configure({
                resizable: true,
            }),

            TableRowHeight,
            TableHeaderAlignment,
            TableCellAlignment,

            TextStyle,
            FontSize,

            FontFamily.configure({
                types: ['textStyle'],
            }),

            Color.configure({
                types: ['textStyle'],
            }),

            Highlight.configure({
                multicolor: true,
            }),

            Underline,

            TextAlign.configure({
                types: ['heading', 'paragraph'],
                defaultAlignment: 'left',
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            }),

            Image,
        ],

        content:
            content ||
            '<p><span style="font-size: 11pt;">Start writing your document...</span></p>',

        editorProps: {
            attributes: {
                class:
                    'word-document max-w-none min-h-[960px] outline-none',
            },
        },

        onUpdate: ({ editor }) => {
            const html = editor.getHTML();

            console.log(
                'eDTS TABLE HTML:',
                html,
            );

            onChange(html);
        },
    });

    const syncFontSize = () => {
        if (!editor) {
            return;
        }

        const currentFontSize =
            editor.getAttributes('textStyle').fontSize;

        if (currentFontSize) {
            setFontSize(
                String(currentFontSize).replace(
                    'pt',
                    '',
                ),
            );
        } else {
            setFontSize('11');
        }
    };

    const syncFontFamily = () => {
        if (!editor) {
            return;
        }

        const currentFontFamily =
            editor.getAttributes('textStyle').fontFamily;

        if (currentFontFamily) {
            setFontFamily(
                currentFontFamily.replace(
                    /^['"]|['"]$/g,
                    '',
                ),
            );
        } else {
            setFontFamily('Arial');
        }
    };

    const syncRowHeight = () => {
        if (!editor) {
            return;
        }

        if (!editor.isActive('tableRow')) {
            setRowHeight('15');
            return;
        }

        const currentHeight =
            editor.getAttributes('tableRow').height;

        if (
            currentHeight !== null &&
            currentHeight !== undefined
        ) {
            setRowHeight(
                String(currentHeight),
            );
        } else {
            setRowHeight('15');
        }
    };


    useEffect(() => {
        if (!editor) {
            return;
        }

        const handleSelectionUpdate = () => {
            setIsTableActive(
                editor.isActive('tableCell') ||
                editor.isActive('tableHeader'),
            );
            syncFontSize();
            syncFontFamily();
            syncRowHeight();

            const cellAttributes =
                editor.getAttributes('tableCell');

            const headerAttributes =
                editor.getAttributes('tableHeader');

            const attributes =
                Object.keys(cellAttributes).length
                    ? cellAttributes
                    : headerAttributes;

            setSelectedCellColor(
                attributes.backgroundColor ||
                    '#ffffff',
            );

            setSelectedBorderColor(
                attributes.borderColor ||
                    '#000000',
            );

            setBorderWidth(
                attributes.borderWidth
                    ? String(attributes.borderWidth)
                    : '1',
            );

            setBorderStyle(
                attributes.borderStyle ||
                    'solid',
            );
        };
        editor.on(
            'selectionUpdate',
            handleSelectionUpdate,
        );

        syncFontSize();
        syncFontFamily();
        syncRowHeight();

        return () => {
            editor.off(
                'selectionUpdate',
                handleSelectionUpdate,
            );
        };
    }, [editor]);

    

   

    /*
    |--------------------------------------------------------------------------
    | LOAD CONTENT
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!editor) {
            return;
        }

        if (
            content !== editor.getHTML() &&
            content !== ''
        ) {
            editor.commands.setContent(
                content,
                false,
            );
        }
    }, [editor, content]);

    if (!editor) {
        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | LINK
    |--------------------------------------------------------------------------
    */

    const setLink = () => {
        const previousUrl =
            editor.getAttributes('link').href;

        const url = window.prompt(
            'Enter URL',
            previousUrl || 'https://',
        );

        if (url === null) {
            return;
        }

        if (url === '') {
            editor
                .chain()
                .focus()
                .unsetLink()
                .run();

            return;
        }

        editor
            .chain()
            .focus()
            .setLink({
                href: url,
            })
            .run();
    };

    /*
    |--------------------------------------------------------------------------
    | FONT FAMILY
    |--------------------------------------------------------------------------
    */

    const applyFontFamily = (
        value: string,
    ) => {
        if (value === 'default') {
            editor
                .chain()
                .focus()
                .unsetFontFamily()
                .run();

            return;
        }

        setFontFamily(value);

        editor
            .chain()
            .focus()
            .setFontFamily(value)
            .run();
    };

    /*
    |--------------------------------------------------------------------------
    | FONT SIZE
    |--------------------------------------------------------------------------
    */

   const setFontSizeValue = (value: string) => {
        const numericValue = Number(value);

        if (
            !Number.isFinite(numericValue) ||
            numericValue < 5 ||
            numericValue > 150
        ) {
            return;
        }

        setFontSize(value);

        editor
            .chain()
            .focus()
            .setFontSize(`${numericValue}pt`)
            .run();
    };

    /*
    |--------------------------------------------------------------------------
    | TEXT COLOR
    |--------------------------------------------------------------------------
    */

    const setTextColor = (
        value: string,
    ) => {
        editor
            .chain()
            .focus()
            .setColor(value)
            .run();
    };

    /*
    |--------------------------------------------------------------------------
    | HIGHLIGHT
    |--------------------------------------------------------------------------
    */

    const setHighlight = (
        value: string,
    ) => {
        editor
            .chain()
            .focus()
            .toggleHighlight({
                color: value,
            })
            .run();
    };

    const setCellVerticalAlign = (
        value: 'top' | 'middle' | 'bottom',
    ) => {
        if (!editor) {
            return;
        }

        const { state } = editor;
        const { $from } = state.selection;

        for (
            let depth = $from.depth;
            depth > 0;
            depth--
        ) {
            const node = $from.node(depth);

            if (
                node.type.name === 'tableCell' ||
                node.type.name === 'tableHeader'
            ) {
                const pos = $from.before(depth);

                const tr = state.tr.setNodeMarkup(
                    pos,
                    undefined,
                    {
                        ...node.attrs,
                        verticalAlign: value,
                    },
                );

                editor.view.dispatch(tr);

                return;
            }
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            {/* ========================================================== */}
            {/* TOOLBAR */}
            {/* ========================================================== */}

            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">

                {/* ====================================================== */}
                {/* ROW 1 */}
                {/* ====================================================== */}

                <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 p-2">

                    {/* Undo */}

                    <ToolbarButton
                        title="Undo"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .undo()
                                .run()
                        }
                        disabled={
                            !editor
                                .can()
                                .chain()
                                .focus()
                                .undo()
                                .run()
                        }
                    >
                        <Undo2 className="h-4 w-4" />
                    </ToolbarButton>

                    {/* Redo */}

                    <ToolbarButton
                        title="Redo"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .redo()
                                .run()
                        }
                        disabled={
                            !editor
                                .can()
                                .chain()
                                .focus()
                                .redo()
                                .run()
                        }
                    >
                        <Redo2 className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Font */}

                    <div className="flex items-center gap-1">

                        <Type className="ml-1 h-4 w-4 text-slate-500" />

                        <select
                            value={fontFamily}
                            onChange={(event) =>
                                applyFontFamily(
                                    event.target.value,
                                )
                            }
                            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                        >
                            <option value="default">
                                Font
                            </option>

                            {FONT_FAMILIES.map(
                                (font) => (
                                    <option
                                        key={
                                            font.value
                                        }
                                        value={
                                            font.value
                                        }
                                    >
                                        {font.label}
                                    </option>
                                ),
                            )}
                        </select>

                    </div>

                    {/* Font size */}

                    <div className="flex items-center">

                        <input
                            type="number"
                            min="5"
                            max="150"
                            step="1"
                            value={fontSize}
                            onChange={(event) => {
                                setFontSize(event.target.value);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();

                                    setFontSizeValue(
                                        event.currentTarget.value,
                                    );

                                    editor
                                        .chain()
                                        .focus()
                                        .run();
                                }
                            }}
                            onBlur={(event) => {
                                setFontSizeValue(
                                    event.currentTarget.value,
                                );
                            }}
                            className="h-8 w-[58px] rounded-l-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                            title="Font size"
                        />

                        <span className="flex h-8 items-center rounded-r-md border border-l-0 border-slate-200 bg-slate-50 px-2 text-xs text-slate-500">
                            pt
                        </span>

                    </div>

                    <select
                        value={
                            editor.isActive('heading', {
                                level: 1,
                            })
                                ? '1'
                                : editor.isActive('heading', {
                                        level: 2,
                                    })
                                    ? '2'
                                    : editor.isActive('heading', {
                                            level: 3,
                                        })
                                        ? '3'
                                        : editor.isActive('heading', {
                                                level: 4,
                                            })
                                            ? '4'
                                            : editor.isActive('heading', {
                                                    level: 5,
                                                })
                                                ? '5'
                                                : editor.isActive('heading', {
                                                        level: 6,
                                                    })
                                                    ? '6'
                                                    : 'paragraph'
                        }
                        onChange={(event) => {
                            const value = event.target.value;

                            if (value === 'paragraph') {
                                editor
                                    .chain()
                                    .focus()
                                    .setParagraph()
                                    .run();

                                return;
                            }

                            editor
                                .chain()
                                .focus()
                                .setHeading({
                                    level: Number(value) as
                                        1 | 2 | 3 | 4 | 5 | 6,
                                })
                                .run();
                        }}
                        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                        title="Paragraph style"
                    >
                        <option value="paragraph">
                            Normal
                        </option>

                        <option value="1">
                            Heading 1
                        </option>

                        <option value="2">
                            Heading 2
                        </option>

                        <option value="3">
                            Heading 3
                        </option>

                        <option value="4">
                            Heading 4
                        </option>

                        <option value="5">
                            Heading 5
                        </option>

                        <option value="6">
                            Heading 6
                        </option>
                    </select>

                    <ToolbarDivider />

                    {/* Bold */}

                    <ToolbarButton
                        title="Bold"
                        active={editor.isActive(
                            'bold',
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleBold()
                                .run()
                        }
                    >
                        <Bold className="h-4 w-4" />
                    </ToolbarButton>

                    {/* Italic */}

                    <ToolbarButton
                        title="Italic"
                        active={editor.isActive(
                            'italic',
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleItalic()
                                .run()
                        }
                    >
                        <Italic className="h-4 w-4" />
                    </ToolbarButton>

                    {/* Underline */}

                    <ToolbarButton
                        title="Underline"
                        active={editor.isActive(
                            'underline',
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleUnderline()
                                .run()
                        }
                    >
                        <UnderlineIcon className="h-4 w-4" />
                    </ToolbarButton>

                    {/* Strike */}

                    <ToolbarButton
                        title="Strikethrough"
                        active={editor.isActive(
                            'strike',
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleStrike()
                                .run()
                        }
                    >
                        <Strikethrough className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Text color */}

                    <label
                        title="Text color"
                        className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-200"
                    >
                        <span className="text-sm font-bold">
                            A
                        </span>

                        <span className="absolute bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-red-500" />

                        <input
                            type="color"
                            defaultValue="#000000"
                            onChange={(event) =>
                                setTextColor(
                                    event.target.value,
                                )
                            }
                            className="absolute inset-0 cursor-pointer opacity-0"
                        />
                    </label>

                    {/* Highlight */}

                    <label
                        title="Highlight"
                        className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-200"
                    >
                        <Highlighter className="h-4 w-4" />

                        <input
                            type="color"
                            defaultValue="#fff59d"
                            onChange={(event) =>
                                setHighlight(
                                    event.target.value,
                                )
                            }
                            className="absolute inset-0 cursor-pointer opacity-0"
                        />
                    </label>

                </div>

                {/* ====================================================== */}
                {/* ROW 2 */}
                {/* ====================================================== */}

                <div className="flex flex-wrap items-center gap-1 bg-white p-2">

                    {/* Insert table */}

                    <div className="relative">
                        <ToolbarButton
                            title="Insert table"
                            onClick={() =>
                                setShowTableGrid(
                                    !showTableGrid,
                                )
                            }
                        >
                            <span className="text-xs font-bold">
                                ▦
                            </span>
                        </ToolbarButton>

                        {showTableGrid && (
                            <div className="absolute left-0 top-10 z-50 w-[220px] rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
                                <div className="mb-2 text-xs font-semibold text-slate-700">
                                    Insert Table
                                </div>

                                <div className="grid grid-cols-10 gap-1">
                                    {Array.from(
                                        { length: 100 },
                                        (_, index) => {
                                            const row =
                                                Math.floor(index / 10) + 1;

                                            const col =
                                                (index % 10) + 1;

                                            return (
                                                <button
                                                    key={index}
                                                    onMouseEnter={() => {
                                                        setTableGridSize({
                                                            rows: row,
                                                            cols: col,
                                                        });
                                                    }}
                                                    type="button"
                                                    title={`${row} × ${col}`}
                                                    onClick={() => {
                                                        editor
                                                            .chain()
                                                            .focus()
                                                            .insertTable({
                                                                rows: row,
                                                                cols: col,
                                                                withHeaderRow:
                                                                    true,
                                                            })
                                                            .run();

                                                        setShowTableGrid(
                                                            false,
                                                        );
                                                    }}
                                                    className={[
                                                        'h-4 w-4 rounded-sm border transition',
                                                        row <= tableGridSize.rows &&
                                                        col <= tableGridSize.cols
                                                            ? 'border-blue-500 bg-blue-200'
                                                            : 'border-slate-300 bg-white',
                                                    ].join(' ')}
                                                />
                                            );
                                        },
                                    )}
                                </div>

                                <div className="mt-2 text-center text-xs font-medium text-slate-600">
                                    {tableGridSize.rows > 0 &&
                                    tableGridSize.cols > 0
                                        ? `${tableGridSize.rows} × ${tableGridSize.cols}`
                                        : 'Select table size'}
                                </div>
                            </div>
                        )}
                    </div>

                      {isTableActive && (
                        <>
                            <ToolbarDivider />

                            <ToolbarButton
                                title="Add row below"
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .addRowAfter()
                                        .run()
                                }
                            >
                                <span className="text-xs font-bold">
                                    +R
                                </span>
                            </ToolbarButton>

                            <ToolbarButton
                                title="Delete row"
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .deleteRow()
                                        .run()
                                }
                            >
                                <span className="text-xs font-bold">
                                    −R
                                </span>
                            </ToolbarButton>

                            <ToolbarButton
                                title="Add column"
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .addColumnAfter()
                                        .run()
                                }
                            >
                                <span className="text-xs font-bold">
                                    +C
                                </span>
                            </ToolbarButton>

                            <ToolbarButton
                                title="Delete column"
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .deleteColumn()
                                        .run()
                                }
                            >
                                <span className="text-xs font-bold">
                                    −C
                                </span>
                            </ToolbarButton>
                            <ToolbarButton
                                title="Merge cells"
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .mergeCells()
                                        .run()
                                }
                            >
                                <span className="text-xs font-bold">
                                    MC
                                </span>
                            </ToolbarButton>
                            <ToolbarButton
                                title="Split cell"
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .splitCell()
                                        .run()
                                }
                            >
                                <span className="text-xs font-bold">
                                    SC
                                </span>
                            </ToolbarButton>
                            <ToolbarButton
                                title="Align cell top"
                                onClick={() =>
                                    setCellVerticalAlign('top')
                                }
                            >
                                <span className="text-xs font-bold">
                                    ↑
                                </span>
                            </ToolbarButton>

                            <ToolbarButton
                                title="Align cell center"
                                onClick={() =>
                                    setCellVerticalAlign('middle')
                                }
                            >
                                <span className="text-xs font-bold">
                                    ↕
                                </span>
                            </ToolbarButton>

                            <ToolbarButton
                                title="Align cell bottom"
                                onClick={() =>
                                    setCellVerticalAlign('bottom')
                                }
                            >
                                <span className="text-xs font-bold">
                                    ↓
                                </span>
                            </ToolbarButton>

                            <div className="relative">
                                <ToolbarButton
                                    title="Cell background color"
                                    onClick={() =>
                                        setShowCellColorPicker(
                                            !showCellColorPicker,
                                        )
                                    }
                                >
                                    <span className="text-xs font-bold">
                                        🖌
                                    </span>
                                </ToolbarButton>

                                {showCellColorPicker && (
                                    <div className="absolute left-0 top-10 z-50 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
                                        <div className="mb-2 text-xs font-semibold text-slate-700">
                                            Cell Color
                                        </div>

                                        <input
                                            type="color"
                                            value={selectedCellColor}
                                            onChange={(event) => {
                                                setCellBackgroundColor(
                                                    event.target.value,
                                                );
                                            }}
                                            className="block h-12 w-20 cursor-pointer rounded-md border border-slate-300 bg-white p-1"
                                            title="Choose cell color"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCellBackgroundColor(
                                                    null,
                                                );

                                                setShowCellColorPicker(
                                                    false,
                                                );
                                            }}
                                            className="mt-2 block w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                                        >
                                            No Color
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <ToolbarButton
                                    title="Cell border color"
                                    onClick={() =>
                                        setShowBorderColorPicker(
                                            !showBorderColorPicker,
                                        )
                                    }
                                >
                                    <span className="text-xs font-bold">
                                        ▣
                                    </span>
                                </ToolbarButton>

                                {showBorderColorPicker && (
                                    <div className="absolute left-0 top-10 z-50 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
                                        <div className="mb-2 text-xs font-semibold text-slate-700">
                                            Border Color
                                        </div>

                                        <input
                                            type="color"
                                            value={selectedBorderColor}
                                            onChange={(event) => {
                                                setCellBorderColor(
                                                    event.target.value,
                                                );
                                            }}
                                            className="block h-12 w-20 cursor-pointer rounded-md border border-slate-300 bg-white p-1"
                                            title="Choose border color"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCellBorderColor(null);

                                                setShowBorderColorPicker(
                                                    false,
                                                );
                                            }}
                                            className="mt-2 block w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                                        >
                                            Default
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-500">
                                    Border
                                </span>

                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    step="1"
                                    value={borderWidth}
                                    onChange={(event) => {
                                        setBorderWidth(event.target.value);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key !== 'Enter') {
                                            return;
                                        }

                                        event.preventDefault();

                                        const width = Number(
                                            event.currentTarget.value,
                                        );

                                        setCellBorderWidth(width);
                                    }}
                                    onBlur={(event) => {
                                        const width = Number(
                                            event.currentTarget.value,
                                        );

                                        if (
                                            Number.isFinite(width) &&
                                            width >= 1 &&
                                            width <= 10
                                        ) {
                                            setCellBorderWidth(width);
                                        }
                                    }}
                                    className="h-8 w-[58px] rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                                    title="Border width"
                                />

                                <span className="text-[10px] text-slate-500">
                                    px
                                </span>
                            </div>

                            <select
                               value={borderStyle}
                                onChange={(event) => {
                                    setCellBorderStyle(
                                        event.target.value,
                                    );
                                }}
                                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                                title="Border style"
                            >
                                <option value="solid">
                                    Solid
                                </option>

                                <option value="dashed">
                                    Dashed
                                </option>

                                <option value="dotted">
                                    Dotted
                                </option>

                                <option value="double">
                                    Double
                                </option>
                            </select>

                            

                            <ToolbarButton
                                title="Delete table"
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .deleteTable()
                                        .run()
                                }
                            >
                                <span className="text-xs font-bold">
                                    ×T
                                </span>
                            </ToolbarButton>
                        </>
                    )}

                   <ToolbarDivider />

                    {isTableActive && (
                        <>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-500">
                                    Row
                                </span>

                                <input
                                    type="number"
                                    min="8"
                                    max="100"
                                    step="1"
                                    value={rowHeight}
                                    onChange={(event) => {
                                        setRowHeight(
                                            event.target.value,
                                        );
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key !== 'Enter') {
                                            return;
                                        }

                                        event.preventDefault();

                                        const height =
                                            Number(
                                                event.currentTarget
                                                    .value,
                                            );
                                        

                                        if (
                                            !Number.isFinite(
                                                height,
                                            ) ||
                                            height < 8 ||
                                            height > 100
                                        ) {
                                            return;
                                        }

                                        editor
                                            .chain()
                                            .focus()
                                            .updateAttributes(
                                                'tableRow',
                                                {
                                                    height,
                                                },
                                            )
                                            .run();
                                    }}
                                    className="h-8 w-[58px] rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                                    title="Row height"
                                />

                                <span className="text-[10px] text-slate-500">
                                    px
                                </span>
                            </div>
                        </>
                    )}

                    <ToolbarDivider />

                    {/* Bullet list */}

                    <ToolbarButton
                        title="Bullet list"
                        active={editor.isActive(
                            'bulletList',
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleBulletList()
                                .run()
                        }
                    >
                        <List className="h-4 w-4" />
                    </ToolbarButton>

                    {/* Numbered list */}

                    <ToolbarButton
                        title="Numbered list"
                        active={editor.isActive(
                            'orderedList',
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleOrderedList()
                                .run()
                        }
                    >
                        <ListOrdered className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Align left */}

                    <ToolbarButton
                        title="Align left"
                        active={editor.isActive({
                            textAlign: 'left',
                        })}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .setTextAlign(
                                    'left',
                                )
                                .run()
                        }
                    >
                        <span className="text-xs font-bold">
                            L
                        </span>
                    </ToolbarButton>

                    {/* Center */}

                    <ToolbarButton
                        title="Align center"
                        active={editor.isActive({
                            textAlign: 'center',
                        })}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .setTextAlign(
                                    'center',
                                )
                                .run()
                        }
                    >
                        <span className="text-xs font-bold">
                            C
                        </span>
                    </ToolbarButton>

                    {/* Right */}

                    <ToolbarButton
                        title="Align right"
                        active={editor.isActive({
                            textAlign: 'right',
                        })}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .setTextAlign(
                                    'right',
                                )
                                .run()
                        }
                    >
                        <span className="text-xs font-bold">
                            R
                        </span>
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Link */}

                    <ToolbarButton
                        title="Insert link"
                        active={editor.isActive(
                            'link',
                        )}
                        onClick={setLink}
                    >
                        <LinkIcon className="h-4 w-4" />
                    </ToolbarButton>

                </div>

            </div>

            {/* ========================================================== */}
            {/* DOCUMENT PAGE */}
            {/* ========================================================== */}

            <div className="overflow-auto bg-slate-200 p-8">

                <div className="mx-auto min-h-[1123px] max-w-[794px] bg-white px-[72px] py-[80px] shadow-xl">

                    <EditorContent
                        editor={editor}
                    />

                </div>

            </div>

        </div>
    );
}

/*
|--------------------------------------------------------------------------
| TOOLBAR BUTTON
|--------------------------------------------------------------------------
*/

interface ToolbarButtonProps {
    children: React.ReactNode;
    title: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
}

function ToolbarButton({
    children,
    title,
    onClick,
    active = false,
    disabled = false,
}: ToolbarButtonProps) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={[
                'flex h-8 min-w-8 items-center justify-center rounded-md px-2 transition',
                active
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-200',
                disabled
                    ? 'cursor-not-allowed opacity-30'
                    : '',
            ].join(' ')}
        >
            {children}
        </button>
    );
}

/*
|--------------------------------------------------------------------------
| TOOLBAR DIVIDER
|--------------------------------------------------------------------------
*/

function ToolbarDivider() {
    return (
        <div className="mx-1 h-5 w-px bg-slate-300" />
    );
}