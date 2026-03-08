import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  list() {
    return this.productsRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const existing = await this.productsRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Slug already exists');
    }

    const product = this.productsRepository.create({
      ...dto,
      price: dto.price.toFixed(2),
    });
    return this.productsRepository.save(product);
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.productsRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException('Slug already exists');
      }
    }

    Object.assign(product, {
      ...dto,
      price: dto.price !== undefined ? dto.price.toFixed(2) : product.price,
    });

    return this.productsRepository.save(product);
  }
}
