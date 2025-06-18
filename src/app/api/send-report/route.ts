import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  reportContent: string;
  reportTitle: string;
}

// Conversion Markdown vers HTML simple
function markdownToHTML(markdown: string): string {
  return markdown
    // Titres
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Liens
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Code inline
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Listes
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    // Paragraphes
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|li|pre|ul|ol])(.*$)/gim, '<p>$1</p>')
    // Nettoyage
    .replace(/<p><\/p>/g, '')
    .replace(/<p><p>/g, '<p>')
    .replace(/<\/p><\/p>/g, '</p>');
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    const { to, subject, body: emailBody, reportContent, reportTitle } = body;

    // Validation des paramètres
    if (!to || !reportContent) {
      return NextResponse.json(
        { error: 'Adresse email et contenu du rapport requis' },
        { status: 400 }
      );
    }

    // Vérification de la configuration Resend
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Configuration Resend manquante (RESEND_API_KEY)' },
        { status: 500 }
      );
    }

    // Initialisation de Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Conversion du contenu
    const htmlContent = markdownToHTML(reportContent);

    // Envoi de l'email
    const { data, error } = await resend.emails.send({
      from: 'Deep Research <onboarding@resend.dev>', // Vous pouvez changer l'expéditeur
      to: [to],
      subject: subject || `Rapport: ${reportTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Rapport Deep Research</h2>
          <p>${emailBody.replace(/\n/g, '<br>')}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h3 style="color: #2c3e50; margin-top: 0;">Contenu du Rapport</h3>
            ${htmlContent}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Généré automatiquement par Deep Research
          </p>
        </div>
      `,
      text: `${emailBody}\n\n${reportContent}`,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email envoyé avec succès',
      data: data
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
} 