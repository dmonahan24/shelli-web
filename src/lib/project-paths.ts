type ProjectPathTarget = {
  id: string;
  slug?: string | null;
};

type BuildingPathTarget = {
  id: string;
  slug?: string | null;
};

type FloorPathTarget = {
  id: string;
  slug?: string | null;
};

export function getProjectIdentifier(project: ProjectPathTarget) {
  return project.slug?.trim() || project.id;
}

export function getBuildingIdentifier(building: BuildingPathTarget) {
  return building.slug?.trim() || building.id;
}

export function getFloorIdentifier(floor: FloorPathTarget) {
  return floor.slug?.trim() || floor.id;
}

export function getProjectRouteParams(project: ProjectPathTarget) {
  return {
    projectIdentifier: getProjectIdentifier(project),
  };
}

export function getBuildingRouteParams(
  project: ProjectPathTarget,
  building: BuildingPathTarget
) {
  return {
    ...getProjectRouteParams(project),
    buildingIdentifier: getBuildingIdentifier(building),
  };
}

export function getFloorRouteParams(
  project: ProjectPathTarget,
  building: BuildingPathTarget,
  floor: FloorPathTarget
) {
  return {
    ...getBuildingRouteParams(project, building),
    floorIdentifier: getFloorIdentifier(floor),
  };
}

export function buildProjectAttachmentFilePath(
  project: ProjectPathTarget,
  attachmentId: string
) {
  return `/api/projects/${getProjectIdentifier(project)}/attachments/${attachmentId}/file`;
}
