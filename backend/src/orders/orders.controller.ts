import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: Express.User) {
    return this.ordersService.createForUser(user.id);
  }

  @Get()
  list(@CurrentUser() user: Express.User) {
    return this.ordersService.getAllForUser(user.id);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: Express.User,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.ordersService.getOneForUser(user.id, orderId);
  }
}

@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  listAll() {
    return this.ordersService.getAllForAdmin();
  }
}
