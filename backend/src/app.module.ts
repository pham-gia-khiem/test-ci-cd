import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CartItem } from './cart/cart-item.entity';
import { Cart } from './cart/cart.entity';
import { CartModule } from './cart/cart.module';
import { CommonModule } from './common/common.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { OrderItem } from './orders/order-item.entity';
import { Order } from './orders/order.entity';
import { OrdersModule } from './orders/orders.module';
import { Product } from './products/product.entity';
import { ProductsModule } from './products/products.module';
import { DatabaseSeedService } from './seed/database-seed.service';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbType = configService.get<string>('DB_TYPE', 'postgres');
        const baseConfig = {
          entities: [User, Product, Cart, CartItem, Order, OrderItem],
          synchronize: true,
          dropSchema:
            configService.get<string>('DB_DROP_SCHEMA', 'false') === 'true',
          logging: false,
        };

        if (dbType === 'sqljs') {
          return {
            ...baseConfig,
            type: 'sqljs',
            autoSave: false,
            location: ':memory:',
          } as TypeOrmModuleOptions;
        }

        return {
          ...baseConfig,
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: Number(configService.get<string>('DB_PORT', '5432')),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'interview_shop'),
        } as TypeOrmModuleOptions;
      },
    }),
    TypeOrmModule.forFeature([User, Product, Cart]),
    CommonModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    CartModule,
    OrdersModule,
  ],
  providers: [DatabaseSeedService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
