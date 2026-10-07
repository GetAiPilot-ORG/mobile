import { FastifyInstance } from "fastify";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { CRMRepository } from "../services/crm/crm.repository.js";
import { JWTPayload } from "../types/index.js";

export async function teamRoutes(fastify: FastifyInstance) {
  const resolveOrgId = async (user: JWTPayload): Promise<string> => {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return ctx.crmOrgId;
  };

  // ── Team Members ──────────────────────────────────────────────────────────────

  fastify.get(
    "/",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      try {
        const orgId = await resolveOrgId(user);
        const members = await CRMRepository.getMembersFull(orgId);
        return reply.send({ members, total_count: members.length });
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  fastify.get(
    "/team/members/:id",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      try {
        const orgId = await resolveOrgId(user);
        const member = await CRMRepository.getMemberById(orgId, id);
        if (!member)
          return reply
            .status(404)
            .send({ statusCode: 404, message: "Member not found" });
        return reply.send(member);
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  fastify.post(
    "/team/members",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      try {
        const orgId = await resolveOrgId(user);
        const member = await CRMRepository.createMember(
          orgId,
          request.body as any,
        );
        return reply.status(201).send(member);
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  fastify.patch(
    "/team/members/:id",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      try {
        const orgId = await resolveOrgId(user);
        const member = await CRMRepository.updateMember(
          orgId,
          id,
          request.body as any,
        );
        return reply.send(member);
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  fastify.delete(
    "/team/members/:id",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      try {
        const orgId = await resolveOrgId(user);
        await CRMRepository.deleteMember(orgId, id);
        return reply.send({ success: true, id });
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  // ── Attendance ────────────────────────────────────────────────────────────────

  fastify.get(
    "/team/attendance",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      const { member_id, date_from, date_to, status, limit } =
        request.query as any;
      try {
        const orgId = await resolveOrgId(user);
        const result = await CRMRepository.getAttendanceRecords(orgId, {
          member_id,
          date_from,
          date_to,
          status,
          limit: limit ? Number(limit) : undefined,
        });
        return reply.send(result);
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  fastify.post(
    "/team/attendance",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      try {
        const orgId = await resolveOrgId(user);
        const record = await CRMRepository.createAttendanceRecord(
          orgId,
          request.body as any,
        );
        return reply.status(201).send(record);
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  fastify.patch(
    "/team/attendance/:id",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      try {
        const orgId = await resolveOrgId(user);
        const record = await CRMRepository.updateAttendanceRecord(
          orgId,
          id,
          request.body as any,
        );
        return reply.send(record);
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  fastify.delete(
    "/team/attendance/:id",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      try {
        const orgId = await resolveOrgId(user);
        await CRMRepository.deleteAttendanceRecord(orgId, id);
        return reply.send({ success: true, id });
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  // ── Leave Requests ────────────────────────────────────────────────────────────

  fastify.get(
    "/team/leave",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      const { member_id, status, leave_type, limit } = request.query as any;
      try {
        const orgId = await resolveOrgId(user);
        const result = await CRMRepository.getLeaveRequests(orgId, {
          member_id,
          status,
          leave_type,
          limit: limit ? Number(limit) : undefined,
        });
        return reply.send(result);
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  fastify.post(
    "/team/leave",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      try {
        const orgId = await resolveOrgId(user);
        const leave = await CRMRepository.createLeaveRequest(
          orgId,
          request.body as any,
        );
        return reply.status(201).send(leave);
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  fastify.patch(
    "/team/leave/:id",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      try {
        const orgId = await resolveOrgId(user);
        const leave = await CRMRepository.updateLeaveRequest(
          orgId,
          id,
          request.body as any,
        );
        return reply.send(leave);
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  fastify.delete(
    "/team/leave/:id",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      try {
        const orgId = await resolveOrgId(user);
        await CRMRepository.deleteLeaveRequest(orgId, id);
        return reply.send({ success: true, id });
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  // ── Presence ──────────────────────────────────────────────────────────────────

  fastify.get(
    "/team/presence",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      const { member_id, limit } = request.query as any;
      try {
        const orgId = await resolveOrgId(user);
        const logs = await CRMRepository.getPresenceLogs(orgId, {
          member_id,
          limit: limit ? Number(limit) : undefined,
        });
        return reply.send({ logs, total_count: logs.length });
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  // ── Birthdays ─────────────────────────────────────────────────────────────────

  fastify.get(
    "/team/birthdays",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      try {
        const orgId = await resolveOrgId(user);
        const birthdays = await CRMRepository.getUpcomingBirthdays(orgId);
        return reply.send({ birthdays });
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  // ── Holidays ──────────────────────────────────────────────────────────────────

  fastify.get(
    "/team/holidays",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      try {
        const orgId = await resolveOrgId(user);
        const holidays = await CRMRepository.getHolidays(orgId);
        return reply.send({ holidays });
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  // ── WFH ──────────────────────────────────────────────────────────────────────

  fastify.get(
    "/team/wfh",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      try {
        const orgId = await resolveOrgId(user);
        const result = await CRMRepository.getLeaveRequests(orgId, {
          leave_type: "work_from_home",
          limit: 50,
        });
        return reply.send({
          wfh: result.requests,
          total_count: result.total_count,
        });
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );

  // ── Team Activity Summary ────────────────────────────────────────────────────────

  fastify.get(
    "/team/activity",
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user as JWTPayload;
      try {
        const orgId = await resolveOrgId(user);
        const today = new Date().toISOString().split("T")[0];

        const [todayAttendance, pendingLeaves, wfhRequests, members] =
          await Promise.all([
            CRMRepository.getAttendanceRecords(orgId, {
              date_from: today,
              date_to: today,
            }),
            CRMRepository.getLeaveRequests(orgId, { status: "pending" }),
            CRMRepository.getLeaveRequests(orgId, {
              leave_type: "work_from_home",
              status: "approved",
            }),
            CRMRepository.getMembersFull(orgId),
          ]);

        return reply.send({
          totalMembers: members.length,
          presentToday: todayAttendance.records.filter((r: any) =>
            ["present", "late"].includes(r.status),
          ).length,
          absentToday: todayAttendance.records.filter(
            (r: any) => r.status === "absent",
          ).length,
          wfhToday: wfhRequests.requests.filter(
            (r: any) => r.start_date <= today && r.end_date >= today,
          ).length,
          pendingLeaveRequests: pendingLeaves.total_count,
        });
      } catch (err: any) {
        return reply
          .status(500)
          .send({ statusCode: 500, message: err.message });
      }
    },
  );
}
