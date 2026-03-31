import { Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
            <Link to="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard/projects">Projects</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard/projects/$projectIdentifier" params={getProjectRouteParams(project)}>
              {project.name}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {building ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {floor ? (
                <BreadcrumbLink asChild>
                  <Link
                    to="/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier"
                    params={getBuildingRouteParams(project, building)}
                  >
                    {building.name}
                  </Link>
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
