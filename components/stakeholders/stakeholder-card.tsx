import Link from "next/link"
import { Mail, Phone, Building2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ArchetypeBadge, OrgTypeBadge } from "./archetype-badge"
import type { Database } from "@/types/database"

type StakeholderRow = Database["public"]["Tables"]["stakeholders"]["Row"]

interface StakeholderCardProps {
  stakeholder: StakeholderRow
  href: string
}

export function StakeholderCard({ stakeholder, href }: StakeholderCardProps) {
  const { name, title, organization, email, phone, archetype, organization_type } = stakeholder

  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <Link href={href}>
      <Card className="p-5 hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 cursor-pointer group">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {name}
              </h3>
              <ArchetypeBadge archetype={archetype} size="sm" />
              {organization_type && <OrgTypeBadge organizationType={organization_type} size="sm" />}
            </div>

            {title && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{title}</p>
            )}

            <div className="mt-2 space-y-1">
              {organization && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3 shrink-0" />
                  <span className="truncate">{organization}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="size-3 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="size-3 shrink-0" />
                  <span className="truncate">{phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
