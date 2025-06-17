'use client'
import { RefreshCcw, Search, Settings, Highlighter, SquarePen } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname, useRouter } from 'next/navigation'
import { ModeToggle } from "./mode-toggle"
import Link from "next/link"
import AppStatus from "./app-status"
import { Store } from "@tauri-apps/plugin-store"
import { PinToggle } from "./pin-toggle"
import { useTranslations } from 'next-intl'
import { LanguageSwitch } from "./language-switch"
import { useSidebarStore } from "@/stores/sidebar"
 
export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toggleFileSidebar } = useSidebarStore()
  const t = useTranslations()
  const items = [
    {
      title: t('navigation.record'),
      url: "/core/record",
      icon: Highlighter,
      isActive: true,
    },
    {
      title: t('navigation.write'),
      url: "/core/article",
      icon: SquarePen,
    },
    {
      title: t('navigation.search'),
      url: "/core/search",
      icon: Search,
    },
    {
      title: t('navigation.gallery'),
      url: "/core/image",
      icon: RefreshCcw,
    },
  ]
  async function menuHandler(item: typeof items[0]) {
    if (pathname === '/core/article' && item.url === '/core/article') {
      toggleFileSidebar()
    } else {
      router.push(item.url)
    }
    const store = await Store.load('store.json')
    store.set('currentPage', item.url)
  }

  return (
    <Sidebar 
      collapsible="none"
      className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r h-screen"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <AppStatus />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    disabled={item.url === '#'}
                    isActive={pathname === item.url}
                    tooltip={{
                      children: item.title,
                      hidden: false,
                    }}
                  >
                    <div className="cursor-pointer" onClick={() => menuHandler(item)}>
                      <item.icon />
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <LanguageSwitch />
        <PinToggle />
        <ModeToggle />
        <SidebarMenuButton isActive={pathname.includes('/core/setting')} asChild className="md:h-8 md:p-0"
          tooltip={{
            children: t('common.settings'),
            hidden: false,
          }}
        >
          <Link href="/core/setting">
            <div className="flex size-8 items-center justify-center rounded-lg">
              <Settings className="size-4" />
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  )
}