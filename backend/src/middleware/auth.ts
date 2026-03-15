import type { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    authUser: {
      userId: string;
      organizationId: string;
      role: string;
    };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{ userId: string; organizationId: string; role: string }>();
    request.authUser = payload;
  } catch {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
}

export function authorize(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!roles.includes(request.authUser.role)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
  };
}
