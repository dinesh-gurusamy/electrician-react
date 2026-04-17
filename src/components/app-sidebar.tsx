import * as React from "react"

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
      title: "All quotations",
      url: "/quotations",
      icon: (
        <ReceiptTextIcon
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
                <span className="text-base font-semibold">Ilansuryan</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
