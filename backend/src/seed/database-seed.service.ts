import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Cart } from '../cart/cart.entity';
import { Product } from '../products/product.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class DatabaseSeedService {
  private readonly logger = new Logger(DatabaseSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,
  ) {}

  async seed() {
    const shouldSeed =
      this.configService.get<string>('SEED_DATA', 'false') === 'true';
    if (!shouldSeed) {
      return;
    }

    const existingAdmin = await this.usersRepository.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!existingAdmin) {
      const admin = await this.usersRepository.save(
        this.usersRepository.create({
          email: 'admin@example.com',
          passwordHash: await bcrypt.hash('admin123', 10),
          role: UserRole.ADMIN,
        }),
      );
      await this.cartsRepository.save(
        this.cartsRepository.create({ user: admin }),
      );
      this.logger.log('Seeded admin@example.com / admin123');
    }

    const existingCustomer = await this.usersRepository.findOne({
      where: { email: 'customer@example.com' },
    });

    if (!existingCustomer) {
      const customer = await this.usersRepository.save(
        this.usersRepository.create({
          email: 'customer@example.com',
          passwordHash: await bcrypt.hash('customer123', 10),
          role: UserRole.CUSTOMER,
        }),
      );
      await this.cartsRepository.save(
        this.cartsRepository.create({ user: customer }),
      );
      this.logger.log('Seeded customer@example.com / customer123');
    }

    const productCount = await this.productsRepository.count();
    if (productCount === 0) {
      await this.productsRepository.save([
        this.productsRepository.create({
          name: 'Mechanical Keyboard',
          slug: 'mechanical-keyboard',
          price: '89.00',
          stock: 15,
        }),
        this.productsRepository.create({
          name: 'Wireless Mouse',
          slug: 'wireless-mouse',
          price: '39.00',
          stock: 20,
        }),
        this.productsRepository.create({
          name: '27-inch Monitor',
          slug: '27-inch-monitor',
          price: '229.00',
          stock: 8,
        }),
      ]);
      this.logger.log('Seeded products');
    }
  }
}
