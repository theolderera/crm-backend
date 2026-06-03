import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private configService: ConfigService) {}

  async sendVerificationCode(email: string, code: string) {
    const serviceId = this.configService.get<string>('EMAILJS_SERVICE_ID');
    const templateId = this.configService.get<string>('EMAILJS_TEMPLATE_ID');
    const publicKey = this.configService.get<string>('EMAILJS_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('EMAILJS_PRIVATE_KEY');

    if (!serviceId || !templateId || !publicKey) {
      console.error('EmailJS credentials missing in .env');
      return false;
    }

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          accessToken: privateKey,
          template_params: {
            to_email: email,
            code: code,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FAILED to send email via EmailJS:', errorText);
        throw new InternalServerErrorException('Хатогӣ ҳангоми фиристодани почта');
      }

      console.log(`Email sent successfully via EmailJS to ${email}.`);
      return true;
    } catch (error: any) {
      console.error('FAILED to send email via EmailJS:', error);
      throw error;
    }
  }
}
