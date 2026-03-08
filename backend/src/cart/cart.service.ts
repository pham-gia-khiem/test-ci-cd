import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItem } from './cart-item.entity';
import { Cart } from './cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemsRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async getCartForUser(userId: number) {
    const cart = await this.cartsRepository.findOne({
      where: { user: { id: userId } },
      relations: { items: true, user: true },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    return {
      id: cart.id,
      userId,
      items: cart.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product: item.product,
        lineTotal: Number(item.product.price) * item.quantity,
      })),
      total: cart.items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      ),
    };
  }

  async addItem(userId: number, dto: AddCartItemDto) {
    const cart = await this.findCartEntityForUser(userId);
    const product = await this.productsRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingItem = await this.cartItemsRepository.findOne({
      where: { cart: { id: cart.id }, product: { id: product.id } },
      relations: { cart: true, product: true },
    });

    if (existingItem) {
      existingItem.quantity += dto.quantity;
      await this.cartItemsRepository.save(existingItem);
    } else {
      await this.cartItemsRepository.save(
        this.cartItemsRepository.create({
          cart,
          product,
          quantity: dto.quantity,
        }),
      );
    }

    return this.getCartForUser(userId);
  }

  async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
    const item = await this.cartItemsRepository.findOne({
      where: { id: itemId, cart: { user: { id: userId } } },
      relations: { cart: { user: true }, product: true },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    item.quantity = dto.quantity;
    await this.cartItemsRepository.save(item);
    return this.getCartForUser(userId);
  }

  async removeItem(userId: number, itemId: number) {
    const item = await this.cartItemsRepository.findOne({
      where: { id: itemId, cart: { user: { id: userId } } },
      relations: { cart: { user: true } },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemsRepository.remove(item);
    return this.getCartForUser(userId);
  }

  async findCartEntityForUser(userId: number) {
    const cart = await this.cartsRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true, items: true },
    });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    return cart;
  }
}
