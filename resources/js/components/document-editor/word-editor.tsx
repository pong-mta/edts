import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
    Bold,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Redo2,
    Strikethrough,
    Underline as UnderlineIcon,
    Undo2,
} from 'lucide-react';
import { useEffect } from 'react';

interface WordEditorProps {
    content: string;
    onChange: (content: string) => void;
}

export default function WordEditor({
    content,
    onChange,
}: WordEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,

            Underline,

            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),

            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            }),

            Image,
        ],

        content,

        editorProps: {
            attributes: {
                class:
                    'prose prose-slate max-w-none min-h-[900px] outline-none',
            },
        },

        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

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

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            {/* ========================================================== */}
            {/* TOOLBAR */}
            {/* ========================================================== */}

            <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">

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
                        !editor.can()
                            .chain()
                            .focus()
                            .undo()
                            .run()
                    }
                >
                    <Undo2 className="h-4 w-4" />
                </ToolbarButton>

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
                        !editor.can()
                            .chain()
                            .focus()
                            .redo()
                            .run()
                    }
                >
                    <Redo2 className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    title="Bold"
                    active={editor.isActive('bold')}
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

                <ToolbarButton
                    title="Italic"
                    active={editor.isActive('italic')}
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

                <ToolbarButton
                    title="Underline"
                    active={editor.isActive('underline')}
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

                <ToolbarButton
                    title="Align left"
                    active={editor.isActive({
                        textAlign: 'left',
                    })}
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .setTextAlign('left')
                            .run()
                    }
                >
                    <span className="text-xs font-bold">
                        L
                    </span>
                </ToolbarButton>

                <ToolbarButton
                    title="Align center"
                    active={editor.isActive({
                        textAlign: 'center',
                    })}
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .setTextAlign('center')
                            .run()
                    }
                >
                    <span className="text-xs font-bold">
                        C
                    </span>
                </ToolbarButton>

                <ToolbarButton
                    title="Align right"
                    active={editor.isActive({
                        textAlign: 'right',
                    })}
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .setTextAlign('right')
                            .run()
                    }
                >
                    <span className="text-xs font-bold">
                        R
                    </span>
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    title="Insert link"
                    active={editor.isActive('link')}
                    onClick={setLink}
                >
                    <LinkIcon className="h-4 w-4" />
                </ToolbarButton>

            </div>

            {/* ========================================================== */}
            {/* DOCUMENT PAGE */}
            {/* ========================================================== */}

            <div className="bg-slate-200 p-8">

                <div className="mx-auto min-h-[1123px] max-w-[794px] bg-white px-[72px] py-[80px] shadow-xl">

                    <EditorContent editor={editor} />

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