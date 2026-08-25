import { TableCell } from '@tiptap/extension-table-cell';

export const TableCellAlignment = TableCell.extend({
    name: 'tableCell',

    addAttributes() {
        return {
            ...this.parent?.(),

            verticalAlign: {
                default: null,

                parseHTML: (element) => {
                    return (
                        element.getAttribute(
                            'data-vertical-align',
                        ) || null
                    );
                },

                renderHTML: (attributes) => {
                    if (
                        !attributes.verticalAlign
                    ) {
                        return {};
                    }

                    return {
                        'data-vertical-align':
                            attributes.verticalAlign,

                        style:
                            `vertical-align: ${attributes.verticalAlign};`,
                    };
                },
            },
        };
    },
});