import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { TicketsService } from './tickets.service';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private ticketsService: TicketsService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });
      client.data.user = payload; // { sub: userId, role: userRole }
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // optional logic
  }

  @SubscribeMessage('join_ticket')
  handleJoinTicket(@ConnectedSocket() client: Socket, @MessageBody() ticketId: number) {
    client.join(`ticket_${ticketId}`);
  }

  @SubscribeMessage('leave_ticket')
  handleLeaveTicket(@ConnectedSocket() client: Socket, @MessageBody() ticketId: number) {
    client.leave(`ticket_${ticketId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ticketId: number; content: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const message = await this.ticketsService.addMessage(payload.ticketId, user.sub, payload.content);

    // Broadcast to the room
    this.server.to(`ticket_${payload.ticketId}`).emit('receive_message', message);

    // Notify admins globally if user sends message
    if (user.role !== 'ADMIN') {
      this.server.emit('new_ticket_activity', { ticketId: payload.ticketId, message });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ticketId: number; isTyping: boolean },
  ) {
    const user = client.data.user;
    if (!user) return;

    // Broadcast to the room, excluding the sender
    client.to(`ticket_${payload.ticketId}`).emit('user_typing', {
      userId: user.sub,
      role: user.role,
      isTyping: payload.isTyping,
    });
  }
}
