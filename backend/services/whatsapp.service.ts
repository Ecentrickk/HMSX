export class WhatsAppService {
  // Assuming a local gateway is running on the LAN (e.g., a node script with whatsapp-web.js or a physical gateway)
  // These settings would typically be in .env
  private static GATEWAY_URL = process.env.WHATSAPP_LOCAL_GATEWAY_URL || 'http://192.168.1.100:3000/send';

  /**
   * Sends a WhatsApp message via the local LAN gateway
   */
  static async sendMessage(phone: string, message: string, fileUrl?: string) {
    console.log(`[WhatsAppService] Preparing to send message to ${phone}...`);

    try {
      // We wrap it in a try-catch so the main application doesn't crash if the gateway is down
      const res = await fetch(this.GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: this.formatPhone(phone),
          message,
          fileUrl // Link to the PDF report that the local gateway will download and forward
        })
      });

      if (!res.ok) {
        console.error(`[WhatsAppService] Local gateway rejected the message (Status: ${res.status})`);
        return false;
      }

      console.log(`[WhatsAppService] Successfully dispatched message to ${phone} via LAN gateway.`);
      return true;
    } catch (error: any) {
      // Expected to fail in development since there's no actual gateway running yet
      console.warn(`[WhatsAppService] Failed to reach local gateway at ${this.GATEWAY_URL}. Is the LAN cable connected and the daemon running?`);
      return false;
    }
  }

  /**
   * Helper to format numbers for the gateway (usually requires country code)
   */
  private static formatPhone(phone: string) {
    let clean = phone.replace(/\D/g, '');
    // Assuming Indian numbers primarily for this local hospital context
    if (clean.length === 10) {
      clean = '91' + clean;
    }
    return clean;
  }
}
