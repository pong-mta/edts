import { TableCell } from '@tiptap/extension-table-cell';

export const TableCellAlignment = TableCell.extend({
    name: 'tableCell',

    addAttributes() {
        return {
            ...this.parent?.(),

            verticalAlign: {
                default: 'top',

                parseHTML: (element) => {
                    return (
                        element.style
                            .verticalAlign ||
                        'top'
                    );
                },

                renderHTML: (attributes) => {
                    const value =
                        attributes.verticalAlign ||
                        'top';

                    return {
                        style: `vertical-align: ${value};`,
                    };
                },
            },
        };
    },
});