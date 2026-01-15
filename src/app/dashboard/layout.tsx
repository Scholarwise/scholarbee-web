import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { OrganizationsProvider } from '@/contexts/organizations-context';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OrganizationsProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </OrganizationsProvider>
    );
}
