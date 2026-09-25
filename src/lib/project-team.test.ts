import { describe, expect, it } from "bun:test";
import { buildProjectTeamChanges, draftFromRoster } from "@/lib/project-team";

const current = {
  projectManagerUserId: "pm-1",
  superintendentUserId: "super-1",
  projectAdminUserId: "admin-1",
  activeMembers: [
    { userId: "pm-1", projectRole: "editor" },
    { userId: "super-1", projectRole: "contributor" },
    { userId: "admin-1", projectRole: "project_admin" },
    { userId: "user-2", projectRole: "viewer" },
  ],
};

describe("draftFromRoster", () => {
  it("mirrors the roster with no additions or removals", () => {
    expect(draftFromRoster(current)).toEqual({
      projectManagerUserId: "pm-1",
      superintendentUserId: "super-1",
      projectAdminUserId: "admin-1",
      memberRoles: {
        "pm-1": "editor",
        "super-1": "contributor",
        "admin-1": "project_admin",
        "user-2": "viewer",
      },
      additions: [],
      removals: [],
    });
  });

  it("uses empty strings for unassigned leadership", () => {
    const draft = draftFromRoster({
      projectManagerUserId: null,
      superintendentUserId: null,
      projectAdminUserId: null,
      activeMembers: [],
    });

    expect(draft.projectManagerUserId).toBe("");
    expect(draft.superintendentUserId).toBe("");
    expect(draft.projectAdminUserId).toBe("");
  });
});

describe("buildProjectTeamChanges", () => {
  it("reports no changes when the draft matches the roster", () => {
    const result = buildProjectTeamChanges(current, draftFromRoster(current));

    expect(result.hasChanges).toBe(false);
    expect(result.assignments).toEqual([]);
    expect(result.removals).toEqual([]);
    expect(result.projectManagerUserId).toBeUndefined();
    expect(result.superintendentUserId).toBeUndefined();
    expect(result.projectAdminUserId).toBeUndefined();
  });

  it("sends only members whose role changed plus new additions", () => {
    const result = buildProjectTeamChanges(current, {
      ...draftFromRoster(current),
      memberRoles: {
        "pm-1": "editor",
        "super-1": "contributor",
        "admin-1": "project_admin",
        "user-2": "editor",
      },
      additions: [{ userId: "user-3", projectRole: "contributor" }],
    });

    expect(result.hasChanges).toBe(true);
    expect(result.assignments).toEqual([
      { userId: "user-2", projectRole: "editor" },
      { userId: "user-3", projectRole: "contributor" },
    ]);
    expect(result.projectManagerUserId).toBeUndefined();
  });

  it("sends a project manager change on its own", () => {
    const result = buildProjectTeamChanges(current, {
      ...draftFromRoster(current),
      projectManagerUserId: "user-2",
    });

    expect(result.hasChanges).toBe(true);
    expect(result.assignments).toEqual([]);
    expect(result.projectManagerUserId).toBe("user-2");
    expect(result.superintendentUserId).toBeUndefined();
    expect(result.projectAdminUserId).toBeUndefined();
  });

  it("sends a project admin change on its own", () => {
    const result = buildProjectTeamChanges(current, {
      ...draftFromRoster(current),
      projectAdminUserId: "user-2",
    });

    expect(result.hasChanges).toBe(true);
    expect(result.projectAdminUserId).toBe("user-2");
    expect(result.projectManagerUserId).toBeUndefined();
  });

  it("sends null when a leadership slot is cleared", () => {
    const result = buildProjectTeamChanges(current, {
      ...draftFromRoster(current),
      projectManagerUserId: "",
      projectAdminUserId: "",
    });

    expect(result.hasChanges).toBe(true);
    expect(result.projectManagerUserId).toBeNull();
    expect(result.projectAdminUserId).toBeNull();
    expect(result.superintendentUserId).toBeUndefined();
  });

  it("leaves an already-unassigned slot untouched", () => {
    const roster = {
      projectManagerUserId: null,
      superintendentUserId: null,
      projectAdminUserId: null,
      activeMembers: [{ userId: "user-2", projectRole: "viewer" }],
    };
    const result = buildProjectTeamChanges(roster, draftFromRoster(roster));

    expect(result.hasChanges).toBe(false);
    expect(result.projectManagerUserId).toBeUndefined();
  });

  it("sends removals for saved members", () => {
    const result = buildProjectTeamChanges(current, {
      ...draftFromRoster(current),
      removals: ["user-2"],
    });

    expect(result.hasChanges).toBe(true);
    expect(result.removals).toEqual(["user-2"]);
    expect(result.assignments).toEqual([]);
  });

  it("does not send a role change for a member being removed", () => {
    const result = buildProjectTeamChanges(current, {
      ...draftFromRoster(current),
      memberRoles: {
        "pm-1": "editor",
        "super-1": "contributor",
        "admin-1": "project_admin",
        "user-2": "editor",
      },
      removals: ["user-2"],
    });

    expect(result.assignments).toEqual([]);
    expect(result.removals).toEqual(["user-2"]);
  });

  it("ignores removals for people who are not saved members", () => {
    const result = buildProjectTeamChanges(current, {
      ...draftFromRoster(current),
      removals: ["user-9"],
    });

    expect(result.hasChanges).toBe(false);
    expect(result.removals).toEqual([]);
  });
});
