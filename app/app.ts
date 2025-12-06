import fastify from 'fastify';

export default function build(opts = {}) {
  const app = fastify(opts);

  app.get('/ping', (_, reply) => {
    const headers = reply.getHeaders();

    const now = Number(headers['x-now']);
    const end = performance.now();
    const elapsed = (end - now).toFixed(3);

    return `Pong in ${elapsed}ms`;
  });

  app.get('/health', async (_, reply) => {
    reply.status(200).send({ status: 'ok' });
  });

  app.register(import('./routes/1'), { prefix: '/1' });

  return app;
}
