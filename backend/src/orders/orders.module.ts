import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { PrismaModule } from '../prisma/prisma.module'
import { RoutingModule } from '../routing/routing.module'

@Module({
  imports: [
    PrismaModule,
    RoutingModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}