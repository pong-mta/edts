import { TableHeader } from '@tiptap/extension-table-header';

export const TableHeaderAlignment =
    TableHeader.extend({
        name: 'tableHeader',

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
                                `border: 1px solid ${attributes.borderColor};`,
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
                            'data-border-top':
                                attributes.borderTop,

                            style:
                                `border-top: ${attributes.borderTop};`,
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

                    renderHTML: (attributes) => {
                        if (!attributes.borderRight) {
                            return {};
                        }

                        return {
                            'data-border-right':
                                attributes.borderRight,

                            style:
                                `border-right: ${attributes.borderRight};`,
                        };
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

                    renderHTML: (attributes) => {
                        if (!attributes.borderBottom) {
                            return {};
                        }

                        return {
                            'data-border-bottom':
                                attributes.borderBottom,

                            style:
                                `border-bottom: ${attributes.borderBottom};`,
                        };
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

                    renderHTML: (attributes) => {
                        if (!attributes.borderLeft) {
                            return {};
                        }

                        return {
                            'data-border-left':
                                attributes.borderLeft,

                            style:
                                `border-left: ${attributes.borderLeft};`,
                        };
                    },
                },
            };
        },
    });