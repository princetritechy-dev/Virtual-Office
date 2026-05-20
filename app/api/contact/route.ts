import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    // Parse request body
    const { firstName, lastName, email, phone, subject, message } = await req.json();

    // Validate the required fields
    if (!firstName || !lastName || !email || !message) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Set up the transporter using Gmail's SMTP settings
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email details
    const mailOptions = {
      from: `"${firstName} ${lastName}" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.CONTACT_TO_EMAIL, // Receiver email
      subject: `Contact Form: ${subject || "General Inquiry"}`,
      text: `Name: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone || "-"}
Subject: ${subject || "General Inquiry"}

Message:
${message}
`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Return success response
    return Response.json({ success: true });
  } catch (err: any) {
    // Log and handle the error
    console.error("MAIL ERROR:", err);
    return Response.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
