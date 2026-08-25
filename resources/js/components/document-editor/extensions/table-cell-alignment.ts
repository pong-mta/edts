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

            borderColor: {
                default: null,

                parseHTML: (element) => {
                    return (
                        element.getAttribute(
                            'data-border-color',
                        ) || null
                    );
                },

                renderHTML: (attributes) => {
                    if (!attributes.borderColor) {
                        return {};
                    }

                    return {
                        'data-border-color':
                            attributes.borderColor,

                        style:
                            `border-color: ${attributes.borderColor};`,
                    };
                },
            },
        };
    },
});