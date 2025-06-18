export interface EmailConfig {
  to: string;
  subject: string;
  body: string;
  reportContent: string;
  reportTitle: string;
}

export async function sendEmailWithResend(config: EmailConfig): Promise<boolean> {
  try {
    const response = await fetch('/api/send-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur API Resend:', errorData);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
}

export function formatEmailBody(reportTitle: string): string {
  return `Bonjour,

Veuillez trouver ci-dessous le rapport "${reportTitle}" généré par Deep Research.

Le rapport est inclus dans cet email au format HTML.

Cordialement`;
}

export function formatEmailSubject(reportTitle: string): string {
  return `Rapport: ${reportTitle}`;
} 