import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PendingLink } from "@/components/navigation/pending-link";
import {
  getBuildingRouteParams,
  getProjectRouteParams,
} from "@/lib/project-paths";

export function HierarchyBreadcrumbs({
  building,
  floor,
  project,
}: {
  building?: {
    id: string;
    slug?: string | null;
    name: string;
  };
  floor?: {
    name: string;
  };
  project: {
    id: string;
    slug?: string | null;
    name: string;
  };
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <PendingLink to="/dashboard" preload="intent">Dashboard</PendingLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <PendingLink to="/dashboard/projects" preload="intent">Projects</PendingLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <PendingLink
              to="/dashboard/projects/$projectIdentifier"
              preload="intent"
              params={getProjectRouteParams(project)}
            >
              {project.name}
            </PendingLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {building ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {floor ? (
                <BreadcrumbLink asChild>
                  <PendingLink
                    preload="intent"
                    to="/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier"
                    params={getBuildingRouteParams(project, building)}
                  >
                    {building.name}
                  </PendingLink>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{building.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        ) : null}
        {floor ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{floor.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
