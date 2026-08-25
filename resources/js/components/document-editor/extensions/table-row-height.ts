import { TableRow } from '@tiptap/extension-table-row';

export const TableRowHeight = TableRow.extend({
    name: 'tableRow',

    addAttributes() {
        return {
            ...this.parent?.(),

            height: {
                default: null,

                parseHTML: (element) => {
                    const height =
                        element.getAttribute(
                            'data-row-height',
                        );

                    return height
                        ? Number(height)
                        : null;
                },

                renderHTML: (attributes) => {
                    if (
                        !attributes.height
                    ) {
                        return {};
                    }

                    return {
                        'data-row-height':
                            attributes.height,

                        style: `height: ${attributes.height}pt;`,
                    };
                },
            },
        };
    },
});