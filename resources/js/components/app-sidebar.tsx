import {
    BookOpen,
    ClipboardList,
    FileArchive,
    FilePlus2,
    FileSpreadsheet,
    FileText,
    FolderOpen,
    LayoutGrid,
    Settings,
    ShieldCheck,
    Upload,
    Users,
    Building2,
    BarChart3,
    Search,
} from 'lucide-react';

import { Link } from '@inertiajs/react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { type NavItem } from '@/types';
import AppLogo from './app-logo';


/*
|--------------------------------------------------------------------------
| MAIN NAVIGATION
|--------------------------------------------------------------------------
*/

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutGrid,
    },

    {
        title: 'Documents',
        url: '#',
        icon: FileText,
        items: [
            {
                title: 'My Documents',
                url: '/documents',
            },
            {
                title: 'Create Document',
                url: '/documents/create',
            },
            {
                title: 'Document Tracking',
                url: '/documents/tracking',
            },
        ],
    },

    {
        title: 'Templates',
        url: '#',
        icon: FileArchive,
        items: [
            {
                title: 'All Templates',
                url: '/templates',
            },
            {
                title: 'Word Templates',
                url: '/templates?type=word',
                icon: FileText,
            },
            {
                title: 'Excel Templates',
                url: '/templates?type=excel',
                icon: FileSpreadsheet,
            },
        ],
    },

    {
        title: 'Import',
        url: '#',
        icon: Upload,
        items: [
            {
                title: 'Import Word',
                url: '/templates/import/word',
                icon: FileText,
            },
            {
                title: 'Import Excel',
                url: '/templates/import/excel',
                icon: FileSpreadsheet,
            },
        ],
    },

    {
        title: 'Reports',
        url: '#',
        icon: BarChart3,
        items: [
            {
                title: 'Document Reports',
                url: '/reports/documents',
            },
            {
                title: 'Tracking Reports',
                url: '/reports/tracking',
            },
        ],
    },

    {
        title: 'Administration',
        url: '#',
        icon: ShieldCheck,
        items: [
            {
                title: 'Users',
                url: '/admin/users',
                icon: Users,
            },
            {
                title: 'Offices',
                url: '/admin/offices',
                icon: Building2,
            },
            {
                title: 'Document Types',
                url: '/admin/document-types',
                icon: ClipboardList,
            },
            {
                title: 'Settings',
                url: '/admin/settings',
                icon: Settings,
            },
        ],
    },
];


/*
|--------------------------------------------------------------------------
| FOOTER
|--------------------------------------------------------------------------
*/

const footerNavItems: NavItem[] = [
    {
        title: 'Document Search',
        url: '/documents/search',
        icon: Search,
    },

    {
        title: 'Documentation',
        url: 'https://laravel.com/docs',
        icon: BookOpen,
    },
];


/*
|--------------------------------------------------------------------------
| SIDEBAR
|--------------------------------------------------------------------------
*/

export function AppSidebar() {
    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
        >
            {/* ============================================================
                HEADER
            ============================================================ */}

            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                        >
                            <Link
                                href="/dashboard"
                                prefetch
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>


            {/* ============================================================
                MAIN
            ============================================================ */}

            <SidebarContent>
                <NavMain
                    items={mainNavItems}
                />
            </SidebarContent>


            {/* ============================================================
                FOOTER
            ============================================================ */}

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}