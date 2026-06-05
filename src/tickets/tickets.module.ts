import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { ChatGateway } from './chat.gateway';
import { Ticket } from './ticket.entity';
import { Message } from './message.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Message]),
    JwtModule,
  ],
  providers: [TicketsService, ChatGateway],
  controllers: [TicketsController],
  exports: [TicketsService],
})
export class TicketsModule {}
