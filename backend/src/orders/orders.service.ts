import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CartItem } from '../cart/cart-item.entity';
import { Cart } from '../cart/cart.entity';
import { Product } from '../products/product.entity';
import { OrderItem } from './order-item.entity';
import { Order, OrderStatus } from './order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {}

  async createForUser(userId: number) {
    return this.dataSource.transaction(async (manager) => {
      const cartRepository = manager.getRepository(Cart);
      const cartItemRepository = manager.getRepository(CartItem);
      const orderRepository = manager.getRepository(Order);
      const orderItemRepository = manager.getRepository(OrderItem);
      const productRepository = manager.getRepository(Product);

      const cart = await cartRepository.findOne({
        where: { user: { id: userId } },
        relations: { items: { product: true }, user: true },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${item.product.name}`,
          );
        }
      }

      const totalAmount = cart.items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      );

      const order = await orderRepository.save(
        orderRepository.create({
          user: cart.user,
          status: OrderStatus.CREATED,
          totalAmount: totalAmount.toFixed(2),
        }),
      );

      for (const item of cart.items) {
        await orderItemRepository.save(
          orderItemRepository.create({
            order,
            product: item.product,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
          }),
        );

        await productRepository.update(item.product.id, {
          stock: item.product.stock - item.quantity,
        });
      }

      await cartItemRepository.remove(cart.items);

      return this.getOneForUser(userId, order.id);
    });
  }

  async getAllForUser(userId: number) {
    const orders = await this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoin('order.user', 'user')
      .where('user.id = :userId', { userId })
      .orderBy('order.id', 'DESC')
      .getMany();

    return orders.map((order) => this.serializeOrder(order));
  }

  async getOneForUser(userId: number, orderId: number) {
    const order = await this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('order.user', 'user')
      .where('order.id = :orderId', { orderId })
      .getOne();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user.id !== userId) {
      throw new ForbiddenException('You cannot access this order');
    }

    return this.serializeOrder(order);
  }

  async getAllForAdmin() {
    const orders = await this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('order.user', 'user')
      .orderBy('order.id', 'DESC')
      .getMany();

    return orders.map((order) => ({
      ...this.serializeOrder(order),
      user: {
        id: order.user.id,
        email: order.user.email,
        role: order.user.role,
      },
    }));
  }

  private serializeOrder(order: Order) {
    return {
      id: order.id,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        priceAtPurchase: Number(item.priceAtPurchase),
        product: item.product,
      })),
    };
  }
}
