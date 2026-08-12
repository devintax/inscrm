import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

const sendMail = async (to, subject, message, html) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to,
            subject: subject,
            text: message,
            html: html
                ? `${html}<hr><p style="color:#216499;font-size:12px">Good Insurance Services</p>`
                : undefined,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent:', info.response);
        // res.send('Email sent successfully');
    } catch (error) {
        console.log('Error sending email:', error);
        throw error;
    }
}

export default sendMail

