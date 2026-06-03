import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

@Injectable()
export class MailService {
  constructor(private configService: ConfigService) {}

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    const serviceId = this.configService.get<string>('EMAILJS_SERVICE_ID');
    const templateId = this.configService.get<string>('EMAILJS_TEMPLATE_ID');
    const publicKey = this.configService.get<string>('EMAILJS_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('EMAILJS_PRIVATE_KEY');

    if (!serviceId || !templateId || !publicKey) {
      console.error('EmailJS credentials missing in .env');
      return false;
    }

    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          to_email: email,
          code: code,
        },
      });

      const options = {
        hostname: 'api.emailjs.com',
        path: '/api/v1.0/email/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`Email sent successfully via EmailJS to ${email}.`);
            resolve(true);
          } else {
            console.error(`FAILED to send email via EmailJS (Status ${res.statusCode}):`, data);
            reject(new InternalServerErrorException('Хатогӣ ҳангоми фиристодани почта'));
          }
        });
      });

      req.on('error', (e) => {
        console.error('FAILED to send email via EmailJS:', e);
        reject(new InternalServerErrorException('Хатогӣ дар пайвастшавӣ ба EmailJS'));
      });

      req.write(payload);
      req.end();
    });
  }
}
