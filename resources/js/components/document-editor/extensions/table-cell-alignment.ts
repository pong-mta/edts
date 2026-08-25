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

            borderWidth: {
                default: null,

                parseHTML: (element) => {
                    return (
                        element.getAttribute(
                            'data-border-width',
                        ) || null
                    );
                },

                renderHTML: (attributes) => {
                    if (!attributes.borderWidth) {
                        return {};
                    }

                    return {
                        'data-border-width':
                            attributes.borderWidth,

                        style:
                            `border-width: ${attributes.borderWidth}px;`,
                    };
                },
            },

            borderStyle: {
                default: null,

                parseHTML: (element) => {
                    return (
                        element.getAttribute(
                            'data-border-style',
                        ) || null
                    );
                },

                renderHTML: (attributes) => {
                    if (!attributes.borderStyle) {
                        return {};
                    }

                    return {
                        'data-border-style':
                            attributes.borderStyle,

                        style:
                            `border-style: ${attributes.borderStyle};`,
                    };
                },
            },

            borderTop: {
                default: null,

                parseHTML: (element) => {
                    return (
                        element.getAttribute(
                            'data-border-top',
                        ) || null
                    );
                },

                renderHTML: (attributes) => {
                    if (!attributes.borderTop) {
                        return {};
                    }

                    return {
                        'data-border-top': attributes.borderTop,
                        style: `border-top: ${attributes.borderTop};`,
                    };
                },
            },

            borderRight: {
                default: null,

                parseHTML: (element) => {
                    return (
                        element.getAttribute(
                            'data-border-right',
                        ) || null
                    );
                },

                renderHTML: () => {
                    return {};
                },
            },

            borderBottom: {
                default: null,

                parseHTML: (element) => {
                    return (
                        element.getAttribute(
                            'data-border-bottom',
                        ) || null
                    );
                },

                renderHTML: () => {
                    return {};
                },
            },

            borderLeft: {
                default: null,

                parseHTML: (element) => {
                    return (
                        element.getAttribute(
                            'data-border-left',
                        ) || null
                    );
                },

                renderHTML: () => {
                    return {};
                },
            },
        };
    },
});