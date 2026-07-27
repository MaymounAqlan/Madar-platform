const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./madar-backend/dist/src/app.module');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const server = app.getHttpServer();
  const router = server._events.request._router;
  const availableRoutes = router.stack
    .map(layer => {
      if (layer.route) {
        return {
          route: {
            path: layer.route?.path,
            method: layer.route?.stack[0].method,
          },
        };
      }
    })
    .filter(item => item !== undefined);
  console.log(availableRoutes);
  process.exit(0);
}
bootstrap();
