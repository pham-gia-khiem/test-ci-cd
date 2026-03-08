import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { CartItem } from '../src/cart/cart-item.entity';
import { Cart } from '../src/cart/cart.entity';
import { Order } from '../src/orders/order.entity';
import { Product } from '../src/products/product.entity';
import { User, UserRole } from '../src/users/user.entity';

describe('Interview shop API (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let moduleFixture: TestingModule;
  let usersRepository: Repository<User>;
  let cartsRepository: Repository<Cart>;
  let cartItemsRepository: Repository<CartItem>;
  let productsRepository: Repository<Product>;
  let ordersRepository: Repository<Order>;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqljs';
    process.env.DB_DROP_SCHEMA = 'true';
    process.env.SEED_DATA = 'false';
    process.env.JWT_ACCESS_SECRET = 'test-access';
    process.env.JWT_REFRESH_SECRET = 'test-refresh';

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();

    usersRepository = moduleFixture.get(getRepositoryToken(User));
    cartsRepository = moduleFixture.get(getRepositoryToken(Cart));
    cartItemsRepository = moduleFixture.get(getRepositoryToken(CartItem));
    productsRepository = moduleFixture.get(getRepositoryToken(Product));
    ordersRepository = moduleFixture.get(getRepositoryToken(Order));
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('logs in with valid credentials and rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'login-user@example.com', password: 'secret123' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'login-user@example.com', password: 'secret123' })
      .expect(201);

    expect(login.body.data.accessToken).toBeDefined();
    expect(login.body.data.user.email).toBe('login-user@example.com');

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'login-user@example.com', password: 'wrong123' })
      .expect(401);
  });

  it('blocks protected routes without a token', async () => {
    await request(app.getHttpServer()).get('/api/cart').expect(401);
  });

  it('blocks customer access to admin routes', async () => {
    const customerToken = await registerAndLogin('customer-role@example.com');

    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Forbidden Product',
        slug: 'forbidden-product',
        price: 10,
        stock: 1,
      })
      .expect(403);
  });

  it('rejects invalid input through validation pipes', async () => {
    const token = await registerAndLogin('pipe-user@example.com');
    const product = await createProduct('validation-product', 5);

    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.id, quantity: 0 })
      .expect(400);
  });

  it('creates an order, clears the cart, and keeps the order record', async () => {
    const token = await registerAndLogin('buyer@example.com');
    const product = await createProduct('order-success', 5, 25);

    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.id, quantity: 2 })
      .expect(201);

    const createOrder = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(201);

    expect(createOrder.body.data.items).toHaveLength(1);
    expect(createOrder.body.data.totalAmount).toBe(50);

    const cart = await request(app.getHttpServer())
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(cart.body.data.items).toHaveLength(0);

    const refreshedProduct = await productsRepository.findOneByOrFail({
      id: product.id,
    });
    expect(refreshedProduct.stock).toBe(3);
  });

  it('rolls back order creation when stock is insufficient', async () => {
    const token = await registerAndLogin('rollback@example.com');
    const product = await createProduct('order-rollback', 1, 15);

    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.id, quantity: 2 })
      .expect(201);

    const orderCountBefore = await ordersRepository.count();

    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    const orderCountAfter = await ordersRepository.count();
    expect(orderCountAfter).toBe(orderCountBefore);

    const cart = await request(app.getHttpServer())
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(cart.body.data.items).toHaveLength(1);

    const refreshedProduct = await productsRepository.findOneByOrFail({
      id: product.id,
    });
    expect(refreshedProduct.stock).toBe(1);
  });

  it('prevents a user from reading another user order', async () => {
    const ownerToken = await registerAndLogin('owner@example.com');
    const intruderToken = await registerAndLogin('intruder@example.com');
    const product = await createProduct('shared-order-product', 3, 18);

    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ productId: product.id, quantity: 1 })
      .expect(201);

    const order = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/orders/${order.body.data.id}`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .expect(403);
  });

  it('allows an admin to create a product', async () => {
    const adminToken = await createAdminAndLogin('admin-test@example.com');

    const response = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Admin Product',
        slug: 'admin-product',
        price: 99,
        stock: 4,
      })
      .expect(201);

    expect(response.body.data.slug).toBe('admin-product');
  });

  async function registerAndLogin(email: string) {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'secret123' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'secret123' })
      .expect(201);

    return login.body.data.accessToken as string;
  }

  async function createAdminAndLogin(email: string) {
    const admin = await usersRepository.save(
      usersRepository.create({
        email,
        passwordHash: await bcrypt.hash('secret123', 10),
        role: UserRole.ADMIN,
      }),
    );
    await cartsRepository.save(cartsRepository.create({ user: admin }));

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'secret123' })
      .expect(201);

    return login.body.data.accessToken as string;
  }

  async function createProduct(slug: string, stock: number, price = 12) {
    return productsRepository.save(
      productsRepository.create({
        name: slug.replace(/-/g, ' '),
        slug,
        stock,
        price: price.toFixed(2),
      }),
    );
  }
});
