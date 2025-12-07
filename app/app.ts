import path from 'node:path';
import fastify from 'fastify';

const dirname = path.resolve(process.cwd(), 'app');

export default async function build(opts = {}) {
  const app = fastify(opts);

  app.register(import('@fastify/static'), {
    root: path.join(dirname, '..', 'docs'),
    prefix: '/',
  });

  app.get('/apidocs', async (_, reply) => {
    return reply.sendFile('swagger-ui.html');
  });

  app.get('/swagger.json', async (_, reply) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { $schema, ...docs } = await import('../docs/swagger.json');
    reply.header('content-type', 'application/json').send(docs);
  });

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

  app.addHook('preHandler', (_, reply, done) => {
    reply.header('x-now', String(performance.now()));
    done();
  });

  await app.register(import('./routes/1'), { prefix: '/1' });

  await app.ready();

  return app;
}
