const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const server = app.getHttpServer();
  await app.init();
  const router = server._events.request._router;
  const availableRoutes = router.stack
    .map(layer => {
      if (layer.route) {
        return {
          path: layer.route?.path,
          method: Object.keys(layer.route?.methods)[0],
        };
      }
    })
    .filter(item => item !== undefined);
  console.log(availableRoutes.filter(r => r.path.includes('cv-upload')));
  process.exit(0);
}
bootstrap();
