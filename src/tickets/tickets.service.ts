import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus } from './ticket.entity';
import { Message } from './message.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
  ) {}

  async findAll() {
    return this.ticketRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number) {
    return this.ticketRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['user', 'messages', 'messages.sender'],
    });
    if (!ticket) throw new NotFoundException('Муроҷиат ёфт нашуд');
    return ticket;
  }

  async createTicket(userId: number, subject: string, type: string) {
    const ticket = this.ticketRepo.create({
      userId,
      subject,
      type: type as any,
      status: TicketStatus.OPEN,
    });
    return this.ticketRepo.save(ticket);
  }

  async updateStatus(id: number, status: TicketStatus) {
    const ticket = await this.findOne(id);
    ticket.status = status;
    return this.ticketRepo.save(ticket);
  }

  async addMessage(ticketId: number, senderId: number, content: string) {
    const msg = this.messageRepo.create({ ticketId, senderId, content });
    const saved = await this.messageRepo.save(msg);
    return this.messageRepo.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    });
  }
}
