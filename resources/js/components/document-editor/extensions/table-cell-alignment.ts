import { TableCell } from '@tiptap/extension-table-cell';

export const TableCellAlignment = TableCell.extend({
    addAttributes() {
        return {
            ...this.parent?.(),

            verticalAlign: {
                default: 'top',

                parseHTML: (element) => {
                    return (
                        element.getAttribute(
                            'data-vertical-align',
                        ) || 'top'
                    );
                },

                renderHTML: (attributes) => {
                    const value =
                        attributes.verticalAlign;

                    if (!value) {
                        return {};
                    }

                    return {
                        'data-vertical-align':
                            value,

                        style: `vertical-align: ${value};`,
                    };
                },
            },
        };
    },
});