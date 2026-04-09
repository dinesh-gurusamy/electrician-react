import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Building2Icon,
  CommandIcon,
  LayoutDashboardIcon,
  PackageSearchIcon,
  PlusSquareIcon,
  ReceiptTextIcon,
  StoreIcon,
  UserRoundIcon,
} from "lucide-react"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      end: true,
      icon: (
        <LayoutDashboardIcon
        />
      ),
    },
    {
      title: "Materials catalog",
      url: "/materials",
      icon: (
        <Building2Icon
        />
      ),
    },
    {
      title: "Customers",
      url: "/customers",
      icon: (
        <UserRoundIcon
        />
      ),
    },
    {
      title: "Electrical stores",
      url: "/stores",
      icon: (
        <StoreIcon
        />
      ),
    },
  ],
  documents: [
    {
      name: "All quotations",
      url: "/quotations",
      icon: (
        <ReceiptTextIcon
        />
      ),
    },
    {
      name: "Materials catalog",
      url: "/materials",
      icon: (
        <Building2Icon
        />
      ),
    },
    {
      name: "Customers",
      url: "/customers",
      icon: (
        <UserRoundIcon
        />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
