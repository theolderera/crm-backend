import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TicketStatus } from './ticket.entity';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  async getAllTickets(@Request() req) {
    if (req.user.role === 'ADMIN') {
      return this.ticketsService.findAll();
    }
    return this.ticketsService.findByUser(req.user.id);
  }

  @Get(':id')
  async getTicket(@Param('id') id: string) {
    return this.ticketsService.findOne(+id);
  }

  @Post()
  async createTicket(@Request() req, @Body() body: { subject: string; type: string }) {
    return this.ticketsService.createTicket(req.user.id, body.subject, body.type);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: TicketStatus, @Request() req) {
    if (req.user.role !== 'ADMIN') {
      throw new Error('Узр, шумо ҳуқуқи иваз кардани статусро надоред.');
    }
    return this.ticketsService.updateStatus(+id, status);
  }
}
