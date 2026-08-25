import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

import { type NavItem } from '@/types';

import {
    Link,
    usePage,
} from '@inertiajs/react';

import {
    ChevronRight,
} from 'lucide-react';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';


export function NavMain({
    items = [],
}: {
    items: NavItem[];
}) {
    const page = usePage();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>
                EDTS
            </SidebarGroupLabel>

            <SidebarMenu>
                {items.map((item) => {
                    /*
                    |--------------------------------------------------------------------------
                    | Check whether this menu has children
                    |--------------------------------------------------------------------------
                    */

                    const hasChildren =
                        Array.isArray(
                            item.items,
                        ) &&
                        item.items.length > 0;

                    /*
                    |--------------------------------------------------------------------------
                    | Check active state
                    |--------------------------------------------------------------------------
                    */

                    const isActive =
                        item.url !== '#' &&
                        page.url === item.url;

                    const childIsActive =
                        item.items?.some(
                            (child) =>
                                page.url ===
                                child.url,
                        ) ?? false;

                    /*
                    |--------------------------------------------------------------------------
                    | Simple menu item
                    |--------------------------------------------------------------------------
                    */

                    if (!hasChildren) {
                        return (
                            <SidebarMenuItem
                                key={
                                    item.title
                                }
                            >
                                <SidebarMenuButton
                                    asChild
                                    isActive={
                                        isActive
                                    }
                                >
                                    <Link
                                        href={
                                            item.url
                                        }
                                        prefetch
                                    >
                                        {item.icon && (
                                            <item.icon />
                                        )}

                                        <span>
                                            {
                                                item.title
                                            }
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Parent menu
                    |--------------------------------------------------------------------------
                    */

                    return (
                        <Collapsible
                            key={
                                item.title
                            }
                            asChild
                            defaultOpen={
                                childIsActive
                            }
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger
                                    asChild
                                >
                                    <SidebarMenuButton
                                        tooltip={
                                            item.title
                                        }
                                        isActive={
                                            childIsActive
                                        }
                                    >
                                        {item.icon && (
                                            <item.icon />
                                        )}

                                        <span>
                                            {
                                                item.title
                                            }
                                        </span>

                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenu className="ml-3 border-l border-slate-200 pl-2">
                                        {item.items?.map(
                                            (
                                                child,
                                            ) => {
                                                const childActive =
                                                    page.url ===
                                                    child.url;

                                                return (
                                                    <SidebarMenuItem
                                                        key={
                                                            child.title
                                                        }
                                                    >
                                                        <SidebarMenuButton
                                                            asChild
                                                            size="sm"
                                                            isActive={
                                                                childActive
                                                            }
                                                        >
                                                            <Link
                                                                href={
                                                                    child.url
                                                                }
                                                                prefetch
                                                            >
                                                                {child.icon && (
                                                                    <child.icon />
                                                                )}

                                                                <span>
                                                                    {
                                                                        child.title
                                                                    }
                                                                </span>
                                                            </Link>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                );
                                            },
                                        )}
                                    </SidebarMenu>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}