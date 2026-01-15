'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useOrganizations } from '@/contexts/organizations-context';
import {
    BookOpen,
    FileQuestion,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Settings,
    Users,
    ClipboardList,
    BarChart3,
    Building2,
    ChevronUp,
    ChevronsUpDown,
    Sun,
    Moon,
    Monitor,
    Plus,
    Shield,
} from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const mainNavItems = [
    { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { title: 'Subjects', icon: BookOpen, href: '/dashboard/subjects' },
    { title: 'Question Banks', icon: FileQuestion, href: '/dashboard/question-banks' },
    { title: 'Exams', icon: ClipboardList, href: '/dashboard/exams' },
    { title: 'Candidates', icon: GraduationCap, href: '/dashboard/candidates' },
    { title: 'Results', icon: BarChart3, href: '/dashboard/results' },
];

const adminNavItems = [
    { title: 'Users', icon: Users, href: '/dashboard/users' },
    { title: 'Roles & Permissions', icon: Shield, href: '/dashboard/roles' },
    { title: 'Organizations', icon: Building2, href: '/dashboard/organizations' },
    { title: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export function AppSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const getUserInitials = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const firstName = user.user_metadata?.first_name || '';
            const lastName = user.user_metadata?.last_name || '';
            if (firstName || lastName) {
                return ((firstName[0] || '') + (lastName[0] || '')).toUpperCase();
            }
            return (user.email || 'U')[0].toUpperCase();
        } catch {
            return 'U';
        }
    };

    const getUserEmail = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.email || 'user@example.com';
        } catch {
            return 'user@example.com';
        }
    };

    const getUserName = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const firstName = user.user_metadata?.first_name || '';
            const lastName = user.user_metadata?.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            return fullName || user.user_metadata?.full_name || 'User';
        } catch {
            return 'User';
        }
    };

    // Use organizations from context (cached at app level)
    const { organizations, activeOrg, isLoading: isLoadingOrgs, setActiveOrg } = useOrganizations();

    // Switch warning state
    const [showSwitchDialog, setShowSwitchDialog] = React.useState(false);
    const [pendingOrg, setPendingOrg] = React.useState<{ id: string, name: string, slug: string } | null>(null);

    const handleOrgChange = (org: { id: string, name: string, slug: string }) => {
        setPendingOrg(org);
        setShowSwitchDialog(true);
    };

    const confirmOrgChange = () => {
        if (pendingOrg) {
            setActiveOrg(pendingOrg);
            localStorage.setItem('current_org', JSON.stringify(pendingOrg));
            setShowSwitchDialog(false);
            setPendingOrg(null);

            // Redirect to dashboard ("Org Detail Page")
            router.push('/dashboard');
        }
    };

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="border-b">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <span className="text-lg font-bold">
                                            {activeOrg?.name?.charAt(0) || 'S'}
                                        </span>
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{activeOrg?.name || 'Select Organization'}</span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {activeOrg?.slug || 'No org selected'}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto h-4 w-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-52 rounded-lg"
                                align="start"
                                side="bottom"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="text-xs text-muted-foreground">
                                    Organizations
                                </DropdownMenuLabel>
                                {organizations.length === 0 && (
                                    <DropdownMenuItem disabled className="text-muted-foreground text-sm">
                                        No organizations found
                                    </DropdownMenuItem>
                                )}
                                {organizations.map((org) => (
                                    <DropdownMenuItem
                                        key={org.id}
                                        onClick={() => handleOrgChange(org)}
                                        className="gap-2 p-2"
                                    >
                                        <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                                            {org.name.charAt(0)}
                                        </div>
                                        {org.name}
                                        {org.id === activeOrg?.id && (
                                            <span className="ml-auto text-primary">✓</span>
                                        )}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2 p-2" onClick={() => router.push('/onboarding')}>
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                    <span className="text-muted-foreground">Add organization</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Main</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href}
                                        tooltip={item.title}
                                    >
                                        <a href={item.href}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Administration</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href}
                                        tooltip={item.title}
                                    >
                                        <a href={item.href}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-full">
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs rounded-full">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                        <span className="truncate font-semibold">{getUserName()}</span>
                                        <span className="truncate text-xs text-muted-foreground">{getUserEmail()}</span>
                                    </div>
                                    <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-52 rounded-lg"
                                align="start"
                                side="top"
                                sideOffset={4}
                            >
                                <div className="flex items-center justify-between p-2">
                                    <span className="text-xs font-medium">Theme</span>
                                    <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setTheme('light');
                                            }}
                                            className={cn(
                                                "w-10 rounded-md py-1 text-xs font-medium transition-all",
                                                theme === 'light' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Light
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setTheme('dark');
                                            }}
                                            className={cn(
                                                "w-10 rounded-md py-1 text-xs font-medium transition-all",
                                                theme === 'dark' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Dark
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setTheme('system');
                                            }}
                                            className={cn(
                                                "w-10 rounded-md py-1 text-xs font-medium transition-all",
                                                theme === 'system' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Auto
                                        </button>
                                    </div>
                                </div>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />

            <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Switch Organization?</DialogTitle>
                        <DialogDescription>
                            You are about to switch to <strong>{pendingOrg?.name}</strong>.
                            <br /><br />
                            <strong>Warning:</strong> Any unsaved changes on the current page will be lost.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSwitchDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmOrgChange}>
                            Confirm & Switch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Sidebar>
    );
}
