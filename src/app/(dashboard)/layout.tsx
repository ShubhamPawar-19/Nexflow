import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const Layout= ({ children } : {children: React.ReactNode; }) => {
    return (
        <SidebarProvider>
            <AppSidebar/>
            <SidebarInset className="bg-accent/20 flex flex-col h-screen">
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
};

export default Layout;