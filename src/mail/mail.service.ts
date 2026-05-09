import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    const host = this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com';
    const port = Number(this.configService.get<number>('MAIL_PORT')) || 587;
    console.log(`MailService initializing: ${host}:${port} (user: ${user ? 'LOADED' : 'MISSING'})`);
    
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  async sendVerificationCode(email: string, code: string) {
    const mailOptions = {
      from: `"CRM System" <${this.configService.get<string>('MAIL_USER')}>`,
      to: email,
      subject: 'Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Тасдиқи имейл</h2>
          <p>Салом!</p>
          <p>Барои анҷом додани қайд дар системаи CRM, лутфан коди зеринро ворид кунед:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p>Ин код барои 10 дақиқа эътибор дорад.</p>
          <p>Агар шумо ин дархостро накарда бошед, ин имейлро нодида гиред.</p>
          <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280; text-align: center;">CRM System &copy; 2026</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${email}. MessageId: ${result.messageId}`);
    } catch (error) {
      console.error('FAILED to send email:', error);
    }
  }
}
