import type { ProjectRole } from "@/lib/auth/principal";

export type ProjectTeamRosterSnapshot = {
  projectManagerUserId: string | null;
  superintendentUserId: string | null;
  projectAdminUserId: string | null;
  activeMembers: Array<{ userId: string; projectRole: string }>;
};

export type ProjectTeamDraft = {
  projectManagerUserId: string;
  superintendentUserId: string;
  projectAdminUserId: string;
  memberRoles: Record<string, ProjectRole>;
  additions: Array<{ userId: string; projectRole: ProjectRole }>;
  /** User ids of saved members the editor has marked for removal. */
  removals: string[];
};

export function draftFromRoster(roster: ProjectTeamRosterSnapshot): ProjectTeamDraft {
  return {
    projectManagerUserId: roster.projectManagerUserId ?? "",
    superintendentUserId: roster.superintendentUserId ?? "",
    projectAdminUserId: roster.projectAdminUserId ?? "",
    memberRoles: Object.fromEntries(
      roster.activeMembers.map((member) => [member.userId, member.projectRole as ProjectRole])
    ),
    additions: [],
    removals: [],
  };
}

/**
 * Reduces the team editor's draft state to the minimal bulk-assignment payload:
 * only members whose role changed, newly added members, removals, and leadership
 * changes. A leadership field is `undefined` when untouched and `null` when the
 * editor cleared it.
 */
export function buildProjectTeamChanges(
  current: ProjectTeamRosterSnapshot,
  draft: ProjectTeamDraft
) {
  const removals = draft.removals.filter((userId) =>
    current.activeMembers.some((member) => member.userId === userId)
  );

  const roleChanges = current.activeMembers.flatMap((member) => {
    if (removals.includes(member.userId)) {
      return [];
    }

    const nextRole = draft.memberRoles[member.userId];
    return nextRole && nextRole !== member.projectRole
      ? [{ userId: member.userId, projectRole: nextRole }]
      : [];
  });

  const assignments = [...roleChanges, ...draft.additions];
  const projectManagerUserId = leadershipChange(
    current.projectManagerUserId,
    draft.projectManagerUserId
  );
  const superintendentUserId = leadershipChange(
    current.superintendentUserId,
    draft.superintendentUserId
  );
  const projectAdminUserId = leadershipChange(
    current.projectAdminUserId,
    draft.projectAdminUserId
  );

  return {
    assignments,
    removals,
    projectManagerUserId,
    superintendentUserId,
    projectAdminUserId,
    hasChanges:
      assignments.length > 0 ||
      removals.length > 0 ||
      projectManagerUserId !== undefined ||
      superintendentUserId !== undefined ||
      projectAdminUserId !== undefined,
  };
}

/** `undefined` keeps the current holder, `null` clears the slot. */
function leadershipChange(currentUserId: string | null, draftUserId: string) {
  if (draftUserId === (currentUserId ?? "")) {
    return undefined;
  }

  return draftUserId === "" ? null : draftUserId;
}
