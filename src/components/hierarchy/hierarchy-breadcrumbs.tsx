import { Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function HierarchyBreadcrumbs({
  buildingId,
  buildingName,
  floorName,
  projectId,
  projectName,
}: {
  buildingId?: string;
  buildingName?: string;
  floorName?: string;
  projectId: string;
  projectName: string;
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
            <Link to="/dashboard/projects/$projectId" params={{ projectId }}>
              {projectName}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {buildingName ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {floorName && buildingId ? (
                <BreadcrumbLink asChild>
                  <Link
                    to="/dashboard/projects/$projectId/buildings/$buildingId"
                    params={{ buildingId, projectId }}
                  >
                    {buildingName}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{buildingName}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        ) : null}
        {floorName ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{floorName}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
