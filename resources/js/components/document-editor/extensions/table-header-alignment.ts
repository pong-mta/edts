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
            };
        },
    });