import { type INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { pascalCase } from 'change-case'

export const setupSwagger = (
  app: INestApplication,
  configure: (builder: DocumentBuilder) => DocumentBuilder = (builder) => builder,
  path = 'docs',
): INestApplication => {
  const documentFactory = () =>
    SwaggerModule.createDocument(app, configure(new DocumentBuilder()).build(), {
      operationIdFactory: (_, methodKey: string) => pascalCase(methodKey),
    })

  SwaggerModule.setup(path, app, documentFactory)
  return app
}
