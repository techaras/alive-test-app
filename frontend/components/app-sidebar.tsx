import { Zap } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar'

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </div>
          <h2 className="text-lg font-semibold">Company Inc.</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Sidebar content will go here */}
      </SidebarContent>
    </Sidebar>
  )
}