import { Resend } from "resend";

// Ponto unico de envio de e-mail. Trocar de provedor (ex: SendGrid, Postmark)
// significa editar apenas este arquivo.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    // Sem provedor configurado (ex: ambiente local sem chave). Registra no
    // console para que o fluxo continue testavel durante o desenvolvimento.
    console.warn(`[email] RESEND_API_KEY ausente — e-mail nao enviado. Para: ${to} | Assunto: ${subject}`);
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "InfraNet <no-reply@infranet.local>",
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(to: string, firstName: string, code: string) {
  await send(
    to,
    "Confirme seu e-mail — InfraNet",
    `<p>Ola, ${firstName}.</p>
     <p>Use o codigo abaixo para confirmar seu e-mail no InfraNet:</p>
     <p style="font-size:24px;font-weight:600;letter-spacing:4px;">${code}</p>
     <p>Este codigo expira em 30 minutos. Se voce nao criou uma conta, ignore esta mensagem.</p>`
  );
}

export async function sendPasswordResetEmail(to: string, firstName: string, code: string) {
  await send(
    to,
    "Recuperacao de senha — InfraNet",
    `<p>Ola, ${firstName}.</p>
     <p>Use o codigo abaixo para redefinir sua senha no InfraNet:</p>
     <p style="font-size:24px;font-weight:600;letter-spacing:4px;">${code}</p>
     <p>Este codigo expira em 30 minutos. Se voce nao solicitou isso, ignore esta mensagem.</p>`
  );
}
