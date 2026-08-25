import { TableCell } from '@tiptap/extension-table-cell';

export const TableCellBackground = TableCell.extend({
    name: 'tableCell',

    addAttributes() {
        return {
            ...this.parent?.(),

            backgroundColor: {
                default: null,

                parseHTML: (element) => {
                    return (
                        element.getAttribute(
                            'data-background-color',
                        ) || null
                    );
                },

                renderHTML: (attributes) => {
                    if (!attributes.backgroundColor) {
                        return {};
                    }

                    return {
                        'data-background-color':
                            attributes.backgroundColor,

                        style:
                            `background-color: ${attributes.backgroundColor};`,
                    };
                },
            },
        };
    },
});